import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import {
  LayoutDashboard,
  CalendarDays,
  Layers,
  Sliders,
  Ticket,
  Users,
  UserCog,
  Wrench,
  Star,
  BarChart3,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const isActive = (p: string) => location.pathname === p;

  const adminNav = [
    { label: "Overview", path: "/admin", icon: LayoutDashboard },
    { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
    { label: "Turfs & Facilities", path: "/admin/turfs", icon: Layers },
    { label: "Dynamic Pricing", path: "/admin/pricing", icon: Sliders },
    { label: "Coupons & Offers", path: "/admin/coupons", icon: Ticket },
    { label: "Customers & CRM", path: "/admin/customers", icon: Users },
    { label: "Staff Management", path: "/admin/staff", icon: UserCog },
    { label: "Maintenance", path: "/admin/maintenance", icon: Wrench },
    { label: "Reviews & Feedback", path: "/admin/reviews", icon: Star },
    { label: "Reports & Revenue", path: "/admin/reports", icon: BarChart3 },
    { label: "Audit Activity Logs", path: "/admin/audit", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-slate-900/90 border border-purple-500/20 rounded-2xl p-4 sticky top-24 shadow-xl">
            <div className="flex items-center space-x-2 px-3 py-2 mb-3 border-b border-slate-800">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Admin Control Center
              </span>
            </div>

            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
