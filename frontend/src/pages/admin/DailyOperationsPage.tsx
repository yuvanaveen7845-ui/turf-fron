import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Search,
  Lock,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  QrCode,
  Calendar,
  UserX,
  Wrench,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  X,
  ExternalLink,
  Info,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

type TabType = "ALL" | "CRITICAL" | "ATTENTION" | "UPCOMING" | "TODAY";

export const DailyOperationsPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Contextual Drill-Down Drawer
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Day Close Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [submittingClose, setSubmittingClose] = useState(false);
  const [closeSummary, setCloseSummary] = useState<any>(null);

  const fetchOperations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/reports/operations/overview/");
      setData(res.data);
      setLastRefreshed(new Date());
      setSecondsAgo(0);
    } catch (err) {
      console.error("Failed to load operations control center data:", err);
      if (!silent) {
        toast.error("Failed to load operations data. Check backend connectivity.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOperations(false);
  }, [fetchOperations]);

  // Stale time tracker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((new Date().getTime() - lastRefreshed.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefreshed]);

  // Auto-refresh interval (25 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOperations(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOperations]);

  // Action: Release expired holds
  const handleReleaseHold = async (slotId?: number) => {
    setActionLoading(true);
    try {
      const res = await api.post("/reports/operations/release-hold/", { slot_id: slotId });
      toast.success(res.data.message || "Expired hold released successfully.");
      setSelectedIssue(null);
      fetchOperations(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to release hold.");
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Mark booking as No-Show
  const handleMarkNoShow = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const res = await api.post("/reports/operations/mark-no-show/", { booking_id: bookingId });
      toast.success(res.data.message || `Booking ${bookingId} marked as NO-SHOW.`);
      setSelectedIssue(null);
      fetchOperations(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to mark no-show.");
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Resolve Anomaly / Reconcile
  const handleResolveAnomaly = async (anomalyId: string) => {
    setActionLoading(true);
    try {
      const res = await api.post("/payments/reconciliation/resolve/", {
        anomaly_id: anomalyId,
        resolution_notes: "Resolved via Operations Control Center",
      });
      toast.success(res.data.message || "Payment anomaly resolved.");
      setSelectedIssue(null);
      fetchOperations(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to resolve anomaly.");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Day Close
  const handleDayClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClose(true);
    try {
      const res = await api.post("/reports/daily-close/", {
        counted_cash: countedCash ? Number(countedCash) : undefined,
        notes: closeNotes,
      });
      setCloseSummary(res.data.summary);
      setIsCloseModalOpen(false);
      toast.success("Day close executed & audited successfully.");
      fetchOperations(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to execute day close.");
    } finally {
      setSubmittingClose(false);
    }
  };

  // Filtered dataset calculations
  const filteredCritical = useMemo(() => {
    if (!data?.critical) return { mismatches: [], refunds: [], jobs: [], conflicts: [] };
    const q = searchQuery.toLowerCase();
    return {
      mismatches: (data.critical.payment_mismatches || []).filter((m: any) =>
        !q || m.booking_id?.toLowerCase().includes(q) || m.customer_name?.toLowerCase().includes(q) || m.title?.toLowerCase().includes(q)
      ),
      refunds: (data.critical.failed_refunds || []).filter((r: any) =>
        !q || r.refund_id?.toLowerCase().includes(q) || r.booking_id?.toLowerCase().includes(q) || r.customer_name?.toLowerCase().includes(q)
      ),
      jobs: (data.critical.failed_jobs || []).filter((j: any) =>
        !q || j.action?.toLowerCase().includes(q) || j.resource_id?.toLowerCase().includes(q)
      ),
      conflicts: (data.critical.booking_conflicts || []).filter((c: any) =>
        !q || c.booking_id?.toLowerCase().includes(q) || c.turf_name?.toLowerCase().includes(q)
      ),
    };
  }, [data, searchQuery]);

  const filteredAttention = useMemo(() => {
    if (!data?.attention) return { holds: [], partials: [], recon: [], checkins: [] };
    const q = searchQuery.toLowerCase();
    return {
      holds: (data.attention.expired_holds || []).filter((h: any) =>
        !q || h.turf_name?.toLowerCase().includes(q) || h.locked_by?.toLowerCase().includes(q)
      ),
      partials: (data.attention.pending_payments || []).filter((p: any) =>
        !q || p.booking_id?.toLowerCase().includes(q) || p.customer_name?.toLowerCase().includes(q) || p.turf_name?.toLowerCase().includes(q)
      ),
      recon: (data.attention.reconciliation_items || []).filter((r: any) =>
        !q || r.payment_id?.toLowerCase().includes(q) || r.booking_id?.toLowerCase().includes(q)
      ),
      checkins: (data.attention.failed_checkins || []).filter((c: any) =>
        !q || c.booking_id?.toLowerCase().includes(q) || c.customer_name?.toLowerCase().includes(q) || c.turf_name?.toLowerCase().includes(q)
      ),
    };
  }, [data, searchQuery]);

  const filteredUpcoming = useMemo(() => {
    if (!data?.upcoming) return { maintenance: [], noShows: [] };
    const q = searchQuery.toLowerCase();
    return {
      maintenance: (data.upcoming.maintenance || []).filter((m: any) =>
        !q || m.turf_name?.toLowerCase().includes(q) || m.reason?.toLowerCase().includes(q)
      ),
      noShows: (data.upcoming.no_shows || []).filter((n: any) =>
        !q || n.booking_id?.toLowerCase().includes(q) || n.customer_name?.toLowerCase().includes(q)
      ),
    };
  }, [data, searchQuery]);

  const summary = data?.summary || {
    critical_count: 0,
    attention_count: 0,
    upcoming_count: 0,
    today_revenue_net: 0,
    active_pitches_now: 0,
    total_pitches: 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* 1. Header with Live Status & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Operations Control Center</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-semibold">{data?.meta?.date_formatted || "Today"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mt-0.5">
            Command & Exception Monitor
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#047857] border border-emerald-200 font-mono">
              LIVE {data?.meta?.server_time || ""}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time exception triage: Payment mismatches, refund failures, turnstile gate alerts, and pitch occupancy.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Stale data pill */}
          <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${secondsAgo > 45 ? "bg-amber-500 animate-ping" : "bg-[#10B981]"}`} />
            <span>{secondsAgo === 0 ? "Just updated" : `Updated ${secondsAgo}s ago`}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOperations(false)}
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-[#059669] ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? "bg-[#ECFDF5] text-[#059669] border-emerald-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoRefresh ? "text-[#059669]" : "text-slate-400"}`} />
            <span>Auto-refresh: {autoRefresh ? "ON (25s)" : "OFF"}</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCloseModalOpen(true)}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
          >
            Day Close
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Health Summary Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Critical Card */}
        <button
          onClick={() => setActiveTab("CRITICAL")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "CRITICAL"
              ? "bg-rose-50 border-rose-400 ring-2 ring-rose-200 shadow-sm"
              : summary.critical_count > 0
              ? "bg-white border-rose-200 hover:border-rose-300 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              🔴 Critical
            </span>
            {summary.critical_count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                ACTION REQUIRED
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-900 mt-2">{summary.critical_count}</p>
          <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">
            {summary.critical_count === 0 ? "All critical systems healthy" : "Mismatches & conflicts"}
          </span>
        </button>

        {/* Attention Card */}
        <button
          onClick={() => setActiveTab("ATTENTION")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "ATTENTION"
              ? "bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-sm"
              : summary.attention_count > 0
              ? "bg-white border-amber-200 hover:border-amber-300 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              🟠 Attention
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">{summary.attention_count}</p>
          <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">
            {summary.attention_count === 0 ? "No pending investigations" : "Holds, balances, scans"}
          </span>
        </button>

        {/* Upcoming Card */}
        <button
          onClick={() => setActiveTab("UPCOMING")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "UPCOMING"
              ? "bg-yellow-50 border-yellow-400 ring-2 ring-yellow-200 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-yellow-600" />
              🟡 Upcoming
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{summary.upcoming_count}</p>
          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
            Maintenance & no-shows
          </span>
        </button>

        {/* Today's Net Revenue */}
        <button
          onClick={() => setActiveTab("TODAY")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "TODAY"
              ? "bg-[#ECFDF5] border-emerald-400 ring-2 ring-emerald-200 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
              🟢 Net Revenue
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#059669] mt-2">
            ₹{Number(summary.today_revenue_net || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
            ₹{Number(summary.today_gross_revenue || 0).toLocaleString()} Gross collected
          </span>
        </button>

        {/* Live Occupancy */}
        <button
          onClick={() => setActiveTab("TODAY")}
          className="col-span-2 sm:col-span-4 lg:col-span-1 p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Live Occupancy
            </span>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {summary.active_pitches_now} / {summary.total_pitches}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
            {summary.occupancy_rate}% Day slots booked
          </span>
        </button>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(["ALL", "CRITICAL", "ATTENTION", "UPCOMING", "TODAY"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#059669] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab === "ALL" && "All Feeds"}
              {tab === "CRITICAL" && `🔴 Critical (${summary.critical_count})`}
              {tab === "ATTENTION" && `🟠 Attention (${summary.attention_count})`}
              {tab === "UPCOMING" && `🟡 Upcoming (${summary.upcoming_count})`}
              {tab === "TODAY" && "🟢 Today / Health"}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking, customer, payment ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#059669] focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. "Happening Now" Arena Live Strip */}
      {data?.today?.happening_now && (
        <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Happening Now</span>
              <span className="text-slate-500 text-xs">• Live Pitch Activity</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {summary.active_pitches_now} Pitches Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.today.happening_now.map((item: any) => (
              <div
                key={item.turf_id}
                className={`p-3 rounded-2xl border transition-all ${
                  item.state === "IN_USE"
                    ? "bg-slate-800/90 border-emerald-500/50"
                    : "bg-slate-800/40 border-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-slate-100">{item.name}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.state === "IN_USE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {item.state === "IN_USE" ? "In Match" : "Available"}
                  </span>
                </div>

                {item.current_match ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white truncate">{item.current_match.customer}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{item.current_match.time}</span>
                      <span className="text-emerald-400 font-bold">{item.minutes_remaining} min left</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-1">Ready for next kick-off</p>
                )}

                {item.next_match && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-slate-400 flex justify-between">
                    <span>Next: {item.next_match.customer}</span>
                    <span className="text-yellow-400 font-semibold">{item.next_match.time}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. 🔴 CRITICAL SECTION */}
      {(activeTab === "ALL" || activeTab === "CRITICAL") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Critical Exceptions ({summary.critical_count})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Immediate staff resolution required</span>
          </div>

          {summary.critical_count === 0 ? (
            <div className="p-6 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-center space-y-1.5">
              <div className="inline-flex p-2.5 rounded-full bg-emerald-100 text-[#059669]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">✓ All Critical Systems Operational</h3>
              <p className="text-xs text-slate-600">
                No payment mismatches, failed refunds, background job failures, or booking conflicts detected.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Mismatches */}
              {filteredCritical.mismatches.map((m: any) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 shadow-sm space-y-3 cursor-pointer transition-all"
                  onClick={() => setSelectedIssue({ ...m, category: "MISMATCH" })}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                      <AlertOctagon className="w-3 h-3" />
                      <span>Payment Mismatch</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{m.booking_id}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{m.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{m.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-extrabold text-rose-700">₹{m.amount}</span>
                    <Button size="sm" variant="outline" className="text-xs py-1 h-7">
                      Investigate <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Failed Refunds */}
              {filteredCritical.refunds.map((r: any) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 shadow-sm space-y-3 cursor-pointer transition-all"
                  onClick={() => setSelectedIssue({ ...r, category: "REFUND_ERROR" })}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                      <CreditCard className="w-3 h-3" />
                      <span>Failed Refund</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{r.refund_id}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      ₹{r.amount} refund for {r.customer_name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">Reason: {r.reason}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-mono">Booking: {r.booking_id}</span>
                    <Button size="sm" variant="outline" className="text-xs py-1 h-7">
                      Review <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Booking Conflicts */}
              {filteredCritical.conflicts.map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 shadow-sm space-y-3 cursor-pointer transition-all"
                  onClick={() => setSelectedIssue({ ...c, category: "CONFLICT" })}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                      <Layers className="w-3 h-3" />
                      <span>Slot Conflict</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{c.booking_id}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{c.turf_name} ({c.time})</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{c.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-rose-600 font-bold">{c.conflict_type}</span>
                    <Button size="sm" variant="outline" className="text-xs py-1 h-7">
                      Resolve <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Failed Background Jobs */}
              {filteredCritical.jobs.map((j: any) => (
                <div
                  key={j.id}
                  className="p-4 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 shadow-sm space-y-3 cursor-pointer transition-all"
                  onClick={() => setSelectedIssue({ ...j, category: "JOB_ERROR" })}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      <Activity className="w-3 h-3" />
                      <span>Audit Alert</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{j.resource_type}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{j.action}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">{JSON.stringify(j.details)}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">{j.actor}</span>
                    <Button size="sm" variant="outline" className="text-xs py-1 h-7">
                      Inspect <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. 🟠 ATTENTION SECTION */}
      {(activeTab === "ALL" || activeTab === "ATTENTION") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Attention Required ({summary.attention_count})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Expired holds, balance due, gate scan alerts</span>
          </div>

          {summary.attention_count === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
              <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-900">✓ No Items Requiring Attention</h3>
              <p className="text-xs text-slate-500">
                All temporary holds are active or released, turnstiles functioning normally, balances collected.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Expired Slot Holds */}
              {filteredAttention.holds.map((h: any) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 shadow-sm space-y-3 cursor-pointer transition-all"
                  onClick={() => setSelectedIssue({ ...h, category: "EXPIRED_HOLD" })}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Expired Slot Hold
                    </span>
                    <span className="text-xs font-mono text-slate-500">{h.start_time} - {h.end_time}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{h.turf_name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">Held by: {h.locked_by}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-semibold">₹{h.price}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs py-1 h-7 text-amber-800 border-amber-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReleaseHold(h.slot_id);
                      }}
                    >
                      Release Lock
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pending Partial Balances */}
              {filteredAttention.partials.map((p: any) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 shadow-sm space-y-3 cursor-pointer transition-all"
                  onClick={() => setSelectedIssue({ ...p, category: "PARTIAL_BALANCE" })}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      Balance Due Today
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{p.booking_id}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{p.customer_name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{p.turf_name} ({p.match_time})</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Balance Due</span>
                      <span className="font-extrabold text-amber-600">₹{p.balance_due}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs py-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/admin/payments");
                      }}
                    >
                      Collect Balance
                    </Button>
                  </div>
                </div>
              ))}

              {/* Failed QR / Gate Check-ins */}
              {filteredAttention.checkins.map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm space-y-3 cursor-pointer transition-all"
                  onClick={() => setSelectedIssue({ ...c, category: "CHECKIN_DENIED" })}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      <span>Gate Scan Denied</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{c.check_in_time}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{c.customer_name}</h3>
                    <p className="text-xs text-rose-600 font-semibold mt-0.5">{c.message}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">{c.turf_name}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{c.reason_code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. 🟡 UPCOMING SECTION */}
      {(activeTab === "ALL" || activeTab === "UPCOMING") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Upcoming Notices & Attendance ({summary.upcoming_count})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Pitch maintenance, elapsed no-shows</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Maintenance */}
            {filteredUpcoming.maintenance.map((m: any) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    <span>Pitch Maintenance</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{m.date} ({m.start_time} - {m.end_time})</span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">{m.turf_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Reason: {m.reason}</p>
                </div>
                {m.conflicts_count > 0 ? (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Conflicts with {m.conflicts_count} confirmed booking(s)!</span>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>No booking schedule conflicts</span>
                  </div>
                )}
              </div>
            ))}

            {/* No Shows */}
            {filteredUpcoming.noShows.map((n: any) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <UserX className="w-3 h-3" />
                    <span>Unattended Match</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{n.booking_id}</span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">{n.customer_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{n.turf_name} • Kickoff passed: {n.time}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Paid: ₹{n.amount_paid}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs py-1 h-7 text-rose-600 border-rose-200"
                    onClick={() => handleMarkNoShow(n.booking_id)}
                  >
                    Mark No-Show
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. 🟢 TODAY'S REVENUE, BOOKINGS & OCCUPANCY HEALTH */}
      {(activeTab === "ALL" || activeTab === "TODAY") && data?.today && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Today's Financial & Booking Health
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Authoritative ledger & drawer breakdown</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue Drawer */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Financial Breakdown</span>
                <DollarSign className="w-4 h-4 text-[#059669]" />
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Online (Razorpay Gateway):</span>
                  <span className="font-bold text-slate-900">₹{data.today.financial_drawer.online_revenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cash in Drawer (Walk-ins):</span>
                  <span className="font-bold text-amber-700">₹{data.today.financial_drawer.cash_revenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Turf Wallet Credits:</span>
                  <span className="font-bold text-blue-700">₹{data.today.financial_drawer.wallet_revenue}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span className="font-medium">Total Processed Refunds:</span>
                  <span className="font-bold">-₹{data.today.financial_drawer.refunds_total}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
                  <span className="font-black text-slate-900">Net Revenue Collected:</span>
                  <span className="font-black text-[#059669]">₹{data.today.financial_drawer.net_revenue}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Outstanding Balance Due:</span>
                  <span className="font-bold text-amber-600">₹{data.today.financial_drawer.outstanding_balance}</span>
                </div>
              </div>
            </div>

            {/* Bookings Status */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Bookings Trajectory</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Today</span>
                  <span className="text-xl font-black text-slate-900">{data.today.bookings.total}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Confirmed</span>
                  <span className="text-xl font-black text-[#059669]">{data.today.bookings.confirmed}</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Completed</span>
                  <span className="text-xl font-black text-blue-600">{data.today.bookings.completed}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Walk-ins</span>
                  <span className="text-xl font-black text-amber-600">{data.today.bookings.walk_ins}</span>
                </div>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Pitch Occupancy</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1 text-slate-600 font-bold">
                    <span>Day Slot Utilization</span>
                    <span className="text-[#059669] font-black">{data.today.occupancy_stats.occupancy_rate}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#059669] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, data.today.occupancy_stats.occupancy_rate)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-bold">Booked Slots</span>
                    <span className="font-bold text-slate-900">{data.today.occupancy_stats.slots_booked_today} slots</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-bold">Total Capacity</span>
                    <span className="font-bold text-slate-900">{data.today.occupancy_stats.total_slots_today} slots</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Contextual Drill-Down Modal/Drawer */}
      {selectedIssue && (
        <Modal
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          title={`Operational Inspection: ${selectedIssue.category || "Issue"}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase text-[10px] text-slate-400">Entity Details</span>
                <span className="font-mono font-bold text-slate-700">{selectedIssue.booking_id || selectedIssue.id}</span>
              </div>
              <p className="text-sm font-black text-slate-900">{selectedIssue.title || selectedIssue.turf_name || selectedIssue.customer_name}</p>
              <p className="text-slate-600">{selectedIssue.description || selectedIssue.reason || selectedIssue.message}</p>
            </div>

            {/* Financial Details if available */}
            {selectedIssue.amount !== undefined && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">Amount Involved</span>
                  <span className="text-base font-black text-slate-900">₹{selectedIssue.amount}</span>
                </div>
                {selectedIssue.balance_due !== undefined && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Balance Due</span>
                    <span className="text-base font-black text-amber-600">₹{selectedIssue.balance_due}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setSelectedIssue(null)}>
                Close
              </Button>

              {selectedIssue.category === "EXPIRED_HOLD" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={actionLoading}
                  onClick={() => handleReleaseHold(selectedIssue.slot_id)}
                >
                  Release Slot Hold
                </Button>
              )}

              {selectedIssue.category === "MISMATCH" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={actionLoading}
                  onClick={() => handleResolveAnomaly(selectedIssue.id)}
                >
                  Reconcile Payment
                </Button>
              )}

              {selectedIssue.category === "PARTIAL_BALANCE" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedIssue(null);
                    navigate("/admin/payments");
                  }}
                >
                  Collect Offline / View Ledger
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 10. Day Close Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Execute End-of-Day Close"
      >
        <form onSubmit={handleDayClose} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Performing Day Close creates an immutable operational snapshot of today's completed matches, audits physical cash in the drawer, and logs closing notes in the audit pipeline.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Physical Cash Counted in Drawer (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="e.g. 4800 (Leave empty to match system total)"
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#059669]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Shift / Admin Closing Notes
            </label>
            <textarea
              rows={3}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="e.g. All pitches inspected, floodlights secured, net repairs needed on Turf B..."
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#059669]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCloseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submittingClose}
            >
              Confirm & Lock Day Close
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
