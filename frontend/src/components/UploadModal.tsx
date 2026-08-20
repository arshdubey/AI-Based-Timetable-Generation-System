"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, FileSpreadsheet } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (schedule: any, csvData: any) => void;
  isDarkMode: boolean;
}

export default function UploadModal({ isOpen, onClose, onSuccess, isDarkMode }: UploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const regRef = useRef<HTMLInputElement>(null);
  const coursesRef = useRef<HTMLInputElement>(null);
  const roomsRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

      // We should also parse CSVs here locally so we can enrich the backend response, 
      // but for now we'll just send it to backend.
      const res = await fetch("http://127.0.0.1:8000/generate-timetable", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate timetable");
      
      if (data.status === "INFEASIBLE") {
        throw new Error("The constraints could not be satisfied. Please check your data.");
      }
      
      // Successfully generated
      onSuccess(data.schedule, { regFile, coursesFile, roomsFile });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-500" />
            Generate Timetable
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 opacity-80">1. Registrations CSV</label>
            <input type="file" accept=".csv" ref={regRef} required className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-700 dark:file:text-slate-300" />
            <p className="text-xs opacity-60 mt-1">Columns: student_id, Major, Minor, MDC, AEC, SEC, VAC</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 opacity-80">2. Courses CSV</label>
            <input type="file" accept=".csv" ref={coursesRef} required className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-700 dark:file:text-slate-300" />
            <p className="text-xs opacity-60 mt-1">Columns: course_id, faculty_id</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 opacity-80">3. Rooms CSV</label>
            <input type="file" accept=".csv" ref={roomsRef} required className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-700 dark:file:text-slate-300" />
            <p className="text-xs opacity-60 mt-1">Columns: room_id, capacity</p>
          </div>

          {error && <div className="p-3 rounded bg-red-100 text-red-700 text-sm border border-red-200">{error}</div>}

          <button type="submit" disabled={loading} className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {loading ? "Generating..." : "Upload & Generate"}
          </button>
        </form>
      </div>
    </div>
  );
}
