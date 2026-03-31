import { Users, Send, MessageSquare, AlertTriangle, TrendingUp } from "lucide-react";

export default function StatsBar({ stats }) {
  const cards = [
    {
      label: "Total Contacts",
      value: stats.total,
      icon: Users,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      accent: "border-l-indigo-500",
    },
    {
      label: "Emails Sent",
      value: stats.statusBreakdown?.SENT || 0,
      icon: Send,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "border-l-emerald-500",
    },
    {
      label: "Replied",
      value: stats.replied,
      icon: MessageSquare,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      accent: "border-l-blue-500",
    },
    {
      label: "Bounced",
      value: stats.bounced,
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      accent: "border-l-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-xl border border-slate-200/80 border-l-4 ${card.accent} p-5 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-slate-800 tracking-tight">
                {card.value.toLocaleString()}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
