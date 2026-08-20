"use client";

import { useState } from "react";
import { User, Users, GraduationCap, Building2, ChevronDown } from "lucide-react";

export type UserMode = "STUDENT" | "FACULTY" | "HOD" | null;

interface RoleSelectorProps {
  students: string[];
  faculties: string[];
  departments: string[];
  onSelectRole: (mode: UserMode, id: string) => void;
  isDarkMode: boolean;
}

export default function RoleSelector({ students, faculties, departments, onSelectRole, isDarkMode }: RoleSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<UserMode>(null);
  const [selectedId, setSelectedId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMode && selectedId) {
      onSelectRole(selectedMode, selectedId);
    }
  };

  const getOptions = () => {
    if (selectedMode === "STUDENT") return students;
    if (selectedMode === "FACULTY") return faculties;
    if (selectedMode === "HOD") return departments;
    return [];
  };

  const getLabel = () => {
    if (selectedMode === "STUDENT") return "Select Student ID";
    if (selectedMode === "FACULTY") return "Select Faculty";
    if (selectedMode === "HOD") return "Select Department";
    return "";
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-8 sm:p-10 ${isDarkMode ? 'bg-stone-900/80 border-stone-700 backdrop-blur-xl' : 'bg-white/90 border-white/40 backdrop-blur-xl'}`}>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-4">
            <User size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            Welcome to the Portal
          </h2>
          <p className="mt-2 text-sm opacity-70">
            Please select your role to access your personalized dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => { setSelectedMode("STUDENT"); setSelectedId(""); }}
            className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedMode === "STUDENT" ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-transparent bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700'}`}
          >
            <GraduationCap size={32} className={selectedMode === "STUDENT" ? "text-emerald-600 dark:text-emerald-400" : "opacity-60"} />
            <span className="font-bold">Student</span>
          </button>
          
          <button
            onClick={() => { setSelectedMode("FACULTY"); setSelectedId(""); }}
            className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedMode === "FACULTY" ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' : 'border-transparent bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700'}`}
          >
            <Users size={32} className={selectedMode === "FACULTY" ? "text-cyan-600 dark:text-cyan-400" : "opacity-60"} />
            <span className="font-bold">Faculty</span>
          </button>

          <button
            onClick={() => { setSelectedMode("HOD"); setSelectedId(""); }}
            className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedMode === "HOD" ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-transparent bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700'}`}
          >
            <Building2 size={32} className={selectedMode === "HOD" ? "text-emerald-600 dark:text-emerald-400" : "opacity-60"} />
            <span className="font-bold">HOD</span>
          </button>
        </div>

        {selectedMode && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <label className="block text-sm font-semibold opacity-90">{getLabel()}</label>
              <div className="relative">
                <select 
                  value={selectedId} 
                  onChange={e => setSelectedId(e.target.value)}
                  required
                  className={`w-full appearance-none rounded-xl p-3.5 pr-10 text-sm font-medium transition-all outline-none border-2 focus:border-emerald-500
                    ${isDarkMode ? 'bg-stone-950/50 border-stone-700 text-stone-200' : 'bg-white border-stone-200 text-stone-800 shadow-sm'}`}
                >
                  <option value="" disabled>Select from list...</option>
                  {getOptions().map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={20} />
              </div>
            </div>

            <button type="submit" disabled={!selectedId} className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
              Continue to Dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
