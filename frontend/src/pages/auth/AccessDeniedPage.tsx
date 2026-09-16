import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Mail, LogIn, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AccessDeniedPage: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const state = location.state as {
    reason?: string;
    email?: string;
    permission?: string;
    feature?: string;
  } | null;

  const isSuspended = state?.reason === "ACCOUNT_SUSPENDED";
  const isPermissionDenied = state?.reason === "PERMISSION_DENIED";
  const isFeatureDisabled = state?.reason === "FEATURE_DISABLED";
  const attemptedEmail = state?.email;

  const dashboardUrl =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "STAFF"
      ? "/staff"
      : "/";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-pitch-card text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
            {isSuspended
              ? "Account Suspended"
              : isFeatureDisabled
              ? "Feature Unavailable"
              : "Access Restricted"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSuspended
              ? "Management Access Suspended"
              : isFeatureDisabled
              ? "Feature Unavailable"
              : "Access Restricted"}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            {isSuspended
              ? "Your Friends Turf corporate account has been temporarily suspended or disabled by the administrator."
              : isFeatureDisabled
              ? "This capability is currently turned off in Friends Turf business configuration."
              : isPermissionDenied
              ? "You don't have permission to access this area. If you require access, please contact your facility administrator."
              : attemptedEmail
              ? `The Google account (${attemptedEmail}) is not authorized to access the Friends Turf management portal.`
              : "You don't have permission to access this area."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-left space-y-2">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#059669]" />
            <span>Authorized Operations Only</span>
          </p>
          <p className="text-[11px] text-slate-600 leading-normal">
            Friends Turf operations, court scheduling, and financial telemetry are restricted to authorized personnel according to their role and clearances.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {user ? (
            <Link
              to={dashboardUrl}
              className="flex-1 py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-emerald-glow transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => logout()}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-200"
            >
              <LogIn className="w-4 h-4" />
              <span>Try Another Account</span>
            </Link>
          )}

          <Link
            to="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
