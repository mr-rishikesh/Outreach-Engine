import { useState, useRef } from "react";
import { api } from "../api";
import {
  Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle,
  Loader2, Users, UserPlus, UserMinus,
} from "lucide-react";

export default function UploadModal({ onClose, onDone }) {
  const [phase, setPhase] = useState("pick"); // pick | uploading | result
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [purpose, setPurpose] = useState("apply");
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const valid = f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls");
    if (!valid) {
      setError("Please upload a CSV file (.csv)");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setPhase("uploading");
    setError(null);
    try {
      const data = await api.uploadCSV(file, purpose);
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err.message);
      setPhase("pick");
    }
  };

  const handleClose = () => {
    if (phase === "result") onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Import Contacts</h3>
              <p className="text-xs text-slate-500">Upload Apollo CSV to add contacts</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors -mr-2">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {/* ---- Pick File ---- */}
          {phase === "pick" && (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : file
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Drop your CSV file here, or <span className="text-indigo-600">browse</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports Apollo export CSV files
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Purpose Selection */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Contact Type / Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="apply">Direct Apply (CEOs, Founders)</option>
                  <option value="referral">Referral (SDEs, Employees)</option>
                </select>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file}
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload & Import
              </button>
            </div>
          )}

          {/* ---- Uploading ---- */}
          {phase === "uploading" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Importing Contacts...</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-[280px]">
                Processing <span className="font-medium text-slate-700">{file?.name}</span>. Duplicates will be automatically skipped.
              </p>
              <div className="w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-progress" />
              </div>
            </div>
          )}

          {/* ---- Result ---- */}
          {phase === "result" && result && (
            <div className="space-y-5">
              {/* Success Banner */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Import Complete</h3>
                <p className="text-sm text-slate-500">
                  Processed {result.total} records from your CSV
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={<Users className="w-4 h-4" />}
                  label="Total Rows"
                  value={result.total}
                  color="slate"
                />
                <StatCard
                  icon={<UserPlus className="w-4 h-4" />}
                  label="Added"
                  value={result.inserted}
                  color="emerald"
                />
                <StatCard
                  icon={<UserMinus className="w-4 h-4" />}
                  label="Skipped"
                  value={result.skipped}
                  color="amber"
                />
              </div>

              {/* Detail text */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 text-sm text-slate-600">
                {result.inserted > 0 ? (
                  <p>
                    <span className="font-semibold text-emerald-700">{result.inserted}</span> new contacts added to your database.
                    {result.skipped > 0 && (
                      <> <span className="font-semibold text-amber-700">{result.skipped}</span> duplicates were skipped (already exist).</>
                    )}
                  </p>
                ) : (
                  <p>
                    All {result.total} contacts already exist in your database. No new contacts were added.
                  </p>
                )}
              </div>

              {/* Done */}
              <button
                onClick={handleClose}
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const styles = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };

  const iconStyles = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    slate: "text-slate-500",
  };

  return (
    <div className={`rounded-xl border p-4 text-center ${styles[color]}`}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className={iconStyles[color]}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
