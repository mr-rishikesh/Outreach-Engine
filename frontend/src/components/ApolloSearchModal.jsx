import { useState } from "react";
import { api } from "../api";
import {
  Search, X, CheckCircle2, AlertTriangle, Loader2, Database, Users,
  UserPlus, UserMinus, Globe
} from "lucide-react";

export default function ApolloSearchModal({ onClose, onDone }) {
  const [phase, setPhase] = useState("search"); // search | loading | results | importing | done
  const [error, setError] = useState(null);
  
  // Search parameters
  const [keywords, setKeywords] = useState("");
  const [titles, setTitles] = useState("");
  const [locations, setLocations] = useState("");
  
  // Results
  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [importResult, setImportResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPhase("loading");
    setError(null);
    try {
      const params = {};
      if (keywords) params.q_keywords = keywords;
      if (titles) params.person_titles = titles.split(",").map(t => t.trim());
      if (locations) params.person_locations = locations.split(",").map(l => l.trim());

      const res = await api.searchApolloLeads(params);
      
      // The Apollo API returns people array
      const people = res.data?.people || res.data?.contacts || [];
      setLeads(people);
      
      // Auto-select all by default
      setSelectedLeadIds(new Set(people.map(p => p.id)));
      
      setPhase("results");
    } catch (err) {
      setError(err.message || "Failed to search Apollo leads");
      setPhase("search");
    }
  };

  const handleImport = async () => {
    const leadsToImport = leads.filter(l => selectedLeadIds.has(l.id));
    if (leadsToImport.length === 0) return;
    
    setPhase("importing");
    setError(null);
    try {
      const res = await api.importApolloLeads(leadsToImport);
      setImportResult(res);
      setPhase("done");
    } catch (err) {
      setError(err.message || "Failed to import leads");
      setPhase("results");
    }
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedLeadIds(newSet);
  };

  const handleClose = () => {
    if (phase === "done") onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Apollo Search</h3>
              <p className="text-xs text-slate-500">Search and import leads directly</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors -mr-2">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ---- Search Form ---- */}
          {phase === "search" && (
            <form onSubmit={handleSearch} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Keywords</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. Software Engineer, Marketing"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Titles (comma separated)</label>
                  <input
                    type="text"
                    value={titles}
                    onChange={(e) => setTitles(e.target.value)}
                    placeholder="e.g. CEO, Founder, VP of Sales"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Locations (comma separated)</label>
                  <input
                    type="text"
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                    placeholder="e.g. San Francisco, New York, London"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!keywords && !titles && !locations}
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Search className="w-4 h-4" />
                Search Apollo
              </button>
            </form>
          )}

          {/* ---- Loading ---- */}
          {(phase === "loading" || phase === "importing") && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800">
                {phase === "loading" ? "Searching Apollo..." : "Importing Leads..."}
              </h3>
              <p className="text-sm text-slate-500 mt-2">This may take a few moments.</p>
            </div>
          )}

          {/* ---- Results ---- */}
          {phase === "results" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Found {leads.length} leads</h4>
                <button
                  onClick={() => setPhase("search")}
                  className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
                >
                  Edit Search
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {leads.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.size === leads.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds(new Set(leads.map(l => l.id)));
                              } else {
                                setSelectedLeadIds(new Set());
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Title</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Company</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.has(lead.id)}
                              onChange={() => toggleSelection(lead.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-medium">
                            {lead.first_name} {lead.last_name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{lead.title || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {lead.organization ? lead.organization.name : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-xl">
                  No leads found matching your criteria.
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={selectedLeadIds.size === 0}
                className="w-full inline-flex items-center justify-center gap-2 h-11 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Database className="w-4 h-4" />
                Import {selectedLeadIds.size} Leads
              </button>
            </div>
          )}

          {/* ---- Done ---- */}
          {phase === "done" && importResult && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Import Complete</h3>
              <p className="text-sm text-slate-500 mb-6">
                Successfully processed {importResult.total} leads.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border p-4 bg-slate-50 border-slate-200 text-slate-700">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
                  </div>
                  <p className="text-2xl font-bold">{importResult.total}</p>
                </div>
                <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-100 text-emerald-700">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Added</span>
                  </div>
                  <p className="text-2xl font-bold">{importResult.inserted}</p>
                </div>
                <div className="rounded-xl border p-4 bg-amber-50 border-amber-100 text-amber-700">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <UserMinus className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Skipped</span>
                  </div>
                  <p className="text-2xl font-bold">{importResult.skipped}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 mt-4 text-sm text-slate-600">
                {importResult.inserted > 0 ? (
                  <p>
                    <span className="font-semibold text-emerald-700">{importResult.inserted}</span> new contacts added to your database.
                  </p>
                ) : (
                  <p>All selected contacts already exist in your database.</p>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 h-11 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
