import { useState, useEffect } from "react";
import { ListFilter, Calendar, Building2, Briefcase, Flag, Trash2, FolderHeart, ShieldAlert, Pin } from "lucide-react";

const OUTREACH_STATUSES = [
  "NOT_SENT", "SENT", "FOLLOWUP_PENDING", "REPLIED_POSITIVE",
  "REPLIED_NEGATIVE", "NO_RESPONSE", "CLOSED",
];

const REPLY_TYPES = ["positive", "negative", "neutral"];

const PRESETS = [
  { name: "🔥 High Engagement", filters: { engagement: "High" } },
  { name: "📥 Positive Replies", filters: { outreachStatus: "REPLIED_POSITIVE", replied: "true" } },
  { name: "⏳ Needs Followup", filters: { outreachStatus: "FOLLOWUP_PENDING" } },
  { name: "🆕 Not Sent Yet", filters: { outreachStatus: "NOT_SENT" } },
];

const selectClass =
  "w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer";

const inputClass =
  "w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

export default function FilterPanel({ filters, onApply, onClear }) {
  const [local, setLocal] = useState({ ...filters });
  const [savedFilters, setSavedFilters] = useState({});
  const [saveName, setSaveName] = useState("");
  const [pinnedKeys, setPinnedKeys] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("outreach_crm_saved_filters");
    if (raw) {
      try {
        setSavedFilters(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse saved filters:", e);
      }
    }
    const rawPinned = localStorage.getItem("outreach_crm_pinned_filters");
    if (rawPinned) {
      try {
        setPinnedKeys(JSON.parse(rawPinned));
      } catch (e) {}
    }
  }, []);

  const handleTogglePin = (key) => {
    const nextKeys = pinnedKeys.includes(key)
      ? pinnedKeys.filter(k => k !== key)
      : [...pinnedKeys, key];
    setPinnedKeys(nextKeys);
    localStorage.setItem("outreach_crm_pinned_filters", JSON.stringify(nextKeys));
  };

  const set = (key, value) => setLocal((p) => ({ ...p, [key]: value }));

  const handleSaveFilter = () => {
    if (!saveName.trim()) return;
    const updated = { ...savedFilters, [saveName.trim()]: { ...local } };
    setSavedFilters(updated);
    localStorage.setItem("outreach_crm_saved_filters", JSON.stringify(updated));
    setSaveName("");
  };

  const handleDeleteSavedFilter = (name) => {
    const updated = { ...savedFilters };
    delete updated[name];
    setSavedFilters(updated);
    localStorage.setItem("outreach_crm_saved_filters", JSON.stringify(updated));
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-slate-50/50 rounded-b-xl">
      {/* Saved & Preset Filters Section */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col gap-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800">
          <FolderHeart className="w-4 h-4 text-indigo-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Saved & Preset Filters</h4>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setLocal({ ...p.filters })}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
            >
              {p.name}
            </button>
          ))}
          {Object.entries(savedFilters).map(([name, savedVal]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 h-8 pl-3.5 pr-2 text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg shadow-sm hover:border-indigo-200 transition-all"
            >
              <button
                type="button"
                onClick={() => setLocal({ ...savedVal })}
                className="hover:underline text-left cursor-pointer font-bold"
              >
                📁 {name}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSavedFilter(name)}
                className="w-5 h-5 rounded-md hover:bg-indigo-100/80 flex items-center justify-center text-indigo-400 hover:text-indigo-600 cursor-pointer font-bold transition-colors"
                title="Delete saved filter"
              >
                ×
              </button>
            </span>
          ))}
          {Object.keys(savedFilters).length === 0 && (
            <span className="text-xs text-slate-400 italic pl-1">No custom saved filters yet</span>
          )}
        </div>
      </div>

      {/* Status & Reply Filters */}
      <FilterGroup icon={<ListFilter className="w-4 h-4" />} title="Status & Engagement" cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <FilterField label="Outreach Status" name="outreachStatus" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <select value={local.outreachStatus || ""} onChange={(e) => set("outreachStatus", e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {OUTREACH_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Replied" name="replied" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <select value={local.replied ?? ""} onChange={(e) => set("replied", e.target.value)} className={selectClass}>
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FilterField>

        <FilterField label="Reply Type" name="replyType" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <select value={local.replyType || ""} onChange={(e) => set("replyType", e.target.value)} className={selectClass}>
            <option value="">All types</option>
            {REPLY_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Email Opened" name="opened" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <select value={local.opened ?? ""} onChange={(e) => set("opened", e.target.value)} className={selectClass}>
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FilterField>

        <FilterField label="Engagement" name="engagement" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <select value={local.engagement || ""} onChange={(e) => set("engagement", e.target.value)} className={selectClass}>
            <option value="">All levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </FilterField>
      </FilterGroup>

      {/* Activity Filters */}
      <FilterGroup icon={<Briefcase className="w-4 h-4" />} title="Activity & Metrics" cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <FilterField label="Min Followups" name="followupCountMin" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <input type="number" min={0} value={local.followupCountMin || ""} onChange={(e) => set("followupCountMin", e.target.value)} className={inputClass} placeholder="e.g. 1" />
        </FilterField>

        <FilterField label="Min Emails Sent" name="emailsSentMin" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <input type="number" min={0} value={local.emailsSentMin || ""} onChange={(e) => set("emailsSentMin", e.target.value)} className={inputClass} placeholder="e.g. 2" />
        </FilterField>

        <FilterField label="Company Name" name="company" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <input type="text" value={local.company || ""} onChange={(e) => set("company", e.target.value)} className={inputClass} placeholder="Search company..." />
        </FilterField>

        <FilterField label="Job Role / Title" name="role" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <input type="text" value={local.role || ""} onChange={(e) => set("role", e.target.value)} className={inputClass} placeholder="Search role..." />
        </FilterField>

        <FilterField label="Lead Source" name="source" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <input type="text" value={local.source || ""} onChange={(e) => set("source", e.target.value)} className={inputClass} placeholder="e.g. LinkedIn" />
        </FilterField>

        <FilterField label="Last Reach Source" name="last_reach_source" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
          <input type="text" value={local.last_reach_source || ""} onChange={(e) => set("last_reach_source", e.target.value)} className={inputClass} placeholder="e.g. Email" />
        </FilterField>
      </FilterGroup>

      {/* Flags & Dates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FilterGroup icon={<Flag className="w-4 h-4" />} title="Restrict Flags" cols="grid-cols-1 sm:grid-cols-3">
          <FilterField label="Do Not Contact" name="doNotContact" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
            <select value={local.doNotContact ?? ""} onChange={(e) => set("doNotContact", e.target.value)} className={selectClass}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </FilterField>

          <FilterField label="Bounced" name="bounced" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
            <select value={local.bounced ?? ""} onChange={(e) => set("bounced", e.target.value)} className={selectClass}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </FilterField>

          <FilterField label="Unsubscribed" name="unsubscribe" pinnedKeys={pinnedKeys} onTogglePin={handleTogglePin}>
            <select value={local.unsubscribe ?? ""} onChange={(e) => set("unsubscribe", e.target.value)} className={selectClass}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </FilterField>
        </FilterGroup>

        <FilterGroup icon={<Calendar className="w-4 h-4" />} title="Created Date" cols="grid-cols-1 sm:grid-cols-2">
          <FilterField label="From">
            <input type="date" value={local.dateFrom || ""} onChange={(e) => set("dateFrom", e.target.value)} className={inputClass} />
          </FilterField>

          <FilterField label="To">
            <input type="date" value={local.dateTo || ""} onChange={(e) => set("dateTo", e.target.value)} className={inputClass} />
          </FilterField>
        </FilterGroup>

        <FilterGroup icon={<Calendar className="w-4 h-4" />} title="Last Reach Date" cols="grid-cols-1 sm:grid-cols-2">
          <FilterField label="From">
            <input type="date" value={local.lastReachDateFrom || ""} onChange={(e) => set("lastReachDateFrom", e.target.value)} className={inputClass} />
          </FilterField>

          <FilterField label="To">
            <input type="date" value={local.lastReachDateTo || ""} onChange={(e) => set("lastReachDateTo", e.target.value)} className={inputClass} />
          </FilterField>
        </FilterGroup>
      </div>

      {/* Action Buttons & Save Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200/80 pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onApply(local)}
            className="inline-flex items-center justify-center h-10 px-6 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => { setLocal({}); onClear(); }}
            className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold border border-slate-200 text-slate-600 bg-white rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            Reset All
          </button>
        </div>

        {/* Save Current Filters Form */}
        <div className="flex items-center gap-2 shrink-0 max-w-sm w-full sm:w-auto">
          <input
            type="text"
            placeholder="Save these filters as..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="flex-1 sm:w-56 h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button
            type="button"
            onClick={handleSaveFilter}
            disabled={!saveName.trim() || Object.keys(local).length === 0}
            className="h-10 px-4 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
          >
            Save Filter
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ icon, title, children, cols }) {
  return (
    <div className="bg-white border border-slate-200/85 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
        <span className="text-indigo-500">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h3>
      </div>
      <div className={`grid ${cols} gap-4`}>
        {children}
      </div>
    </div>
  );
}

function FilterField({ label, children, name, pinnedKeys, onTogglePin }) {
  const isPinned = pinnedKeys?.includes(name);
  return (
    <div className="flex flex-col gap-1.5 relative group/field">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        {name && onTogglePin && (
          <button
            type="button"
            onClick={() => onTogglePin(name)}
            className={`opacity-0 group-hover/field:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100 cursor-pointer ${
              isPinned ? "opacity-100 text-indigo-600" : "text-slate-400"
            }`}
            title={isPinned ? "Unpin filter" : "Pin filter to top"}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-indigo-600 text-indigo-600" : ""}`} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
