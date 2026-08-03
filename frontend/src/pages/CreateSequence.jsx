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
    subject: "",
    type: "direct_apply",
    greeting: "Hii {first_name} {last_name}",
    body: "",
    signature: "Thank You\n\n— Rishikesh Kumar Yadav\nOutreach Engineer",
    enableFollowup: true,
    followupSubject: "",
    followupGreeting: "Hii {first_name} {last_name}",
    followupBody: "",
    followupSignature: "Thank You\n\n— Rishikesh Kumar Yadav\nOutreach Engineer",
    followupDays: 3,
    maxFollowups: 1
  });

  const [previousSequences, setPreviousSequences] = useState([]);

  // Fetch previous sequences to support quick-load templates
  useEffect(() => {
    const loadPrevious = async () => {
      try {
        const res = await api.getSequences();
        const seqs = res.data || [];
        setPreviousSequences(seqs);
        
        // Default templates to latest sequence if available
        if (seqs.length > 0) {
          const latest = [...seqs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          setSequenceInfo({
            name: "",
            subject: latest.subject || "",
            type: latest.type || "direct_apply",
            greeting: latest.greeting || "Hii {first_name} {last_name}",
            body: latest.body || "",
            signature: latest.signature || "Thank You",
            enableFollowup: latest.maxFollowups > 0,
            followupSubject: latest.followupSubject || "",
            followupGreeting: latest.followupGreeting || "Hii {first_name} {last_name}",
            followupBody: latest.followupBody || "",
            followupSignature: latest.followupSignature || "Thank You",
            followupDays: latest.followupDays || 3,
            maxFollowups: latest.maxFollowups || 1
          });
          toast.success(`Default templates loaded from latest campaign: "${latest.name}"`);
        }
      } catch (err) {
        console.error("Failed to load previous sequences:", err);
      }
    };
    loadPrevious();
  }, []);

  const handleCopyFromSequence = (seqId) => {
    const selected = previousSequences.find(s => s._id === seqId);
    if (selected) {
      setSequenceInfo(prev => ({
        ...prev,
        type: selected.type || "direct_apply",
        subject: selected.subject || "",
        greeting: selected.greeting || "",
        body: selected.body || "",
        signature: selected.signature || "",
        enableFollowup: selected.maxFollowups > 0,
        followupSubject: selected.followupSubject || "",
        followupGreeting: selected.followupGreeting || "",
        followupBody: selected.followupBody || "",
        followupSignature: selected.followupSignature || "",
        followupDays: selected.followupDays || 3,
        maxFollowups: selected.maxFollowups || 1
      }));
      toast.success(`Copied templates from "${selected.name}"`);
    }
  };

  const insertPlaceholder = (fieldName, placeholder) => {
    const textarea = document.getElementsByName(fieldName)[0];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newValue = before + placeholder + after;
    setSequenceInfo(prev => ({ ...prev, [fieldName]: newValue }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const renderVariableButtons = (fieldName) => {
    const vars = [
      { label: "First Name", tag: "{first_name}" },
      { label: "Last Name", tag: "{last_name}" },
      { label: "Company", tag: "{company_name}" },
      { label: "Job Role", tag: "{role}" },
      { label: "Email", tag: "{email}" }
    ];
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2.5">
        {vars.map(v => (
          <button
            key={v.tag}
            type="button"
            onClick={() => insertPlaceholder(fieldName, v.tag)}
            className="px-2 py-0.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-[10px] font-bold text-slate-500 rounded cursor-pointer transition-colors shadow-sm"
          >
            + {v.label}
          </button>
        ))}
      </div>
    );
  };

  // Step 2: Contact Filtering & Selection
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [excludeSequence, setExcludeSequence] = useState(true);
  const [excludeRecent, setExcludeRecent] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState("apply");

  useEffect(() => {
    setPurposeFilter(sequenceInfo.type === "direct_apply" ? "apply" : "referral");
  }, [sequenceInfo.type]);

  // Fetch contacts for step 2
  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const params = {
        purpose: purposeFilter === "all" ? undefined : purposeFilter,
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
  }, [step, excludeSequence, excludeRecent, searchQuery, activeFilters, purposeFilter]);

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
        subject: sequenceInfo.subject,
        type: sequenceInfo.type,
        greeting: sequenceInfo.greeting,
        body: sequenceInfo.body,
        signature: sequenceInfo.signature,
        followupSubject: sequenceInfo.enableFollowup ? sequenceInfo.followupSubject : "",
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
            {/* Quick Load Selector */}
            {previousSequences.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Templates Quick Load</span>
                  <p className="text-[11px] text-slate-400">Copy templates and follow-up schedules from any previous sequence</p>
                </div>
                <select
                  onChange={(e) => handleCopyFromSequence(e.target.value)}
                  defaultValue=""
                  className="h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer w-full sm:w-60 font-semibold"
                >
                  <option value="" disabled>-- Select template to load --</option>
                  {previousSequences.map(seq => (
                    <option key={seq._id} value={seq._id}>{seq.name}</option>
                  ))}
                </select>
              </div>
            )}

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
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Primary Email Subject (Dynamic Variable Supported)</label>
                  <input
                    type="text"
                    name="subject"
                    value={sequenceInfo.subject}
                    onChange={handleInfoChange}
                    placeholder="e.g. Outreach regarding Intern opportunity at {company_name}"
                    className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-semibold"
                  />
                  {renderVariableButtons("subject")}
                </div>

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
                  {renderVariableButtons("greeting")}
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
                  {renderVariableButtons("body")}
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
                  {renderVariableButtons("signature")}
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
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Follow-up Subject (Dynamic Variable Supported)</label>
                    <input
                      type="text"
                      name="followupSubject"
                      value={sequenceInfo.followupSubject}
                      onChange={handleInfoChange}
                      placeholder={`e.g. Re: Outreach regarding Intern opportunity at {company_name}`}
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-semibold"
                    />
                    {renderVariableButtons("followupSubject")}
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
                    {renderVariableButtons("followupGreeting")}
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
                    {renderVariableButtons("followupBody")}
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
                    {renderVariableButtons("followupSignature")}
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

          {/* Premium Preview Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-20">
            {/* Live Preview Panel */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Live Email Preview</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">Interactive</span>
              </div>
              
              <div className="p-4 space-y-3.5 text-xs text-slate-600">
                <div className="border-b border-slate-100 pb-2 space-y-1.5">
                  <p><span className="font-semibold text-slate-400">To:</span> John Doe &lt;john.doe@acme.com&gt;</p>
                  <p>
                    <span className="font-semibold text-slate-400">Subject:</span>{" "}
                    <span className="text-slate-800 font-semibold font-mono">
                      {sequenceInfo.subject 
                        ? sequenceInfo.subject
                            .replace(/{first_name}/g, "John")
                            .replace(/{last_name}/g, "Doe")
                            .replace(/{company_name}/g, "Acme")
                            .replace(/{role}/g, "Software Engineer") 
                        : "[Custom Subject Line]"}
                    </span>
                  </p>
                </div>

                <div className="bg-slate-50/50 rounded-lg p-3.5 border border-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {(() => {
                    const simulatedContact = {
                      firstName: "John",
                      lastName: "Doe",
                      companyName: "Acme",
                      role: "Software Engineer",
                      email: "john.doe@acme.com"
                    };
                    const rawText = `${sequenceInfo.greeting || "Hii {first_name} {last_name}"},\n\n${sequenceInfo.body || "[Email body text will appear here...]"}\n\n${sequenceInfo.signature || "Thank You"}`;
                    
                    return rawText
                      .replace(/{first_name}/g, simulatedContact.firstName)
                      .replace(/{last_name}/g, simulatedContact.lastName)
                      .replace(/{firstName}/g, simulatedContact.firstName)
                      .replace(/{lastName}/g, simulatedContact.lastName)
                      .replace(/{company_name}/g, simulatedContact.companyName)
                      .replace(/{companyName}/g, simulatedContact.companyName)
                      .replace(/{company}/g, simulatedContact.companyName)
                      .replace(/{role}/g, simulatedContact.role)
                      .replace(/{title}/g, simulatedContact.role)
                      .replace(/{email}/g, simulatedContact.email);
                  })()}
                </div>

                {sequenceInfo.enableFollowup && (sequenceInfo.followupBody || sequenceInfo.followupSubject) && (
                  <div className="space-y-2 mt-4 pt-3 border-t border-dashed border-slate-200">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded self-start">Follow-up Step (Day {sequenceInfo.followupDays})</span>
                      <p className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-400">Subject:</span>{" "}
                        <span className="font-semibold font-mono text-slate-700">
                          {(sequenceInfo.followupSubject || `Re: ${sequenceInfo.subject || "[Primary Subject]"} follow-up`)
                            .replace(/{first_name}/g, "John")
                            .replace(/{last_name}/g, "Doe")
                            .replace(/{company_name}/g, "Acme")
                            .replace(/{role}/g, "Software Engineer")}
                        </span>
                      </p>
                    </div>
                    <div className="bg-slate-50/50 rounded-lg p-3.5 border border-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {(() => {
                        const simulatedContact = {
                          firstName: "John",
                          lastName: "Doe",
                          companyName: "Acme",
                          role: "Software Engineer",
                          email: "john.doe@acme.com"
                        };
                        const rawText = `${sequenceInfo.followupGreeting || "Hii {first_name} {last_name}"},\n\n${sequenceInfo.followupBody}\n\n${sequenceInfo.followupSignature || "Thank You"}`;
                        
                        return rawText
                          .replace(/{first_name}/g, simulatedContact.firstName)
                          .replace(/{last_name}/g, simulatedContact.lastName)
                          .replace(/{firstName}/g, simulatedContact.firstName)
                          .replace(/{lastName}/g, simulatedContact.lastName)
                          .replace(/{company_name}/g, simulatedContact.companyName)
                          .replace(/{companyName}/g, simulatedContact.companyName)
                          .replace(/{company}/g, simulatedContact.companyName)
                          .replace(/{role}/g, simulatedContact.role)
                          .replace(/{title}/g, simulatedContact.role)
                          .replace(/{email}/g, simulatedContact.email);
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spam Checker & Quality Stats */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Template Insights</h4>
              
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-400 text-[10px]">Read Time</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    {Math.max(1, Math.round(sequenceInfo.body.split(/\s+/).filter(Boolean).length / 200))} min
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-400 text-[10px]">Spam Words</p>
                  <p className={`text-sm font-bold mt-0.5 ${
                    (() => {
                      const spamWords = ["free", "money", "100%", "click", "guarantee", "limited", "opportunity", "cash", "buy"];
                      const count = spamWords.reduce((acc, w) => acc + (sequenceInfo.body.toLowerCase().includes(w) ? 1 : 0), 0);
                      return count > 0 ? "text-amber-600" : "text-emerald-600";
                    })()
                  }`}>
                    {(() => {
                      const spamWords = ["free", "money", "100%", "click", "guarantee", "limited", "opportunity", "cash", "buy"];
                      const count = spamWords.reduce((acc, w) => acc + (sequenceInfo.body.toLowerCase().includes(w) ? 1 : 0), 0);
                      return count > 0 ? `${count} found` : "Safe";
                    })()}
                  </p>
                </div>
              </div>

              {/* Show spam suggestions */}
              {(() => {
                const spamWords = ["free", "money", "100%", "click", "guarantee", "limited", "opportunity", "cash", "buy"];
                const detected = spamWords.filter(w => sequenceInfo.body.toLowerCase().includes(w));
                if (detected.length > 0) {
                  return (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-[10px] text-amber-700 leading-normal">
                      <strong>⚠️ Spam Warning:</strong> Avoid trigger words like <em>{detected.join(", ")}</em> in cold emails to protect deliverability and prevent spam folder skips.
                    </div>
                  );
                }
                return null;
              })()}
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

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contacts:</span>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="apply">CEO & Founder (Apply)</option>
                  <option value="referral">Employee (Referral)</option>
                  <option value="all">All Contacts</option>
                </select>
              </div>
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
