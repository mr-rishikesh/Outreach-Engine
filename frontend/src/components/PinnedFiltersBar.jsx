import { useState, useEffect } from "react";
import { Pin, X } from "lucide-react";

const OUTREACH_STATUSES = [
  "NOT_SENT", "SENT", "FOLLOWUP_PENDING", "REPLIED_POSITIVE",
  "REPLIED_NEGATIVE", "NO_RESPONSE", "CLOSED",
];

const REPLY_TYPES = ["positive", "negative", "neutral"];

const selectClass =
  "h-9 px-3.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer";

const inputClass =
  "h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-40";

export default function PinnedFiltersBar({ filters, onApply, onClear }) {
  const [pinnedKeys, setPinnedKeys] = useState([]);
  const [localFilters, setLocalFilters] = useState({ ...filters });

  useEffect(() => {
    const raw = localStorage.getItem("outreach_crm_pinned_filters");
    if (raw) {
      try {
        setPinnedKeys(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, [filters]);

  useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters]);

  // Sync back on state change
  const handleValueChange = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    if (value === "" || value === undefined || value === null) {
      delete updated[key];
    }
    setLocalFilters(updated);
    onApply(updated);
  };

  const handleUnpin = (key) => {
    const newPinned = pinnedKeys.filter(k => k !== key);
    setPinnedKeys(newPinned);
    localStorage.setItem("outreach_crm_pinned_filters", JSON.stringify(newPinned));
    
    // Clear filter value when unpinned
    const updated = { ...localFilters };
    delete updated[key];
    setLocalFilters(updated);
    onApply(updated);
  };

  if (pinnedKeys.length === 0) return null;

  const renderField = (key) => {
    switch (key) {
      case "outreachStatus":
        return (
          <select
            value={localFilters.outreachStatus || ""}
            onChange={(e) => handleValueChange("outreachStatus", e.target.value)}
            className={selectClass}
          >
            <option value="">Status: All</option>
            {OUTREACH_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        );
      case "replied":
        return (
          <select
            value={localFilters.replied ?? ""}
            onChange={(e) => handleValueChange("replied", e.target.value)}
            className={selectClass}
          >
            <option value="">Replied: All</option>
            <option value="true">Replied: Yes</option>
            <option value="false">Replied: No</option>
          </select>
        );
      case "replyType":
        return (
          <select
            value={localFilters.replyType || ""}
            onChange={(e) => handleValueChange("replyType", e.target.value)}
            className={selectClass}
          >
            <option value="">Reply Type: All</option>
            {REPLY_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        );
      case "opened":
        return (
          <select
            value={localFilters.opened ?? ""}
            onChange={(e) => handleValueChange("opened", e.target.value)}
            className={selectClass}
          >
            <option value="">Opened: All</option>
            <option value="true">Opened: Yes</option>
            <option value="false">Opened: No</option>
          </select>
        );
      case "engagement":
        return (
          <select
            value={localFilters.engagement || ""}
            onChange={(e) => handleValueChange("engagement", e.target.value)}
            className={selectClass}
          >
            <option value="">Engagement: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        );
      case "followupCountMin":
        return (
          <input
            type="number"
            placeholder="Min Followups"
            value={localFilters.followupCountMin || ""}
            onChange={(e) => handleValueChange("followupCountMin", e.target.value)}
            className={inputClass}
          />
        );
      case "emailsSentMin":
        return (
          <input
            type="number"
            placeholder="Min Emails Sent"
            value={localFilters.emailsSentMin || ""}
            onChange={(e) => handleValueChange("emailsSentMin", e.target.value)}
            className={inputClass}
          />
        );
      case "company":
        return (
          <input
            type="text"
            placeholder="Company Name"
            value={localFilters.company || ""}
            onChange={(e) => handleValueChange("company", e.target.value)}
            className={inputClass}
          />
        );
      case "role":
        return (
          <input
            type="text"
            placeholder="Job Role / Title"
            value={localFilters.role || ""}
            onChange={(e) => handleValueChange("role", e.target.value)}
            className={inputClass}
          />
        );
      case "source":
        return (
          <input
            type="text"
            placeholder="Lead Source"
            value={localFilters.source || ""}
            onChange={(e) => handleValueChange("source", e.target.value)}
            className={inputClass}
          />
        );
      case "last_reach_source":
        return (
          <input
            type="text"
            placeholder="Last Reach Source"
            value={localFilters.last_reach_source || ""}
            onChange={(e) => handleValueChange("last_reach_source", e.target.value)}
            className={inputClass}
          />
        );
      case "doNotContact":
        return (
          <select
            value={localFilters.doNotContact ?? ""}
            onChange={(e) => handleValueChange("doNotContact", e.target.value)}
            className={selectClass}
          >
            <option value="">Do Not Contact: All</option>
            <option value="true">DNC: Yes</option>
            <option value="false">DNC: No</option>
          </select>
        );
      case "bounced":
        return (
          <select
            value={localFilters.bounced ?? ""}
            onChange={(e) => handleValueChange("bounced", e.target.value)}
            className={selectClass}
          >
            <option value="">Bounced: All</option>
            <option value="true">Bounced: Yes</option>
            <option value="false">Bounced: No</option>
          </select>
        );
      case "unsubscribe":
        return (
          <select
            value={localFilters.unsubscribe ?? ""}
            onChange={(e) => handleValueChange("unsubscribe", e.target.value)}
            className={selectClass}
          >
            <option value="">Unsubscribed: All</option>
            <option value="true">Unsubscribed: Yes</option>
            <option value="false">Unsubscribed: No</option>
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-indigo-50/40 border border-indigo-100/70 p-2 px-3 rounded-xl">
      <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 uppercase tracking-wide mr-1 select-none">
        <Pin className="w-3 h-3 fill-indigo-600" />
        <span>Pinned:</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {pinnedKeys.map((key) => (
          <div key={key} className="inline-flex items-center gap-1 bg-white border border-slate-200/80 rounded-lg p-0.5 pl-1 shadow-sm hover:border-slate-300/90 transition-colors">
            {renderField(key)}
            <button
              onClick={() => handleUnpin(key)}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
              title="Unpin filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
