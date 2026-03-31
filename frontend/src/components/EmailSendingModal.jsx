import { CheckCircle2, XCircle, Mail, Send, RefreshCw, X, Loader2, AlertTriangle, Ban } from "lucide-react";

/**
 * phase: "sending" | "result"
 * type: "email" | "followup"
 * result: { sent: [...], failed: [...], skipped: [...] } | null
 * onClose: () => void
 * count: number (total contacts being emailed)
 */
export default function EmailSendingModal({ phase, type, result, onClose, count }) {
  if (!phase) return null;

  const isFollowup = type === "followup";
  const label = isFollowup ? "Follow-up" : "Email";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "sending" && <SendingView label={label} isFollowup={isFollowup} count={count} />}
        {phase === "result" && <ResultView label={label} isFollowup={isFollowup} result={result} onClose={onClose} />}
      </div>
    </div>
  );
}

/* ---- Sending State ---- */
function SendingView({ label, isFollowup, count }) {
  return (
    <div className="p-8 flex flex-col items-center text-center">
      {/* Animated icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
          {isFollowup
            ? <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" style={{ animationDuration: "2s" }} />
            : <Send className="w-8 h-8 text-indigo-600 animate-pulse" />
          }
        </div>
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping" style={{ animationDuration: "2s" }} />
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-2">
        Sending {label}{count > 1 ? "s" : ""}...
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-[280px]">
        {count > 1
          ? `Sending personalized ${label.toLowerCase()}s to ${count} contacts. This may take a moment.`
          : `Generating and sending a personalized ${label.toLowerCase()}. Please wait...`
        }
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full animate-progress" />
      </div>

      <p className="text-xs text-slate-400 mt-4">
        AI is personalizing each email
      </p>
    </div>
  );
}

/* ---- Result State ---- */
function ResultView({ label, isFollowup, result, onClose }) {
  if (!result) return null;

  const sentCount = result.sent?.length || 0;
  const failedCount = result.failed?.length || 0;
  const skippedCount = result.skipped?.length || 0;
  const total = sentCount + failedCount + skippedCount;
  const allSuccess = failedCount === 0 && skippedCount === 0 && sentCount > 0;
  const allFailed = sentCount === 0 && skippedCount === 0;

  return (
    <div>
      {/* Header Banner */}
      <div className={`px-8 pt-8 pb-6 text-center ${
        allSuccess ? "bg-emerald-50" : allFailed ? "bg-red-50" : "bg-amber-50"
      }`}>
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
          allSuccess ? "bg-emerald-100" : allFailed ? "bg-red-100" : "bg-amber-100"
        }`}>
          {allSuccess
            ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            : allFailed
            ? <XCircle className="w-8 h-8 text-red-600" />
            : <AlertTriangle className="w-8 h-8 text-amber-600" />
          }
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {allSuccess
            ? `${label}${sentCount > 1 ? "s" : ""} Sent Successfully`
            : allFailed
            ? `${label} Sending Failed`
            : `Partially Sent`
          }
        </h3>
        <p className="text-sm text-slate-500">
          {allSuccess
            ? `${sentCount} ${label.toLowerCase()}${sentCount > 1 ? "s" : ""} delivered successfully`
            : allFailed
            ? `Could not deliver to any contacts`
            : `${sentCount} sent, ${failedCount} failed${skippedCount ? `, ${skippedCount} skipped` : ""}`
          }
        </p>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-4">
        {/* Stat Cards */}
        <div className={`grid gap-3 ${skippedCount > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Sent</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{sentCount}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{failedCount}</p>
          </div>
          {skippedCount > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Ban className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Skipped</span>
              </div>
              <p className="text-2xl font-bold text-slate-600">{skippedCount}</p>
            </div>
          )}
        </div>

        {/* Sent list */}
        {sentCount > 0 && (
          <Details title={`Sent (${sentCount})`} color="emerald">
            {result.sent.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 px-3 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-700 truncate">{item.email}</span>
              </div>
            ))}
          </Details>
        )}

        {/* Failed list */}
        {failedCount > 0 && (
          <Details title={`Failed (${failedCount})`} color="red">
            {result.failed.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 px-3 text-sm">
                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-slate-700 truncate">{item.email}</span>
                {item.error && (
                  <span className="text-xs text-slate-400 ml-auto shrink-0 truncate max-w-[120px]" title={item.error}>
                    {item.error}
                  </span>
                )}
              </div>
            ))}
          </Details>
        )}

        {/* Skipped list */}
        {skippedCount > 0 && (
          <Details title={`Skipped — Blocked Domain (${skippedCount})`} color="slate">
            {result.skipped.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 px-3 text-sm">
                <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-700 truncate">{item.email}</span>
                {item.reason && (
                  <span className="text-xs text-slate-400 ml-auto shrink-0">{item.reason}</span>
                )}
              </div>
            ))}
          </Details>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 h-11 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 shadow-sm transition-all mt-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ---- Expandable details ---- */
function Details({ title, color, children }) {
  const colors = {
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50/50", text: "text-emerald-700" },
    red: { border: "border-red-200", bg: "bg-red-50/50", text: "text-red-700" },
    slate: { border: "border-slate-200", bg: "bg-slate-50/50", text: "text-slate-600" },
  };
  const c = colors[color] || colors.slate;
  const borderColor = c.border;
  const bgColor = c.bg;
  const textColor = c.text;

  return (
    <details className={`rounded-xl border ${borderColor} overflow-hidden`}>
      <summary className={`px-4 py-2.5 text-xs font-semibold ${textColor} ${bgColor} cursor-pointer select-none hover:opacity-80 transition-opacity`}>
        {title}
      </summary>
      <div className={`divide-y ${borderColor} max-h-40 overflow-y-auto`}>
        {children}
      </div>
    </details>
  );
}
