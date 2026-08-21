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
  Sparkles,
  Award,
  Linkedin
} from "lucide-react";

const ALL_COLUMNS = [
  { key: "firstName", label: "Name & Email", minW: "min-w-[240px]" },
  { key: "email", label: "Direct Email", minW: "min-w-[220px]" },
  { key: "companyName", label: "Company", minW: "min-w-[160px]" },
  { key: "linkedin", label: "LinkedIn", minW: "min-w-[80px]" },
  { key: "title", label: "Title", minW: "min-w-[160px]" },
  { key: "outreachStatus", label: "Status", minW: "min-w-[150px]" },
  { key: "engagement", label: "Engagement", minW: "min-w-[110px]" },
  { key: "source", label: "Source", minW: "min-w-[110px]" },
  { key: "emailStats.emailsSent", label: "Sent", minW: "min-w-[90px]" },
  { key: "reply.replied", label: "Replied", minW: "min-w-[90px]" },
  { key: "followup.followupCount", label: "Followups", minW: "min-w-[90px]" },
  { key: "flags.doNotContact", label: "DNC", minW: "min-w-[70px]" },
];

const STATUS_COLORS = {
  NOT_SENT: "bg-slate-50 text-slate-500 border border-slate-200/80",
  SENT: "bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-sm",
  FOLLOWUP_PENDING: "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm",
  REPLIED_POSITIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm",
  REPLIED_NEGATIVE: "bg-rose-50 text-rose-700 border border-rose-200/60 shadow-sm",
  NO_RESPONSE: "bg-slate-50 text-slate-400 border border-slate-200/60 shadow-sm",
  CLOSED: "bg-purple-50 text-purple-700 border border-purple-200/60 shadow-sm",
};

