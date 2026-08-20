from pydantic import BaseModel
from typing import List

class ScheduleItem(BaseModel):
    course_id: str
    timeslot: int
    room_id: str
    faculty_id: str
    students: List[str]

class TimetableResponse(BaseModel):
    schedule: List[ScheduleItem]
    status: str
