import { Outlet, Link, useLocation } from "react-router-dom";
import { Mail, Users, LayoutDashboard } from "lucide-react";

export default function Layout() {
  const { pathname } = useLocation();

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
              <NavLink to="/" active={false} icon={<Users className="w-4 h-4" />}>
                Contacts
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
