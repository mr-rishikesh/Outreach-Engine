import { useState } from "react";
import { ListFilter, Calendar, Building2, Briefcase, Flag } from "lucide-react";

const OUTREACH_STATUSES = [
  "NOT_SENT", "SENT", "FOLLOWUP_PENDING", "REPLIED_POSITIVE",
  "REPLIED_NEGATIVE", "NO_RESPONSE", "CLOSED",
];

const REPLY_TYPES = ["positive", "negative", "neutral"];

const selectClass =
  "w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all cursor-pointer";

const inputClass =
  "w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all";

export default function FilterPanel({ filters, onApply, onClear }) {
  const [local, setLocal] = useState({ ...filters });

  const set = (key, value) => setLocal((p) => ({ ...p, [key]: value }));

  return (
    <div className="p-5 lg:p-6 space-y-6">
      {/* Status & Reply Filters */}
      <FilterGroup icon={<ListFilter className="w-4 h-4" />} title="Status & Engagement">
        <FilterField label="Outreach Status">
          <select value={local.outreachStatus || ""} onChange={(e) => set("outreachStatus", e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {OUTREACH_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Replied">
          <select value={local.replied ?? ""} onChange={(e) => set("replied", e.target.value)} className={selectClass}>
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FilterField>

        <FilterField label="Reply Type">
          <select value={local.replyType || ""} onChange={(e) => set("replyType", e.target.value)} className={selectClass}>
            <option value="">All types</option>
            {REPLY_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Email Opened">
          <select value={local.opened ?? ""} onChange={(e) => set("opened", e.target.value)} className={selectClass}>
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FilterField>
      </FilterGroup>

      {/* Activity Filters */}
      <FilterGroup icon={<Briefcase className="w-4 h-4" />} title="Activity & Metrics">
        <FilterField label="Min Followup Count">
          <input type="number" min={0} value={local.followupCountMin || ""} onChange={(e) => set("followupCountMin", e.target.value)} className={inputClass} placeholder="e.g. 1" />
        </FilterField>

        <FilterField label="Min Emails Sent">
          <input type="number" min={0} value={local.emailsSentMin || ""} onChange={(e) => set("emailsSentMin", e.target.value)} className={inputClass} placeholder="e.g. 2" />
        </FilterField>

        <FilterField label="Company">
          <input type="text" value={local.company || ""} onChange={(e) => set("company", e.target.value)} className={inputClass} placeholder="Filter by company name" />
        </FilterField>

        <FilterField label="Role / Title">
          <input type="text" value={local.role || ""} onChange={(e) => set("role", e.target.value)} className={inputClass} placeholder="Filter by job title" />
        </FilterField>
      </FilterGroup>

      {/* Flags & Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FilterGroup icon={<Flag className="w-4 h-4" />} title="Flags">
          <FilterField label="Do Not Contact">
            <select value={local.doNotContact ?? ""} onChange={(e) => set("doNotContact", e.target.value)} className={selectClass}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </FilterField>

          <FilterField label="Bounced">
            <select value={local.bounced ?? ""} onChange={(e) => set("bounced", e.target.value)} className={selectClass}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </FilterField>

          <FilterField label="Unsubscribed">
            <select value={local.unsubscribe ?? ""} onChange={(e) => set("unsubscribe", e.target.value)} className={selectClass}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </FilterField>
        </FilterGroup>

        <FilterGroup icon={<Calendar className="w-4 h-4" />} title="Date Range">
          <FilterField label="Created From">
            <input type="date" value={local.dateFrom || ""} onChange={(e) => set("dateFrom", e.target.value)} className={inputClass} />
          </FilterField>

          <FilterField label="Created To">
            <input type="date" value={local.dateTo || ""} onChange={(e) => set("dateTo", e.target.value)} className={inputClass} />
          </FilterField>
        </FilterGroup>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => onApply(local)}
          className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all"
        >
          Apply Filters
        </button>
        <button
          onClick={() => { setLocal({}); onClear(); }}
          className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          Reset All
        </button>
      </div>
    </div>
  );
}

function FilterGroup({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
