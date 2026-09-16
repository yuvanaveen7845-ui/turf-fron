import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  QrCode,
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
} from "lucide-react";
import { GlobalSearchModal } from "../admin/GlobalSearchModal";
import { NewBookingWizardModal } from "../admin/NewBookingWizardModal";
import { RecordOfflinePaymentModal } from "../admin/RecordOfflinePaymentModal";
import { QuickPriceChangeModal } from "../admin/QuickPriceChangeModal";
import { QuickBlockSlotModal } from "../admin/QuickBlockSlotModal";
import { QuickCustomerModal } from "../admin/QuickCustomerModal";
import { Button } from "../ui/Button";
import { QuickActionAnywhere } from "../common/QuickActionAnywhere";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../context/PermissionContext";

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

  // Global Keyboard Shortcuts (⌘B for dock, ⌘K / '/' for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (document.activeElement?.tagName || "")
      );

      if ((e.key === "b" && (e.metaKey || e.ctrlKey)) || (e.key === "[" && !isInput)) {
        e.preventDefault();
        toggleSidebar();
      }

      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isInput)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Centralized Navigation Catalog
  const allNavSections: NavSection[] = [
    {
      title: "OPERATIONS",
      items: [
        { label: "Overview", path: "/admin", icon: LayoutDashboard },
        { label: "Live Schedule", path: "/admin/schedule", icon: Clock },
        { label: "Bookings", path: "/admin/bookings", icon: CalendarDays, permission: "BOOKING_VIEW" },
        { label: "Gate Check-In", path: "/admin/qr-management", icon: QrCode, permission: "CHECKIN_VIEW" },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Payments", path: "/admin/payments", icon: CreditCard, permission: "PAYMENT_VIEW" },
        { label: "Refunds", path: "/admin/refunds", icon: RotateCcw, permission: "PAYMENT_REFUND" },
        { label: "Reports & KPIs", path: "/admin/reports", icon: BarChart3, permission: "REPORT_VIEW" },
      ],
    },
    {
      title: "TURFS & PRICING",
      items: [
        { label: "Turf Venues", path: "/admin/turfs", icon: Layers, permission: "FACILITY_VIEW" },
        { label: "Hourly Pricing", path: "/admin/pricing", icon: Sliders, permission: "PRICING_VIEW" },
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
      {/* 1. Full-Height Modern Collapsible Dock */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-250 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {/* Brand & Genuine Logo */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white">
          <Link
            to="/admin"
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
              title="Collapse Dock (⌘B)"
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-[#059669]">
                    {effectiveRole || "ADMIN"}
                  </span>
                  <Link
                    to="/"
                    title="View Customer Arena"
                    className="text-[10px] text-slate-400 hover:text-slate-700 inline-flex items-center gap-0.5"
                  >
                    <span>Store</span>
                    <ExternalLink className="w-2.5 h-2.5" />
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
          isCollapsed ? "pl-[72px]" : "pl-64"
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

        {/* Clean Unified Top Command Bar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between gap-4">
          {/* Breadcrumb & Live Pulse */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 md:hidden"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                  Live Command
                </span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs font-bold text-slate-600 hidden sm:inline">
                {currentNavItem?.label || "Overview"}
              </span>
            </div>
          </div>

          {/* Controls: Role Preview, Search ⌘K & Quick Actions */}
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <div className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
                <span className="text-[10px] uppercase font-bold px-1.5 text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Clearance:</span>
                </span>
                <button
                  onClick={() => setPreviewRole(null)}
                  className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer text-[11px] ${
                    !isSimulating ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setPreviewRole("STAFF")}
                  className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer text-[11px] ${
                    previewRole === "STAFF" ? "bg-[#059669] text-white shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  Staff
                </button>
              </div>
            )}

            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#059669]" />
              <span className="hidden md:inline">Search or type action...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md">
                ⌘K
              </kbd>
            </button>

            {/* Quick Actions Menu */}
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsQuickActionMenuOpen(!isQuickActionMenuOpen)}
                rightIcon={<ChevronDown className="w-3.5 h-3.5 opacity-80" />}
              >
                <span>+ Action</span>
              </Button>

              {isQuickActionMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsQuickActionMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 text-xs font-bold text-slate-700">
                    {canAccess("BOOKING_CREATE") && (
                      <button
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setIsNewBookingOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#ECFDF5] hover:text-[#059669] flex items-center space-x-2 transition cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2 transition cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2 transition cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2 transition cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2 transition cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2 transition cursor-pointer"
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
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
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

      {/* Quick Action Anywhere (⌘J launcher + FAB) */}
      <QuickActionAnywhere />
    </div>
  );
};
