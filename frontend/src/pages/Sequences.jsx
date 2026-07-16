import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import {
  Play, Pause, Square, Mail, Users, Edit3, Trash2, Plus, 
  ChevronRight, RefreshCw, X, Check, AlertCircle, Loader2, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function Sequences() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [runLogs, setRunLogs] = useState(null); // { status: 'idle' | 'running' | 'done', logs: [] }
  const [runLoading, setRunLoading] = useState(false);

  // Detail view edit states
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  const loadSequences = async () => {
    setLoading(true);
    try {
      const res = await api.getSequences();
      setSequences(res.data || []);
      // If a sequence is selected, update it in detail view too
      if (selectedSequence) {
        const updated = res.data.find(s => s._id === selectedSequence._id);
        if (updated) {
          // Fetch populated contact details
          const detailRes = await api.getSequence(updated._id);
          setSelectedSequence(detailRes.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sequences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSequences();
  }, []);

  const handleStatusChange = async (seqId, newStatus) => {
    try {
      await api.updateSequence(seqId, { status: newStatus });
      toast.success(`Sequence status updated to ${newStatus}`);
      loadSequences();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (seqId) => {
    if (!confirm("Are you sure you want to delete this sequence? This cannot be undone.")) return;
    try {
      await api.deleteSequence(seqId);
      toast.success("Sequence deleted");
      if (selectedSequence?._id === seqId) setSelectedSequence(null);
      loadSequences();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete sequence.");
    }
  };

  const handleSelectSequence = async (seq) => {
    setEditMode(false);
    try {
      const res = await api.getSequence(seq._id);
      setSelectedSequence(res.data);
      setEditForm(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sequence details.");
    }
  };

  const handleRemoveContact = async (seqId, contactId) => {
    if (!confirm("Remove this contact from the sequence?")) return;
    try {
      await api.manageSequenceContacts(seqId, {
        action: "remove",
        contactId
      });
      toast.success("Contact removed from sequence.");
      // Refresh sequence detail
      const res = await api.getSequence(seqId);
      setSelectedSequence(res.data);
      loadSequences();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove contact.");
    }
  };

  const handleUpdateTemplates = async () => {
    try {
      await api.updateSequence(selectedSequence._id, {
        name: editForm.name,
        greeting: editForm.greeting,
        body: editForm.body,
        signature: editForm.signature,
        followupGreeting: editForm.followupGreeting,
        followupBody: editForm.followupBody,
        followupSignature: editForm.followupSignature,
        followupDays: Number(editForm.followupDays),
        maxFollowups: Number(editForm.maxFollowups)
      });
      toast.success("Templates updated successfully!");
      setEditMode(false);
      // Reload sequence detail
      const res = await api.getSequence(selectedSequence._id);
      setSelectedSequence(res.data);
      loadSequences();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    }
  };

  const handleRunSequence = async (seqId) => {
    setRunLoading(true);
    setRunLogs({ status: "running", logs: ["Initializing sequence runner..."] });
    try {
      const res = await api.runSequence(seqId);
      const { results } = res;
      
      const nextLogs = ["Sequence processing batch completed."];
      nextLogs.push(`Sent: ${results.sent.length} emails`);
      nextLogs.push(`Failed: ${results.failed.length} emails`);
      nextLogs.push(`Skipped: ${results.skipped.length} emails`);

      if (results.sent.length > 0) {
        results.sent.forEach(s => {
          nextLogs.push(`✅ SENT: ${s.email} (${s.isFollowup ? 'Follow-up' : 'Primary'})`);
        });
      }
      if (results.failed.length > 0) {
        results.failed.forEach(f => {
          nextLogs.push(`❌ FAILED: ${f.email} - ${f.error || f.reason || 'Unknown error'}`);
        });
      }

      setRunLogs({ status: "done", logs: nextLogs });
      loadSequences();
    } catch (err) {
      console.error(err);
      setRunLogs({ status: "done", logs: ["Error running sequence: " + err.message] });
      toast.error("Failed to execute sequence.");
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Email Sequences</h1>
          <p className="text-sm text-slate-500">Create, run, and monitor multi-step automated email campaigns</p>
        </div>

        <Link
          to="/sequences/new"
          className="inline-flex items-center gap-2 h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Sequence</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sequences list */}
        <div className="lg:col-span-2 space-y-4">
          {loading && sequences.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center italic text-slate-500">
              Loading email sequences...
            </div>
          ) : sequences.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center shadow-sm">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">No sequences created yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Set up an email flow with custom greeting, body template, and automated follow-ups.
              </p>
              <Link
                to="/sequences/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Create your first sequence
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sequences.map((seq) => {
                const isSelected = selectedSequence?._id === seq._id;
                return (
                  <div
                    key={seq._id}
                    className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between gap-4 cursor-pointer relative ${
                      isSelected ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200/80"
                    }`}
                    onClick={() => handleSelectSequence(seq)}
                  >
                    <div>
                      {/* Name & Type */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">
                            {seq.name}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {seq.type === "direct_apply" ? "Direct Apply" : "Referral"}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize select-none ${
                          seq.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : seq.status === "paused"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {seq.status}
                        </span>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-xs font-semibold text-slate-400">Total</p>
                          <p className="text-base font-bold text-slate-800 mt-0.5">{seq.stats?.total || 0}</p>
                        </div>
                        <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                          <p className="text-xs font-semibold text-indigo-400">Pending</p>
                          <p className="text-base font-bold text-indigo-700 mt-0.5">{seq.stats?.pending || 0}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                          <p className="text-xs font-semibold text-emerald-400">Sent</p>
                          <p className="text-base font-bold text-emerald-700 mt-0.5">{seq.stats?.sent || 0}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                          <p className="text-xs font-semibold text-green-400">Replied</p>
                          <p className="text-base font-bold text-green-700 mt-0.5">{seq.stats?.replied || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-1" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {seq.status !== "active" ? (
                          <button
                            onClick={() => handleStatusChange(seq._id, "active")}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="Play / Activate Sequence"
                          >
                            <Play className="w-3.5 h-3.5 fill-emerald-700" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(seq._id, "paused")}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                            title="Pause / Temp Stop"
                          >
                            <Pause className="w-3.5 h-3.5 fill-amber-700" />
                          </button>
                        )}
                        
                        {seq.status !== "stopped" && (
                          <button
                            onClick={() => handleStatusChange(seq._id, "stopped")}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors cursor-pointer"
                            title="Stop / Permanent Stop"
                          >
                            <Square className="w-3.5 h-3.5 fill-red-700" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRunSequence(seq._id)}
                          disabled={seq.status !== "active" || runLoading}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Run Batch
                        </button>

                        <button
                          onClick={() => handleDelete(seq._id)}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-100 transition-colors cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Sequence Detail Side Panel */}
        <div className="lg:col-span-1">
          {selectedSequence ? (
            <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden sticky top-20 flex flex-col max-h-[calc(100vh-7rem)]">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{selectedSequence.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">Campaign Inspector</p>
                </div>
                <button
                  onClick={() => setSelectedSequence(null)}
                  className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs / Content Scroll Area */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* Mode Selector */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setEditMode(false)}
                    className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                      !editMode ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Target Contacts
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                      editMode ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Edit Templates
                  </button>
                </div>

                {/* TARGET CONTACTS VIEW */}
                {!editMode && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contacts ({selectedSequence.contacts.length})</span>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {selectedSequence.contacts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-5">No contacts in this sequence.</p>
                      ) : (
                        selectedSequence.contacts.map((sc) => {
                          const contact = sc.contactId;
                          if (!contact) return null;
                          return (
                            <div
                              key={sc._id}
                              className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm bg-white ${
                                sc.status === "removed" ? "border-slate-100 opacity-60 bg-slate-50" : "border-slate-200/80"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">
                                  {contact.firstName} {contact.lastName}
                                </p>
                                <p className="text-slate-400 text-[10px] mt-0.5 truncate">{contact.email}</p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                    sc.status === "pending"
                                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                                      : sc.status === "sent"
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                      : sc.status === "followup_pending"
                                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                                      : sc.status === "replied"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-red-50 text-red-700 border border-red-100"
                                  }`}>
                                    {sc.status.replace(/_/g, " ")}
                                  </span>
                                  {sc.lastSentDate && (
                                    <span className="text-[9px] text-slate-400">
                                      Sent: {new Date(sc.lastSentDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {sc.status !== "removed" && (
                                <button
                                  onClick={() => handleRemoveContact(selectedSequence._id, contact._id)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer border border-transparent hover:border-red-100"
                                  title="Remove from sequence"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* EDIT TEMPLATES VIEW */}
                {editMode && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Sequence Name</label>
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Greeting Template</label>
                      <input
                        type="text"
                        value={editForm.greeting || ""}
                        onChange={(e) => setEditForm({ ...editForm, greeting: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Primary Email Body</label>
                      <textarea
                        value={editForm.body || ""}
                        onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                        rows={6}
                        className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Signature</label>
                      <textarea
                        value={editForm.signature || ""}
                        onChange={(e) => setEditForm({ ...editForm, signature: e.target.value })}
                        rows={2}
                        className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-700">Follow-up Template</h4>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Days</label>
                          <input
                            type="number"
                            value={editForm.followupDays || 3}
                            onChange={(e) => setEditForm({ ...editForm, followupDays: e.target.value })}
                            className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Max Count</label>
                          <input
                            type="number"
                            value={editForm.maxFollowups || 1}
                            onChange={(e) => setEditForm({ ...editForm, maxFollowups: e.target.value })}
                            className="w-full h-9 px-3 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Follow-up Greeting</label>
                        <input
                          type="text"
                          value={editForm.followupGreeting || ""}
                          onChange={(e) => setEditForm({ ...editForm, followupGreeting: e.target.value })}
                          className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Follow-up Body</label>
                        <textarea
                          value={editForm.followupBody || ""}
                          onChange={(e) => setEditForm({ ...editForm, followupBody: e.target.value })}
                          rows={4}
                          className="w-full p-3 border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Follow-up Signature</label>
                        <textarea
                          value={editForm.followupSignature || ""}
                          onChange={(e) => setEditForm({ ...editForm, followupSignature: e.target.value })}
                          rows={2}
                          className="w-full p-3 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateTemplates}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Save Template Updates
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 italic text-xs select-none">
              Click on a sequence card to inspect its email templates, statistics, and contacts.
            </div>
          )}
        </div>
      </div>

      {/* Batch Running Logs Modal */}
      {runLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden ring-1 ring-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                {runLoading ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 font-bold" />
                )}
                <h3 className="font-bold text-sm">Sequence Run Logs</h3>
              </div>
              {!runLoading && (
                <button
                  onClick={() => setRunLogs(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Logs Area */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto space-y-1.5 scrollbar-thin">
                {runLogs.logs.map((log, i) => (
                  <p
                    key={i}
                    className={
                      log.startsWith("❌")
                        ? "text-red-400"
                        : log.startsWith("✅")
                        ? "text-emerald-400"
                        : log.startsWith("⏭️")
                        ? "text-amber-400"
                        : "text-slate-300"
                    }
                  >
                    {log}
                  </p>
                ))}
                {runLoading && (
                  <p className="text-slate-500 animate-pulse mt-2">Processing campaigns, please wait (nodemailing contacts)...</p>
                )}
              </div>

              {!runLoading && (
                <button
                  onClick={() => setRunLogs(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close Logs
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
