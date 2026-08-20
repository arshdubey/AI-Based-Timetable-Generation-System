"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { ScheduleEvent } from "@/data/mockTimetable";
import { Users, BookOpen, Moon, Sun, LayoutDashboard, Clock, AlertTriangle, LogOut, CheckCircle, X } from "lucide-react";
import UploadGateway from "@/components/UploadGateway";
import RoleSelector, { UserMode } from "@/components/RoleSelector";

const TimetableCalendar = dynamic(() => import("@/components/TimetableCalendar"), { ssr: false });

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to true
  const [eventsData, setEventsData] = useState<ScheduleEvent[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>(null);
  const [activeId, setActiveId] = useState("");

  // Sync dark mode class with HTML
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Extract unique values for role selection
  const departments = Array.from(new Set(eventsData.map(e => e.department)));
  const faculties = Array.from(new Set(eventsData.map(e => e.faculty)));
  const students = Array.from(new Set(eventsData.flatMap(e => e.students)));

  // Filter events strictly based on userMode
  const filteredEvents = useMemo(() => {
    if (!userMode || !activeId) return [];
    if (userMode === "STUDENT") {
      return eventsData.filter(evt => evt.students.includes(activeId));
    }
    if (userMode === "FACULTY") {
      return eventsData.filter(evt => evt.faculty === activeId);
    }
    if (userMode === "HOD") {
      return eventsData.filter(evt => evt.department === activeId);
    }
    return [];
  }, [eventsData, userMode, activeId]);

  // Calculate Student Credits
  const getStudentCredits = () => {
    let credits = 0;
    filteredEvents.forEach(evt => {
      if (evt.bucket === "Major") credits += 4;
      else if (evt.bucket === "Minor" || evt.bucket === "MDC") credits += 3;
      else credits += 2; // AEC, SEC, VAC
    });
    return credits;
  };

  // Find Common Meeting Times for HOD
  const [meetingTimes, setMeetingTimes] = useState<Record<string, string[]>>({});
  const calculateMeetingTimes = () => {
    if (userMode !== "HOD") return;
    
    // Find all faculty in this dept
    const deptFaculty = new Set(eventsData.filter(e => e.department === activeId).map(e => e.faculty));
    const daySlots: Record<string, string[]> = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    
    // Check every slot (0 to 7) for every day (1 to 5)
    for (let d = 1; d <= 5; d++) {
      const dayName = days[d-1];
      daySlots[dayName] = [];
      for (let s = 0; s < 8; s++) {
        // Find which faculty have a class here
        const busyFaculty = new Set(eventsData.filter(e => e.department === activeId && e.dayOfWeek === d && e.startSlot === s).map(e => e.faculty));
        if (busyFaculty.size === 0 && deptFaculty.size > 0) {
          daySlots[dayName].push(`${9 + s}:00 - ${10 + s}:00`);
        }
      }
    }
    setMeetingTimes(daySlots);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative
      ${isDarkMode ? 'text-stone-100' : 'text-stone-900'}
    `}>
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      <div className={`fixed inset-0 z-[-1] transition-colors duration-500 ${isDarkMode ? 'bg-stone-950/40' : 'bg-white/40'}`} />

      {/* Top Navbar */}
      <nav className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${isDarkMode ? 'bg-stone-950/60 border-stone-800' : 'bg-white/70 border-white/20 shadow-sm'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={22} className="text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
              NEP Timetable
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {userMode && (
              <button 
                onClick={() => setUserMode(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Switch Role</span>
              </button>
            )}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-stone-800 text-emerald-400 hover:bg-stone-700' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {!isDataLoaded ? (
        <UploadGateway 
          isDarkMode={isDarkMode}
          onSuccess={(schedule) => {
            const newEvents: ScheduleEvent[] = schedule.map((item: any, idx: number) => {
              const dayOfWeek = Math.floor(item.timeslot / 8) + 1;
              const startSlot = item.timeslot % 8;
              
              const buckets: any[] = ["Major", "Minor", "MDC", "AEC", "SEC", "VAC"];
              const hash = item.course_id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
              const bucket = buckets[hash % buckets.length];
              
              const deptPrefix = item.course_id.substring(0, 2).toUpperCase();
              const deptMap: Record<string, string> = {
                "CS": "Computer Science",
                "MA": "Mathematics",
                "PH": "Physics",
                "EE": "Electrical Engineering",
                "ME": "Mechanical Engineering",
                "HU": "Humanities",
                "EN": "English",
                "CH": "Chemistry"
              };
              const department = deptMap[deptPrefix] || "General Studies";

              return {
                id: `gen-${idx}`,
                courseId: item.course_id,
                title: item.course_id + " Lecture",
                department: department,
                faculty: item.faculty_id, 
                classroom: item.room_id,
                students: item.students,
                bucket: bucket,
                dayOfWeek,
                startSlot,
                endSlot: startSlot + 1
              };
            });
            setEventsData(newEvents);
            setIsDataLoaded(true);
          }}
        />
      ) : !userMode ? (
        <RoleSelector 
          students={students} 
          faculties={faculties} 
          departments={departments} 
          isDarkMode={isDarkMode} 
          onSelectRole={(mode, id) => {
            setUserMode(mode);
            setActiveId(id);
          }} 
        />
      ) : (
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold drop-shadow-md">{userMode === "STUDENT" ? "Student" : userMode === "FACULTY" ? "Faculty" : "Department"} Dashboard</h2>
              <p className="opacity-90 font-medium drop-shadow-md">Viewing details for: <span className="font-extrabold">{activeId}</span></p>
            </div>
            
            {userMode === "STUDENT" && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-stone-800 border dark:border-stone-700">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black leading-none">{getStudentCredits()}</div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-60">Total Credits</div>
                </div>
              </div>
            )}
            
            {userMode === "HOD" && (
              <button onClick={calculateMeetingTimes} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all border-transparent">
                Find Meeting Time
              </button>
            )}
          </div>
          
          {userMode === "HOD" && Object.keys(meetingTimes).length > 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-stone-100/90 backdrop-blur-md border border-stone-300 dark:bg-stone-900/60 dark:border-stone-700 shadow-xl relative animate-in fade-in slide-in-from-top-4 duration-300">
              <button 
                onClick={() => setMeetingTimes({})}
                className="absolute top-4 right-4 p-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
                title="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              <h3 className="font-bold text-stone-900 dark:text-stone-200 mb-5 flex items-center gap-2 text-lg pr-12">
                <Users size={20} /> Available Common Free Slots for {activeId} Faculty:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(meetingTimes).map(([day, slots]) => (
                  <div key={day} className="bg-white/60 dark:bg-stone-950/60 rounded-xl p-4 border border-stone-200 dark:border-stone-700/50 shadow-sm flex flex-col h-full">
                    <h4 className="font-bold text-center mb-3 text-[13px] uppercase tracking-wider opacity-80 border-b border-stone-300 dark:border-stone-700/80 pb-3">{day}</h4>
                    {slots.length > 0 ? (
                      <div className="flex flex-col gap-2 flex-grow">
                        {slots.map(time => (
                          <span key={time} className="px-3 py-2 rounded-lg bg-stone-200 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-center text-xs font-bold shadow-sm text-stone-900 dark:text-stone-200 transition-transform hover:scale-105 cursor-default">
                            {time}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full flex-grow py-6">
                        <p className="text-center text-xs opacity-50 font-medium italic">No free slots</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <TimetableCalendar 
              events={filteredEvents} 
              isDarkMode={isDarkMode}
              userMode={userMode}
              allEvents={eventsData}
              activeId={activeId}
            />
          </div>
        </main>
      )}
    </div>
  );
}
