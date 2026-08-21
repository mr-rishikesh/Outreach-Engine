import { useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";
import {
  Send, RefreshCw, MessageSquare, Ban, X,
  ThumbsUp, ThumbsDown, StickyNote, ToggleRight, ToggleLeft, Plus
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

  // Batch states
  const [sequences, setSequences] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: "",
    sequence_id: "",
    email_send_date: new Date().toISOString().split("T")[0],
    follow_up_dates: []
  });

  const handleOpenBatchModal = async () => {
    try {
      const res = await api.getSequences();
      const seqs = res.data || [];
      setSequences(seqs);
      setBatchForm({
        name: "",
        sequence_id: seqs.length > 0 ? seqs[0]._id : "",
        email_send_date: new Date().toISOString().split("T")[0],
        follow_up_dates: seqs.length > 0 && seqs[0].followupDays ? [
          (() => {
            const d = new Date();
            d.setDate(d.getDate() + seqs[0].followupDays);
            return d.toISOString().split("T")[0];
          })()
        ] : []
      });
      setShowBatchModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sequences templates.");
    }
  };

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
        <BulkBtn onClick={handleOpenBatchModal} disabled={loading} icon={<Plus />}>
          New Batch
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

      {/* New Batch Modal */}
      {showBatchModal && (
        <Modal onClose={() => setShowBatchModal(false)}>
          <div className="p-6 max-w-xl w-full text-xs">
            <h3 className="text-sm font-extrabold text-slate-800 mb-1.5 uppercase tracking-wide">Schedule New Campaign Batch</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">Create a batch for {count} selected contacts</p>

            <div className="space-y-4">
              {/* Batch Name */}
              <div>
                <label className="block font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Batch Name</label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. Q3 Outreach Batch A"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Select Sequence */}
              <div>
                <label className="block font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Select Sequence Template</label>
                <select
                  value={batchForm.sequence_id}
                  onChange={(e) => {
                    const seqId = e.target.value;
                    const seq = sequences.find(s => s._id === seqId);
                    setBatchForm(prev => {
                      const suggestedFollowups = [];
                      if (prev.email_send_date && seq?.followupDays) {
                        const dateObj = new Date(prev.email_send_date);
                        dateObj.setDate(dateObj.getDate() + seq.followupDays);
                        suggestedFollowups.push(dateObj.toISOString().split("T")[0]);
                      }
                      return {
                        ...prev,
                        sequence_id: seqId,
                        follow_up_dates: suggestedFollowups
                      };
                    });
                  }}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>-- Select a Sequence --</option>
                  {sequences.map((seq) => (
                    <option key={seq._id} value={seq._id}>
                      {seq.name} ({seq.type === "direct_apply" ? "Direct Apply" : "Referral"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Send date & Follow-ups */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Initial Email Send Date</label>
                  <input
                    type="date"
                    value={batchForm.email_send_date}
                    onChange={(e) => {
                      const newSendDate = e.target.value;
                      const seq = sequences.find(s => s._id === batchForm.sequence_id);
                      setBatchForm(prev => {
                        const suggestedFollowups = [];
                        if (newSendDate && seq?.followupDays) {
                          const dateObj = new Date(newSendDate);
                          dateObj.setDate(dateObj.getDate() + seq.followupDays);
                          suggestedFollowups.push(dateObj.toISOString().split("T")[0]);
                        }
                        return {
                          ...prev,
                          email_send_date: newSendDate,
                          follow_up_dates: suggestedFollowups
                        };
                      });
                    }}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Follow-up Send Dates</label>
                  <div className="space-y-2">
                    {batchForm.follow_up_dates.map((date, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => {
                            const newDates = [...batchForm.follow_up_dates];
                            newDates[idx] = e.target.value;
                            setBatchForm({ ...batchForm, follow_up_dates: newDates });
                          }}
                          className="flex-1 h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newDates = batchForm.follow_up_dates.filter((_, i) => i !== idx);
                            setBatchForm({ ...batchForm, follow_up_dates: newDates });
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-100 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newDates = [...batchForm.follow_up_dates];
                        let baseDate = batchForm.email_send_date || new Date().toISOString().split("T")[0];
                        if (newDates.length > 0) {
                          baseDate = newDates[newDates.length - 1];
                        }
                        const seq = sequences.find(s => s._id === batchForm.sequence_id);
                        const dateObj = new Date(baseDate);
                        dateObj.setDate(dateObj.getDate() + (seq?.followupDays || 3));
                        newDates.push(dateObj.toISOString().split("T")[0]);
                        setBatchForm({ ...batchForm, follow_up_dates: newDates });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3 font-bold" />
                      Add Date
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={async () => {
                  if (!batchForm.name.trim()) {
                    toast.error("Batch name is required.");
                    return;
                  }
                  if (!batchForm.sequence_id) {
                    toast.error("Please select a sequence template.");
                    return;
                  }
                  if (!batchForm.email_send_date) {
                    toast.error("Email send date is required.");
                    return;
                  }

                  setLoading(true);
                  try {
                    await api.createBatch({
                      name: batchForm.name,
                      sequence_id: batchForm.sequence_id,
                      contactIds: selectedIds,
                      email_send_date: batchForm.email_send_date,
                      follow_up_dates: batchForm.follow_up_dates,
                    });
                    toast.success(`Batch "${batchForm.name}" created and scheduled for ${count} contacts!`);
                    setShowBatchModal(false);
                    onDone();
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to create batch: " + err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 h-9 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                {loading ? "Scheduling..." : "Save Scheduled Batch"}
              </button>
              <button
                onClick={() => setShowBatchModal(false)}
                className="h-9 px-5 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

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
