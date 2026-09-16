import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Calendar,
  Users,
  Clock,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Sparkles,
  PlusCircle,
  CreditCard,
  Lock,
  Sliders,
  UserPlus,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Phone,
  QrCode,
  Check,
  ChevronRight,
  Radio,
  Zap,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { DashboardMetrics } from "../../types";
import { Button, ErrorState, Skeleton } from "../../components/ui";
import { NewBookingWizardModal } from "../../components/admin/NewBookingWizardModal";
import { RecordOfflinePaymentModal } from "../../components/admin/RecordOfflinePaymentModal";
import { QuickPriceChangeModal } from "../../components/admin/QuickPriceChangeModal";
import { QuickBlockSlotModal } from "../../components/admin/QuickBlockSlotModal";
import { QuickCustomerModal } from "../../components/admin/QuickCustomerModal";
import { ContextualBookingDrawer } from "../../components/admin/ContextualBookingDrawer";
import { useNavigate } from "react-router-dom";
import { useOperationsRealtime, useGateRealtime } from "../../hooks/useRealtime";

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const navigate = useNavigate();

  // Action Modals State
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isOfflinePaymentOpen, setIsOfflinePaymentOpen] = useState(false);
  const [isPriceChangeOpen, setIsPriceChangeOpen] = useState(false);
  const [isBlockSlotOpen, setIsBlockSlotOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Drawer State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Daily Operations Live Status
  const [dailyOps, setDailyOps] = useState<any | null>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.get("/reports/dashboard/"),
      api.get("/reports/daily-operations/").catch(() => ({ data: null })),
    ])
      .then(([mRes, dRes]) => {
        setMetrics(mRes.data);
        setDailyOps(dRes.data);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time live sync for dashboard KPIs and gate activity
  useOperationsRealtime(() => {
    fetchDashboardData();
  });

  useGateRealtime(() => {
    fetchDashboardData();
  });

  const openBookingDrawer = (booking: any) => {
    setSelectedBooking(booking);
    setIsDrawerOpen(true);
  };

  const { kpis } = metrics || {
    kpis: {
      today_bookings: 0,
      today_revenue: 0,
      upcoming_bookings: 0,
      pending_payments: 0,
      cancellations: 0,
      no_shows: 0,
      occupancy_rate: 0,
      available_slots: 0,
      active_customers: 0,
      average_rating: 5.0,
    },
  };

  const hasExceptions = (kpis.pending_payments || 0) > 0 || (kpis.cancellations || 0) > 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Hero Operations Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200 text-[#059669] text-[11px] font-bold uppercase tracking-[0.08em]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Live Operations</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-[-0.03em] leading-tight">
            Today's Turf Command
          </h1>
          <p className="text-sm text-[#475569] max-w-2xl font-normal leading-relaxed">
            Real-time match operations, pitch occupancy, automated QR check-in, and instant financial reconciliations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          {lastUpdated && (
            <div className="text-right hidden lg:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Data Stream
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                Synced at {lastUpdated}
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewBookingOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* 2. Fast Desks & Operational Shortcuts (Cohesive, Clean Athletic Layout) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#475569]">
            Fast Desks & Operations Cockpit
          </span>
          <span className="text-xs font-semibold text-slate-400">1-Click Fast Actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Action 1: Walk-In Booking */}
          <button
            type="button"
            onClick={() => setIsNewBookingOpen(true)}
            className="group p-4 rounded-2xl bg-white hover:bg-[#ECFDF5] border border-slate-200 hover:border-[#059669] text-left transition-all cursor-pointer shadow-sm hover:shadow-pitch-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold shadow-2xs group-hover:bg-[#059669] group-hover:text-white transition-colors">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                1-CLICK
              </span>
            </div>
            <div className="mt-3.5">
              <h4 className="font-bold text-sm text-[#0F172A] tracking-tight group-hover:text-[#059669] transition-colors">
                Walk-in Booking
              </h4>
              <p className="text-xs text-[#475569] mt-0.5 font-normal">
                Counter or phone
              </p>
            </div>
          </button>

          {/* Action 2: Offline Payment */}
          <button
            type="button"
            onClick={() => setIsOfflinePaymentOpen(true)}
            className="group p-4 rounded-2xl bg-white hover:bg-[#ECFDF5] border border-slate-200 hover:border-[#059669] text-left transition-all cursor-pointer shadow-sm hover:shadow-pitch-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold shadow-2xs group-hover:bg-[#059669] group-hover:text-white transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                CASH/UPI
              </span>
            </div>
            <div className="mt-3.5">
              <h4 className="font-bold text-sm text-[#0F172A] tracking-tight group-hover:text-[#059669] transition-colors">
                Offline Payment
              </h4>
              <p className="text-xs text-[#475569] mt-0.5 font-normal">
                Spot receipt
              </p>
            </div>
          </button>

          {/* Action 3: Live Schedule */}
          <button
            type="button"
            onClick={() => navigate("/admin/schedule")}
            className="group p-4 rounded-2xl bg-white hover:bg-[#ECFDF5] border border-slate-200 hover:border-[#059669] text-left transition-all cursor-pointer shadow-sm hover:shadow-pitch-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold shadow-2xs group-hover:bg-[#059669] group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                TIMELINE
              </span>
            </div>
            <div className="mt-3.5">
              <h4 className="font-bold text-sm text-[#0F172A] tracking-tight group-hover:text-[#059669] transition-colors">
                Live Schedule
              </h4>
              <p className="text-xs text-[#475569] mt-0.5 font-normal">
                Slot matrix
              </p>
            </div>
          </button>

          {/* Action 4: Gate Scanner */}
          <button
            type="button"
            onClick={() => navigate("/admin/qr-management")}
            className="group p-4 rounded-2xl bg-white hover:bg-[#ECFDF5] border border-slate-200 hover:border-[#059669] text-left transition-all cursor-pointer shadow-sm hover:shadow-pitch-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold shadow-2xs group-hover:bg-[#059669] group-hover:text-white transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                QR SCAN
              </span>
            </div>
            <div className="mt-3.5">
              <h4 className="font-bold text-sm text-[#0F172A] tracking-tight group-hover:text-[#059669] transition-colors">
                Gate Scanner
              </h4>
              <p className="text-xs text-[#475569] mt-0.5 font-normal">
                QR admission
              </p>
            </div>
          </button>

          {/* Action 5: Block Pitch */}
          <button
            type="button"
            onClick={() => setIsBlockSlotOpen(true)}
            className="group p-4 rounded-2xl bg-white hover:bg-[#ECFDF5] border border-slate-200 hover:border-[#059669] text-left transition-all cursor-pointer shadow-sm hover:shadow-pitch-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold shadow-2xs group-hover:bg-[#059669] group-hover:text-white transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                LOCK
              </span>
            </div>
            <div className="mt-3.5">
              <h4 className="font-bold text-sm text-[#0F172A] tracking-tight group-hover:text-[#059669] transition-colors">
                Block Pitch
              </h4>
              <p className="text-xs text-[#475569] mt-0.5 font-normal">
                Maintenance
              </p>
            </div>
          </button>

          {/* Action 6: Add Player */}
          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="group p-4 rounded-2xl bg-white hover:bg-[#ECFDF5] border border-slate-200 hover:border-[#059669] text-left transition-all cursor-pointer shadow-sm hover:shadow-pitch-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold shadow-2xs group-hover:bg-[#059669] group-hover:text-white transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                CRM
              </span>
            </div>
            <div className="mt-3.5">
              <h4 className="font-bold text-sm text-[#0F172A] tracking-tight group-hover:text-[#059669] transition-colors">
                Add Player
              </h4>
              <p className="text-xs text-[#475569] mt-0.5 font-normal">
                Registration
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Real-Time Pitch Status Board ("Happening Right Now") */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <h2 className="text-lg font-bold text-[#0F172A] tracking-[-0.02em]">
              Happening Right Now on Pitches
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/operations")}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Operations Desk
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : dailyOps?.pitches && dailyOps.pitches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dailyOps.pitches.map((p: any) => {
              const isOccupied = p.is_occupied;
              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isOccupied
                      ? "bg-[#F0FDF4] border-emerald-200 shadow-sm"
                      : "bg-[#F8FAFC] border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-[#0F172A] tracking-tight">
                        {p.name}
                      </h3>
                      <span className="text-xs text-[#475569]">
                        {p.turf_type || "FIFA Standard AstroTurf"}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isOccupied
                          ? "bg-[#10B981] text-white shadow-2xs"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isOccupied ? "● IN PLAY" : "○ OPEN"}
                    </span>
                  </div>

                  {isOccupied && p.current_match ? (
                    <div className="mt-3.5 pt-3 border-t border-emerald-200/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#475569] font-medium">Player / Team:</span>
                        <span className="font-bold text-[#0F172A]">
                          {p.current_match.customer_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-[#475569] font-sans font-medium">Window:</span>
                        <span className="font-bold text-[#059669] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#059669]" />
                          {p.current_match.time_window}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-bold"
                          onClick={() => openBookingDrawer(p.current_match)}
                        >
                          Inspect Match
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3.5 pt-3 border-t border-slate-200 text-xs flex items-center justify-between">
                      <span className="text-[#475569] font-medium">Available for booking</span>
                      <button
                        type="button"
                        onClick={() => setIsNewBookingOpen(true)}
                        className="text-xs font-bold text-[#059669] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Book Walk-in</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "The Champions Arena", spec: "7v7 • FIFA AstroTurf • Floodlit" },
              { name: "Legends Box Cricket", spec: "Box Cricket • Enclosed Netting" },
              { name: "Strikers Dome", spec: "5v5 • Premium Synthetic Pitch" },
            ].map((pitch, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#0F172A] tracking-tight">
                      {pitch.name}
                    </h3>
                    <span className="text-xs text-[#475569]">{pitch.spec}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                    ○ OPEN
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-[#475569] font-medium">Ready for play</span>
                  <button
                    type="button"
                    onClick={() => setIsNewBookingOpen(true)}
                    className="text-xs font-bold text-[#059669] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Book Walk-in</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. High-Impact Performance Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] block">
            Settled Revenue
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono tracking-tight">
            ₹{Number(kpis.today_revenue).toLocaleString("en-IN")}
          </p>
          <div className="text-xs text-[#059669] font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Today's collected total</span>
          </div>
        </div>

        {/* Metric 2: Today's Matches */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] block">
            Total Matches
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {kpis.today_bookings}
          </p>
          <p className="text-xs text-[#475569] font-medium">
            {kpis.upcoming_bookings} remaining today
          </p>
        </div>

        {/* Metric 3: Pitch Occupancy Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] block">
            Pitch Occupancy
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#059669] tracking-tight">
            {kpis.occupancy_rate}%
          </p>
          <p className="text-xs text-[#475569] font-medium">
            {kpis.available_slots} open slots remaining
          </p>
        </div>

        {/* Metric 4: Active Registered Players */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] block">
            Active Players
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {kpis.active_customers}
          </p>
          <p className="text-xs text-[#475569] font-medium">
            {Number(kpis.average_rating || 5.0).toFixed(1)} ★ review rating
          </p>
        </div>
      </div>

      {/* 5. Smart Exception Banner */}
      {hasExceptions ? (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-bold text-sm text-amber-950">
                Action Required ({Number(kpis.pending_payments || 0) + Number(kpis.cancellations || 0)} Items)
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-700">Exception Desk</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(kpis.pending_payments || 0) > 0 && (
              <div
                onClick={() => setIsOfflinePaymentOpen(true)}
                className="p-3.5 rounded-xl bg-white border border-amber-200 hover:border-amber-300 transition cursor-pointer flex items-center justify-between shadow-2xs"
              >
                <div>
                  <p className="font-bold text-[#0F172A] text-sm">
                    {kpis.pending_payments} Pending Cash/UPI Payment
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5 font-medium">
                    Click to record settlement & issue receipt
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-700" />
              </div>
            )}

            {(kpis.cancellations || 0) > 0 && (
              <div
                onClick={() => navigate("/admin/refunds")}
                className="p-3.5 rounded-xl bg-white border border-rose-200 hover:border-rose-300 transition cursor-pointer flex items-center justify-between shadow-2xs"
              >
                <div>
                  <p className="font-bold text-[#0F172A] text-sm">
                    {kpis.cancellations} Cancellation Request
                  </p>
                  <p className="text-xs text-rose-800 mt-0.5 font-medium">
                    Review refund eligibility & ledger entry
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-rose-700" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-[#059669] font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>All operations nominal — 0 pending exceptions in queue</span>
          </div>
          <span className="text-xs text-[#059669] font-medium hidden sm:inline">
            Turnstiles & admissions synchronized
          </span>
        </div>
      )}

      {/* Action Modals */}
      <NewBookingWizardModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        onBookingCreated={fetchDashboardData}
      />

      <RecordOfflinePaymentModal
        isOpen={isOfflinePaymentOpen}
        onClose={() => setIsOfflinePaymentOpen(false)}
        onPaymentSuccess={fetchDashboardData}
      />

      <QuickPriceChangeModal
        isOpen={isPriceChangeOpen}
        onClose={() => setIsPriceChangeOpen(false)}
        onPriceUpdated={fetchDashboardData}
      />

      <QuickBlockSlotModal
        isOpen={isBlockSlotOpen}
        onClose={() => setIsBlockSlotOpen(false)}
        onSlotBlocked={fetchDashboardData}
      />

      <QuickCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />

      {/* Universal Contextual Booking Drawer */}
      <ContextualBookingDrawer
        booking={selectedBooking}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedBooking(null);
        }}
        onBookingUpdated={fetchDashboardData}
        onRecordPaymentClick={(id) => {
          setIsDrawerOpen(false);
          setIsOfflinePaymentOpen(true);
        }}
      />
    </div>
  );
};
