import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import toast from "react-hot-toast";
import {
  ArrowLeft, Send, RefreshCw, Save, Mail, Building2,
  User, Globe, Phone, MapPin, MessageSquare, Clock,
  Loader2, UserX,
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

  useEffect(() => {
    api.getContact(id).then((d) => {
      setContact(d.data);
      setNotes(d.data.notes || "");
      setStatus(d.data.outreachStatus || "NOT_SENT");
      setLoading(false);
    }).catch((err) => {
      toast.error(err.message);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateContact(id, { notes, outreachStatus: status });
      setContact(res.data);
      toast.success("Contact updated");
    } catch (err) {
      toast.error(err.message);
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
      setEmailModal({ phase: "result", type: "email", result: { sent: [], failed: [{ id, email: c?.email || "Unknown", error: err.message }] } });
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
      setEmailModal({ phase: "result", type: "followup", result: { sent: [], failed: [{ id, email: c?.email || "Unknown", error: err.message }] } });
    } finally {
      setSending(false);
    }
  };

  const closeEmailModal = async () => {
    setEmailModal({ phase: null, type: null, result: null });
    // Refresh contact data after sending
    try {
      const d = await api.getContact(id);
      setContact(d.data);
      setNotes(d.data.notes || "");
      setStatus(d.data.outreachStatus || "NOT_SENT");
    } catch (_) {}
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

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="self-start p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar + Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
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
                {c.title}{c.title && c.companyName ? " at " : ""}{c.companyName}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`self-start sm:self-center shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${STATUS_COLORS[c.outreachStatus] || STATUS_COLORS.NOT_SENT}`}>
            {(c.outreachStatus || "NOT_SENT").replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5 lg:space-y-6">
          {/* Contact Info Card */}
          <Card>
            <CardHeader icon={<User className="w-4 h-4" />} title="Contact Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-5">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={c.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={c.workDirectPhone || c.mobilePhone || "-"} />
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={c.companyName} />
              <InfoRow icon={<Globe className="w-4 h-4" />} label="Website" value={c.website} link />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={[c.city, c.state, c.country].filter(Boolean).join(", ") || "-"} />
              <InfoRow label="Industry" value={c.industry || "-"} />
              <InfoRow label="Employees" value={c.employees || "-"} />
              <InfoRow label="LinkedIn" value={c.personLinkedinUrl} link />
            </div>
          </Card>

          {/* Email History Card */}
          <Card>
            <CardHeader icon={<Mail className="w-4 h-4" />} title="Email History" />
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
                      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        e.type === "followup"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                          : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                      }`}>
                        {e.type}
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

          {/* Reply Info Card */}
          {c.reply?.replied && (
            <Card>
              <CardHeader icon={<MessageSquare className="w-4 h-4" />} title="Reply" />
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 w-16 shrink-0">Type</span>
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                    c.reply.replyType === "positive"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                      : c.reply.replyType === "negative"
                      ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {c.reply.replyType}
                  </span>
                </div>
                {c.reply.replyMessage && (
                  <div className="flex gap-3">
                    <span className="text-slate-500 w-16 shrink-0 pt-0.5">Message</span>
                    <p className="text-slate-700 bg-slate-50 rounded-lg px-3.5 py-2.5 flex-1 border border-slate-100">{c.reply.replyMessage}</p>
                  </div>
                )}
                {c.reply.repliedAt && (
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 w-16 shrink-0">Date</span>
                    <span className="text-slate-700">{new Date(c.reply.repliedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5 lg:space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader title="Actions" />
            <div className="mt-5 space-y-3">
              <button
                onClick={handleSendEmail}
                disabled={sending || c.flags?.doNotContact}
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : "Send Email"}
              </button>
              <button
                onClick={handleSendFollowup}
                disabled={sending || c.flags?.doNotContact}
                className="w-full inline-flex items-center justify-center gap-2 h-11 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                {sending ? "Sending..." : "Send Follow-up"}
              </button>
            </div>
          </Card>

          {/* Status & Tracking Card */}
          <Card>
            <CardHeader title="Status & Tracking" />
            <div className="mt-5 space-y-5">
              {/* Status Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">Outreach Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all cursor-pointer"
                >
                  {OUTREACH_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

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
            <CardHeader title="Notes" />
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
                className="w-full inline-flex items-center justify-center gap-2 h-10 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
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
