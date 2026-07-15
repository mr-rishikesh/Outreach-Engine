import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import toast from "react-hot-toast";
import {
  ArrowLeft, Send, RefreshCw, Save, Mail, Building2,
  User, Globe, Phone, MapPin, MessageSquare, Clock,
  Loader2, UserX, Tag,
} from "lucide-react";
import EmailSendingModal from "../components/EmailSendingModal";

const STATUS_COLORS = {
  NOT_SENT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  FOLLOWUP_PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  REPLIED_POSITIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  REPLIED_NEGATIVE: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  NO_RESPONSE: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  CLOSED: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
};

const OUTREACH_STATUSES = [
  "NOT_SENT", "SENT", "FOLLOWUP_PENDING", "REPLIED_POSITIVE",
  "REPLIED_NEGATIVE", "NO_RESPONSE", "CLOSED",
];

const ENGAGEMENT_LEVELS = ["High", "Medium", "Low"];

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [emailModal, setEmailModal] = useState({ phase: null, type: null, result: null });

  // Full editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companey_name: "",
    companey_url: "",
    role: "",
    city: "",
    state: "",
    country: "",
    industry: "",
    employees: "",
    linkedin: "",
    twitter: "",
    insta: "",
    source: "",
    engagement: "Low",
    outreachStatus: "NOT_SENT",
    last_reach_date: "",
    last_reach_source: "",
    last_reach_message: "",
  });

  const loadContact = async () => {
    try {
      const d = await api.getContact(id);
      const c = d.data;
      setContact(c);
      setNotes(c.notes || "");
      setStatus(c.outreachStatus || "NOT_SENT");
      setEditForm({
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        email: c.email || "",
        phone: c.phone || c.workDirectPhone || "",
        companey_name: c.companey_name || c.companyName || "",
        companey_url: c.companey_url || c.website || "",
        role: c.role || c.title || "",
        city: c.city || c.companyCity || "",
        state: c.state || c.companyState || "",
        country: c.country || c.companyCountry || "",
        industry: c.industry || "",
        employees: c.employees || "",
        linkedin: c.linkedin || c.personLinkedinUrl || "",
        twitter: c.twitter || c.twitterUrl || "",
        insta: c.insta || "",
        source: c.source || "",
        engagement: c.engagement || "Low",
        outreachStatus: c.outreachStatus || "NOT_SENT",
        last_reach_date: c.last_reach_date ? new Date(c.last_reach_date).toISOString().split('T')[0] : "",
        last_reach_source: c.last_reach_source || "",
        last_reach_message: c.last_reach_message || "",
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContact();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateContact(id, { notes, outreachStatus: status });
      setContact(res.data);
      toast.success("Contact notes & status updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const formatted = {
        ...editForm,
        last_reach_date: editForm.last_reach_date ? new Date(editForm.last_reach_date) : null,
        notes: notes, // Keep notes sync
      };
      const res = await api.updateContact(id, formatted);
      setContact(res.data);
      setStatus(res.data.outreachStatus || "NOT_SENT");
      setIsEditing(false);
      toast.success("Lead profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    setEmailModal({ phase: "sending", type: "email", result: null });
    try {
      const res = await api.sendEmails([id]);
      setEmailModal({ phase: "result", type: "email", result: res.results });
    } catch (err) {
      setEmailModal({ phase: "result", type: "email", result: { sent: [], failed: [{ id, email: contact?.email || "Unknown", error: err.message }] } });
    } finally {
      setSending(false);
    }
  };

  const handleSendFollowup = async () => {
    setSending(true);
    setEmailModal({ phase: "sending", type: "followup", result: null });
    try {
      const res = await api.sendFollowups([id]);
      setEmailModal({ phase: "result", type: "followup", result: res.results });
    } catch (err) {
      setEmailModal({ phase: "result", type: "followup", result: { sent: [], failed: [{ id, email: contact?.email || "Unknown", error: err.message }] } });
    } finally {
      setSending(false);
    }
  };

  const closeEmailModal = async () => {
    setEmailModal({ phase: null, type: null, result: null });
    loadContact();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Loading contact...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
        <UserX className="w-10 h-10 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-500">Contact not found</p>
      </div>
    );
  }

  const c = contact;

  const inputClass =
    "w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const selectClass =
    "w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer";

  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="flex flex-col gap-6 lg:gap-8 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Avatar + Info */}
            {isEditing ? (
              <div className="flex gap-2 min-w-0 flex-1 sm:max-w-md">
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="First name"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="Last name"
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-indigo-600">
                    {(c.firstName?.[0] || "").toUpperCase()}
                    {(c.lastName?.[0] || "").toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-800 truncate">
                    {c.firstName} {c.lastName}
                  </h1>
                  <p className="text-sm text-slate-500 truncate mt-0.5">
                    {c.role || c.title}{c.role || c.title ? " at " : ""}{c.companey_name || c.companyName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Edit Toggle and Status */}
          <div className="flex items-center gap-3 shrink-0">
            {isEditing ? (
              <select
                value={editForm.outreachStatus}
                onChange={(e) => setEditForm(p => ({ ...p, outreachStatus: e.target.value }))}
                className={`${selectClass} w-44`}
              >
                {OUTREACH_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            ) : (
              <>
                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${STATUS_COLORS[c.outreachStatus] || STATUS_COLORS.NOT_SENT}`}>
                  {(c.outreachStatus || "NOT_SENT").replace(/_/g, " ")}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Edit Lead
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-5 lg:gap-6">
          
          {/* Contact Info Card */}
          <Card>
            <CardHeader icon={<User className="w-4 h-4" />} title="Contact & Company Information" />
            
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Role / Title</label>
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Company Name</label>
                  <input
                    type="text"
                    value={editForm.companey_name}
                    onChange={(e) => setEditForm(p => ({ ...p, companey_name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Company URL</label>
                  <input
                    type="text"
                    value={editForm.companey_url}
                    onChange={(e) => setEditForm(p => ({ ...p, companey_url: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <input
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm(p => ({ ...p, industry: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Employee Count</label>
                  <input
                    type="text"
                    value={editForm.employees}
                    onChange={(e) => setEditForm(p => ({ ...p, employees: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                
                {/* Location Group */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm(p => ({ ...p, city: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm(p => ({ ...p, state: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) => setEditForm(p => ({ ...p, country: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-5">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={c.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={c.phone || c.workDirectPhone || "-"} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={c.companey_name || c.companyName} />
                <InfoRow icon={<Globe className="w-4 h-4" />} label="Website" value={c.companey_url || c.website} link />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={[c.city || c.companyCity, c.state || c.companyState, c.country || c.companyCountry].filter(Boolean).join(", ") || "-"} />
                <InfoRow label="Industry" value={c.industry || "-"} />
                <InfoRow label="Employees" value={c.employees || "-"} />
              </div>
            )}
          </Card>

          {/* CRM & Socials Card */}
          <Card>
            <CardHeader icon={<Tag className="w-4 h-4" />} title="CRM Properties & Social Handles" />
            
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className={labelClass}>Lead Source</label>
                  <input
                    type="text"
                    value={editForm.source}
                    onChange={(e) => setEditForm(p => ({ ...p, source: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. LinkedIn, Apollo"
                  />
                </div>
                <div>
                  <label className={labelClass}>Engagement Level</label>
                  <select
                    value={editForm.engagement}
                    onChange={(e) => setEditForm(p => ({ ...p, engagement: e.target.value }))}
                    className={selectClass}
                  >
                    {ENGAGEMENT_LEVELS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm(p => ({ ...p, linkedin: e.target.value }))}
                    className={inputClass}
                    placeholder="linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Twitter Profile URL</label>
                  <input
                    type="text"
                    value={editForm.twitter}
                    onChange={(e) => setEditForm(p => ({ ...p, twitter: e.target.value }))}
                    className={inputClass}
                    placeholder="twitter.com/..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Instagram Profile URL</label>
                  <input
                    type="text"
                    value={editForm.insta}
                    onChange={(e) => setEditForm(p => ({ ...p, insta: e.target.value }))}
                    className={inputClass}
                    placeholder="instagram.com/..."
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-5">
                <InfoRow label="Lead Source" value={c.source || "-"} />
                <InfoRow label="Engagement Rating" value={c.engagement || "Low"} />
                <InfoRow label="LinkedIn URL" value={c.linkedin || c.personLinkedinUrl} link />
                <InfoRow label="Twitter URL" value={c.twitter || c.twitterUrl} link />
                <InfoRow label="Instagram URL" value={c.insta} link />
              </div>
            )}
          </Card>

          {/* Last Reach Card */}
          <Card>
            <CardHeader icon={<MessageSquare className="w-4 h-4" />} title="Reach Details" />
            
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className={labelClass}>Last Reach Date</label>
                  <input
                    type="date"
                    value={editForm.last_reach_date}
                    onChange={(e) => setEditForm(p => ({ ...p, last_reach_date: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Reach Source / Channel</label>
                  <input
                    type="text"
                    value={editForm.last_reach_source}
                    onChange={(e) => setEditForm(p => ({ ...p, last_reach_source: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Email, Insta Direct"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Last Reach Message Outline</label>
                  <textarea
                    value={editForm.last_reach_message}
                    onChange={(e) => setEditForm(p => ({ ...p, last_reach_message: e.target.value }))}
                    rows={3}
                    className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 resize-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-5">
                <InfoRow label="Last Reach Date" value={c.last_reach_date ? new Date(c.last_reach_date).toLocaleDateString() : "-"} />
                <InfoRow label="Last Reach Source" value={c.last_reach_source || "-"} />
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-400 mb-1">Last Reach Message Outline</p>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3">{c.last_reach_message || "No reach logs recorded"}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Email History Card */}
          <Card>
            <CardHeader icon={<Mail className="w-4 h-4" />} title="Email Campaign History" />
            <div className="mt-5">
              {c.emails && c.emails.length > 0 ? (
                <div className="space-y-3">
                  {c.emails.map((e, i) => (
                    <div key={i} className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className={`p-2 rounded-lg shrink-0 ${e.type === "followup" ? "bg-amber-100" : "bg-blue-100"}`}>
                        {e.type === "followup"
                          ? <RefreshCw className="w-4 h-4 text-amber-600" />
                          : <Send className="w-4 h-4 text-blue-600" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{e.subject}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          {e.sentAt ? new Date(e.sentAt).toLocaleString() : "-"}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize bg-indigo-50 text-indigo-700`}>
                        {e.type || "outreach"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No emails sent yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-5 lg:gap-6">
          
          {/* Actions / Editing Controls Card */}
          <Card>
            <CardHeader title={isEditing ? "Editing Lead Properties" : "Outreach Actions"} />
            <div className="mt-5 space-y-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); loadContact(); }}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSendEmail}
                    disabled={sending || c.flags?.doNotContact}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? "Sending..." : "Send Email"}
                  </button>
                  <button
                    onClick={handleSendFollowup}
                    disabled={sending || c.flags?.doNotContact}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {sending ? "Sending..." : "Send Follow-up"}
                  </button>
                </>
              )}
            </div>
          </Card>

          {/* Status & Tracking Card */}
          <Card>
            <CardHeader title="Outreach Metrics" />
            <div className="mt-5 space-y-5">
              {!isEditing && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Outreach Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      api.updateContact(id, { outreachStatus: e.target.value }).then(loadContact).catch(toast.error);
                    }}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all cursor-pointer text-slate-800 font-medium"
                  >
                    {OUTREACH_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Emails Sent" value={c.emailStats?.emailsSent || 0} />
                <StatBox label="Followups" value={`${c.followup?.followupCount || 0}/${c.followup?.maxFollowups || 3}`} />
                <StatBox label="Opened" value={c.emailStats?.opened ? "Yes" : "No"} />
                <StatBox label="Followup On" value={c.followup?.followupEnabled ? "Yes" : "No"} />
              </div>

              {/* Flags */}
              {(c.flags?.doNotContact || c.flags?.bounced || c.flags?.unsubscribe) && (
                <div className="flex flex-wrap gap-2">
                  {c.flags?.doNotContact && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">Do Not Contact</span>
                  )}
                  {c.flags?.bounced && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20">Bounced</span>
                  )}
                  {c.flags?.unsubscribe && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">Unsubscribed</span>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader title="Notes Log" />
            <div className="mt-5 space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 resize-none transition-all"
                placeholder="Add notes about this contact..."
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 h-10 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Email Sending / Result Modal */}
      <EmailSendingModal
        phase={emailModal.phase}
        type={emailModal.type}
        result={emailModal.result}
        onClose={closeEmailModal}
        count={1}
      />
    </div>
  );
}

/* ---------- Reusable sub-components ---------- */

function Card({ children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 lg:p-6">
      {children}
    </div>
  );
}

function CardHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && <span className="text-indigo-500">{icon}</span>}
      <h2 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5 text-center">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-800 tracking-tight">{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value, link }) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>
        {link && value && value !== "-" ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline break-all transition-colors"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-slate-700 break-all">{value || "-"}</p>
        )}
      </div>
    </div>
  );
}
