import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import {
  CompanySizeChart,
  IndustryListChart,
  GeographicBreakdownChart
} from "../components/AnalyticsCharts";
import {
  Search,
  Building2,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit2,
  Trash2,
  RefreshCw,
  TrendingUp,
  Inbox,
  Loader2,
  X
} from "lucide-react";
import toast from "react-hot-toast";

export default function Companies() {
  const [activeTab, setActiveTab] = useState("directory"); // "directory" or "analytics"
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });

  // Edit Modal states
  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    website: "",
    industry: "",
    employees: "",
    city: "",
    state: "",
    country: "",
    annualRevenue: "",
    totalFunding: ""
  });
  const [updating, setUpdating] = useState(false);

  const debounceRef = useRef(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await api.getCompanies({
        page,
        limit,
        search,
      });
      setCompanies(data.data || []);
      setPagination(data.pagination || { page, limit, total: 0, pages: 0 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load companies database");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.getCompanyStats();
      setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, limit, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim());
      setPage(1);
    }, 400);
  };

  // Open Edit Modal
  const openEdit = (comp) => {
    setEditingCompany(comp);
    setEditForm({
      name: comp.name || "",
      website: comp.website || "",
      industry: comp.industry || "",
      employees: comp.employees || "",
      city: comp.city || "",
      state: comp.state || "",
      country: comp.country || "",
      annualRevenue: comp.annualRevenue || "",
      totalFunding: comp.totalFunding || ""
    });
  };

  // Submit Edit Form
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      return toast.error("Company name is required");
    }
    setUpdating(true);
    try {
      await api.updateCompany(editingCompany._id, editForm);
      toast.success("Company profile updated successfully");
      setEditingCompany(null);
      fetchCompanies();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update company");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company profile? This action is permanent.")) return;
    try {
      const res = await fetch(`http://localhost:${import.meta.env.VITE_PORT || "5000"}/api/companies/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      toast.success("Company profile deleted successfully");
      fetchCompanies();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete company");
    }
  };

  // Initials generator
  const getInitials = (name = "") => {
    return name.slice(0, 2).toUpperCase() || "CP";
  };

  const getAvatarBg = (initials) => {
    const charCode = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
    const gradients = [
      "from-indigo-500 to-indigo-600 text-white",
      "from-teal-500 to-emerald-500 text-white",
      "from-pink-500 to-rose-500 text-white",
      "from-cyan-500 to-blue-500 text-white",
      "from-violet-500 to-purple-500 text-white",
    ];
    return gradients[charCode % gradients.length];
  };

  // Identify top metrics
  const topIndustry = stats?.industries?.[0]?.name || "None";
  const topCountry = stats?.countries?.[0]?.name || "None";

  // Category counts
  const sizeBrackets = stats?.employeeBreakdown || {};
  let topSize = "None";
  let maxCount = 0;
  Object.entries(sizeBrackets).forEach(([k, v]) => {
    if (v > maxCount) {
      maxCount = v;
      topSize = `${k} Emp.`;
    }
  });

  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, pagination.total);

  return (
    <div className="space-y-6">
      
      {/* 1. Elegant Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md rounded-3xl border border-slate-200/50 p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-500" />
            <span>🏢 Companies Registry</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Unified dashboard for outbound corporate targets, sector metrics, and target locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchCompanies(); fetchStats(); toast.success("Refetched dataset"); }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
            title="Refetch data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total companies</p>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              {statsLoading ? "..." : stats?.total?.toLocaleString() || "0"}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Sector</p>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5 truncate" title={topIndustry}>
              {statsLoading ? "..." : topIndustry}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Country</p>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5 truncate" title={topCountry}>
              {statsLoading ? "..." : topCountry}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Common size</p>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5">
              {statsLoading ? "..." : topSize}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-white/20 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "directory"
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 Companies Directory</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>📊 Company Analytics</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      {activeTab === "analytics" ? (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs font-semibold">Aggregating analytics data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CompanySizeChart data={stats?.employeeBreakdown || {}} />
                <IndustryListChart data={stats?.industries || []} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <GeographicBreakdownChart data={stats?.countries || []} />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-center items-center text-center space-y-3">
                  <Building2 className="w-10 h-10 text-indigo-500 animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-700">Database Completeness</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Companies profiles are synchronized in real-time with contacts and lead additions. Modifying company values propagates parameters dynamically.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <div className="flex-1 min-w-0 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search companies by name, industry, or country..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full h-9 pl-10 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden xs:inline">Rows:</span>
                <div className="relative w-32">
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="appearance-none w-full h-9 pl-3 pr-8 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>{pagination.total.toLocaleString()} Companies Registered</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-55 border-b border-slate-200/80">
                    <th className="px-5 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[220px]">
                      Company Name & Website
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[150px]">
                      Industry Sector
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[110px]">
                      Company Size
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[160px]">
                      Location (City, Country)
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          <p className="text-xs font-semibold tracking-wider">Loading Companies list...</p>
                        </div>
                      </td>
                    </tr>
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                          <Inbox className="w-10 h-10 stroke-[1.5] text-slate-300" />
                          <div className="text-center space-y-0.5">
                            <p className="text-xs font-bold text-slate-600">No companies found</p>
                            <p className="text-[10px]">Try adjusting your search criteria</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    companies.map((comp) => {
                      const initials = getInitials(comp.name);
                      return (
                        <tr key={comp._id} className="odd:bg-white even:bg-slate-50/20 hover:bg-slate-50/60 hover:shadow-[inset_3px_0_0_0_#4f46e5] group transition-all duration-150">
                          <td className="px-5 py-2.5 whitespace-nowrap text-xs font-semibold">
                            <div className="flex items-center gap-3">
                              <div className={`w-7.5 h-7.5 rounded-xl bg-gradient-to-tr ${getAvatarBg(initials)} flex items-center justify-center text-[10px] font-extrabold shadow-sm shrink-0 border border-white`}>
                                {initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                                  {comp.name}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                                  {comp.website || "No URL website"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-505">
                            {comp.industry ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {comp.industry}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-2.5 whitespace-nowrap text-xs font-bold text-slate-700">
                            {comp.employees ? `${comp.employees} Employees` : "-"}
                          </td>

                          <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-600">
                            {comp.city || comp.country ? (
                              <span className="text-slate-600">
                                📍 {comp.city ? `${comp.city}, ` : ""}{comp.country || ""}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs font-semibold">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(comp)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                title="Edit Company Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(comp._id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                title="Delete Company"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Showing <span className="text-slate-700">{startRow}</span> to{" "}
                  <span className="text-slate-700">{endRow}</span> of{" "}
                  <span className="text-slate-700">{pagination.total.toLocaleString()}</span> Companies
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          pageNum === page
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Edit Modal Overlay */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  Edit Company Details
                </h3>
              </div>
              <button
                onClick={() => setEditingCompany(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={editForm.website}
                    placeholder="e.g. apple.com"
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Employees Count
                  </label>
                  <input
                    type="text"
                    value={editForm.employees}
                    placeholder="e.g. 150"
                    onChange={(e) => setEditForm({ ...editForm, employees: e.target.value })}
                    className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Industry Sector
                </label>
                <input
                  type="text"
                  value={editForm.industry}
                  placeholder="e.g. technology"
                  onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Annual Revenue
                  </label>
                  <input
                    type="text"
                    value={editForm.annualRevenue}
                    placeholder="e.g. $10M"
                    onChange={(e) => setEditForm({ ...editForm, annualRevenue: e.target.value })}
                    className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Total Funding
                  </label>
                  <input
                    type="text"
                    value={editForm.totalFunding}
                    placeholder="e.g. $2.5M"
                    onChange={(e) => setEditForm({ ...editForm, totalFunding: e.target.value })}
                    className="w-full h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 h-10 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 h-10 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
