"use client";

import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ScheduleEvent, slotToTime } from '@/data/mockTimetable';
import { AlertTriangle, MapPin, User, X, RefreshCcw } from 'lucide-react';
import { UserMode } from './RoleSelector';

interface TimetableCalendarProps {
  events: ScheduleEvent[];
  isDarkMode?: boolean;
  userMode?: UserMode;
  allEvents?: ScheduleEvent[];
  activeId?: string;
}

const bucketStyles: Record<string, string> = {
  'Major': 'bg-indigo-500/40 text-indigo-900 dark:text-indigo-100 border-l-4 border-indigo-500',
  'Minor': 'bg-purple-500/40 text-purple-900 dark:text-purple-100 border-l-4 border-purple-500',
  'MDC': 'bg-emerald-500/40 text-emerald-900 dark:text-emerald-100 border-l-4 border-emerald-500',
  'AEC': 'bg-amber-500/40 text-amber-900 dark:text-amber-100 border-l-4 border-amber-500',
  'SEC': 'bg-rose-500/40 text-rose-900 dark:text-rose-100 border-l-4 border-rose-500',
  'VAC': 'bg-sky-500/40 text-sky-900 dark:text-sky-100 border-l-4 border-sky-500',
};

const defaultBucketStyle = 'bg-gray-500/40 text-gray-900 dark:text-gray-100 border-l-4 border-gray-500';

// Fixed set of distinct colors for Faculty in HOD mode
const facultyColors = [
  'bg-blue-500/40 text-blue-900 dark:text-blue-100 border-l-4 border-blue-500',
  'bg-emerald-500/40 text-emerald-900 dark:text-emerald-100 border-l-4 border-emerald-500',
  'bg-pink-500/40 text-pink-900 dark:text-pink-100 border-l-4 border-pink-500',
  'bg-teal-500/40 text-teal-900 dark:text-teal-100 border-l-4 border-teal-500',
  'bg-amber-500/40 text-amber-900 dark:text-amber-100 border-l-4 border-amber-500',
  'bg-cyan-500/40 text-cyan-900 dark:text-cyan-100 border-l-4 border-cyan-500',
];

