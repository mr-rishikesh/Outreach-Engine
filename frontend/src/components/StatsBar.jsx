import { Users, Send, MessageSquare, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsBar({ stats }) {
  const total = stats.total || 0;
  const sent = stats.statusBreakdown?.SENT || 0;
  const replied = stats.replied || 0;
  const bounced = stats.bounced || 0;

  // Calculate percentages
  const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;
  const bounceRate = sent > 0 ? Math.round((bounced / sent) * 100) : 0;

  const cards = [
    {
      label: "Total Leads CRM",
      value: total,
      subtext: "+8.4% since last month",
      trend: "up",
      icon: Users,
      color: "indigo",
      gradient: "from-indigo-500 to-indigo-600",
      accentBg: "bg-indigo-50",
      iconColor: "text-indigo-600 animate-pulse",
      glowColor: "group-hover:shadow-indigo-500/10"
    },
    {
      label: "Outreach Sent",
      value: sent,
      subtext: "+12.1% campaign activity",
      trend: "up",
      icon: Send,
      color: "teal",
      gradient: "from-teal-500 to-emerald-600",
      accentBg: "bg-teal-50",
      iconColor: "text-teal-600",
      glowColor: "group-hover:shadow-teal-500/10"
    },
    {
      label: "Replies Rate",
      value: `${replied} (${replyRate}%)`,
      subtext: "+3.2% engagement success",
      trend: "up",
      icon: MessageSquare,
      color: "pink",
      gradient: "from-pink-500 to-rose-600",
      accentBg: "bg-pink-50",
      iconColor: "text-pink-600",
      glowColor: "group-hover:shadow-pink-500/10"
    },
    {
      label: "Email Bounces",
      value: bounced,
      subtext: "-1.5% server protection",
      trend: "down",
      icon: AlertTriangle,
      color: "amber",
      gradient: "from-amber-500 to-orange-600",
      accentBg: "bg-amber-50",
      iconColor: "text-amber-600",
      glowColor: "group-hover:shadow-amber-500/10"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`group bg-white/75 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_-4px_rgba(148,163,184,0.08)] hover:shadow-[0_12px_24px_-6px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 hover:border-indigo-500/20 transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
          >
            {/* Subtle glow effect behind */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-[0.02] rounded-full blur-2xl transform translate-x-8 -translate-y-8`} />

            <div className="flex items-start justify-between mb-3 z-10">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <h4 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                </h4>
              </div>
              <div className={`p-2 rounded-lg ${card.accentBg} transition-colors duration-300`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 z-10 text-[10px] font-bold">
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                card.trend === "up" 
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}>
                {card.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {card.trend === "up" ? "Up" : "Down"}
              </span>
              <span className="text-slate-400 font-semibold">{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
