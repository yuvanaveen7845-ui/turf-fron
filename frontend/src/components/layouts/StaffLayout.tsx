import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import {
  LayoutDashboard,
  QrCode,
  UserPlus,
  Search,
  ClipboardCheck,
  Clock,
  ShieldCheck,
} from "lucide-react";

export const StaffLayout: React.FC = () => {
  const location = useLocation();
  const isActive = (p: string) => location.pathname === p;

  const staffNavItems = [
    { label: "Today's Schedule", path: "/staff", icon: LayoutDashboard },
    { label: "Live QR Scanner", path: "/staff/scanner", icon: QrCode },
    { label: "Walk-In Booking", path: "/staff/walk-in", icon: UserPlus },
    { label: "Search Booking", path: "/staff/search", icon: Search },
    { label: "Gate Check-In Logs", path: "/staff/logs", icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Staff Sub-header Navigation */}
      <div className="bg-slate-900 border-b border-amber-500/20 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Ground Operations Console
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {staffNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive(item.path)
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
