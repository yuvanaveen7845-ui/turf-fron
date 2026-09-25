import React, { useState, useEffect, Suspense } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  QrCode,
  Camera,
  Layers,
  Sliders,
  Ticket,
  Users,
  UserCog,
  Wrench,
  Star,
  BarChart3,
  ShieldAlert,
  Settings,
  CreditCard,
  RotateCcw,
  Search,
  Plus,
  ChevronDown,
  DollarSign,
  PlusCircle,
  Lock,
  UserPlus,
  Eye,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  Home,
  Globe,
} from "lucide-react";
import { GlobalSearchModal } from "../admin/GlobalSearchModal";
import { NewBookingWizardModal } from "../admin/NewBookingWizardModal";
import { RecordOfflinePaymentModal } from "../admin/RecordOfflinePaymentModal";
import { QuickPriceChangeModal } from "../admin/QuickPriceChangeModal";
import { QuickBlockSlotModal } from "../admin/QuickBlockSlotModal";
import { QuickCustomerModal } from "../admin/QuickCustomerModal";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../context/PermissionContext";
import { useGlobalShortcuts } from "../../hooks/useGlobalShortcuts";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  feature?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const {
    hasPermission,
    hasFeature,
    canAccess,
    previewRole,
    setPreviewRole,
    isSimulating,
    effectiveRole,
  } = usePermission();

  const isActive = (p: string) => location.pathname === p;

  // Sidebar Collapsed State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("ft_admin_dock_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("ft_admin_dock_collapsed", String(next));
      return next;
    });
  };

  // Global Modals State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isOfflinePaymentOpen, setIsOfflinePaymentOpen] = useState(false);
  const [isPriceChangeOpen, setIsPriceChangeOpen] = useState(false);
  const [isBlockSlotOpen, setIsBlockSlotOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isQuickActionMenuOpen, setIsQuickActionMenuOpen] = useState(false);

  // Consolidated Global Keyboard Shortcuts Hook (⌘B, ⌘K, ⌘Q)
  useGlobalShortcuts({
    onSearch: () => setIsSearchOpen(true),
    onToggleSidebar: toggleSidebar,
  });

  // Centralized Navigation Catalog
  const allNavSections: NavSection[] = [
    {
      title: "OPERATIONS",
      items: [
        { label: "Overview", path: "/admin", icon: LayoutDashboard },
        { label: "Live Schedule", path: "/admin/schedule", icon: Clock },
        { label: "Bookings", path: "/admin/bookings", icon: CalendarDays, permission: "BOOKING_VIEW" },
        { label: "QR Scanner", path: "/admin/scanner", icon: Camera, permission: "CHECKIN_SCAN", feature: "QR_CHECKIN" },
        { label: "Gate Check-In", path: "/admin/qr-management", icon: QrCode, permission: "CHECKIN_VIEW", feature: "QR_CHECKIN" },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Payments", path: "/admin/payments", icon: CreditCard, permission: "PAYMENT_VIEW" },
        { label: "Refunds", path: "/admin/refunds", icon: RotateCcw, permission: "PAYMENT_REFUND" },
        { label: "Reports & KPIs", path: "/admin/reports", icon: BarChart3, permission: "REPORT_VIEW", feature: "ADVANCED_REPORTING" },
      ],
    },
    {
      title: "TURFS & PRICING",
      items: [
        { label: "Turf Venues", path: "/admin/turfs", icon: Layers, permission: "FACILITY_VIEW" },
        { label: "Hourly Pricing", path: "/admin/pricing", icon: Sliders, permission: "PRICING_VIEW", feature: "DYNAMIC_PRICING" },
        { label: "Maintenance", path: "/admin/maintenance", icon: Wrench, permission: "FACILITY_EDIT" },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { label: "Players CRM", path: "/admin/customers", icon: Users, permission: "CUSTOMER_VIEW" },
        { label: "Staff & Team", path: "/admin/staff", icon: UserCog, permission: "STAFF_VIEW" },
        { label: "Offers & Coupons", path: "/admin/coupons", icon: Ticket, permission: "COUPONS_MANAGE", feature: "COUPONS" },
        { label: "Reviews", path: "/admin/reviews", icon: Star, feature: "REVIEWS" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { label: "Audit Logs", path: "/admin/audit", icon: ShieldAlert, permission: "AUDIT_VIEW" },
        { label: "Settings", path: "/admin/settings", icon: Settings, permission: "SETTINGS_VIEW" },
      ],
    },
    {
      title: "PORTAL ACCESS",
      items: [
        { label: "Public Website / Home", path: "/", icon: Home },
      ],
    },
  ];

  const navSections = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.permission && !hasPermission(item.permission)) return false;
        if (item.feature && !hasFeature(item.feature)) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const currentNavItem = navSections
    .flatMap((s) => s.items)
    .find((item) => isActive(item.path));

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#059669] selection:text-white">
      {/* Mobile Backdrop Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* 1. Full-Height Modern Collapsible Dock (Drawer on Mobile) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-250 ease-in-out ${
          isCollapsed
            ? "-translate-x-full md:translate-x-0 md:w-[72px]"
            : "translate-x-0 w-64 shadow-2xl md:shadow-none"
        }`}
      >
        {/* Brand & Genuine Logo */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white">
          <Link
            to="/admin"
            onClick={() => {
              if (window.innerWidth < 768) setIsCollapsed(true);
            }}
            className={`flex items-center gap-3 overflow-hidden ${
              isCollapsed ? "justify-center w-full" : ""
            }`}
            title="Friends Turf Operations"
          >
            <img
              src="/logo.png"
              alt="Friends Turf Logo"
              className="w-9 h-9 object-contain shrink-0"
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight block truncate leading-tight">
                  FRIENDS TURF
                </span>
                <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider block">
                  Admin Console
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              title="Close Dock"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {section.title}
                </div>
              ) : (
                <div className="w-full flex justify-center my-1.5">
                  <div className="w-6 h-px bg-slate-100" />
                </div>
              )}

              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 768) setIsCollapsed(true);
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`group relative flex items-center rounded-xl transition-all ${
                        isCollapsed
                          ? "justify-center w-11 h-11 mx-auto"
                          : "px-3 py-2 space-x-3 text-xs"
                      } ${
                        active
                          ? "bg-[#ECFDF5] text-[#059669] font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? "text-[#059669]" : "text-slate-400 group-hover:text-slate-700"
                        }`}
                      />

                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}

                      {/* Active Indicator */}
                      {active && (
                        <div
                          className={`absolute ${
                            isCollapsed
                              ? "left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#059669]"
                              : "right-2 w-1.5 h-1.5 rounded-full bg-[#059669]"
                          }`}
                        />
                      )}

                      {/* Floating Tooltip in Collapsed Mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Collapsed Expand Trigger at Bottom */}
        {isCollapsed && (
          <div className="p-3 border-t border-slate-100 flex justify-center bg-white">
            <button
              onClick={toggleSidebar}
              title="Expand Dock (⌘B)"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Operator Profile Card */}
        <div className="p-3 border-t border-slate-100 bg-[#F8FAFC] shrink-0">
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "space-x-3 px-1.5 py-1"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-[#059669] flex items-center justify-center font-bold text-xs shrink-0">
              {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {user?.first_name ? `${user.first_name} ${user?.last_name || ""}` : user?.email}
                </div>
                <div className="flex items-center justify-between gap-1.5 mt-1">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-[#059669]">
                    {effectiveRole || "ADMIN"}
                  </span>
                  <Link
                    to="/"
                    title="Return to Customer Home Page"
                    className="text-[11px] font-bold text-slate-700 hover:text-[#059669] inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition"
                  >
                    <Home className="w-3 h-3 text-[#059669]" />
                    <span>Home Page</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Canvas */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-250 ${
          isCollapsed ? "pl-0 md:pl-[72px]" : "pl-0 md:pl-64"
        }`}
      >
        {/* Safe Access Preview Banner */}
        {isSimulating && (
          <div className="bg-amber-400 text-slate-950 px-4 py-2 border-b border-amber-500 shadow-sm flex items-center justify-between text-xs font-bold z-40 sticky top-0">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-slate-950 animate-pulse shrink-0" />
              <span>
                SAFE PREVIEW MODE: Simulating as <strong>{previewRole}</strong>. Server authorizations remain unchanged.
              </span>
            </div>
            <button
              onClick={() => setPreviewRole(null)}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Exit Simulation
            </button>
          </div>
        )}

        {/* Floating Dynamic Island Command Bar */}
        <header className="sticky top-0 z-30 pt-3 sm:pt-4 pb-2 px-3 sm:px-6 lg:px-8 pointer-events-none bg-[#F8FAFC]/90 backdrop-blur-md transition-all">
          <div className="pointer-events-auto max-w-7xl mx-auto">
            <div className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.04)] rounded-full px-3 sm:px-4 py-2 flex items-center justify-between gap-3 ring-1 ring-slate-900/[0.04]">
              
              {/* Subtle Island Top Accent Highlight */}
              <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-[#10B981]/50 to-transparent rounded-full pointer-events-none" />

              {/* 1. Left Breadcrumb & Live Context */}
              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                <button
                  onClick={toggleSidebar}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center md:hidden transition cursor-pointer"
                  aria-label="Toggle Navigation Dock"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>

                {/* Live Status & Page Title Capsule */}
                <div className="flex items-center bg-slate-100/80 p-1 pl-2.5 pr-3 rounded-full border border-slate-200/60 backdrop-blur-md shadow-inner space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#059669]">
                    Command
                  </span>
                  <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline truncate max-w-[150px]">
                    {currentNavItem?.label || "Overview"}
                  </span>
                </div>

                {/* Direct Public Website Link */}
                <Link
                  to="/"
                  className="hidden xl:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 border border-slate-200/60 text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                  title="Return to Customer Home Page & Booking Arena"
                >
                  <Home className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Main Website</span>
                </Link>
              </div>

              {/* 2. Middle Clearance Preview Segmented Control (Admin Only) */}
              {isAdmin && (
                <div className="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200/60 backdrop-blur-md shadow-inner">
                  <span className="text-[10px] uppercase font-bold px-2 text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span>Clearance:</span>
                  </span>
                  <button
                    onClick={() => setPreviewRole(null)}
                    className={`px-3 py-1 rounded-full transition cursor-pointer text-xs ${
                      !isSimulating
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/50 font-black scale-[1.02]"
                        : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => setPreviewRole("STAFF")}
                    className={`px-3 py-1 rounded-full transition cursor-pointer text-xs ${
                      previewRole === "STAFF"
                        ? "bg-[#059669] text-white shadow-xs font-black scale-[1.02]"
                        : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                    }`}
                  >
                    Staff
                  </button>
                </div>
              )}

              {/* 3. Right Action Dock */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                {/* Easy QR Scanner Header Shortcut */}
                <Link
                  to="/admin/scanner"
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100 text-[#059669] border border-emerald-200/80 text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                  title="Quick Optical Gate Scanner (⌘Q)"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Scan Pass</span>
                  <kbd className="px-1.5 py-0.2 text-[9px] font-mono font-extrabold text-emerald-900 bg-emerald-100/90 rounded-md">
                    ⌘Q
                  </kbd>
                </Link>

                {/* Global Search Button */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/60 rounded-full text-xs font-bold text-slate-600 hover:text-slate-950 transition shadow-2xs cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="hidden md:inline">Search...</span>
                  <kbd className="px-1.5 py-0.2 text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-md">
                    ⌘K
                  </kbd>
                </button>

                {/* Quick Actions Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsQuickActionMenuOpen(!isQuickActionMenuOpen)}
                    className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>+ Action</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  {isQuickActionMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsQuickActionMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] z-50 p-2 space-y-1 text-xs font-bold text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
                        {canAccess("BOOKING_CREATE") && (
                          <button
                            onClick={() => {
                              setIsQuickActionMenuOpen(false);
                              setIsNewBookingOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-2xl hover:bg-[#ECFDF5] hover:text-[#059669] flex items-center space-x-2.5 transition cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4 text-[#059669]" />
                            <span>+ New Booking / Walk-In</span>
                          </button>
                        )}

                        {canAccess("PAYMENT_RECORD_OFFLINE", "OFFLINE_PAYMENTS") && (
                          <button
                            onClick={() => {
                              setIsQuickActionMenuOpen(false);
                              setIsOfflinePaymentOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2.5 transition cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4 text-blue-500" />
                            <span>+ Record Offline Payment</span>
                          </button>
                        )}

                        {canAccess("FACILITY_BLOCK") && (
                          <button
                            onClick={() => {
                              setIsQuickActionMenuOpen(false);
                              setIsBlockSlotOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2.5 transition cursor-pointer"
                          >
                            <Lock className="w-4 h-4 text-amber-500" />
                            <span>+ Block Pitch Slot</span>
                          </button>
                        )}

                        {canAccess("PRICING_EDIT") && (
                          <button
                            onClick={() => {
                              setIsQuickActionMenuOpen(false);
                              setIsPriceChangeOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2.5 transition cursor-pointer"
                          >
                            <Sliders className="w-4 h-4 text-purple-500" />
                            <span>+ Change Hourly Price</span>
                          </button>
                        )}

                        {canAccess("CUSTOMER_EDIT") && (
                          <button
                            onClick={() => {
                              setIsQuickActionMenuOpen(false);
                              setIsAddCustomerOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2.5 transition cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4 text-teal-600" />
                            <span>+ Add New Player</span>
                          </button>
                        )}

                        {canAccess("STAFF_CREATE") && (
                          <button
                            onClick={() => {
                              setIsQuickActionMenuOpen(false);
                              navigate("/admin/staff");
                            }}
                            className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2.5 transition cursor-pointer"
                          >
                            <UserCog className="w-4 h-4 text-slate-600" />
                            <span>+ Invite Staff Member</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 max-w-7xl w-full mx-auto">
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse">
                <div className="h-12 rounded-2xl bg-slate-200/60 max-w-md" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-32 rounded-2xl bg-slate-200/50" />
                  <div className="h-32 rounded-2xl bg-slate-200/50" />
                  <div className="h-32 rounded-2xl bg-slate-200/50" />
                </div>
                <div className="h-64 rounded-2xl bg-slate-200/40" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenNewBooking={() => setIsNewBookingOpen(true)}
        onOpenRecordPayment={() => setIsOfflinePaymentOpen(true)}
        onOpenPriceChange={() => setIsPriceChangeOpen(true)}
        onOpenBlockSlot={() => setIsBlockSlotOpen(true)}
        onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
      />

      <NewBookingWizardModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        onBookingCreated={() => {}}
      />

      <RecordOfflinePaymentModal
        isOpen={isOfflinePaymentOpen}
        onClose={() => setIsOfflinePaymentOpen(false)}
      />

      <QuickPriceChangeModal
        isOpen={isPriceChangeOpen}
        onClose={() => setIsPriceChangeOpen(false)}
      />

      <QuickBlockSlotModal
        isOpen={isBlockSlotOpen}
        onClose={() => setIsBlockSlotOpen(false)}
      />

      <QuickCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />
    </div>
  );
};
