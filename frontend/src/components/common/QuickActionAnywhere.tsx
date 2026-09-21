import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  CalendarPlus,
  UserPlus,
  CreditCard,
  Lock,
  QrCode,
  Users,
  Sparkles,
  Command,
  X,
  ScanLine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../context/PermissionContext";
import { NewBookingWizardModal } from "../admin/NewBookingWizardModal";
import { RecordOfflinePaymentModal } from "../admin/RecordOfflinePaymentModal";
import { QuickBlockSlotModal } from "../admin/QuickBlockSlotModal";
import { QuickCustomerModal } from "../admin/QuickCustomerModal";

export const QuickActionAnywhere: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { canAccess, hasPermission } = usePermission();

  const [isOpen, setIsOpen] = useState(false);

  // Sub-modal triggers
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isOfflinePaymentOpen, setIsOfflinePaymentOpen] = useState(false);
  const [isBlockSlotOpen, setIsBlockSlotOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Check if currently on scanner page
  const isScannerPage =
    location.pathname === "/admin/scanner" ||
    location.pathname === "/staff/scanner" ||
    location.pathname === "/admin/check-in" ||
    location.pathname === "/staff/check-in";

  const targetScannerPath =
    location.pathname.startsWith("/admin") || user?.role === "ADMIN"
      ? "/admin/scanner"
      : "/staff/scanner";

  // Global hotkey: ⌘J or Ctrl+J to open Quick Action launcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (document.activeElement?.tagName || "")
      );
      if ((e.key === "j" || e.key === "J") && (e.metaKey || e.ctrlKey) && !isInput) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Only authorized staff/manager/admin users should see the persistent FAB
  if (!user || user.role === "CUSTOMER" || user.status !== "ACTIVE") {
    return null;
  }

  const actions = [
    {
      id: "new-booking",
      keyNum: "1",
      title: "New Booking",
      desc: "Reserve pitch slot for customer with live price calculation",
      icon: CalendarPlus,
      color: "bg-emerald-50 text-[#059669] border-emerald-200 hover:border-[#059669]",
      permission: "BOOKING_CREATE",
      onClick: () => {
        setIsOpen(false);
        setIsNewBookingOpen(true);
      },
    },
    {
      id: "walkin",
      keyNum: "2",
      title: "Walk-In Player",
      desc: "Fast-track immediate on-spot registration & court check-in",
      icon: UserPlus,
      color: "bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-500",
      permission: "BOOKING_CREATE",
      onClick: () => {
        setIsOpen(false);
        navigate("/staff/walk-in");
      },
    },
    {
      id: "record-payment",
      keyNum: "3",
      title: "Record Payment",
      desc: "Log cash drawer payment or manual UPI reconciliation",
      icon: CreditCard,
      color: "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-500",
      permission: "PAYMENT_RECORD_OFFLINE",
      feature: "OFFLINE_PAYMENTS",
      onClick: () => {
        setIsOpen(false);
        setIsOfflinePaymentOpen(true);
      },
    },
    {
      id: "block-slot",
      keyNum: "4",
      title: "Block Turf Slot",
      desc: "Hold slot for venue maintenance, private event, or clinic",
      icon: Lock,
      color: "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-500",
      permission: "FACILITY_BLOCK",
      onClick: () => {
        setIsOpen(false);
        setIsBlockSlotOpen(true);
      },
    },
    {
      id: "checkin",
      keyNum: "5",
      title: "Check-In Scanner",
      desc: "Scan player QR quick-pass or perform manual admission override",
      icon: QrCode,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-500",
      permission: "CHECKIN_SCAN",
      feature: "QR_CHECKIN",
      onClick: () => {
        setIsOpen(false);
        navigate(targetScannerPath);
      },
    },
    {
      id: "add-customer",
      keyNum: "6",
      title: "Add Customer",
      desc: "Register new customer profile, wallet, and contact info",
      icon: Users,
      color: "bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-500",
      permission: "CUSTOMER_EDIT",
      onClick: () => {
        setIsOpen(false);
        setIsAddCustomerOpen(true);
      },
    },
  ];

  // Filter actions user is permitted to use
  const permittedActions = actions.filter((a) =>
    a.permission ? canAccess(a.permission, a.feature) : true
  );

  return (
    <>
      {/* Persistent Floating Action Cluster (Right Edge - Mobile Friendly) */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {/* 1-Tap Quick Launch Scanner Button */}
        {canAccess("CHECKIN_SCAN", "QR_CHECKIN") && !isScannerPage && (
          <button
            type="button"
            onClick={() => navigate(targetScannerPath)}
            aria-label="Launch QR Scanner (⌘Q)"
            className="pointer-events-auto group relative flex items-center justify-center px-3.5 sm:px-4 h-12 sm:h-13 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl shadow-slate-950/30 border-2 border-emerald-500/80 hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
            title="Launch QR Scanner (⌘Q)"
          >
            {/* Pulsing Radar Glow Effect */}
            <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />

            <div className="relative flex items-center space-x-2">
              <div className="relative flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </div>

              {/* Text label */}
              <span className="text-xs font-black tracking-wide uppercase text-white group-hover:text-emerald-300 transition-colors whitespace-nowrap">
                Scan QR
              </span>

              {/* Keyboard Shortcut badge on desktop */}
              <span className="hidden md:inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-mono text-emerald-300 font-bold border border-white/10">
                <span>⌘Q</span>
              </span>
            </div>
          </button>
        )}

        {/* General Operations Quick Action FAB (⌘J) */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Quick Operations Launcher (⌘J)"
          className="pointer-events-auto group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#059669] hover:bg-[#047857] text-white rounded-full shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-emerald-400/40"
          title="Quick Operations Launcher (⌘J)"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
        </button>
      </div>

      {/* Quick Action Modal Launcher */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                    What do you want to do?
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Instant operations launcher • Friends Turf
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-200/80 text-[10px] font-mono text-slate-600 font-bold">
                  <Command className="w-3 h-3" />
                  <span>J</span>
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {permittedActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className={`flex items-start text-left p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer shadow-2xs group ${action.color}`}
                  >
                    <div className="p-2.5 rounded-xl bg-white/80 border border-current/10 shrink-0 mr-3 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-current transition">
                          {action.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold opacity-40">
                          {action.keyNum}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {action.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Tip */}
            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Press <strong>Esc</strong> to cancel</span>
              <span>Available anywhere in operations desk</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modals Mounted at Root */}
      <NewBookingWizardModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
      />

      <RecordOfflinePaymentModal
        isOpen={isOfflinePaymentOpen}
        onClose={() => setIsOfflinePaymentOpen(false)}
      />

      <QuickBlockSlotModal
        isOpen={isBlockSlotOpen}
        onClose={() => setIsBlockSlotOpen(false)}
      />

      <QuickCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />
    </>
  );
};
