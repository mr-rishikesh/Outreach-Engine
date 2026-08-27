import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useContacts } from "../hooks/useContacts";
import { api } from "../api";
import ContactTable from "../components/ContactTable";
import FilterPanel from "../components/FilterPanel";
import BulkActions from "../components/BulkActions";
import StatsBar from "../components/StatsBar";
import {
  TrendLineChart,
  LastSentTrendChart,
  CircularHitRate,
  CompanySizeChart,
  IndustryListChart,
  EngagementDistributionChart,
  EmailDeliverabilityChart,
  GeographicBreakdownChart
} from "../components/AnalyticsCharts";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Upload,
  Plus,
  BarChart3,
  Users2,
  Calendar,
  RefreshCw
} from "lucide-react";
import UploadModal from "../components/UploadModal";
import ApolloSearchModal from "../components/ApolloSearchModal";
import CreateLeadModal from "../components/CreateLeadModal";
import PinnedFiltersBar from "../components/PinnedFiltersBar";

export default function Dashboard() {
  const {
    contacts,
    pagination,
    loading,
    search,
    setSearch,
    setPage,
    setSort,
    setLimit,
    filters,
    applyFilters,
    clearFilters,
    refetch,
  } = useContacts();

  const [selected, setSelected] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showApollo, setShowApollo] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = pathname === "/leads" ? "contacts" : "analytics";
  const setActiveTab = (tab) => {
    if (tab === "contacts") navigate("/leads");
    else navigate("/");
  };

  const handleFilterClick = (filterKey, filterValue) => {
    navigate(`/leads?${filterKey}=${encodeURIComponent(filterValue)}`);
  };

  const debounceRef = useRef(null);

  const fetchStats = () => {
    setStatsLoading(true);
    api.getStats()
      .then((d) => {
        setStats(d.data);
        setStatsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setStatsLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val.trim()), 400);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    setSearch(searchInput.trim());
  };

  const handleSelectAll = (checked) => {
    setSelected(checked ? contacts.map((c) => c._id) : []);
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const activeFilterCount = Object.keys(filters).length;

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Outreach CRM Executive Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor outbound metrics, lead distributions, and manage CRM contacts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{todayStr}</span>
          </div>
          <button
            onClick={() => {
              refetch();
              fetchStats();
            }}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-slate-300 transition-colors shadow-sm cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Global KPIs stats bar */}
      {stats && <StatsBar stats={stats} />}

      {/* 3. Section Tabs */}
      <div className="flex border-b border-slate-200/80">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>📊 Analytics Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "contacts"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>👥 CRM Contact Manager</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      {activeTab === "analytics" ? (
        /* Analytics Tab content */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TrendLineChart data={stats?.trend || []} />
              <LastSentTrendChart data={stats?.lastSentTrend || []} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <CircularHitRate
                title="Emails Reply conversion"
                percentage={
                  stats?.total > 0
                    ? Math.round((stats.replied / stats.total) * 100)
                    : 12
                }
                subtext="Replies received out of total contacts"
                color="teal"
              />
              <CircularHitRate
                title="Campaign Hit Rate"
                percentage={
                  stats?.statusBreakdown?.SENT > 0
                    ? Math.round(((stats.statusBreakdown?.SENT - stats.bounced) / stats.statusBreakdown?.SENT) * 100)
                    : 86
                }
                subtext="Success deliverability rate"
                color="indigo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CompanySizeChart data={stats?.employeeBreakdown || {}} onFilterClick={handleFilterClick} />
            <IndustryListChart data={stats?.industries || []} onFilterClick={handleFilterClick} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EngagementDistributionChart data={stats?.engagementBreakdown || {}} onFilterClick={handleFilterClick} />
            <EmailDeliverabilityChart data={stats?.emailStatusBreakdown || {}} onFilterClick={handleFilterClick} />
            <GeographicBreakdownChart data={stats?.countryBreakdown || []} onFilterClick={handleFilterClick} />
          </div>
        </div>
      ) : (
        /* Contact CRM Database Tab content */
        <div className="space-y-4">
          {/* Toolbar Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex flex-col gap-3">
            <PinnedFiltersBar filters={filters} onApply={applyFilters} />
            
            {/* Row 1: Search & Page Size */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <form onSubmit={handleSearch} className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or company..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    className="w-full h-9 pl-10 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </form>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden xs:inline">Rows:</span>
                <div className="relative w-32">
                  <select
                    value={pagination.limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="appearance-none w-full h-9 pl-3 pr-8 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                    <option value={300}>300 rows</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-2">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-sm ${
                    showFilters || activeFilterCount > 0
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                      : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 animate-pulse">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { clearFilters(); setShowFilters(false); }}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Import CSV Button */}
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import CSV</span>
                </button>

                {/* Import from Apollo Button */}
                <button
                  onClick={() => setShowApollo(true)}
                  className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Apollo</span>
                </button>

                {/* Add Lead Button */}
                <button
                  onClick={() => setShowCreateLead(true)}
                  className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Lead</span>
                </button>
              </div>
            </div>

            {/* Filter Panel — expands inside the toolbar card */}
            {showFilters && (
              <div className="border-t border-slate-100">
                <FilterPanel
                  filters={filters}
                  onApply={(f) => { applyFilters(f); setShowFilters(false); }}
                  onClear={clearFilters}
                />
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selected.length > 0 && (
            <BulkActions
              selectedIds={selected}
              count={selected.length}
              onClear={() => setSelected([])}
              onDone={() => { setSelected([]); refetch(); }}
            />
          )}

          {/* Table */}
          <ContactTable
            contacts={contacts}
            loading={loading}
            selected={selected}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            pagination={pagination}
            onPageChange={setPage}
            onSort={setSort}
          />
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDone={() => {
            refetch();
            fetchStats();
          }}
        />
      )}

      {/* Apollo Search Modal */}
      {showApollo && (
        <ApolloSearchModal
          onClose={() => setShowApollo(false)}
          onDone={() => {
            refetch();
            fetchStats();
          }}
        />
      )}

      {/* Create Lead Modal */}
      {showCreateLead && (
        <CreateLeadModal
          onClose={() => setShowCreateLead(false)}
          onDone={() => {
            refetch();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
