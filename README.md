# NEP-Aligned Automated Timetable Generator 🎓

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)
![OR-Tools](https://img.shields.io/badge/Google_OR--Tools-Constraint_Solver-blue?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

An intelligent, algorithmic timetable generator built to solve the complex multi-disciplinary scheduling challenges introduced by the **National Education Policy (NEP) 2020**. 

Traditional timetable software functions merely as a digital spreadsheet. This project uses **Google OR-Tools (CP-SAT Solver)** to mathematically guarantee a 100% clash-free schedule while natively handling NEP credit buckets (Major, Minor, MDC, AEC, SEC, VAC) and actively prioritizing faculty well-being.

---

## ✨ Key Features

- **🧠 Algorithmic Constraint Solving:** Abstracted scheduling into a Boolean Satisfiability (SAT) problem to guarantee zero overlaps, zero double-bookings, and strict adherence to room capacities.
- **📚 NEP 2020 Bucket Support:** Natively supports and color-codes complex interdisciplinary credit buckets.
- **👩‍🏫 Faculty Protection:** Hard constraints programmed to prevent burnout—enforces a maximum of 3 classes per day and guarantees at least 1 full weekday off per week for every teacher.
- **🔄 Smart Role Dashboards:** 
  - **Student Mode:** View weekly schedules and track total earned credits.
  - **Faculty Mode:** View personal schedules and click on a class to instantly find free substitute colleagues.
  - **HOD Mode:** One-click generation of common free slots across the entire department to easily schedule staff meetings.
- **🎨 Glassmorphic UI:** A stunning, fully responsive dark-mode interface built with Tailwind CSS.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js, React, Tailwind CSS, FullCalendar, Lucide React
- **Backend:** Python, FastAPI, Uvicorn
- **AI/Math Engine:** Google OR-Tools (Constraint Programming)

---

## 🚀 Getting Started

### 1. Run the Backend (Constraint Solver)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend will run on `http://localhost:8000`*

### 2. Run the Frontend (Web Dashboard)
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`*

### 3. Upload Data
Once the application is running, open `http://localhost:3000`. You will be prompted to upload three CSV files. Sample data is provided in the `/sample_data` folder for testing!

---

## 📂 Project Structure

```text
├── backend/
│   ├── main.py              # FastAPI server and endpoints
│   ├── models.py            # Pydantic data schemas
│   └── timetable_solver.py  # Google OR-Tools CP-SAT logic
├── frontend/
│   ├── src/app/             # Next.js App Router & Pages
│   └── src/components/      # UI Components (Calendar, Gateway, etc.)
├── sample_data/             # Test CSVs (Students, Courses, Rooms)
└── README.md
```

---

*Built for the Smart India Hackathon (SIH) 2026* 🚀
