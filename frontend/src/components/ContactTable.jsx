import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  Loader2,
  Inbox,
} from "lucide-react";

const ALL_COLUMNS = [
  { key: "firstName", label: "Name", minW: "min-w-[180px]" },
  { key: "email", label: "Email", minW: "min-w-[220px]" },
  { key: "companyName", label: "Company", minW: "min-w-[160px]" },
  { key: "title", label: "Title", minW: "min-w-[160px]" },
  { key: "outreachStatus", label: "Status", minW: "min-w-[140px]" },
  { key: "engagement", label: "Engagement", minW: "min-w-[110px]" },
  { key: "source", label: "Source", minW: "min-w-[110px]" },
  { key: "emailStats.emailsSent", label: "Emails Sent", minW: "min-w-[100px]" },
  { key: "reply.replied", label: "Replied", minW: "min-w-[90px]" },
  { key: "followup.followupCount", label: "Followups", minW: "min-w-[90px]" },
  { key: "flags.doNotContact", label: "DNC", minW: "min-w-[70px]" },
];

const STATUS_COLORS = {
  NOT_SENT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  FOLLOWUP_PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  REPLIED_POSITIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  REPLIED_NEGATIVE: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  NO_RESPONSE: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  CLOSED: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20",
};

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export default function ContactTable({
  contacts,
  loading,
  selected,
  onSelect,
  onSelectAll,
  pagination,
  onPageChange,
  onSort,
}) {
  const navigate = useNavigate();
  const [visibleCols, setVisibleCols] = useState(ALL_COLUMNS.map((c) => c.key));
  const [showColPicker, setShowColPicker] = useState(false);
  const [sortField, setSortField] = useState("-createdAt");
  const [dragStart, setDragStart] = useState(null);

  const toggleCol = (key) => {
    setVisibleCols((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleSort = (key) => {
    const newSort = sortField === key ? `-${key}` : key;
    setSortField(newSort);
    onSort(newSort);
  };

  const getSortIcon = (key) => {
    if (sortField === key) return <ArrowUp className="w-3 h-3 text-indigo-600" />;
    if (sortField === `-${key}`) return <ArrowDown className="w-3 h-3 text-indigo-600" />;
    return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  const columns = ALL_COLUMNS.filter((c) => visibleCols.includes(c.key));
  const allSelected = contacts.length > 0 && selected.length === contacts.length;

  const handleMouseDown = (id) => setDragStart(id);
  const handleMouseEnter = (id) => {
    if (dragStart === null) return;
    const startIdx = contacts.findIndex((c) => c._id === dragStart);
    const endIdx = contacts.findIndex((c) => c._id === id);
    if (startIdx === -1 || endIdx === -1) return;
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    const range = contacts.slice(min, max + 1).map((c) => c._id);
    range.forEach((rid) => {
      if (!selected.includes(rid)) onSelect(rid);
    });
  };
  const handleMouseUp = () => setDragStart(null);

  // Pagination range display
  const startRow = (pagination.page - 1) * pagination.limit + 1;
  const endRow = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-slate-700">
            {pagination.total.toLocaleString()} contacts
          </p>
          {selected.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full ring-1 ring-inset ring-indigo-600/20">
              {selected.length} selected
            </span>
          )}
        </div>

        {/* Column Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColPicker(!showColPicker)}
            className="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Columns className="w-3.5 h-3.5" />
            Columns
          </button>
          {showColPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColPicker(false)} />
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-20 w-52">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Toggle columns
                </p>
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(col.key)}
                      onChange={() => toggleCol(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" onMouseUp={handleMouseUp}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="w-12 px-4 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th className="w-12 px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none group ${col.minW}`}
                >
                  <span className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                    {col.label}
                    {getSortIcon(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-20">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm">Loading contacts...</p>
                  </div>
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-20">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Inbox className="w-10 h-10 stroke-[1.5]" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-500">No contacts found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map((contact, index) => {
                const serialNumber = (pagination.page - 1) * pagination.limit + index + 1;
                return (
                <tr
                  key={contact._id}
                  className={`group transition-colors cursor-pointer ${
                    selected.includes(contact._id)
                      ? "bg-indigo-50/60 hover:bg-indigo-50"
                      : "hover:bg-slate-50/80"
                  }`}
                  onMouseDown={() => handleMouseDown(contact._id)}
                  onMouseEnter={() => handleMouseEnter(contact._id)}
                >
                  <td className="w-12 px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(contact._id)}
                      onChange={() => onSelect(contact._id)}
                    />
                  </td>
                  <td className="w-12 px-3 py-2.5 text-center text-slate-600 font-medium">
                    {serialNumber}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-2 whitespace-nowrap"
                      onClick={() => {
                        if (dragStart === null) navigate(`/contacts/${contact._id}`);
                      }}
                    >
                      {col.key === "firstName" ? (
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {contact.firstName} {contact.lastName}
                          </p>
                        </div>
                      ) : col.key === "outreachStatus" ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                            STATUS_COLORS[contact.outreachStatus] || STATUS_COLORS.NOT_SENT
                          }`}
                        >
                          {(contact.outreachStatus || "NOT_SENT").replace(/_/g, " ")}
                        </span>
                      ) : col.key === "engagement" ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                            contact.engagement === "High"
                              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10"
                              : contact.engagement === "Medium"
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10"
                              : "bg-slate-50 text-slate-600 ring-1 ring-slate-600/10"
                          }`}
                        >
                          {contact.engagement || "Low"}
                        </span>
                      ) : col.key === "source" ? (
                        contact.source ? (
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            {contact.source}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )
                      ) : col.key === "reply.replied" ? (
                        <span className={`inline-flex items-center gap-1 text-sm ${
                          getNestedValue(contact, col.key)
                            ? "text-emerald-600 font-medium"
                            : "text-slate-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            getNestedValue(contact, col.key) ? "bg-emerald-500" : "bg-slate-300"
                          }`} />
                          {getNestedValue(contact, col.key) ? "Yes" : "No"}
                        </span>
                      ) : col.key === "flags.doNotContact" ? (
                        getNestedValue(contact, col.key) ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                            DNC
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )
                      ) : (
                        <span className="text-slate-600">
                          {getNestedValue(contact, col.key) ?? "-"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{startRow}</span> to{" "}
            <span className="font-medium text-slate-700">{endRow}</span> of{" "}
            <span className="font-medium text-slate-700">{pagination.total.toLocaleString()}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let page;
              if (pagination.pages <= 5) {
                page = i + 1;
              } else if (pagination.page <= 3) {
                page = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                page = pagination.pages - 4 + i;
              } else {
                page = pagination.page - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-lg transition-all ${
                    page === pagination.page
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
