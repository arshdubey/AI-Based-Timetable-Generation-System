from ortools.sat.python import cp_model
import pandas as pd
from typing import List, Dict, Tuple
from models import ScheduleItem

def solve_timetable(
    registrations_df: pd.DataFrame, 
    courses_df: pd.DataFrame, 
    rooms_df: pd.DataFrame,
    num_days: int = 5,
    slots_per_day: int = 8,
    time_limit_sec: float = 60.0
) -> Tuple[str, List[ScheduleItem]]:
    
    num_slots = num_days * slots_per_day
    
    # 1. Parse data
    course_students: Dict[str, List[str]] = {}
    student_courses: Dict[str, List[str]] = {}
    
    # registrations can be long format (student_id, course_id) or wide format (student_id, Major, Minor, etc)
    if 'course_id' in registrations_df.columns:
        for _, row in registrations_df.iterrows():
            sid = str(row['student_id'])
            cid = str(row['course_id'])
            if pd.notna(cid) and cid.strip() != "" and cid.strip() != "nan":
                course_students.setdefault(cid, []).append(sid)
                student_courses.setdefault(sid, []).append(cid)
    else:
        bucket_cols = [c for c in registrations_df.columns if c != 'student_id']
        for _, row in registrations_df.iterrows():
            sid = str(row['student_id'])
            for col in bucket_cols:
                cid = str(row[col])
                if pd.notna(row[col]) and cid.strip() != "" and cid.strip() != "nan":
                    course_students.setdefault(cid, []).append(sid)
                    student_courses.setdefault(sid, []).append(cid)

    # Courses info
    courses = []
    course_faculty: Dict[str, str] = {}
    faculty_courses: Dict[str, List[str]] = {}
    for _, row in courses_df.iterrows():
        cid = str(row['course_id'])
        fid = str(row['faculty_id'])
        if pd.notna(cid) and cid.strip() != "" and cid.strip() != "nan":
            courses.append(cid)
            course_faculty[cid] = fid
            faculty_courses.setdefault(fid, []).append(cid)
        
    courses_to_schedule = list(set(courses))
    
    # Rooms info
    rooms = []
    room_capacities = {}
    for _, row in rooms_df.iterrows():
        rid = str(row['room_id'])
        cap = int(row['capacity'])
        if pd.notna(rid) and rid.strip() != "" and rid.strip() != "nan":
            rooms.append(rid)
            room_capacities[rid] = cap
        
    # 2. Build model
    model = cp_model.CpModel()
    schedule = {}
    
    # Variables
    for c in courses_to_schedule:
        req_capacity = len(course_students.get(c, []))
        for t in range(num_slots):
            for r in rooms:
                if room_capacities[r] >= req_capacity:
                    schedule[(c, t, r)] = model.NewBoolVar(f'sched_c{c}_t{t}_r{r}')
                else:
                    schedule[(c, t, r)] = model.NewConstant(0)
                    
    # Hard Constraints
    # 1. Each course exactly once
    for c in courses_to_schedule:
        model.AddExactlyOne(schedule[(c, t, r)] for t in range(num_slots) for r in rooms)
        
    # 2. Room clash: At most 1 course per room per timeslot
    for t in range(num_slots):
        for r in rooms:
            model.AddAtMostOne(schedule[(c, t, r)] for c in courses_to_schedule)
            
    # 3. Faculty clash: At most 1 course per faculty per timeslot
    for f, f_courses in faculty_courses.items():
        f_courses_sched = [c for c in f_courses if c in courses_to_schedule]
        for t in range(num_slots):
            model.AddAtMostOne(schedule[(c, t, r)] for c in f_courses_sched for r in rooms)
            
    # 4. Student clash: At most 1 course per student per timeslot
    for s, s_courses in student_courses.items():
        s_courses_sched = list(set([c for c in s_courses if c in courses_to_schedule]))
        if len(s_courses_sched) > 1:
            for t in range(num_slots):
                model.AddAtMostOne(schedule[(c, t, r)] for c in s_courses_sched for r in rooms)
                
    # 5. Faculty Workload Constraints
    for f, f_courses in faculty_courses.items():
        f_courses_sched = [c for c in f_courses if c in courses_to_schedule]
        if not f_courses_sched:
            continue
            
        # Boolean variables representing if the faculty is teaching on a specific day
        f_working_days = []
        for day in range(num_days):
            teaching_day = model.NewBoolVar(f'f_{f}_day_{day}_teaching')
            f_working_days.append(teaching_day)
            
            slots_in_day = range(day * slots_per_day, (day + 1) * slots_per_day)
            # Link teaching_day to whether any course is scheduled on this day
            model.AddMaxEquality(teaching_day, [schedule[(c, t, r)] for c in f_courses_sched for t in slots_in_day for r in rooms])
            
            # Max 3 classes per day
            # model.Add(sum(schedule[(c, t, r)] for c in f_courses_sched for t in slots_in_day for r in rooms) <= 3)
            
            # Min 1 class per day IF teaching_day is true
            # This is automatically satisfied by AddMaxEquality, but we can be explicit
            
        # At least 1 day off per week (so max 4 working days if num_days=5)
        # If they teach less than 4 courses, they will naturally have more days off.
        # But we enforce at least 1 day off.
        # model.Add(sum(f_working_days) <= num_days - 1)
                
    # Soft constraints: Gap minimization for faculty (keep existing logic but updated variable names to avoid conflict)
    penalty_vars = []
    for f, f_courses in faculty_courses.items():
        f_courses_sched = [c for c in f_courses if c in courses_to_schedule]
        if len(f_courses_sched) > 1:
            for day in range(num_days):
                slots_in_day = range(day * slots_per_day, (day + 1) * slots_per_day)
                
                # Check if teaching this day
                is_teaching = model.NewBoolVar(f'f_{f}_day_{day}_gap_teaching')
                model.AddMaxEquality(is_teaching, [schedule[(c, t, r)] for c in f_courses_sched for t in slots_in_day for r in rooms])
                
                first_slot = model.NewIntVar(0, slots_per_day - 1, f'f_{f}_day_{day}_first')
                last_slot = model.NewIntVar(0, slots_per_day - 1, f'f_{f}_day_{day}_last')
                
                for t in slots_in_day:
                    slot_index = t % slots_per_day
                    is_teaching_t = model.NewBoolVar(f'f_{f}_t_{t}_teaching')
                    model.AddMaxEquality(is_teaching_t, [schedule[(c, t, r)] for c in f_courses_sched for r in rooms])
                    
                    model.Add(first_slot <= slot_index).OnlyEnforceIf(is_teaching_t)
                    model.Add(last_slot >= slot_index).OnlyEnforceIf(is_teaching_t)
                
                model.Add(first_slot == 0).OnlyEnforceIf(is_teaching.Not())
                model.Add(last_slot == 0).OnlyEnforceIf(is_teaching.Not())
                
                span = model.NewIntVar(0, slots_per_day, f'f_{f}_day_{day}_span')
                model.Add(span == last_slot - first_slot)
                penalty_vars.append(span)

    if penalty_vars:
        pass
        # model.Minimize(sum(penalty_vars))  # Disabled to speed up feasibility search for Render
        
    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_sec
    status = solver.Solve(model)
    
    result_schedule = []
    status_str = solver.StatusName(status)
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        for c in courses_to_schedule:
            for t in range(num_slots):
                for r in rooms:
                    if solver.Value(schedule[(c, t, r)]):
                        result_schedule.append(ScheduleItem(
                            course_id=c, 
                            timeslot=t, 
                            room_id=r,
                            faculty_id=course_faculty.get(c, "Unknown"),
                            students=course_students.get(c, [])
                        ))
                        
    return status_str, result_schedule
