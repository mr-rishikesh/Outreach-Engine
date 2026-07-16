import { useState, useEffect } from "react";
import { Save, Shield, Settings as SettingsIcon, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../api";
import toast from "react-hot-toast";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maxEmailsPerDay: 300,
    minDelaySeconds: 60,
    maxDelaySeconds: 90,
    emailsSentToday: 0,
    lastResetDate: null
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      setSettings(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (settings.minDelaySeconds > settings.maxDelaySeconds) {
      toast.error("Minimum delay cannot be greater than maximum delay.");
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.updateSettings({
        maxEmailsPerDay: settings.maxEmailsPerDay,
        minDelaySeconds: settings.minDelaySeconds,
        maxDelaySeconds: settings.maxDelaySeconds
      });
      setSettings(res.data);
      toast.success("Settings updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-500 italic">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
        Loading system settings...
      </div>
    );
  }

  const usagePercent = Math.min(100, Math.round((settings.emailsSentToday / settings.maxEmailsPerDay) * 100));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600" />
          Outreach Policy & Limits
        </h1>
        <p className="text-sm text-slate-500">Configure safety thresholds, daily email volumes, and delay limits to protect your domain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily limit tracker card */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Daily Email Throttle Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Resets automatically every calendar day</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {settings.emailsSentToday} / {settings.maxEmailsPerDay} Sent
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0%</span>
              <span>{usagePercent}% utilized</span>
              <span>100%</span>
            </div>
          </div>

          {settings.lastResetDate && (
            <p className="text-[10px] text-slate-400 font-mono">
              Last reset timestamp: {new Date(settings.lastResetDate).toLocaleString()}
            </p>
          )}
        </div>

        {/* Setting Form */}
        <form onSubmit={handleSave} className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-emerald-500" />
              Safety Rules & Delays
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Daily Limit Input */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Maximum Emails Per Day
                </label>
                <input
                  type="number"
                  name="maxEmailsPerDay"
                  value={settings.maxEmailsPerDay}
                  onChange={handleChange}
                  min={1}
                  max={2000}
                  className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-400">
                  Recommended daily outbound limit for Gmail accounts is 300-500 emails to prevent spam flags.
                </span>
              </div>

              {/* Min Delay Input */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Minimum Delay (Seconds)
                </label>
                <input
                  type="number"
                  name="minDelaySeconds"
                  value={settings.minDelaySeconds}
                  onChange={handleChange}
                  min={5}
                  className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                />
              </div>

              {/* Max Delay Input */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Maximum Delay (Seconds)
                </label>
                <input
                  type="number"
                  name="maxDelaySeconds"
                  value={settings.maxDelaySeconds}
                  onChange={handleChange}
                  min={5}
                  className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  The sequence runner will choose a random delay between your configured minimum and maximum limits for each email sent.
                </span>
              </div>
            </div>
          </div>

          {/* Form Action */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
