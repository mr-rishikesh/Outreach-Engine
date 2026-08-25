import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Mail,
  Users,
  LayoutDashboard,
  Settings as SettingsIcon,
  Search,
  Menu,
  Bell,
  MessageSquare,
  Globe,
  Sparkles,
  Clock,
  ChevronRight,
  User,
  Building2
} from "lucide-react";
import toast from "react-hot-toast";

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [version, setVersion] = useState("v1.0.0");
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("outreach_crm_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${baseUrl}/api/version`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            setVersion(`v${data.version}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch version:", err);
      }
    };
    fetchVersion();
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("outreach_crm_sidebar_collapsed", next.toString());
      return next;
    });
  };

  const handlePlaceholderClick = (name) => {
    toast.success(`Navigating to mock module: ${name}`);
  };

  const navGroups = [
    {
      title: "Dashboards",
      items: [
        { label: "Overview Hub", to: "/", icon: LayoutDashboard, active: pathname === "/" },
        { label: "Leads Database", to: "/leads", icon: Users, active: pathname === "/leads" },
        { label: "Companies Registry", to: "/companies", icon: Building2, active: pathname === "/companies" },
        { label: "Email Sequences", to: "/sequences", icon: Mail, active: pathname.startsWith("/sequences") },
        { label: "CRM Settings", to: "/settings", icon: SettingsIcon, active: pathname === "/settings" },
      ]
    },
    {
      title: "Layouts",
      items: [
        { label: "Page Layouts", type: "mock", icon: Sparkles, badge: "New" },
        { label: "Vertical Nav", type: "mock", icon: Globe },
        { label: "Horizontal Nav", type: "mock", icon: Clock },
      ]
    },
    {
      title: "General Modules",
      items: [
        { label: "Templates", type: "mock", icon: Mail },
        { label: "Users & Teams", type: "mock", icon: Users },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      
      {/* 1. Sleek Left Sidebar (Desktop) */}
      <aside className={`hidden lg:flex flex-col sticky top-0 h-screen ${collapsed ? "w-20" : "w-64"} bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800 shadow-xl z-20 transition-all duration-300`}>
        {/* Brand/Logo Section */}
        <div className={`h-16 border-b border-slate-800/80 flex items-center bg-slate-950 transition-all duration-300 ${collapsed ? "justify-center px-4" : "justify-between px-6"}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-tr from-pink-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="text-base font-extrabold text-white tracking-wider uppercase bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent transition-opacity duration-300">
                Modern Admin
              </span>
            )}
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-none">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-opacity duration-300">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  if (item.type === "mock") {
                    return (
                      <button
                        key={itemIdx}
                        onClick={() => handlePlaceholderClick(item.label)}
                        className={`w-full flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200 cursor-pointer ${
                          collapsed ? "justify-center py-2 px-2" : "justify-between py-2 px-3"
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0" />
                          {!collapsed && <span className="text-xs font-semibold">{item.label}</span>}
                        </div>
                        {!collapsed && (
                          item.badge ? (
                            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                          )
                        )}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={itemIdx}
                      to={item.to}
                      className={`flex items-center rounded-lg transition-all duration-200 ${
                        item.active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      } ${
                        collapsed ? "justify-center py-2.5 px-2" : "justify-between py-2 px-3 text-xs font-semibold"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${item.active ? "text-white" : "text-slate-500"}`} />
                        {!collapsed && <span className="text-xs font-semibold">{item.label}</span>}
                      </div>
                      {!collapsed && item.active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Sidebar Info */}
        <div className={`p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center gap-3 text-xs transition-all duration-300 ${collapsed ? "justify-center px-2" : "px-4"}`}>
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="w-4.5 h-4.5 text-slate-300" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-300">
              <span className="text-white font-semibold truncate">mr.rishikesh2</span>
              <span className="text-[10px] text-slate-500 truncate">Outreach Operator</span>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm">
          <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl relative">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              &times;
            </button>
            <div className="h-16 px-6 border-b border-slate-800 flex items-center bg-slate-950">
              <span className="text-base font-extrabold text-white tracking-widest uppercase">
                Modern Admin
              </span>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
              {navGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1.5">
                  <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      if (item.type === "mock") {
                        return (
                          <button
                            key={itemIdx}
                            onClick={() => { setMobileOpen(false); handlePlaceholderClick(item.label); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-slate-500" />
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={itemIdx}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                            item.active ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="flex-grow" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* 3. Main content area wrapper */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header Navbar */}
        <header className="h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/80 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:inline-flex p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Header Mock Search Box */}
            <div className="relative hidden md:block w-72 ml-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Global admin query search..."
                onClick={() => handlePlaceholderClick("Global Query Search")}
                className="w-full h-9 pl-9 pr-4 text-xs bg-slate-100/80 border border-slate-200/60 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Header Right Elements */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Version badge */}
            {version && (
              <span className="inline-flex items-center h-6 px-2.5 text-[10px] font-extrabold bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                {version}
              </span>
            )}
            {/* Mega Menu Indicator */}
            <button
              onClick={() => handlePlaceholderClick("Mega Menu")}
              className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Mega Menu
            </button>

            {/* Language Flag Selector */}
            <div
              onClick={() => handlePlaceholderClick("Language Switcher")}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider hidden xs:inline">
                EN (UK)
              </span>
            </div>

            {/* Notifications with counter pill */}
            <div
              onClick={() => handlePlaceholderClick("Notifications Center")}
              className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border border-white">
                5
              </span>
            </div>

            {/* Mail with counter pill */}
            <div
              onClick={() => handlePlaceholderClick("Mail Messages")}
              className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 text-slate-500" />
              <span className="absolute top-0 right-0 w-4.5 h-1 bg-indigo-500 rounded-full border border-white" />
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200" />

            {/* User Profile Info */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-slate-800">John Doe</span>
                <span className="text-[9px] font-bold text-emerald-500 tracking-wide uppercase">
                  Online
                </span>
              </div>
              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 p-[2px] shadow-sm">
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-white">
                  <User className="w-4.5 h-4.5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Routing Outlet Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1440px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
