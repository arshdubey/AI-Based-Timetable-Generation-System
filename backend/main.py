from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import io
from models import TimetableResponse
from timetable_solver import solve_timetable

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NEP 2020 Timetable Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins (for dev)
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

@app.post("/generate-timetable", response_model=TimetableResponse)
async def generate_timetable(
    registrations: UploadFile = File(...),
    courses: UploadFile = File(...),
    rooms: UploadFile = File(...),
    num_days: int = 5,
    slots_per_day: int = 8
):
    try:
        reg_df = pd.read_csv(io.StringIO((await registrations.read()).decode('utf-8')))
        courses_df = pd.read_csv(io.StringIO((await courses.read()).decode('utf-8')))
        rooms_df = pd.read_csv(io.StringIO((await rooms.read()).decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV files: {str(e)}")
        
    status, schedule = solve_timetable(
        registrations_df=reg_df, 
        courses_df=courses_df, 
        rooms_df=rooms_df,
        num_days=num_days,
        slots_per_day=slots_per_day,
        time_limit_sec=30.0 # Time limit to prevent timeouts
    )
    
    if status not in ["OPTIMAL", "FEASIBLE"]:
        # If INFEASIBLE or UNKNOWN
        return TimetableResponse(schedule=[], status=status)
        
    return TimetableResponse(schedule=schedule, status=status)