export default function TimetableCalendar({ 
  events,
  isDarkMode = false,
  userMode,
  allEvents = [],
  activeId
}: TimetableCalendarProps) {

  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [zoomHeight, setZoomHeight] = useState<number | string>("100%");
  
  const [substitutes, setSubstitutes] = useState<string[]>([]);

  const handleZoomIn = () => {
    setZoomHeight(prev => {
      if (prev === "100%") return 800;
      if (typeof prev === "number") return Math.min(prev + 300, 2500);
      return prev;
    });
  };

  const handleZoomOut = () => {
    setZoomHeight(prev => {
      if (typeof prev === "number") {
        if (prev <= 800) return "100%";
        return Math.max(prev - 300, 500);
      }
      return prev;
    });
  };
  

  // Function to detect clashes
  const getClashes = (events: ScheduleEvent[]) => {
    const clashes = new Set<string>();
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const e1 = events[i];
        const e2 = events[j];
        if (e1.dayOfWeek === e2.dayOfWeek && e1.startSlot === e2.startSlot) {
          let hasClash = false;
          if (e1.classroom === e2.classroom) hasClash = true;
          if (e1.faculty === e2.faculty) hasClash = true;
          const commonStudents = e1.students.filter(s => e2.students.includes(s));
          if (commonStudents.length > 0) hasClash = true;
          if (hasClash) {
            clashes.add(e1.id);
            clashes.add(e2.id);
          }
        }
      }
    }
    return clashes;
  };

  const clashingEventIds = useMemo(() => getClashes(events), [events]);

  const calendarEvents = events.map(evt => {
    // 2026-08-17 is a Monday. 
    // We construct the string directly to avoid timezone shift from toISOString()
    const day = 17 + (evt.dayOfWeek - 1);
    const dateString = `2026-08-${day.toString().padStart(2, '0')}`;
    const hasClash = clashingEventIds.has(evt.id);

    return {
      id: evt.id,
      title: evt.title,
      start: `${dateString}T${slotToTime(evt.startSlot)}`,
      end: `${dateString}T${slotToTime(evt.endSlot)}`,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      extendedProps: {
        ...evt,
        hasClash
      }
    };
  });

  return (
    <>
      <div className={`p-4 rounded-3xl shadow-2xl border transition-colors duration-300 flex flex-col
        ${isDarkMode ? 'bg-stone-900/60 backdrop-blur-md border-stone-700/50 text-stone-100' : 'bg-white/80 backdrop-blur-md border-white/40 text-stone-800'}
        w-full overflow-hidden h-[72vh] min-h-[500px]`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg hidden sm:block opacity-80">Weekly Overview</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleZoomOut}
              disabled={zoomHeight === "100%"}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-sm font-semibold
                ${isDarkMode ? 'border-stone-600 hover:bg-stone-700 disabled:opacity-50' : 'border-stone-300 hover:bg-stone-100 disabled:opacity-50'}`}
              title="Zoom Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Zoom Out
            </button>
            <button 
              onClick={handleZoomIn}
              disabled={typeof zoomHeight === "number" && zoomHeight >= 2500}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-sm font-semibold
                ${isDarkMode ? 'border-stone-600 hover:bg-stone-700 disabled:opacity-50' : 'border-stone-300 hover:bg-stone-100 disabled:opacity-50'}`}
              title="Zoom In"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Zoom In
            </button>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid {
            border-color: ${isDarkMode ? '#292524' : '#e7e5e4'};
          }
          .fc-col-header-cell {
            background: ${isDarkMode ? '#1c1917' : '#f5f5f4'};
            padding: 8px 0 !important;
          }
          .fc .fc-timegrid-slot-minor {
            border-top-style: dashed;
            border-color: ${isDarkMode ? '#292524' : '#e7e5e4'};
          }
          .fc-v-event {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .fc-event-main {
            padding: 0 !important;
            height: 100%;
          }
        `}} />
        <div className="overflow-x-auto flex-grow overflow-y-auto">
          <div className="min-w-[800px] h-full">
            <FullCalendar
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              initialDate="2026-08-17" 
              headerToolbar={{ left: '', center: '', right: '' }}
              weekends={false}
              slotMinTime="09:00:00"
              slotMaxTime="18:00:00"
              allDaySlot={false}
              events={calendarEvents}
              slotEventOverlap={false}
              eventClick={(info) => {
                const evt = info.event.extendedProps as ScheduleEvent;
                setSelectedEvent(evt);
                
                if (userMode === "FACULTY") {
                  // Find free faculty for this timeslot
                  const activeDept = evt.department;
                  const deptFaculty = new Set(allEvents.filter(e => e.department === activeDept).map(e => e.faculty));
                  const busyFaculty = new Set(allEvents.filter(e => e.dayOfWeek === evt.dayOfWeek && e.startSlot === evt.startSlot).map(e => e.faculty));
                  
                  const freeFacs = Array.from(deptFaculty).filter(f => !busyFaculty.has(f) && f !== activeId);
                  setSubstitutes(freeFacs);
                }
              }}
              eventContent={(arg) => {
                const props = arg.event.extendedProps as ScheduleEvent & { hasClash: boolean };
                
                let styleClass = defaultBucketStyle;
                if (userMode === "HOD") {
                  // Hash faculty name to a fixed color
                  const hash = props.faculty.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                  styleClass = facultyColors[hash % facultyColors.length];
                } else {
                  styleClass = bucketStyles[props.bucket] || defaultBucketStyle;
                }
                
                return (
                  <div className={`h-full w-full rounded-md shadow-sm p-1 flex flex-col justify-between overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer 
                    ${styleClass} ${props.hasClash ? 'ring-2 ring-red-500 animate-pulse' : ''}
                  `}>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[11px] px-1 py-0.5 rounded bg-white/40 dark:bg-black/40 leading-none">
                        {props.courseId}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-widest px-1 rounded-sm border border-current leading-none opacity-80">
                        {props.bucket}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] opacity-90 truncate pb-0.5">
                      <span className="flex items-center gap-0.5 truncate"><MapPin size={10} /> {props.classroom}</span>
                      <span className="flex items-center gap-0.5 truncate"><User size={10} /> {props.faculty}</span>
                    </div>
                    
                    {props.hasClash && (
                      <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-lg">
                        <AlertTriangle size={12} />
                      </div>
                    )}
                  </div>
                );
              }}
              height={zoomHeight}
              expandRows={true}
              dayHeaderFormat={{ weekday: 'short' }}
            />
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-700 flex flex-wrap gap-3 items-center text-sm">
          <span className="font-semibold opacity-70">Categories:</span>
          {Object.entries(bucketStyles).map(([bucket, style]) => (
            <div key={bucket} className={`px-2 py-1 rounded text-xs font-semibold ${style}`}>
              {bucket}
            </div>
          ))}
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div 
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border p-6
              ${isDarkMode ? 'bg-stone-800 border-stone-700 text-stone-200' : 'bg-white border-stone-200 text-stone-800'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${bucketStyles[selectedEvent.bucket] || defaultBucketStyle}`}>
                  {selectedEvent.bucket}
                </div>
                <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                <p className="opacity-70 text-sm">{selectedEvent.courseId} • {selectedEvent.department}</p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-stone-700/50' : 'bg-stone-50'}`}>
                  <div className="flex items-center gap-2 opacity-70 text-xs mb-1 uppercase font-semibold"><User size={14}/> Faculty</div>
                  <div className="font-medium">{selectedEvent.faculty}</div>
                </div>
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-stone-700/50' : 'bg-stone-50'}`}>
                  <div className="flex items-center gap-2 opacity-70 text-xs mb-1 uppercase font-semibold"><MapPin size={14}/> Classroom</div>
                  <div className="font-medium">{selectedEvent.classroom}</div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-stone-700/30 border-stone-600' : 'bg-stone-50 border-stone-200'}`}>
                <h3 className="text-sm font-semibold mb-2">Student Overlap Analytics</h3>
                <div className="text-3xl font-bold text-indigo-500 mb-1">{selectedEvent.students.length}</div>
                <p className="text-xs opacity-70 mb-3">Enrolled Students</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {selectedEvent.students.map(s => (
                    <span key={s} className={`text-xs px-2 py-1 rounded-md ${isDarkMode ? 'bg-stone-600' : 'bg-white shadow-sm border border-stone-200'}`}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-purple-500" />
                  <div>
                    <p className="text-sm opacity-60">Faculty</p>
                    <p className="font-semibold">{selectedEvent.faculty}</p>
                  </div>
                </div>

                {userMode === "FACULTY" && (
                  <div className="mt-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                      <RefreshCcw size={16} /> Need a Substitute?
                    </h4>
                    <p className="text-xs opacity-80 mb-3 text-purple-900 dark:text-purple-200">
                      The following faculty from {selectedEvent.department} are currently free during this timeslot:
                    </p>
                    {substitutes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {substitutes.map(sub => (
                          <span key={sub} className="px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border shadow-sm text-xs font-semibold">
                            {sub}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-red-500">No one is free to substitute.</p>
                    )}
                  </div>
                )}
              </div>
              
              {clashingEventIds.has(selectedEvent.id) && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                  <div className="text-sm">
                    <strong>Clash Warning:</strong> This event overlaps with another schedule using the same resources (room, faculty, or students).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
