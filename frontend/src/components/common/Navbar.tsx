import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Wallet,
  User as UserIcon,
  LogOut,
  QrCode,
  LayoutDashboard,
  Bell,
  ChevronDown,
  Sparkles,
  Settings,
  Menu,
  X,
  Ticket,
  Compass,
  Layers,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { useRealtime } from "../../context/RealtimeContext";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";
import { NotificationOverlay } from "./NotificationOverlay";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { company } = useBusinessSettings();
  const { status: realtimeStatus } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotificationOverlay, setShowNotificationOverlay] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Fetch unread notifications
  useEffect(() => {
    if (user) {
      api
        .get("/notifications/")
        .then((res) => setUnreadCount(res.data.unread_count || 0))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  // Global Quick Scan Shortcut (⌘Q) for Staff / Admin
  useEffect(() => {
    if (!user || (user.role !== "STAFF" && user.role !== "ADMIN" && !user.is_superuser)) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (document.activeElement?.tagName || "")
      );

      if (
        (e.key.toLowerCase() === "q" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "q" && !isInput)
      ) {
        e.preventDefault();
        const targetRoute =
          user.role === "ADMIN" || user.is_superuser ? "/admin/scanner" : "/staff/scanner";
        navigate(targetRoute);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, navigate]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getUserInitials = () => {
    if (user?.first_name) return user.first_name[0].toUpperCase();
    if (user?.full_name) return user.full_name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getTierLabel = () => {
    if (user?.role === "ADMIN" || user?.is_superuser) return "Admin Hub";
    if (user?.role === "STAFF") return "Ground Staff";
    return user?.customer_profile?.membership_tier || "Standard Player";
  };

  return (
    <header className="fixed top-2.5 sm:top-4 inset-x-0 z-50 pointer-events-none px-3 sm:px-6 lg:px-8">
      {/* Floating Island Container */}
      <div className="pointer-events-auto max-w-6xl mx-auto">
        <div className="relative bg-white/92 backdrop-blur-2xl border border-white/85 shadow-[0_16px_48px_rgba(15,23,42,0.1),0_2px_12px_rgba(15,23,42,0.04)] rounded-full px-3.5 sm:px-5 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between ring-1 ring-slate-900/[0.07] transition-all duration-300 hover:shadow-[0_20px_56px_rgba(15,23,42,0.14)]">
          
          {/* Subtle Island Top Accent Highlight */}
          <div className="absolute top-0 inset-x-10 h-[1.5px] bg-gradient-to-r from-transparent via-[#10B981]/60 to-transparent rounded-full pointer-events-none" />

          {/* 1. Left Brand / Island Anchor */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/"
              className="flex items-center space-x-3 group focus:outline-hidden"
              aria-label={`${company.name} Home`}
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 p-0.5 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                <img
                  src={company.logo_url || "/logo.png"}
                  alt={company.name}
                  className="w-full h-full object-contain drop-shadow-2xs"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + "/logo.png") {
                      e.currentTarget.src = "/logo.png";
                    }
                  }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white ring-1 ring-emerald-500/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none group-hover:text-slate-950">
                  {company.name.split(" ")[0]} <span className="text-[#059669]">{company.name.split(" ").slice(1).join(" ") || "TURF"}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1 hidden xs:block">
                  {company.address.split(",")[0] || "Tiruppur Arena"}
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center Segmented Navigation Capsule (The Inner Island) */}
          <nav className="hidden lg:flex items-center bg-slate-100/80 p-1 xl:p-1.5 rounded-full border border-slate-200/60 backdrop-blur-md shadow-inner space-x-0.5 xl:space-x-1 shrink-0 mx-auto">
            {(!user || user.role === "CUSTOMER") && (
              <>
                <Link
                  to="/"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
                    isActive("/") && location.pathname === "/"
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <Compass className="w-4 h-4 text-[#059669]" />
                  <span>Explore</span>
                </Link>
                <Link
                  to="/turfs"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
                    isActive("/turfs")
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#059669]" />
                  <span>Our Pitches</span>
                </Link>
                {user && (
                  <>
                    <Link
                      to="/my-bookings"
                      className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
                        isActive("/my-bookings")
                          ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                          : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-[#059669]" />
                      <span>Bookings</span>
                    </Link>
                    <Link
                      to="/offers"
                      className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
                        isActive("/offers")
                          ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                          : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                      }`}
                    >
                      <Ticket className="w-4 h-4 text-[#059669]" />
                      <span>Passes</span>
                    </Link>
                  </>
                )}
              </>
            )}

            {user?.role === "STAFF" && (
              <>
                <Link
                  to="/staff"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
                    isActive("/staff") && location.pathname === "/staff"
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-600" />
                  <span>Schedule</span>
                </Link>
                <Link
                  to="/staff/scanner"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
                    isActive("/staff/scanner")
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-[#059669]" />
                  <span>Gate Scanner</span>
                </Link>
                <Link
                  to="/staff/walk-in"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all ${
                    isActive("/staff/walk-in")
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <span>Walk-In</span>
                </Link>
                <Link
                  to="/staff/logs"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all ${
                    isActive("/staff/logs")
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <span>Logs</span>
                </Link>
              </>
            )}

            {(user?.role === "ADMIN" || user?.is_superuser) && (
              <>
                <Link
                  to="/admin"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
                    isActive("/admin") && location.pathname === "/admin"
                      ? "bg-white text-purple-950 shadow-xs border border-purple-200 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-600" />
                  <span>Command</span>
                </Link>
                <Link
                  to="/admin/schedule"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all ${
                    isActive("/admin/schedule")
                      ? "bg-white text-purple-950 shadow-xs border border-purple-200 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <span>Schedule</span>
                </Link>
                <Link
                  to="/admin/bookings"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all ${
                    isActive("/admin/bookings")
                      ? "bg-white text-purple-950 shadow-xs border border-purple-200 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <span>Bookings</span>
                </Link>
                <Link
                  to="/admin/reports"
                  className={`px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all ${
                    isActive("/admin/reports")
                      ? "bg-white text-purple-950 shadow-xs border border-purple-200 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <span>Reports</span>
                </Link>
              </>
            )}
          </nav>

          {/* 3. Right Action Dock */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Realtime Live Pulse Indicator */}
            <div
              className={`hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                realtimeStatus === "CONNECTED"
                  ? "bg-emerald-50/90 border-emerald-200/90 text-[#059669]"
                  : realtimeStatus === "CONNECTING"
                  ? "bg-amber-50/90 border-amber-200 text-amber-700"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
              title={
                realtimeStatus === "CONNECTED"
                  ? "Live Realtime SSE Stream Active"
                  : "Connecting to realtime server..."
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === "CONNECTED"
                    ? "bg-[#10B981] animate-pulse"
                    : realtimeStatus === "CONNECTING"
                    ? "bg-amber-500 animate-ping"
                    : "bg-slate-400"
                }`}
              />
              <span className="uppercase tracking-wider font-extrabold text-[10px]">
                {realtimeStatus === "CONNECTED" ? "Live" : "Syncing"}
              </span>
            </div>

            {user ? (
              <>
                {/* Customer Turf Cash Balance Chip (Shown on tablet/desktop to keep mobile header clean) */}
                {user.role === "CUSTOMER" && user.customer_profile && (
                  <Link
                    to="/wallet"
                    className="hidden sm:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 text-[#059669] transition-all group shadow-2xs shrink-0"
                    title="Turf Cash Wallet"
                  >
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#059669] group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs sm:text-sm font-mono font-black shrink-0">
                      ₹{Number(user.customer_profile.wallet_balance || 0).toLocaleString("en-IN")}
                    </span>
                  </Link>
                )}

                {/* Notification Bell (Opens Overlay Popover) */}
                <button
                  type="button"
                  onClick={() => setShowNotificationOverlay(!showNotificationOverlay)}
                  className={`relative w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all duration-200 shadow-2xs cursor-pointer shrink-0 ${
                    showNotificationOverlay
                      ? "bg-emerald-50 text-[#059669] border-emerald-300 ring-2 ring-emerald-500/20"
                      : "bg-slate-100/80 hover:bg-slate-200/80 border-slate-200/60 text-slate-700 hover:text-slate-950"
                  }`}
                  title="Notifications & Alerts"
                  aria-label="Toggle notifications overlay"
                >
                  <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 sm:min-w-4.5 sm:h-4.5 px-1 rounded-full bg-amber-500 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Ultra-Premium User Profile Pill (Desktop / Tablet) */}
                <div className="relative hidden lg:block shrink-0" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="group flex items-center space-x-2 pl-1.5 pr-2 xl:pr-3.5 py-1.5 rounded-full bg-gradient-to-r from-slate-50 via-white to-slate-50 hover:from-white hover:to-white border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-[0_4px_16px_rgba(5,150,105,0.12)] transition-all duration-200 cursor-pointer focus:outline-hidden shrink-0"
                    aria-haspopup="true"
                    aria-expanded={showUserMenu}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#059669] via-emerald-600 to-teal-400 flex items-center justify-center font-black text-xs text-white shadow-2xs ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                      {getUserInitials()}
                    </div>
                    <div className="hidden xl:flex flex-col text-left">
                      <span className="text-xs font-black text-slate-900 leading-tight max-w-[100px] truncate">
                        {user.first_name || user.full_name || user.email.split("@")[0]}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#059669] leading-tight">
                        {user.role === "ADMIN" || user.is_superuser ? "Admin" : user.role === "STAFF" ? "Staff" : "Player"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                        showUserMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Floating Glass Dropdown Panel */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3.5 w-80 bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.14),0_6px_16px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(15,23,42,0.02)] ring-1 ring-slate-900/[0.04] p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Header Profile Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-white/80 via-emerald-50/40 to-white/60 backdrop-blur-md border border-white/90 mb-2 shadow-[0_2px_8px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)]">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#059669] via-emerald-600 to-teal-400 text-white font-black text-base flex items-center justify-center shadow-sm ring-2 ring-emerald-500/25">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">
                              {user.full_name || user.email}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate font-medium">
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-1.5">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#059669] text-[10px] font-extrabold border border-emerald-500/25 backdrop-blur-xs">
                                <Sparkles className="w-2.5 h-2.5 text-[#059669]" />
                                <span>{getTierLabel()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Navigation Links */}
                      <div className="space-y-0.5 text-xs font-bold text-slate-700">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-white/60 hover:text-slate-950 transition-all border border-transparent hover:border-white/60"
                        >
                          <div className="flex items-center space-x-3">
                            <UserIcon className="w-4 h-4 text-slate-400" />
                            <span>Player Profile & Settings</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                        </Link>

                        {user.role === "CUSTOMER" && (
                          <>
                            <Link
                              to="/my-bookings"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-white/60 hover:text-slate-950 transition-all border border-transparent hover:border-white/60"
                            >
                              <div className="flex items-center space-x-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>My Match Bookings</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                            </Link>
                            <Link
                              to="/wallet"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-white/60 hover:text-slate-950 transition-all border border-transparent hover:border-white/60"
                            >
                              <div className="flex items-center space-x-3">
                                <Wallet className="w-4 h-4 text-slate-400" />
                                <span>Turf Cash Wallet</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                            </Link>
                            <Link
                              to="/offers"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-white/60 hover:text-slate-950 transition-all border border-transparent hover:border-white/60"
                            >
                              <div className="flex items-center space-x-3">
                                <Ticket className="w-4 h-4 text-slate-400" />
                                <span>Squad Passes & Deals</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                            </Link>
                          </>
                        )}

                        {(user.role === "ADMIN" || user.is_superuser) && (
                          <Link
                            to="/admin/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-white/60 hover:text-slate-950 transition-all border border-transparent hover:border-white/60"
                          >
                            <div className="flex items-center space-x-3">
                              <Settings className="w-4 h-4 text-slate-400" />
                              <span>System Settings</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                          </Link>
                        )}
                      </div>

                      {/* Sign Out CTA */}
                      <div className="pt-2 mt-2 border-t border-slate-200/50">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            navigate("/login");
                          }}
                          className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-200/50 cursor-pointer transition-all"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-full text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
                >
                  Join Squad
                </Link>
              </div>
            )}

            {/* Mobile Island Menu / Profile Toggle Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden relative flex items-center justify-center w-8.5 h-8.5 rounded-full bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/80 text-slate-700 hover:text-slate-950 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              aria-label="Toggle navigation menu"
            >
              {showMobileMenu ? (
                <X className="w-4.5 h-4.5 text-slate-800" />
              ) : user ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#059669] via-emerald-600 to-teal-400 flex items-center justify-center font-black text-xs text-white shadow-2xs">
                  {getUserInitials()}
                </div>
              ) : (
                <Menu className="w-4.5 h-4.5 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* 4. Mobile Dynamic Island Expansion Drawer */}
        {showMobileMenu && (
          <>
            {/* Backdrop to close menu when tapping outside */}
            <div
              className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-40 lg:hidden transition-opacity"
              onClick={() => setShowMobileMenu(false)}
              aria-hidden="true"
            />

            <div className="relative z-50 lg:hidden mt-2 bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.14),0_6px_16px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(15,23,42,0.02)] rounded-3xl p-4 space-y-3 ring-1 ring-slate-900/[0.04] animate-in fade-in slide-in-from-top-3 duration-200">
              {/* User Profile Capsule in Mobile Drawer */}
              {user && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/80 via-emerald-50/40 to-white/60 backdrop-blur-md border border-white/90 mb-2 shadow-[0_2px_8px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#059669] via-emerald-600 to-teal-400 text-white font-black text-sm flex items-center justify-center shadow-sm ring-2 ring-emerald-500/25">
                        {getUserInitials()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {user.full_name || user.first_name || user.email}
                        </p>
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#059669] text-[9px] font-extrabold border border-emerald-500/25 backdrop-blur-xs mt-0.5 shadow-2xs">
                          <Sparkles className="w-2 h-2 text-[#059669]" />
                          <span>{getTierLabel()}</span>
                        </span>
                      </div>
                    </div>

                    {user.role === "CUSTOMER" && user.customer_profile && (
                      <Link
                        to="/wallet"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex flex-col items-end px-2.5 py-1 rounded-xl bg-white/75 backdrop-blur-xs border border-white/90 text-right shadow-2xs hover:bg-white/90 transition-all"
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Balance</span>
                        <span className="text-xs font-black font-mono text-[#059669]">
                          ₹{Number(user.customer_profile.wallet_balance || 0).toLocaleString("en-IN")}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive("/") && location.pathname === "/"
                      ? "bg-emerald-500/12 text-[#059669] border border-emerald-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs font-black"
                      : "text-slate-700 hover:bg-white/60 hover:text-slate-950 border border-transparent hover:border-white/60"
                  }`}
                >
                  <Compass className="w-4 h-4 text-[#059669]" />
                  <span>Explore Pitches</span>
                </Link>
                <Link
                  to="/turfs"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive("/turfs")
                      ? "bg-emerald-500/12 text-[#059669] border border-emerald-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs font-black"
                      : "text-slate-700 hover:bg-white/60 hover:text-slate-950 border border-transparent hover:border-white/60"
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#059669]" />
                  <span>All Arenas & Rates</span>
                </Link>
                {user ? (
                  <>
                    <Link
                      to="/my-bookings"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive("/my-bookings")
                          ? "bg-emerald-500/12 text-[#059669] border border-emerald-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs font-black"
                          : "text-slate-700 hover:bg-white/60 hover:text-slate-950 border border-transparent hover:border-white/60"
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-[#059669]" />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/wallet"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive("/wallet")
                          ? "bg-emerald-500/12 text-[#059669] border border-emerald-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs font-black"
                          : "text-slate-700 hover:bg-white/60 hover:text-slate-950 border border-transparent hover:border-white/60"
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-[#059669]" />
                      <span>Turf Cash Wallet</span>
                    </Link>
                    <Link
                      to="/offers"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive("/offers")
                          ? "bg-emerald-500/12 text-[#059669] border border-emerald-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs font-black"
                          : "text-slate-700 hover:bg-white/60 hover:text-slate-950 border border-transparent hover:border-white/60"
                      }`}
                    >
                      <Ticket className="w-4 h-4 text-[#059669]" />
                      <span>Passes & Offers</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive("/profile")
                          ? "bg-emerald-500/12 text-[#059669] border border-emerald-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs font-black"
                          : "text-slate-700 hover:bg-white/60 hover:text-slate-950 border border-transparent hover:border-white/60"
                      }`}
                    >
                      <UserIcon className="w-4 h-4 text-[#059669]" />
                      <span>Player Profile & Settings</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowNotificationOverlay(true);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-white/60 hover:text-slate-950 border border-transparent hover:border-white/60 cursor-pointer text-left transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Bell className="w-4 h-4 text-[#059669]" />
                        <span>Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          {unreadCount} New
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="pt-2 border-t border-slate-200/50 flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex-1 py-2 text-center rounded-xl bg-white/60 hover:bg-white/90 border border-white/80 text-xs font-bold text-slate-800 shadow-2xs transition-all"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex-1 py-2 text-center rounded-xl bg-[#059669] hover:bg-[#047857] text-xs font-bold text-white shadow-sm shadow-emerald-600/30 transition-all"
                    >
                      Join Squad
                    </Link>
                  </div>
                )}

                {(user?.role === "STAFF" || user?.role === "ADMIN" || user?.is_superuser) && (
                  <div className="pt-3 border-t border-slate-200/50 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400/90 px-3 block">
                      Operations Hub
                    </span>
                    <Link
                      to={user.role === "ADMIN" || user.is_superuser ? "/admin" : "/staff"}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-800 hover:bg-white/60 border border-transparent hover:border-white/60 transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#059669]" />
                      <span>{user.role === "ADMIN" ? "Admin Command" : "Staff Console"}</span>
                    </Link>
                    <Link
                      to={user.role === "ADMIN" || user.is_superuser ? "/admin/scanner" : "/staff/scanner"}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl text-xs font-black text-[#059669] bg-emerald-500/12 border border-emerald-500/25 shadow-[0_2px_8px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Gate Scanner (⌘Q)</span>
                    </Link>
                  </div>
                )}

                {user && (
                  <div className="pt-2 border-t border-slate-200/50">
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        logout();
                        navigate("/login");
                      }}
                      className="w-full flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-black text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-200/50 cursor-pointer transition-all"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Global Floating Notification Overlay Popover & Mobile Sheet */}
        {user && (
          <div className="pointer-events-auto">
            <NotificationOverlay
              isOpen={showNotificationOverlay}
              onClose={() => setShowNotificationOverlay(false)}
              onUnreadCountChange={(cnt) => setUnreadCount(cnt)}
            />
          </div>
        )}
      </div>
    </header>
  );
};

