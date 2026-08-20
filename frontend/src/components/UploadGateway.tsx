"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileSpreadsheet, Database } from "lucide-react";

interface UploadGatewayProps {
  onSuccess: (schedule: any, csvData: any) => void;
  isDarkMode: boolean;
}

export default function UploadGateway({ onSuccess, isDarkMode }: UploadGatewayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const regRef = useRef<HTMLInputElement>(null);
  const coursesRef = useRef<HTMLInputElement>(null);
  const roomsRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const regFile = regRef.current?.files?.[0];
      const coursesFile = coursesRef.current?.files?.[0];
      const roomsFile = roomsRef.current?.files?.[0];

      if (!regFile || !coursesFile || !roomsFile) {
        throw new Error("Please upload all three CSV files.");
      }

      const formData = new FormData();
      formData.append("registrations", regFile);
      formData.append("courses", coursesFile);
      formData.append("rooms", roomsFile);

      const res = await fetch("https://ai-based-timetable-generation-system.onrender.com/generate-timetable", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate timetable");
      
      if (data.status === "INFEASIBLE") {
        throw new Error("The constraints could not be satisfied. Please check your data.");
      }
      
      onSuccess(data.schedule, { regFile, coursesFile, roomsFile });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-8 sm:p-10 ${isDarkMode ? 'bg-stone-900/80 border-stone-700 backdrop-blur-xl' : 'bg-white/90 border-white/40 backdrop-blur-xl'}`}>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-4">
            <Database size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            Initialize Timetable
          </h2>
          <p className="mt-2 text-sm opacity-70">
            Upload the university data to generate a clash-free schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-semibold opacity-90">1. Registrations CSV</label>
            <input type="file" accept=".csv" ref={regRef} required className="block w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-stone-800 dark:file:text-emerald-300 border border-transparent dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900/50" />
            <p className="text-[11px] opacity-60">Columns: student_id, Major, Minor, MDC, AEC, SEC, VAC</p>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold opacity-90">2. Courses CSV</label>
            <input type="file" accept=".csv" ref={coursesRef} required className="block w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-stone-800 dark:file:text-emerald-300 border border-transparent dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900/50" />
            <p className="text-[11px] opacity-60">Columns: course_id, faculty_id</p>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold opacity-90">3. Rooms CSV</label>
            <input type="file" accept=".csv" ref={roomsRef} required className="block w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-stone-800 dark:file:text-emerald-300 border border-transparent dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900/50" />
            <p className="text-[11px] opacity-60">Columns: room_id, capacity</p>
          </div>

          {error && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-900/50">{error}</div>}

          <button type="submit" disabled={loading} className="w-full mt-8 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-transparent flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
            {loading ? "Crunching numbers..." : "Generate Timetable"}
          </button>
        </form>
      </div>
    </div>
  );
}
