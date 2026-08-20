import csv
import random

faculties = {
    "CS": ["FAC_SHARMA", "FAC_PATEL", "FAC_GUPTA", "FAC_VERMA", "FAC_REDDY"],
    "EE": ["FAC_IYER", "FAC_SINGH", "FAC_DESAI", "FAC_JOSHI"],
    "MA": ["FAC_RAO", "FAC_KUMAR"],
    "PH": ["FAC_DAS", "FAC_BOSE"],
    "ME": ["FAC_MENON", "FAC_NAIR"],
    "HU": ["FAC_CHATTERJEE", "FAC_BANERJEE"],
    "EN": ["FAC_MUKHERJEE", "FAC_SEN"],
    "CH": ["FAC_CHAWLA", "FAC_KAPOOR"]
}

courses_data = []
course_ids = []

for dept, fac_list in faculties.items():
    course_num = 101
    for fac in fac_list:
        # Give each teacher exactly 5 courses
        for _ in range(5):
            cid = f"{dept}{course_num}"
            courses_data.append([cid, fac])
            course_ids.append(cid)
            course_num += 1

with open("sample_data/courses.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["course_id", "faculty_id"])
    writer.writerows(courses_data)

# Generate 10 students
students_data = []
for i in range(1, 11):
    sid = f"STU{i:03d}"
    # Randomly pick 6 courses for each student
    selected = random.sample(course_ids, 6)
    students_data.append([sid] + selected)

with open("sample_data/registrations.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["student_id", "Major", "Minor", "MDC", "AEC", "SEC", "VAC"])
    writer.writerows(students_data)

# Generate Rooms (we need enough rooms since there are 21*5 = 105 courses)
# With 40 slots in a week, we need at least 105/40 = 3 rooms. Let's make 5 rooms.
rooms_data = [
    ["R101", 60],
    ["R102", 60],
    ["R201", 30],
    ["R202", 30],
    ["LAB_1", 40]
]
with open("sample_data/rooms.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["room_id", "capacity"])
    writer.writerows(rooms_data)

print("Generated sample data")
