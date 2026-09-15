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
  ShieldAlert,
  ChevronDown,
  Sparkles,
  Layers,
} from "lucide-react";
import api from "../../services/api";

export const Navbar: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
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

  const handleRoleSwitch = async (role: "CUSTOMER" | "STAFF" | "ADMIN") => {
    setShowRoleMenu(false);
    await quickLogin(role);
    if (role === "ADMIN") navigate("/admin");
    else if (role === "STAFF") navigate("/staff");
    else navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/30 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                  FRIENDS TURF
                </span>
                <span className="hidden sm:block text-[10px] text-emerald-400/80 font-medium tracking-widest uppercase -mt-1">
                  Turf Arena & Booking
                </span>
              </div>
            </Link>

            {/* Quick Role Badge Switcher for pair testing */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                title="Switch Demo Role"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{user ? user.role : "DEMO ROLES"}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showRoleMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Role Switch
                  </div>
                  <button
                    onClick={() => handleRoleSwitch("CUSTOMER")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-400 flex items-center justify-between"
                  >
                    <span>Customer View</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                      Player
                    </span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch("STAFF")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-amber-600/20 hover:text-amber-400 flex items-center justify-between"
                  >
                    <span>Staff Gate View</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                      Scanner
                    </span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch("ADMIN")}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-purple-600/20 hover:text-purple-400 flex items-center justify-between"
                  >
                    <span>Admin Dashboard</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                      Manager
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links according to user role */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {(!user || user.role === "CUSTOMER") && (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/")
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/turfs"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/turfs")
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Book Turf
                </Link>
                {user && (
                  <>
                    <Link
                      to="/my-bookings"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/my-bookings")
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/offers"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/offers")
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      Offers
                    </Link>
                    <Link
                      to="/wallet"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/wallet")
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      Wallet
                    </Link>
                    <Link
                      to="/loyalty"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/loyalty")
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      Loyalty
                    </Link>
                  </>
                )}
              </>
            )}

            {user?.role === "STAFF" && (
              <>
                <Link
                  to="/staff"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/staff")
                      ? "bg-amber-500/20 text-amber-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Staff Dashboard</span>
                  </span>
                </Link>
                <Link
                  to="/staff/scanner"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/staff/scanner")
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>QR Scanner</span>
                  </span>
                </Link>
                <Link
                  to="/staff/walk-in"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/staff/walk-in")
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Walk-ins
                </Link>
                <Link
                  to="/staff/search"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/staff/search")
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Search Booking
                </Link>
              </>
            )}

            {(user?.role === "ADMIN" || user?.is_superuser) && (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/admin")
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin Hub</span>
                  </span>
                </Link>
                <Link
                  to="/admin/bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/admin/bookings")
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Bookings
                </Link>
                <Link
                  to="/admin/turfs"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/admin/turfs")
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Turfs
                </Link>
                <Link
                  to="/admin/pricing"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/admin/pricing")
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Pricing
                </Link>
                <Link
                  to="/admin/reports"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/admin/reports")
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Reports
                </Link>
              </>
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Wallet Preview for Customer */}
                {user.role === "CUSTOMER" && user.customer_profile && (
                  <Link
                    to="/wallet"
                    className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 hover:border-emerald-500/50 transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">
                      ₹
                      {Number(
                        user.customer_profile.wallet_balance || 0,
                      ).toLocaleString()}
                    </span>
                  </Link>
                )}

                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm text-white">
                      {user.first_name
                        ? user.first_name[0].toUpperCase()
                        : user.email[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-xs font-medium text-slate-200">
                      {user.first_name || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-700/60">
                        <p className="text-sm font-bold text-white truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-emerald-400 font-medium">
                          {user.role} Account
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Profile & Referral</span>
                      </Link>
                      {user.role === "CUSTOMER" && (
                        <Link
                          to="/membership"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-amber-300 hover:bg-slate-700/50"
                        >
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>Membership Club</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate("/login");
                        }}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
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
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
