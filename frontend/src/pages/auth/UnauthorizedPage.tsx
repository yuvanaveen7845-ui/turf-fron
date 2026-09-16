import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, ArrowLeft, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const UnauthorizedPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as { requiredRoles?: string[] } | null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-pitch-card text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            Permission Required
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Insufficient Privileges
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your current account role (<strong className="text-slate-900">{user?.role}</strong>) does not have sufficient clearance to access this module.
          </p>
        </div>

        {state?.requiredRoles && (
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-left space-y-1.5">
            <p className="text-xs font-bold text-slate-800">Required Roles:</p>
            <div className="flex gap-2">
              {state.requiredRoles.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-mono font-bold"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {user?.role === "STAFF" && (
            <Link
              to="/staff"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-200"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Staff Portal</span>
            </Link>
          )}
          <Link
            to="/"
            className="flex-1 py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-emerald-glow transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