const STATUS_DOTS = {
  NOT_SENT: "bg-slate-400",
  SENT: "bg-indigo-500",
  FOLLOWUP_PENDING: "bg-amber-500",
  REPLIED_POSITIVE: "bg-emerald-500",
  REPLIED_NEGATIVE: "bg-rose-500",
  NO_RESPONSE: "bg-slate-400",
  CLOSED: "bg-purple-500",
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
  const [visibleCols, setVisibleCols] = useState(
    ALL_COLUMNS.filter(c => c.key !== "email").map((c) => c.key) // Hide direct email column by default to reduce clutter since it's merged in Name
  );
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
    if (sortField === key) return <ArrowUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    if (sortField === `-${key}`) return <ArrowDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />;
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

  // Get Initials avatar helper
  const getInitials = (first = "", last = "") => {
    const f = first.slice(0, 1).toUpperCase();
    const l = last.slice(0, 1).toUpperCase();
    return `${f}${l}` || "LD";
  };

  const getAvatarBg = (initials) => {
    const charCode = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
    const gradients = [
      "from-indigo-500 to-indigo-600 text-white",
      "from-teal-500 to-emerald-500 text-white",
      "from-pink-500 to-rose-500 text-white",
      "from-cyan-500 to-blue-500 text-white",
      "from-violet-500 to-purple-500 text-white",
      "from-amber-500 to-orange-500 text-white",
    ];
    return gradients[charCode % gradients.length];
  };

  const checkClass =
    "rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-2 transition-colors cursor-pointer w-4.5 h-4.5";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden transition-all duration-300">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>{pagination.total.toLocaleString()} Contacts Found</span>
          </p>
          {selected.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full ring-1 ring-inset ring-indigo-600/20">
              {selected.length} Selected
            </span>
          )}
        </div>

        {/* Column Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColPicker(!showColPicker)}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
          >
            <Columns className="w-3.5 h-3.5 text-slate-400" />
            <span>Toggle Columns</span>
          </button>
          {showColPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColPicker(false)} />
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-20 w-56 max-h-[360px] overflow-y-auto">
                <p className="px-3 py-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
                  Configure Grid Columns
                </p>
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(col.key)}
                      onChange={() => toggleCol(col.key)}
                      className={checkClass}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto" onMouseUp={handleMouseUp}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-55 border-b border-slate-200/80">
              <th className="w-12 px-5 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className={checkClass}
                />
              </th>
              <th className="w-28 px-4 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Lead ID
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest cursor-pointer select-none group transition-colors hover:bg-slate-100/50 ${col.minW}`}
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
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <p className="text-xs font-semibold tracking-wider">Loading Contacts list...</p>
                  </div>
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-20">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Inbox className="w-10 h-10 stroke-[1.5] text-slate-300" />
                    <div className="text-center space-y-0.5">
                      <p className="text-xs font-bold text-slate-600">No CRM leads found</p>
                      <p className="text-[10px]">Try adjusting your search criteria or applying alternative filters</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map((contact, index) => {
                const serialNumber = (pagination.page - 1) * pagination.limit + index + 1;
                const initials = getInitials(contact.firstName, contact.lastName);
                const isSelected = selected.includes(contact._id);

                return (
                  <tr
                    key={contact._id}
                    className={`group transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/55 hover:bg-indigo-55"
                        : "odd:bg-white even:bg-slate-50/20 hover:bg-slate-50/60 hover:shadow-[inset_3px_0_0_0_#4f46e5]"
                    }`}
                    onMouseDown={() => handleMouseDown(contact._id)}
                    onMouseEnter={() => handleMouseEnter(contact._id)}
                  >
                    <td className="w-12 px-5 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(contact._id)}
                        className={checkClass}
                      />
                    </td>
                    <td className="w-28 px-4 py-2.5 text-left text-xs whitespace-nowrap" onClick={() => {
                      if (dragStart === null) navigate(`/contacts/${contact._id}`);
                    }}>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200/80 font-extrabold tracking-wider">
                        {contact.leadId || "LD-xxxxx"}
                      </span>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-600"
                        onClick={() => {
                          if (dragStart === null) navigate(`/contacts/${contact._id}`);
                        }}
                      >
                        {col.key === "firstName" ? (
                          <div className="flex items-center gap-3">
                            <div className={`w-7.5 h-7.5 rounded-xl bg-gradient-to-tr ${getAvatarBg(initials)} flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0 border border-white`}>
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <p className="font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                                {contact.email}
                              </span>
                            </div>
                          </div>
                        ) : col.key === "outreachStatus" ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              STATUS_COLORS[contact.outreachStatus] || STATUS_COLORS.NOT_SENT
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[contact.outreachStatus] || STATUS_DOTS.NOT_SENT}`} />
                            {(contact.outreachStatus || "NOT_SENT").replace(/_/g, " ")}
                          </span>
                        ) : col.key === "engagement" ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full ${
                              contact.engagement === "High"
                                ? "bg-rose-50 text-rose-700 border border-rose-100 shadow-sm"
                                : contact.engagement === "Medium"
                                ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-sm"
                                : "bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
                            }`}
                          >
                            <Award className="w-3.5 h-3.5 opacity-80" />
                            {contact.engagement || "Low"}
                          </span>
                        ) : col.key === "linkedin" ? (
                          (() => {
                            const url = contact.linkedin || contact.personLinkedinUrl;
                            if (!url) return <span className="text-slate-400 font-medium">-</span>;
                            return (
                              <a
                                href={url.startsWith("http") ? url : `https://${url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer border border-indigo-200/40"
                                title="Open LinkedIn Profile"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            );
                          })()
                        ) : col.key === "source" ? (
                          contact.source ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md capitalize">
                              {contact.source}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )
                        ) : col.key === "reply.replied" ? (
                          <span className={`inline-flex items-center gap-1 text-xs ${
                            getNestedValue(contact, col.key)
                              ? "text-emerald-600 font-bold"
                              : "text-slate-400 font-medium"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              getNestedValue(contact, col.key) ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                            }`} />
                            {getNestedValue(contact, col.key) ? "Yes" : "No"}
                          </span>
                        ) : col.key === "flags.doNotContact" ? (
                          getNestedValue(contact, col.key) ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold rounded bg-red-50 text-red-700 border border-red-200">
                              DNC
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )
                        ) : (
                          <span className="text-slate-600 font-semibold truncate max-w-[200px]">
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

      {/* Pagination controls */}
      {pagination.pages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Showing <span className="text-slate-700">{startRow}</span> to{" "}
            <span className="text-slate-700">{endRow}</span> of{" "}
            <span className="text-slate-700">{pagination.total.toLocaleString()}</span> Leads
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                  className={`inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    page === pagination.page
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
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
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
