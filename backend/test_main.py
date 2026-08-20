import pytest
from fastapi.testclient import TestClient
import pandas as pd
from backend.main import app
from backend.timetable_solver import solve_timetable
import io

client = TestClient(app)

def test_timetable_solver_feasible():
    # Create mock data
    # 2 students, 2 courses, 1 faculty, 1 room
    reg_data = {
        'student_id': ['s1', 's2'],
        'course_id': ['c1', 'c2']
    }
    reg_df = pd.DataFrame(reg_data)
    
    course_data = {
        'course_id': ['c1', 'c2'],
        'faculty_id': ['f1', 'f1']
    }
    course_df = pd.DataFrame(course_data)
    
    room_data = {
        'room_id': ['r1'],
        'capacity': [50]
    }
    room_df = pd.DataFrame(room_data)
    
    status, schedule = solve_timetable(
        registrations_df=reg_df,
        courses_df=course_df,
        rooms_df=room_df,
        num_days=1,
        slots_per_day=2,
        time_limit_sec=5.0
    )
    
    assert status in ["OPTIMAL", "FEASIBLE"]
    assert len(schedule) == 2 # 2 courses to schedule
    
    # Check faculty clash
    times = [item.timeslot for item in schedule]
    assert len(times) == len(set(times)) # f1 teaches both, so must be different times

def test_timetable_solver_infeasible():
    # 2 students, 2 courses, 1 faculty, 1 room
    # But only 1 timeslot available! Will be infeasible because f1 teaches both.
    reg_df = pd.DataFrame({'student_id': ['s1'], 'course_id': ['c1']})
    course_df = pd.DataFrame({'course_id': ['c1', 'c2'], 'faculty_id': ['f1', 'f1']})
    room_df = pd.DataFrame({'room_id': ['r1'], 'capacity': [50]})
    
    status, schedule = solve_timetable(
        registrations_df=reg_df,
        courses_df=course_df,
        rooms_df=room_df,
        num_days=1,
        slots_per_day=1,
        time_limit_sec=5.0
    )
    
    assert status == "INFEASIBLE"
    assert len(schedule) == 0

def test_timetable_solver_room_capacity():
    # c1 has 3 students, room capacity is 2
    reg_df = pd.DataFrame({'student_id': ['s1', 's2', 's3'], 'course_id': ['c1', 'c1', 'c1']})
    course_df = pd.DataFrame({'course_id': ['c1'], 'faculty_id': ['f1']})
    room_df = pd.DataFrame({'room_id': ['r1'], 'capacity': [2]})
    
    status, schedule = solve_timetable(
        registrations_df=reg_df,
        courses_df=course_df,
        rooms_df=room_df,
        num_days=1,
        slots_per_day=1,
        time_limit_sec=5.0
    )
    
    assert status == "INFEASIBLE"

def test_api_generate_timetable():
    reg_csv = "student_id,course_id\ns1,c1\n"
    course_csv = "course_id,faculty_id\nc1,f1\n"
    room_csv = "room_id,capacity\nr1,50\n"
    
    response = client.post(
        "/generate-timetable",
        files={
            "registrations": ("reg.csv", io.BytesIO(reg_csv.encode('utf-8')), "text/csv"),
            "courses": ("course.csv", io.BytesIO(course_csv.encode('utf-8')), "text/csv"),
            "rooms": ("room.csv", io.BytesIO(room_csv.encode('utf-8')), "text/csv")
        },
        data={
            "num_days": 1,
            "slots_per_day": 2
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["OPTIMAL", "FEASIBLE"]
    assert len(data["schedule"]) == 1
    assert data["schedule"][0]["course_id"] == "c1"
    assert data["schedule"][0]["room_id"] == "r1"

def test_student_clash():
    # s1 takes c1 and c2. So c1 and c2 cannot be at the same time.
    # We provide 1 room, 1 timeslot -> should be infeasible
    reg_df = pd.DataFrame({'student_id': ['s1', 's1'], 'course_id': ['c1', 'c2']})
    course_df = pd.DataFrame({'course_id': ['c1', 'c2'], 'faculty_id': ['f1', 'f2']})
    room_df = pd.DataFrame({'room_id': ['r1', 'r2'], 'capacity': [50, 50]})
    
    status, schedule = solve_timetable(
        registrations_df=reg_df,
        courses_df=course_df,
        rooms_df=room_df,
        num_days=1,
        slots_per_day=1,
        time_limit_sec=5.0
    )
    
    assert status == "INFEASIBLE"

def test_nep_buckets():
    # Test wide format parsing
    reg_df = pd.DataFrame({'student_id': ['s1'], 'Major': ['c1'], 'Minor': ['c2'], 'MDC': ['']})
    course_df = pd.DataFrame({'course_id': ['c1', 'c2'], 'faculty_id': ['f1', 'f2']})
    room_df = pd.DataFrame({'room_id': ['r1', 'r2'], 'capacity': [50, 50]})
    
    status, schedule = solve_timetable(
        registrations_df=reg_df,
        courses_df=course_df,
        rooms_df=room_df,
        num_days=1,
        slots_per_day=2,
        time_limit_sec=5.0
    )
    
    assert status in ["OPTIMAL", "FEASIBLE"]
    assert len(schedule) == 2
