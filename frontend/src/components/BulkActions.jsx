import { useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";
import {
  Send, RefreshCw, MessageSquare, Ban, X,
  ThumbsUp, ThumbsDown, StickyNote, ToggleRight, ToggleLeft,
} from "lucide-react";
import EmailSendingModal from "./EmailSendingModal";

const OUTREACH_STATUSES = [
  "NOT_SENT", "SENT", "FOLLOWUP_PENDING", "REPLIED_POSITIVE",
  "REPLIED_NEGATIVE", "NO_RESPONSE", "CLOSED",
];

const STATUS_BADGE = {
  NOT_SENT: "hover:bg-slate-100",
  SENT: "hover:bg-blue-50",
  FOLLOWUP_PENDING: "hover:bg-amber-50",
  REPLIED_POSITIVE: "hover:bg-emerald-50",
  REPLIED_NEGATIVE: "hover:bg-red-50",
  NO_RESPONSE: "hover:bg-orange-50",
  CLOSED: "hover:bg-purple-50",
};

export default function BulkActions({ selectedIds, count, onClear, onDone }) {
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState("");

  // Email sending modal state
  const [emailModal, setEmailModal] = useState({ phase: null, type: null, result: null });

  const runBulk = async (update, label) => {
    setLoading(true);
    try {
      await api.bulkUpdate(selectedIds, update);
      toast.success(`${label} - ${count} contacts updated`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    setEmailModal({ phase: "sending", type: "email", result: null });
    try {
      const res = await api.sendEmails(selectedIds);
      setEmailModal({ phase: "result", type: "email", result: res.results });
    } catch (err) {
      setEmailModal({ phase: "result", type: "email", result: { sent: [], failed: selectedIds.map((id) => ({ id, email: "Unknown", error: err.message })) } });
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowup = async () => {
    setLoading(true);
    setEmailModal({ phase: "sending", type: "followup", result: null });
    try {
      const res = await api.sendFollowups(selectedIds);
      setEmailModal({ phase: "result", type: "followup", result: res.results });
    } catch (err) {
      setEmailModal({ phase: "result", type: "followup", result: { sent: [], failed: selectedIds.map((id) => ({ id, email: "Unknown", error: err.message })) } });
    } finally {
      setLoading(false);
    }
  };

  const closeEmailModal = () => {
    setEmailModal({ phase: null, type: null, result: null });
    onDone();
  };

  return (
    <>
      <div className="bg-indigo-600 rounded-xl p-3 lg:p-4 flex flex-wrap items-center gap-2 lg:gap-2.5 sticky top-15 z-40 shadow-lg ring-1 ring-indigo-500">
        {/* Count */}
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-white/15 px-3 py-1.5 rounded-lg mr-1">
          {count} selected
        </span>

        {/* Divider */}
        <div className="hidden lg:block w-px h-7 bg-white/25" />

        {/* Action Buttons */}
        <BulkBtn onClick={handleSendEmail} disabled={loading} icon={<Send />}>
          Send Email
        </BulkBtn>
        <BulkBtn onClick={handleSendFollowup} disabled={loading} icon={<RefreshCw />}>
          Followup
        </BulkBtn>
        <BulkBtn onClick={() => setShowStatusModal(true)} disabled={loading} icon={<MessageSquare />}>
          Status
        </BulkBtn>
        <BulkBtn onClick={() => setShowNotesModal(true)} disabled={loading} icon={<StickyNote />}>
          Notes
        </BulkBtn>

        <div className="hidden lg:block w-px h-7 bg-white/25" />

        <BulkBtn onClick={() => runBulk({ "followup.followupEnabled": true }, "Followups enabled")} disabled={loading} icon={<ToggleRight />}>
          Enable FU
        </BulkBtn>
        <BulkBtn onClick={() => runBulk({ "followup.followupEnabled": false }, "Followups disabled")} disabled={loading} icon={<ToggleLeft />}>
          Disable FU
        </BulkBtn>
        <BulkBtn onClick={() => runBulk({ "reply.replied": true, "reply.replyType": "positive", outreachStatus: "REPLIED_POSITIVE" }, "Marked replied positive")} disabled={loading} icon={<ThumbsUp />} className="text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/20">
          Replied +
        </BulkBtn>
        <BulkBtn onClick={() => runBulk({ "reply.replied": true, "reply.replyType": "negative", outreachStatus: "REPLIED_NEGATIVE" }, "Marked replied negative")} disabled={loading} icon={<ThumbsDown />} className="text-orange-200 border-orange-400/40 hover:bg-orange-500/20">
          Replied -
        </BulkBtn>
        <BulkBtn onClick={() => runBulk({ "flags.doNotContact": true }, "Marked do not contact")} disabled={loading} icon={<Ban />} className="text-red-200 border-red-400/40 hover:bg-red-500/20">
          DNC
        </BulkBtn>

        {/* Close */}
        <button
          onClick={onClear}
          className="ml-auto p-2 hover:bg-white/15 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Email Sending / Result Modal */}
      <EmailSendingModal
        phase={emailModal.phase}
        type={emailModal.type}
        result={emailModal.result}
        onClose={closeEmailModal}
        count={count}
      />

      {/* Status Modal */}
      {showStatusModal && (
        <Modal onClose={() => setShowStatusModal(false)}>
          <div className="p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Update Status</h3>
            <p className="text-sm text-slate-500 mb-5">Set status for {count} contacts</p>
            <div className="space-y-1">
              {OUTREACH_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    runBulk({ outreachStatus: s }, `Status set to ${s}`);
                    setShowStatusModal(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg transition-colors ${STATUS_BADGE[s]}`}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <Modal onClose={() => setShowNotesModal(false)}>
          <div className="p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Update Notes</h3>
            <p className="text-sm text-slate-500 mb-5">Add notes to {count} contacts</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 resize-none transition-all"
              placeholder="Enter notes..."
              autoFocus
            />
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => {
                  runBulk({ notes }, "Notes updated");
                  setShowNotesModal(false);
                  setNotes("");
                }}
                className="flex-1 h-10 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
              >
                Save Notes
              </button>
              <button
                onClick={() => setShowNotesModal(false)}
                className="h-10 px-5 border border-slate-200 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function BulkBtn({ onClick, disabled, icon, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white/90 rounded-lg border border-white/20 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all ${className}`}
    >
      <span className="w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
