import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import {
  Play, Pause, Mail, Users, Edit3, Trash2, Plus, 
  ChevronRight, RefreshCw, X, Check, Loader2, ArrowRight, Calendar, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

export default function Sequences() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [testStep, setTestStep] = useState("primary");
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    setSendingTest(true);
    try {
      const payload = {
        email: testRecipient,
        subject: editForm.subject,
        greeting: testStep === "followup" ? editForm.followupGreeting : editForm.greeting,
        body: testStep === "followup" ? editForm.followupBody : editForm.body,
        signature: testStep === "followup" ? editForm.followupSignature : editForm.signature,
        step: testStep
      };
      await api.sendTestSequenceEmail(payload);
      toast.success("Test email dispatched successfully!");
      setShowTestModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to send test email.");
    } finally {
      setSendingTest(false);
    }
  };

  // Batch states
  const [batches, setBatches] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    name: "",
    email_send_date: "",
    follow_up_dates: [],
    contactIds: []
  });
  const [allContacts, setAllContacts] = useState([]);
  const [searchContact, setSearchContact] = useState("");

  const loadSequences = async () => {
    setLoading(true);
    try {
      const res = await api.getSequences();
      setSequences(res.data || []);
      // Refresh current selection if any
      if (selectedSequence) {
        const updated = res.data.find(s => s._id === selectedSequence._id);
        if (updated) {
          setSelectedSequence(updated);
          setEditForm(updated);
          const batchRes = await api.getSequenceBatches(updated._id);
          setBatches(batchRes.data || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sequence templates.");
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
      toast.success(`Sequence template status updated to ${newStatus}`);
      loadSequences();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update template status.");
    }
  };

  const handleDelete = async (seqId) => {
    if (!confirm("Are you sure you want to delete this sequence template? This will delete all associated batches and unschedule contacts.")) return;
    try {
      await api.deleteSequence(seqId);
      toast.success("Sequence template deleted");
      if (selectedSequence?._id === seqId) {
        setSelectedSequence(null);
        setBatches([]);
      }
      loadSequences();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete sequence template.");
    }
  };

  const handleSelectSequence = async (seq) => {
    setEditMode(false);
    setSelectedSequence(seq);
    setEditForm(seq);
    try {
      const batchRes = await api.getSequenceBatches(seq._id);
      setBatches(batchRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load batches for sequence.");
    }
  };

  const handleUpdateTemplates = async () => {
    try {
      await api.updateSequence(selectedSequence._id, {
        name: editForm.name,
        subject: editForm.subject,
        greeting: editForm.greeting,
        body: editForm.body,
        signature: editForm.signature,
        followupGreeting: editForm.followupGreeting,
        followupBody: editForm.followupBody,
        followupSignature: editForm.followupSignature,
        followupDays: Number(editForm.followupDays),
        maxFollowups: Number(editForm.maxFollowups)
      });
      toast.success("Sequence template updated successfully!");
      setEditMode(false);
      loadSequences();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save sequence templates.");
    }
  };

  // Contacts picker for Batch scheduling
  const loadContactsForBatch = async (currBatchContactIds = []) => {
    try {
      const res = await api.filterContacts({ limit: 1000 });
      // Include contacts who are not in any batch OR are currently inside this editing batch
      const filtered = (res.data || []).filter(c => {
        return !c.batch_id || currBatchContactIds.includes(c._id.toString());
      });
      setAllContacts(filtered);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contacts for scheduling.");
    }
  };

  const handleOpenCreateBatch = () => {
    setEditingBatch(null);
    setBatchForm({
      name: "",
      email_send_date: new Date().toISOString().split("T")[0],
      follow_up_dates: [],
      contactIds: []
    });
    setSearchContact("");
    loadContactsForBatch([]);
    setShowBatchModal(true);
  };

  const handleOpenEditBatch = (batch) => {
    setEditingBatch(batch);
    setBatchForm({
      name: batch.name || "",
      email_send_date: batch.email_send_date ? new Date(batch.email_send_date).toISOString().split("T")[0] : "",
      follow_up_dates: (batch.follow_up_dates || []).map(d => new Date(d).toISOString().split("T")[0]),
      contactIds: (batch.contacts || []).map(c => c._id || c)
    });
    setSearchContact("");
    loadContactsForBatch((batch.contacts || []).map(c => (c._id || c).toString()));
    setShowBatchModal(true);
  };

  const handleSaveBatch = async () => {
    if (!batchForm.email_send_date) {
      toast.error("Email send date is required.");
      return;
    }
    if (batchForm.contactIds.length === 0) {
      toast.error("Please select at least one contact for this batch.");
      return;
    }

    try {
      if (editingBatch) {
        await api.updateBatch(editingBatch._id, {
          name: batchForm.name,
          contacts: batchForm.contactIds,
          email_send_date: batchForm.email_send_date,
          follow_up_dates: batchForm.follow_up_dates,
        });
        toast.success("Batch updated successfully!");
      } else {
        await api.createBatch({
          name: batchForm.name,
          sequence_id: selectedSequence._id,
          contactIds: batchForm.contactIds,
          email_send_date: batchForm.email_send_date,
          follow_up_dates: batchForm.follow_up_dates,
        });
        toast.success("Batch created and scheduled successfully!");
      }
      setShowBatchModal(false);
      loadSequences();
      const batchRes = await api.getSequenceBatches(selectedSequence._id);
      setBatches(batchRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save batch: " + err.message);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!confirm("Are you sure you want to delete this scheduled batch? All contacts inside will be detached.")) return;
    try {
      await api.deleteBatch(batchId);
      toast.success("Batch deleted successfully!");
      loadSequences();
      const batchRes = await api.getSequenceBatches(selectedSequence._id);
      setBatches(batchRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete batch: " + err.message);
    }
  };

  const handleToggleBatchStatus = async (batch) => {
    const newStatus = batch.status === "active" ? "paused" : "active";
    try {
      await api.updateBatch(batch._id, { status: newStatus });
      toast.success(`Batch status updated to ${newStatus}`);
      const batchRes = await api.getSequenceBatches(selectedSequence._id);
      setBatches(batchRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update batch status: " + err.message);
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

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const confirmRun = confirm("Trigger the daily outreach sending process right now? This will immediately process and send emails for contacts scheduled today or earlier.");
              if (!confirmRun) return;
              toast.loading("Running daily outreach process...", { id: "scheduler-run" });
              try {
                await api.runSchedulerManual();
                toast.success("Daily sending process completed successfully!", { id: "scheduler-run" });
                loadSequences();
                if (selectedSequence) {
                  const batchRes = await api.getSequenceBatches(selectedSequence._id);
                  setBatches(batchRes.data || []);
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to run daily sending: " + err.message, { id: "scheduler-run" });
              }
            }}
            className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-bold rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Trigger Scheduler Run</span>
          </button>

          <Link
            to="/sequences/new"
            className="inline-flex items-center gap-2 h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Sequence Template</span>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sequences list */}
        <div className="lg:col-span-2 space-y-4">
          {loading && sequences.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center italic text-slate-500">
              Loading email templates...
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
                            title="Pause Sequence"
                          >
                            <Pause className="w-3.5 h-3.5 fill-amber-700" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(seq._id)}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-100 transition-colors cursor-pointer"
                          title="Delete Template"
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
                    Scheduled Batches
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                      editMode ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Edit Template
                  </button>
                </div>

                {/* TARGET BATCHES VIEW */}
                {!editMode && (
                  <div className="space-y-4">
                    <button
                      onClick={handleOpenCreateBatch}
                      className="w-full py-2 border border-dashed border-indigo-300 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule New Batch</span>
                    </button>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {batches.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-5">No batches scheduled yet.</p>
                      ) : (
                        batches.map((b) => (
                          <div
                            key={b._id}
                            className={`p-3.5 border rounded-lg flex flex-col gap-2.5 text-xs shadow-sm bg-white ${
                              b.status === "paused" ? "border-slate-150 opacity-70 bg-slate-50/50" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-bold text-slate-800 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{b.name || `Batch - ${new Date(b.email_send_date).toLocaleDateString()}`}</span>
                                </p>
                                <p className="text-slate-400 text-[10px] font-semibold mt-0.5">
                                  Contacts: <span className="text-slate-600 font-bold">{b.contacts?.length || 0}</span>
                                </p>
                              </div>

                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase select-none ${
                                b.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            {/* Followups timeline */}
                            {b.follow_up_dates && b.follow_up_dates.length > 0 && (
                              <div className="bg-slate-50/80 p-2 rounded border border-slate-100 text-[10px] text-slate-500 font-medium">
                                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Follow-ups:</span>
                                <div className="flex flex-wrap gap-1">
                                  {b.follow_up_dates.map((d, i) => (
                                    <span key={i} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                                      #{i+1}: {new Date(d).toLocaleDateString()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Batch Action Toolbar */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleBatchStatus(b)}
                                  className={`p-1.5 rounded transition-all cursor-pointer ${
                                    b.status === "active"
                                      ? "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/40"
                                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/40"
                                  }`}
                                  title={b.status === "active" ? "Pause Batch" : "Resume Batch"}
                                >
                                  {b.status === "active" ? (
                                    <Pause className="w-3.5 h-3.5 fill-amber-600" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-emerald-600" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleOpenEditBatch(b)}
                                  className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200/60 transition-all cursor-pointer"
                                  title="Edit Dates / Contacts"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleDeleteBatch(b._id)}
                                className="p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded border border-slate-200/60 transition-all cursor-pointer"
                                title="Delete Batch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* EDIT TEMPLATE VIEW */}
                {editMode && (
                  <div className="space-y-4 text-xs">
                    {/* Collapsible Variables Help */}
                    <div className="border border-slate-200 rounded-lg bg-slate-50/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          Dynamic Placeholders
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold select-none">Click to copy</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { tag: "{first_name}", label: "First Name" },
                          { tag: "{last_name}", label: "Last Name" },
                          { tag: "{company_name}", label: "Company Name" },
                          { tag: "{companyNameForEmails}", label: "Short Company" },
                          { tag: "{title}", label: "Job Title" },
                          { tag: "{city}", label: "City" },
                          { tag: "{state}", label: "State" },
                          { tag: "{country}", label: "Country" },
                          { tag: "{website}", label: "Website" },
                          { tag: "{industry}", label: "Industry" },
                        ].map(({ tag, label }) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(tag);
                              toast.success(`Copied: ${tag}`);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 transition-all font-mono font-bold text-indigo-600 cursor-pointer shadow-sm text-[9px]"
                            title={label}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Sequence Name</label>
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Email Subject Line</label>
                      <input
                        type="text"
                        value={editForm.subject || ""}
                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
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
                        className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
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
                      <h4 className="font-bold text-slate-700 uppercase tracking-wide">Follow-up Template</h4>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Days</label>
                          <input
                            type="number"
                            value={editForm.followupDays || 3}
                            onChange={(e) => setEditForm({ ...editForm, followupDays: e.target.value })}
                            className="w-full h-9 px-3 border border-slate-200 rounded-lg font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Max Count</label>
                          <input
                            type="number"
                            value={editForm.maxFollowups || 1}
                            onChange={(e) => setEditForm({ ...editForm, maxFollowups: e.target.value })}
                            className="w-full h-9 px-3 border border-slate-200 rounded-lg font-semibold"
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
                          className="w-full p-3 border border-slate-200 rounded-lg font-semibold"
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

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleUpdateTemplates}
                        className="flex-grow py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        Save Template Updates
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTestModal(true)}
                        className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Send Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 italic text-xs select-none">
              Click on a sequence template card to schedule batches, manage campaign sending dates, and configure follow-ups.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-black/5 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-800">
                {editingBatch ? "Edit Scheduled Batch" : "Schedule Campaign Batch"}
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Batch Name */}
              <div>
                <label className="block font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Batch Name</label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. Q3 Outreach Batch A"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold mb-2"
                />
              </div>

              {/* Dates grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Initial Email Send Date</label>
                  <input
                    type="date"
                    value={batchForm.email_send_date}
                    onChange={(e) => {
                      const newSendDate = e.target.value;
                      setBatchForm(prev => {
                        const suggestedFollowups = [];
                        if (newSendDate && selectedSequence.followupDays) {
                          const dateObj = new Date(newSendDate);
                          dateObj.setDate(dateObj.getDate() + selectedSequence.followupDays);
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
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
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
                        const dateObj = new Date(baseDate);
                        dateObj.setDate(dateObj.getDate() + (selectedSequence.followupDays || 3));
                        newDates.push(dateObj.toISOString().split("T")[0]);
                        setBatchForm({ ...batchForm, follow_up_dates: newDates });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 font-bold" />
                      Add Follow-up Date
                    </button>
                  </div>
                </div>
              </div>

              {/* Contacts Picker */}
              <div className="space-y-2 pt-3 border-t border-slate-100 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-600 uppercase tracking-wide">Target Contacts ({batchForm.contactIds.length} Selected)</label>
                  <input
                    type="text"
                    placeholder="Search contacts by name or email..."
                    value={searchContact}
                    onChange={(e) => setSearchContact(e.target.value)}
                    className="w-56 h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
                  />
                </div>

                <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50 scrollbar-thin">
                  {allContacts.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 italic">No available contacts (ensure they are imported and not in other batches).</p>
                  ) : (
                    (() => {
                      const filtered = allContacts.filter(c => {
                        const term = searchContact.toLowerCase();
                        return (c.firstName + " " + c.lastName).toLowerCase().includes(term) || c.email?.toLowerCase().includes(term);
                      });

                      if (filtered.length === 0) {
                        return <p className="text-center py-6 text-slate-400 italic">No contacts match search query.</p>;
                      }

                      return filtered.map((c) => {
                        const isChecked = batchForm.contactIds.includes(c._id);
                        return (
                          <label
                            key={c._id}
                            className={`flex items-center gap-3 px-4 py-2 hover:bg-slate-100 cursor-pointer select-none ${isChecked ? "bg-indigo-50/20" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const newIds = isChecked
                                  ? batchForm.contactIds.filter(id => id !== c._id)
                                  : [...batchForm.contactIds, c._id];
                                setBatchForm({ ...batchForm, contactIds: newIds });
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{c.firstName} {c.lastName}</p>
                              <p className="text-slate-400 text-[10px] truncate">{c.email} | {c.companyName || "No Company"}</p>
                            </div>
                          </label>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatch}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                Save Scheduled Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-sm font-bold text-slate-800">Send Test Email</h3>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-base"
              >
                &times;
              </button>
            </div>
            
            <p className="text-slate-500 leading-relaxed">
              Send a test email using the currently entered template text. Places like <code>{"{first_name}"}</code> will be filled with mock contact data.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-600 mb-1.5 font-bold uppercase tracking-wide">Select Step to Test</label>
                <select
                  value={testStep}
                  onChange={(e) => setTestStep(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer font-semibold"
                >
                  <option value="primary">Step 1: Primary Email</option>
                  {editForm.followupBody && (
                    <option value="followup">Step 2: Automated Follow-up</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-bold uppercase tracking-wide">Recipient Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. your-email@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm font-semibold text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="h-9 px-4 font-bold border border-slate-200 text-slate-600 bg-white rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sendingTest || !testRecipient.trim()}
                className="h-9 px-5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                {sendingTest ? "Sending Test..." : "Send Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
