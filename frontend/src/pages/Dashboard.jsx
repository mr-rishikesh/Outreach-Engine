import { useState, useEffect, useRef } from "react";
import { useContacts } from "../hooks/useContacts";
import { api } from "../api";
import ContactTable from "../components/ContactTable";
import FilterPanel from "../components/FilterPanel";
import BulkActions from "../components/BulkActions";
import StatsBar from "../components/StatsBar";
import { Search, SlidersHorizontal, X, ChevronDown, Upload } from "lucide-react";
import UploadModal from "../components/UploadModal";

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
  const [searchInput, setSearchInput] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.getStats().then((d) => setStats(d.data)).catch(console.error);
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

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Stats */}
      {stats && <StatsBar stats={stats} />}

      {/* Toolbar Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <div className="p-4 lg:p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                />
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border transition-all ${
                  showFilters || activeFilterCount > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-600 text-white text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { clearFilters(); setShowFilters(false); }}
                  className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}

              {/* Import Button */}
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-slate-200" />

              {/* Page Size */}
              <div className="relative">
                <select
                  value={pagination.limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="appearance-none h-10 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
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

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDone={() => {
            refetch();
            api.getStats().then((d) => setStats(d.data)).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
