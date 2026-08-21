import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, Check } from "lucide-react";
import { api } from "../api";
import toast from "react-hot-toast";

export default function CreateSequence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [sequenceInfo, setSequenceInfo] = useState({
    name: "",
    subject: "",
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

  const handleInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSequenceInfo(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleCreate = async () => {
    if (!sequenceInfo.name.trim() || !sequenceInfo.body.trim()) {
      toast.error("Please fill in sequence name and primary email body.");
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
        followupGreeting: sequenceInfo.followupGreeting,
        followupBody: sequenceInfo.enableFollowup ? sequenceInfo.followupBody : "",
        followupSignature: sequenceInfo.followupSignature,
        followupDays: Number(sequenceInfo.followupDays),
        maxFollowups: sequenceInfo.enableFollowup ? Number(sequenceInfo.maxFollowups) : 0,
      };

      await api.createSequence(payload);
      toast.success("Sequence template created successfully!");
      navigate("/sequences");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create sequence template.");
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
            <h1 className="text-2xl font-bold text-slate-800">Create Sequence Template</h1>
            <p className="text-sm text-slate-500">Define a reusable outreach template sequence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Meta Information */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Sequence Details</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Sequence Template Name</label>
              <input
                type="text"
                name="name"
                value={sequenceInfo.name}
                onChange={handleInfoChange}
                placeholder="e.g. Founder Internship Outreach Template"
                className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email Subject Line</label>
              <input
                type="text"
                name="subject"
                value={sequenceInfo.subject}
                onChange={handleInfoChange}
                placeholder="e.g. Contribution as a Full Stack & AI Engineer"
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
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Signature</label>
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Automated Follow-up Template</h3>
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
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Creating Template..." : "Create Sequence Template"}
            <Check className="w-4 h-4" />
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
                <strong className="text-white">Reusable templates:</strong> Templates store email subject, greeting, body, signature, and follow-up templates.
              </li>
              <li>
                <strong className="text-white">Scheduled Batches:</strong> Run campaigns by creating a Batch, where you add contacts and schedule the send dates.
              </li>
              <li>
                <strong className="text-white">Greeting variables:</strong> Greeting input fields support replacing <code>{"{first_name}"}</code> and <code>{"{last_name}"}</code> dynamically.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
