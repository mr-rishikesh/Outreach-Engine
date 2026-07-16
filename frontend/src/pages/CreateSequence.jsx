import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, HelpCircle, Mail, Users, Check, Pin, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "../api";
import toast from "react-hot-toast";
import PinnedFiltersBar from "../components/PinnedFiltersBar";
import FilterPanel from "../components/FilterPanel";

export default function CreateSequence() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Step 1: Template Info
  const [sequenceInfo, setSequenceInfo] = useState({
    name: "",
    type: "direct_apply",
    greeting: "Hii {first_name} {last_name}",
    body: "",
    signature: "Thank You\n\n— Rishikesh Kumar Yadav\nOutreach Engineer",
    enableFollowup: true,
    followupGreeting: "Hii {first_name} {last_name}",
    followupBody: "",
    followupSignature: "Thank You\n\n— Rishikesh Kumar Yadav\nOutreach Engineer",
    followupDays: 3,
    maxFollowups: 1
  });

  // Step 2: Contact Filtering & Selection
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [excludeSequence, setExcludeSequence] = useState(true);
  const [excludeRecent, setExcludeRecent] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch contacts for step 2
  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const params = {
        purpose: sequenceInfo.type === "direct_apply" ? "apply" : "referral",
        excludeSequence: excludeSequence ? "true" : "false",
        excludeRecent: excludeRecent ? "true" : "false",
        search: searchQuery,
        limit: 100, // retrieve a good batch to select from
        ...activeFilters
      };
      
      const res = await api.filterContacts(params);
      setContacts(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contacts for sequence selection.");
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2) {
      loadContacts();
    }
  }, [step, excludeSequence, excludeRecent, searchQuery, activeFilters]);

  const handleInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSequenceInfo(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContacts(contacts.map(c => c._id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (id) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact to start the sequence.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: sequenceInfo.name,
        type: sequenceInfo.type,
        greeting: sequenceInfo.greeting,
        body: sequenceInfo.body,
        signature: sequenceInfo.signature,
        followupGreeting: sequenceInfo.followupGreeting,
        followupBody: sequenceInfo.enableFollowup ? sequenceInfo.followupBody : "",
        followupSignature: sequenceInfo.followupSignature,
        followupDays: Number(sequenceInfo.followupDays),
        maxFollowups: sequenceInfo.enableFollowup ? Number(sequenceInfo.maxFollowups) : 0,
        contactIds: selectedContacts
      };

      await api.createSequence(payload);
      toast.success("Sequence created and launched successfully!");
      navigate("/sequences");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create sequence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link to="/sequences" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Create Outreach Sequence</h1>
            <p className="text-sm text-slate-500">Automate primary outreach and follow-up emails</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            1. Templates
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className={`px-3 py-1 rounded-full ${step === 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            2. Select Contacts
          </span>
        </div>
      </div>

      {/* STEP 1: Templates & Details */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Meta Information */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Sequence Details</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Sequence Campaign Name</label>
                <input
                  type="text"
                  name="name"
                  value={sequenceInfo.name}
                  onChange={handleInfoChange}
                  placeholder="e.g. Intern Opportunity Outreach - July Batch"
                  className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Sequence Type (Purpose)</label>
                <select
                  name="type"
                  value={sequenceInfo.type}
                  onChange={handleInfoChange}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="direct_apply">Direct Apply (to Founders/CEOs)</option>
                  <option value="referral">Referral (to SDEs/Employees)</option>
                </select>
              </div>
            </div>

            {/* Primary Email Editor */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Primary Email Template</h3>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">Step 1</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Greeting (Dynamic Variable Supported)</label>
                  <input
                    type="text"
                    name="greeting"
                    value={sequenceInfo.greeting}
                    onChange={handleInfoChange}
                    placeholder="Hii {first_name} {last_name}"
                    className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Available triggers: <code>{"{first_name}"}</code>, <code>{"{last_name}"}</code></span>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email Body Message</label>
                  <textarea
                    name="body"
                    value={sequenceInfo.body}
                    onChange={handleInfoChange}
                    rows={8}
                    placeholder="Enter email template text..."
                    className="w-full p-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Signature (Will automatically include 'Thank You' if omitted)</label>
                  <textarea
                    name="signature"
                    value={sequenceInfo.signature}
                    onChange={handleInfoChange}
                    rows={3}
                    placeholder="Thank You..."
                    className="w-full p-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Follow-up Email Editor */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Automated Follow-up Campaign</h3>
                  <input
                    type="checkbox"
                    name="enableFollowup"
                    checked={sequenceInfo.enableFollowup}
                    onChange={handleInfoChange}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                {sequenceInfo.enableFollowup && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">Step 2</span>
                )}
              </div>

              {sequenceInfo.enableFollowup && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Wait Time (Days)</label>
                      <input
                        type="number"
                        name="followupDays"
                        value={sequenceInfo.followupDays}
                        onChange={handleInfoChange}
                        min={1}
                        className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Max Follow-ups</label>
                      <input
                        type="number"
                        name="maxFollowups"
                        value={sequenceInfo.maxFollowups}
                        onChange={handleInfoChange}
                        min={1}
                        max={3}
                        className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Follow-up Greeting</label>
                    <input
                      type="text"
                      name="followupGreeting"
                      value={sequenceInfo.followupGreeting}
                      onChange={handleInfoChange}
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Follow-up Body</label>
                    <textarea
                      name="followupBody"
                      value={sequenceInfo.followupBody}
                      onChange={handleInfoChange}
                      rows={6}
                      placeholder="e.g. Just checking in to see if you had a chance to read my previous email..."
                      className="w-full p-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Follow-up Signature</label>
                    <textarea
                      name="followupSignature"
                      value={sequenceInfo.followupSignature}
                      onChange={handleInfoChange}
                      rows={2}
                      className="w-full p-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (!sequenceInfo.name.trim() || !sequenceInfo.body.trim()) {
                  toast.error("Please fill in sequence name and primary email body.");
                  return;
                }
                setStep(2);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Next: Select Sequence Contacts
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-lg p-6 space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-300" />
                Sequence Guide
              </h4>
              <ul className="text-xs text-indigo-200/90 space-y-3 list-disc list-inside">
                <li>
                  <strong className="text-white">Greeting variables:</strong> Greeting input fields support replacing <code>{"{first_name}"}</code> and <code>{"{last_name}"}</code> dynamically.
                </li>
                <li>
                  <strong className="text-white">Auto-Thankyou:</strong> If your signature doesn't contain a standard "Thank You", a random professional thank you message will be auto-appended at email sending time.
                </li>
                <li>
                  <strong className="text-white">Exclusions:</strong> Next step allows excluding contacts already in other sequences, or those contacted in the last 3 days to protect brand safety.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Contact Filtering & Selection */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Top Exclusions Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excludeSequence}
                  onChange={(e) => setExcludeSequence(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                Exclude contacts in other active sequences
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excludeRecent}
                  onChange={(e) => setExcludeRecent(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                Exclude emailed in the last 3 days
              </label>
            </div>

            {/* Local Search Input & Filters Toggle */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72 font-normal">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search matching contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center gap-1.5 h-10 px-3.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-sm ${
                  showFilters || Object.keys(activeFilters).length > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {Object.keys(activeFilters).length > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                    {Object.keys(activeFilters).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Full Advanced Filters Drawer */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <FilterPanel
                filters={activeFilters}
                onApply={(f) => {
                  setActiveFilters(f);
                  setShowFilters(false);
                }}
                onClear={() => {
                  setActiveFilters({});
                  setShowFilters(false);
                }}
              />
            </div>
          )}

          {/* Pinned Filters Bar (Always on Top) */}
          <PinnedFiltersBar
            filters={activeFilters}
            onApply={(f) => setActiveFilters(f)}
          />

          {/* Contacts Table Card */}
          <div className="bg-white border border-slate-200/85 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Target Contacts List ({contacts.length} found)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filtered by sequence purpose: <span className="font-semibold capitalize">{sequenceInfo.type.replace(/_/g, " ")}</span>
                </p>
              </div>
              <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {selectedContacts.length} Selected
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
                    <th className="w-12 px-5 py-3">
                      <input
                        type="checkbox"
                        checked={contacts.length > 0 && selectedContacts.length === contacts.length}
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role / Title</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3 text-center">Last Emailed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contactsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500 font-medium italic">
                        Loading matching contacts...
                      </td>
                    </tr>
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 italic">
                        No contacts matching the sequence criteria were found. Try toggling the exclusions.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((c) => {
                      const isChecked = selectedContacts.includes(c._id);
                      return (
                        <tr
                          key={c._id}
                          className={`hover:bg-slate-50/50 transition-colors ${isChecked ? "bg-indigo-50/20" : ""}`}
                        >
                          <td className="px-5 py-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectContact(c._id)}
                              className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {c.firstName} {c.lastName}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{c.email}</td>
                          <td className="px-4 py-3 text-slate-500 font-medium">{c.title || c.role || "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{c.companyName || c.companey_name || "—"}</td>
                          <td className="px-4 py-3 text-center text-slate-400">
                            {c.lastSentDate && new Date(c.lastSentDate).getFullYear() > 2000
                              ? new Date(c.lastSentDate).toLocaleDateString()
                              : "Never"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Templates
            </button>

            <button
              onClick={handleCreate}
              disabled={loading || selectedContacts.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? "Launching Sequence..." : "Create & Launch Sequence"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
