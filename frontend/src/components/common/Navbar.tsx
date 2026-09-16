import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Trophy,
  Calendar,
  Wallet,
  Award,
  Gift,
  User as UserIcon,
  LogOut,
  LogIn,
  QrCode,
  LayoutDashboard,
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  Shield,
  Layers,
} from "lucide-react";
import api from "../../services/api";
import { useRealtime } from "../../context/RealtimeContext";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { status: realtimeStatus } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      api
        .get("/notifications/")
        .then((res) => setUnreadCount(res.data.unread_count || 0))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/logo.png"
                alt="Friends Turf"
                className="w-11 h-11 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight block">
                  FRIENDS <span className="text-[#059669]">TURF</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                  Official Arena & Pitch Booking
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links according to user role */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {(!user || user.role === "CUSTOMER") && (
              <>
                <Link
                  to="/"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/")
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Explore
                </Link>
                <Link
                  to="/turfs"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/turfs")
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Our Pitches
                </Link>
                {user && (
                  <>
                    <Link
                      to="/my-bookings"
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isActive("/my-bookings")
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/offers"
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isActive("/offers")
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      Coupons & Offers
                    </Link>
                  </>
                )}
              </>
            )}

            {user?.role === "STAFF" && (
              <>
                <Link
                  to="/staff"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/staff")
                      ? "bg-amber-50 text-amber-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Staff Portal</span>
                  </span>
                </Link>
                <Link
                  to="/staff/scanner"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/staff/scanner")
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>Gate Scanner</span>
                  </span>
                </Link>
                <Link
                  to="/staff/walk-in"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/staff/walk-in")
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Walk-ins
                </Link>
              </>
            )}

            {(user?.role === "ADMIN" || user?.is_superuser) && (
              <>
                <Link
                  to="/admin"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/admin")
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin Hub</span>
                  </span>
                </Link>
                <Link
                  to="/admin/bookings"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/admin/bookings")
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Bookings
                </Link>
                <Link
                  to="/admin/turfs"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/admin/turfs")
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Turfs
                </Link>
                <Link
                  to="/admin/reports"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/admin/reports")
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Reports
                </Link>
              </>
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-3">
            {/* Realtime Live Sync Status */}
            <div
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                realtimeStatus === "CONNECTED"
                  ? "bg-[#ECFDF5] border-emerald-200 text-[#059669]"
                  : realtimeStatus === "CONNECTING"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
              title={
                realtimeStatus === "CONNECTED"
                  ? "Real-time Live Sync Stream Active"
                  : realtimeStatus === "CONNECTING"
                  ? "Reconnecting to live sync stream..."
                  : "Live sync offline (using polling fallback)"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  realtimeStatus === "CONNECTED"
                    ? "bg-[#10B981] animate-pulse"
                    : realtimeStatus === "CONNECTING"
                    ? "bg-amber-500 animate-ping"
                    : "bg-slate-400"
                }`}
              />
              <span className="uppercase tracking-wider">
                {realtimeStatus === "CONNECTED" ? "Live" : realtimeStatus === "CONNECTING" ? "Syncing" : "Offline"}
              </span>
            </div>

            {user ? (
              <>
                {/* Wallet Preview for Customer */}
                {user.role === "CUSTOMER" && user.customer_profile && (
                  <Link
                    to="/wallet"
                    className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-[#059669]" />
                    <span className="text-xs font-bold text-[#059669]">
                      ₹{Number(user.customer_profile.wallet_balance || 0).toLocaleString("en-IN")}
                    </span>
                  </Link>
                )}

                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#059669] flex items-center justify-center font-bold text-sm text-white shadow-sm">
                      {user.first_name
                        ? user.first_name[0].toUpperCase()
                        : user.email[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-xs font-bold text-slate-800">
                      {user.first_name || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-[#059669] font-semibold mt-0.5">
                          {user.role} Account
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#059669]"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile & Referral</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate("/login");
                        }}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-[#059669] text-white hover:bg-[#047857] shadow-emerald-glow transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
