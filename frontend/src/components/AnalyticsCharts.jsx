import { useState } from "react";
import { TrendingUp, Users, Percent, HelpCircle, Shield, Globe, Award } from "lucide-react";

// Helper to format numbers nicely
const formatNumber = (num) => num.toLocaleString();

// 1. Line/Area Chart (Outreach Trend over Time)
export function TrendLineChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  if (!data || data.length === 0) {
    data = [
      { date: "2026-01", count: 120 },
      { date: "2026-02", count: 240 },
      { date: "2026-03", count: 190 },
      { date: "2026-04", count: 320 },
      { date: "2026-05", count: 450 },
      { date: "2026-06", count: 840 },
    ];
  }

  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const values = data.map((d) => d.count);
  const maxVal = Math.max(...values, 50);
  const minVal = 0;
  const valRange = maxVal - minVal;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  const dx = data.length > 1 ? graphWidth / (data.length - 1) : graphWidth;

  const points = data.map((d, i) => {
    const x = paddingLeft + i * dx;
    const y = height - paddingBottom - ((d.count - minVal) / valRange) * graphHeight;
    return { x, y, ...d };
  });

  // Construct SVG Path using Bezier curve
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + dx / 3;
      const cp1y = p0.y;
      const cp2x = p1.x - dx / 3;
      const cp2y = p1.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  const gridLines = [];
  const divisions = 4;
  for (let i = 0; i <= divisions; i++) {
    const yVal = minVal + (valRange / divisions) * i;
    const y = height - paddingBottom - (i / divisions) * graphHeight;
    gridLines.push({ y, label: Math.round(yVal) });
  }

  return (
    <div className="relative bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Outreach Activity Trend
          </h3>
          <p className="text-xs text-slate-400">Monthly contact additions & campaign triggers</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full">
          Live Database
        </span>
      </div>

      <div className="relative flex-grow min-h-[220px]">
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg border border-slate-700 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full flex flex-col gap-0.5"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 8}%`,
            }}
          >
            <span className="font-bold">{points[hoveredIndex].date}</span>
            <span className="text-indigo-300 font-semibold">{formatNumber(points[hoveredIndex].count)} Leads</span>
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4f46e5" floodOpacity="0.25" />
            </filter>
          </defs>

          {gridLines.map((line, idx) => (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
              >
                {line.label}
              </text>
            </g>
          ))}

          {areaD && <path d={areaD} fill="url(#areaGrad)" />}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={3}
              strokeLinecap="round"
              filter="url(#glow)"
            />
          )}

          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-semibold"
            >
              {p.date.split("-")[1] ? `${p.date.split("-")[1]}/${p.date.split("-")[0].slice(-2)}` : p.date}
            </text>
          ))}

          {points.map((p, idx) => (
            <g key={idx}>
              {hoveredIndex === idx && (
                <line
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={height - paddingBottom}
                  stroke="#818cf8"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? 6 : 4}
                fill={hoveredIndex === idx ? "#4f46e5" : "#ffffff"}
                stroke="#4f46e5"
                strokeWidth={hoveredIndex === idx ? 3 : 2}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <rect
                x={p.x - dx / 2}
                y={paddingTop}
                width={dx}
                height={graphHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// 2. Circular Hit Rate gauge
export function CircularHitRate({ title, percentage, subtext, color = "indigo" }) {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    indigo: { stroke: "#4f46e5", bg: "bg-indigo-50", fill: "text-indigo-600", gradient: ["#6366f1", "#4f46e5"] },
    pink: { stroke: "#ec4899", bg: "bg-pink-50", fill: "text-pink-600", gradient: ["#f472b6", "#db2777"] },
    teal: { stroke: "#14b8a6", bg: "bg-teal-50", fill: "text-teal-600", gradient: ["#2dd4bf", "#0d9488"] },
    cyan: { stroke: "#06b6d4", bg: "bg-cyan-50", fill: "text-cyan-600", gradient: ["#22d3ee", "#0891b2"] }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between items-center text-center h-full group">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        <Percent className={`w-4 h-4 ${scheme.fill} opacity-60`} />
      </div>

      <div className="relative my-4 flex items-center justify-center">
        <div className={`absolute w-24 h-24 rounded-full ${scheme.bg} blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-300`} />
        
        <svg width="120" height="120" className="transform -rotate-90 overflow-visible select-none">
          <defs>
            <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scheme.gradient[0]} />
              <stop offset="100%" stopColor={scheme.gradient[1]} />
            </linearGradient>
            <filter id={`shadow-${color}`} x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={scheme.stroke} floodOpacity="0.3" />
            </filter>
          </defs>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={`url(#grad-${color})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter={`url(#shadow-${color})`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{percentage}%</span>
          <span className="text-[10px] text-slate-400 font-medium">Success</span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>
    </div>
  );
}

// 3. Horizontal Bar Chart (Company Size / Employee Distribution)
export function CompanySizeChart({ data = {}, onFilterClick }) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const maxVal = Math.max(...values, 1);

  const colors = [
    ["from-indigo-400 to-indigo-600", "bg-indigo-500/20"],
    ["from-teal-400 to-teal-600", "bg-teal-500/20"],
    ["from-cyan-400 to-cyan-600", "bg-cyan-500/20"],
    ["from-pink-400 to-pink-600", "bg-pink-500/20"],
    ["from-amber-400 to-amber-600", "bg-amber-500/20"],
  ];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-500" />
          Lead Distribution (Company Size)
        </h3>
        <p className="text-xs text-slate-400">Click a company size range to view filtered leads</p>
      </div>

      <div className="space-y-4 flex-grow flex flex-col justify-center">
        {keys.map((key, i) => {
          const val = data[key] || 0;
          const pct = Math.round((val / total) * 100);
          const fillWidth = Math.max((val / maxVal) * 100, 3);
          const colorPair = colors[i % colors.length];

          return (
            <div
              key={key}
              onClick={() => onFilterClick && onFilterClick("employees", key)}
              className="space-y-1 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition-all duration-200 transform hover:translate-x-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-600 hover:underline">{key} Employees</span>
                <span className="text-slate-800">
                  {val} leads <span className="text-slate-400 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorPair[0]} shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out`}
                  style={{ width: `${fillWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. Industry Distribution
export function IndustryListChart({ data = [], onFilterClick }) {
  if (!data || data.length === 0) {
    data = [
      { name: "Information Technology & Services", count: 420 },
      { name: "Financial Services", count: 180 },
      { name: "Management Consulting", count: 90 },
      { name: "Marketing & Advertising", count: 75 },
    ];
  }

  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-pink-500" />
          Industry Demographics
        </h3>
        <p className="text-xs text-slate-400">Click an industry sector to filter target lists</p>
      </div>

      <div className="space-y-3 flex-grow overflow-y-auto max-h-[220px] pr-1">
        {data.map((ind, i) => {
          const pct = Math.round((ind.count / maxVal) * 100);
          const capitalizedName = ind.name
            ? ind.name.replace(/\b\w/g, (c) => c.toUpperCase())
            : "Other Industries";

          return (
            <div
              key={i}
              onClick={() => onFilterClick && onFilterClick("industry", ind.name)}
              className="space-y-1 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition-all duration-200 transform hover:translate-x-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-600 hover:underline truncate max-w-[220px]" title={capitalizedName}>
                  {capitalizedName}
                </span>
                <span className="text-slate-500">{ind.count} leads</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. Engagement Distribution Chart
export function EngagementDistributionChart({ data = {}, onFilterClick }) {
  const categories = ["High", "Medium", "Low"];
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  const maxVal = Math.max(...Object.values(data), 1);

  const colors = {
    High: "from-emerald-400 to-emerald-600",
    Medium: "from-blue-400 to-blue-600",
    Low: "from-slate-400 to-slate-500"
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-500" />
          Lead Engagement Levels
        </h3>
        <p className="text-xs text-slate-400">Click to filter leads by outreach engagement activity</p>
      </div>

      <div className="space-y-4 flex-grow flex flex-col justify-center">
        {categories.map((cat) => {
          const val = data[cat] || 0;
          const pct = Math.round((val / total) * 100);
          const fillWidth = Math.max((val / maxVal) * 100, 3);
          const colorClass = colors[cat] || "from-slate-400 to-slate-500";

          return (
            <div
              key={cat}
              onClick={() => onFilterClick && onFilterClick("engagement", cat)}
              className="space-y-1 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition-all duration-200 transform hover:translate-x-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-600 hover:underline">{cat} Engagement</span>
                <span className="text-slate-800">
                  {val} leads <span className="text-slate-400 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
                  style={{ width: `${fillWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 6. Email Deliverability Health Chart
export function EmailDeliverabilityChart({ data = {}, onFilterClick }) {
  // Grab all keys, sort, filter empty ones
  const keys = Object.keys(data).filter(k => k.trim() !== "");
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  const maxVal = Math.max(...Object.values(data), 1);

  const colors = [
    "from-indigo-400 to-indigo-600",
    "from-cyan-400 to-cyan-600",
    "from-amber-400 to-amber-600",
    "from-rose-400 to-rose-600"
  ];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-500" />
          Email Deliverability Status
        </h3>
        <p className="text-xs text-slate-400">Click to inspect lead verification lists</p>
      </div>

      <div className="space-y-4 flex-grow flex flex-col justify-center max-h-[220px] overflow-y-auto pr-1">
        {keys.map((key, i) => {
          const val = data[key] || 0;
          const pct = Math.round((val / total) * 100);
          const fillWidth = Math.max((val / maxVal) * 100, 3);
          const colorClass = colors[i % colors.length];
          const displayLabel = key.replace(/_/g, " ");

          return (
            <div
              key={key}
              onClick={() => onFilterClick && onFilterClick("emailStatus", key)}
              className="space-y-1 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition-all duration-200 transform hover:translate-x-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-600 hover:underline capitalize">{displayLabel}</span>
                <span className="text-slate-800">
                  {val} leads <span className="text-slate-400 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
                  style={{ width: `${fillWidth}%` }}
                />
              </div>
            </div>
          );
        })}
        {keys.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-4">No verification details found</p>
        )}
      </div>
    </div>
  );
}

// 7. Geographic breakdown
export function GeographicBreakdownChart({ data = [], onFilterClick }) {
  if (!data || data.length === 0) {
    data = [
      { name: "United States", count: 720 },
      { name: "Canada", count: 80 },
      { name: "United Kingdom", count: 40 },
    ];
  }

  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-pink-500" />
          Geographic Demographics
        </h3>
        <p className="text-xs text-slate-400">Click on a country to isolate locations</p>
      </div>

      <div className="space-y-3.5 flex-grow overflow-y-auto max-h-[220px] pr-1">
        {data.map((country, i) => {
          const pct = Math.round((country.count / maxVal) * 100);
          const displayLabel = country.name || "Unknown Location";

          return (
            <div
              key={i}
              onClick={() => onFilterClick && onFilterClick("country", country.name)}
              className="space-y-1 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition-all duration-200 transform hover:translate-x-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-600 hover:underline truncate max-w-[200px]">
                  📍 {displayLabel}
                </span>
                <span className="text-slate-500">{country.count} leads</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 8. Last Sent Activity Trend Month-Wise
export function LastSentTrendChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  if (!data || data.length === 0) {
    data = [
      { date: "2026-01", count: 0 },
      { date: "2026-02", count: 0 },
      { date: "2026-03", count: 0 },
      { date: "2026-04", count: 0 },
      { date: "2026-05", count: 0 },
      { date: "2026-06", count: 0 },
    ];
  }

  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const values = data.map((d) => d.count);
  const maxVal = Math.max(...values, 50);
  const minVal = 0;
  const valRange = maxVal - minVal;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  const dx = data.length > 1 ? graphWidth / (data.length - 1) : graphWidth;

  const points = data.map((d, i) => {
    const x = paddingLeft + i * dx;
    const y = height - paddingBottom - ((d.count - minVal) / valRange) * graphHeight;
    return { x, y, ...d };
  });

  // Construct SVG Path using Bezier curve
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + dx / 3;
      const cp1y = p0.y;
      const cp2x = p1.x - dx / 3;
      const cp2y = p1.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  const gridLines = [];
  const divisions = 4;
  for (let i = 0; i <= divisions; i++) {
    const yVal = minVal + (valRange / divisions) * i;
    const y = height - paddingBottom - (i / divisions) * graphHeight;
    gridLines.push({ y, label: Math.round(yVal) });
  }

  return (
    <div className="relative bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Email Dispatch Trend (Last Sent Date)
          </h3>
          <p className="text-xs text-slate-400">Monthly breakdown of sent emails based on last outbound outreach</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full">
          Outbox Activity
        </span>
      </div>

      <div className="relative flex-grow min-h-[220px]">
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg border border-slate-700 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full flex flex-col gap-0.5"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 8}%`,
            }}
          >
            <span className="font-bold">{points[hoveredIndex].date}</span>
            <span className="text-emerald-300 font-semibold">{formatNumber(points[hoveredIndex].count)} Emails Sent</span>
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none overflow-visible">
          <defs>
            <linearGradient id="areaGradLastSent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={gl.y}
                x2={width - paddingRight}
                y2={gl.y}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={gl.y + 4}
                className="text-[10px] text-slate-400 font-medium text-right"
                textAnchor="end"
              >
                {gl.label}
              </text>
            </g>
          ))}

          {/* Area Path */}
          {areaD && <path d={areaD} fill="url(#areaGradLastSent)" />}

          {/* Line Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]"
            />
          )}

          {/* X axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - paddingBottom + 16}
              className="text-[10px] text-slate-400 font-medium text-center"
              textAnchor="middle"
            >
              {p.date}
            </text>
          ))}

          {/* Hotspots for interaction */}
          {points.map((p, i) => (
            <g key={i}>
              {hoveredIndex === i && (
                <>
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={height - paddingBottom}
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                  <circle cx={p.x} cy={p.y} r={6} fill="#ffffff" stroke="#10b981" strokeWidth={3} />
                </>
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#10b981"
                className="transition-all duration-200"
                opacity={hoveredIndex === i ? 0 : 1}
              />
              <rect
                x={p.x - dx / 2}
                y={paddingTop}
                width={dx}
                height={graphHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
