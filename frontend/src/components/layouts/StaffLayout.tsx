import React, { useEffect, Suspense } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import {
  LayoutDashboard,
  QrCode,
  UserPlus,
  Search,
  ClipboardCheck,
  Clock,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { useGlobalShortcuts } from "../../hooks/useGlobalShortcuts";

export const StaffLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (p: string) => location.pathname === p;

  // Global Quick Scan Shortcut: ⌘Q / 'q'
  useGlobalShortcuts();

  const staffNavItems = [
    { label: "Today's Schedule", path: "/staff", icon: LayoutDashboard },
    { label: "Live QR Scanner", path: "/staff/scanner", icon: QrCode },
    { label: "Walk-In Booking", path: "/staff/walk-in", icon: UserPlus },
    { label: "Search Booking", path: "/staff/search", icon: Search },
    { label: "Gate Check-In Logs", path: "/staff/logs", icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar />

      {/* Staff Sub-header Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 pt-20 sm:pt-22">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="Friends Turf"
              className="w-6 h-6 object-contain shrink-0"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">
              Ground Operations Console
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[10px] font-bold text-[#059669] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>Live Shift</span>
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {staffNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive(item.path)
                      ? "bg-[#059669] text-white shadow-sm shadow-emerald-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto py-12 px-4 space-y-4 animate-pulse">
              <div className="h-28 rounded-2xl bg-slate-200/60" />
              <div className="h-64 rounded-2xl bg-slate-200/50" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};
