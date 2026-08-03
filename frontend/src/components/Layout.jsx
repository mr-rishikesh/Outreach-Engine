import { Outlet, Link, useLocation } from "react-router-dom";
import { Mail, Users, LayoutDashboard, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { useWorker } from "../context/WorkerContext";

export default function Layout() {
  const { pathname } = useLocation();
  const { status, current, total, sequenceName, type } = useWorker();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-slate-800 tracking-tight">
                OutreachCRM
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              <NavLink to="/" active={pathname === "/"} icon={<LayoutDashboard className="w-4 h-4" />}>
                Dashboard
              </NavLink>
              <NavLink to="/sequences" active={pathname.startsWith("/sequences")} icon={<Mail className="w-4 h-4" />}>
                Sequences
              </NavLink>
              <NavLink to="/settings" active={pathname === "/settings"} icon={<SettingsIcon className="w-4 h-4" />}>
                Settings
              </NavLink>
            </div>
          </div>
        </div>

        {/* Global Progress Banner */}
        {status !== "idle" && (
          <div className={`border-t px-4 py-2.5 text-xs text-white transition-all flex items-center justify-between gap-4 select-none ${
            status === "running" ? "bg-indigo-600 border-indigo-755 animate-pulse" : "bg-emerald-600 border-emerald-700"
          }`}>
            <div className="flex items-center gap-2 font-bold min-w-0">
              {status === "running" ? (
                <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
              ) : (
                <span className="shrink-0 bg-emerald-500 rounded-full p-0.5 text-[9px] text-white">✓</span>
              )}
              <span className="truncate">
                {status === "running"
                  ? `Sending ${type === "followup" ? "follow-up" : "primary"} emails for "${sequenceName}"...`
                  : `Finished sending "${sequenceName}" emails!`
                }
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono font-bold">
                {current} / {total} Sent
              </span>
              <div className="w-24 bg-white/20 h-2 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${(current / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
