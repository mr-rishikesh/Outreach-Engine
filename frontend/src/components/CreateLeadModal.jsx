import { useState } from "react";
import { X, Loader2, Save, User, Building2, Phone, Mail, Link2, MessageSquare, Tag } from "lucide-react";
import { api } from "../api";
import toast from "react-hot-toast";

const OUTREACH_STATUSES = [
  "NOT_SENT", "SENT", "FOLLOWUP_PENDING", "REPLIED_POSITIVE",
  "REPLIED_NEGATIVE", "NO_RESPONSE", "CLOSED",
];

const ENGAGEMENT_LEVELS = ["High", "Medium", "Low"];

export default function CreateLeadModal({ onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companey_name: "",
    companey_url: "",
    role: "",
    source: "",
    engagement: "Low",
    outreachStatus: "NOT_SENT",
    linkedin: "",
    twitter: "",
    insta: "",
    last_reach_date: "",
    last_reach_source: "",
    last_reach_message: "",
    notes: "",
    purpose: "apply",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...form,
        email: form.email.trim(),
        last_reach_date: form.last_reach_date ? new Date(form.last_reach_date) : null,
      };

      await api.createContact(dataToSubmit);
      toast.success("Lead created successfully");
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const selectClass =
    "w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer";

  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Create Manual Lead</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Enter contact details and outreach information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/30">
          
          {/* Section 1: Basic Info */}
          <FormSection icon={<User className="w-4 h-4 text-indigo-500" />} title="Primary Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="e.g. John"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. john.doe@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 (555) 019-2834"
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          {/* Section 2: Company & Role */}
          <FormSection icon={<Building2 className="w-4 h-4 text-indigo-500" />} title="Company & Role">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Role / Job Title</label>
                <input
                  type="text"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  name="companey_name"
                  value={form.companey_name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Company Website</label>
                <input
                  type="text"
                  name="companey_url"
                  value={form.companey_url}
                  onChange={handleChange}
                  placeholder="e.g. www.acme.com"
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          {/* Section 3: CRM Details */}
          <FormSection icon={<Tag className="w-4 h-4 text-indigo-500" />} title="Outreach & CRM Properties">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Outreach Status</label>
                <select
                  name="outreachStatus"
                  value={form.outreachStatus}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {OUTREACH_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Engagement Level</label>
                <select
                  name="engagement"
                  value={form.engagement}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {ENGAGEMENT_LEVELS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Lead Source</label>
                <input
                  type="text"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="e.g. LinkedIn, Inbound"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Lead Purpose / Type</label>
                <select
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="apply">Direct Apply (Founder/CEO)</option>
                  <option value="referral">Referral (SDE/Employee)</option>
                </select>
              </div>
            </div>
          </FormSection>

          {/* Section 4: Social Accounts */}
          <FormSection icon={<Link2 className="w-4 h-4 text-indigo-500" />} title="Social Profiles">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>LinkedIn URL</label>
                <input
                  type="text"
                  name="linkedin"
                  value={form.linkedin}
                  onChange={handleChange}
                  placeholder="linkedin.com/in/username"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Twitter Username</label>
                <input
                  type="text"
                  name="twitter"
                  value={form.twitter}
                  onChange={handleChange}
                  placeholder="twitter.com/handle"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Instagram Username</label>
                <input
                  type="text"
                  name="insta"
                  value={form.insta}
                  onChange={handleChange}
                  placeholder="instagram.com/username"
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          {/* Section 5: Interaction History */}
          <FormSection icon={<MessageSquare className="w-4 h-4 text-indigo-500" />} title="Latest Reach Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Last Reach Date</label>
                <input
                  type="date"
                  name="last_reach_date"
                  value={form.last_reach_date}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last Reach Channel / Source</label>
                <input
                  type="text"
                  name="last_reach_source"
                  value={form.last_reach_source}
                  onChange={handleChange}
                  placeholder="e.g. Instagram DM, Email"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Last Reach Message Outline</label>
              <textarea
                name="last_reach_message"
                value={form.last_reach_message}
                onChange={handleChange}
                rows={2}
                placeholder="Brief summary of the message sent..."
                className="w-full px-3.5 py-3 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all shadow-sm"
              />
            </div>
          </FormSection>

          {/* Notes */}
          <div className="space-y-1.5 bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-sm">
            <label className={labelClass}>General Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add initial notes or follow-up timelines..."
              className="w-full px-3.5 py-3 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all shadow-sm"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80 shrink-0 animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold border border-slate-200 text-slate-600 bg-white rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                Save Lead
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

function FormSection({ icon, title, children }) {
  return (
    <div className="border border-slate-200/80 rounded-xl p-5 bg-white flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        {icon}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
