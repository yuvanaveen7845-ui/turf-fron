import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  DollarSign,
  PlusCircle,
  Eye,
  FileText,
  Download,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  X,
  Wallet,
  Building2,
  Check,
  AlertTriangle,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { ReceiptModal } from "../../components/payment/ReceiptModal";

export const ManagePaymentsPage: React.FC = () => {
  const { user } = useAuth();

  // Primary Data
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all'
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Drawer & Modals
  const [selectedPaymentForDrawer, setSelectedPaymentForDrawer] = useState<any | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Fast Record Offline Payment Modal (< 10 seconds)
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectBookingSearch, setCollectBookingSearch] = useState("");
  const [foundBookings, setFoundBookings] = useState<any[]>([]);
  const [selectedBookingForCollect, setSelectedBookingForCollect] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectRef, setCollectRef] = useState("");
  const [collectNotes, setCollectNotes] = useState("");
  const [collectLoading, setCollectLoading] = useState(false);

  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState<any | null>(null);
  const [refundChoice, setRefundChoice] = useState<"FULL" | "50" | "CUSTOM">("FULL");
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [refundTo, setRefundTo] = useState("ORIGINAL");
  const [refundReason, setRefundReason] = useState("Customer cancellation");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundStep, setRefundStep] = useState<"SELECT" | "REVIEW">("SELECT");

  // Daily Cash Drawer Modal
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [cashDrawerData, setCashDrawerData] = useState<any | null>(null);
  const [closingCashCount, setClosingCashCount] = useState("");
  const [drawerNotes, setDrawerNotes] = useState("");
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Reconciliation Anomaly Modal
  const [isReconOpen, setIsReconOpen] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [reconLoading, setReconLoading] = useState(false);

  // Receipt Modal
  const [receiptIdentifier, setReceiptIdentifier] = useState<string | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (dateFilter && dateFilter !== "all") params.append("date_filter", dateFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (methodFilter) params.append("payment_method", methodFilter);
      if (originFilter) params.append("origin", originFilter);

      const [paymentsRes, statsRes] = await Promise.all([
        api.get(`/payments/?${params.toString()}`),
        api.get("/payments/stats/"),
      ]);

      setPayments(paymentsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch payments data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, statusFilter, methodFilter, originFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Booking Search for Offline Collect
  useEffect(() => {
    if (!collectBookingSearch || collectBookingSearch.trim().length < 2) {
      setFoundBookings([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/bookings/?search=${encodeURIComponent(collectBookingSearch.trim())}`);
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
        setFoundBookings(list.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [collectBookingSearch]);

  // Fast Record Offline Payment
  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCollect || !collectAmount) return;

    setCollectLoading(true);
    try {
      const res = await api.post("/payments/manual-collect/", {
        booking_id: selectedBookingForCollect.booking_id,
        amount: collectAmount,
        payment_method: collectMethod,
        transaction_reference: collectRef,
        notes: collectNotes,
      });

      setFeedback({
        type: "success",
        text: `Recorded offline payment of ₹${collectAmount} (${collectMethod}) for booking ${selectedBookingForCollect.booking_id}!`,
      });

      setIsCollectModalOpen(false);
      setSelectedBookingForCollect(null);
      setCollectBookingSearch("");
      setCollectAmount("");
      setCollectRef("");
      setCollectNotes("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setCollectLoading(false);
    }
  };

  // Open Refund Modal for Payment
  const handleStartRefund = (payment: any) => {
    setRefundPayment(payment);
    setRefundChoice("FULL");
    setCustomRefundAmount("");
    setRefundTo(payment.provider === "RAZORPAY" ? "ORIGINAL" : "CASH");
    setRefundReason("Customer requested cancellation");
    setRefundStep("SELECT");
    setIsRefundModalOpen(true);
  };

  // Submit Refund
  const handleConfirmRefund = async () => {
    if (!refundPayment) return;

    let amtToRefund = Number(refundPayment.amount);
    if (refundChoice === "50") {
      amtToRefund = Math.round(Number(refundPayment.amount) * 0.5);
    } else if (refundChoice === "CUSTOM") {
      amtToRefund = parseFloat(customRefundAmount);
    }

    if (!amtToRefund || amtToRefund <= 0) {
      alert("Please enter a valid refund amount.");
      return;
    }

    setRefundLoading(true);
    try {
      await api.post(`/payments/${refundPayment.id}/refund/`, {
        amount: amtToRefund,
        refund_to: refundTo,
        reason: refundReason,
      });

      setFeedback({
        type: "success",
        text: `Successfully initiated refund of ₹${amtToRefund} via ${refundTo}.`,
      });

      setIsRefundModalOpen(false);
      setRefundPayment(null);
      if (selectedPaymentForDrawer?.id === refundPayment.id) {
        setSelectedPaymentForDrawer(null);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process refund.");
    } finally {
      setRefundLoading(false);
    }
  };

  // Open Daily Cash Drawer Modal
  const handleOpenCashDrawer = async () => {
    setIsCashDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await api.get("/payments/daily-cash/");
      setCashDrawerData(res.data);
      setClosingCashCount(res.data.actual_closing_cash ? String(res.data.actual_closing_cash) : "");
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseCashDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingCashCount) return;

    setDrawerLoading(true);
    try {
      const res = await api.post("/payments/daily-cash/", {
        action: "CLOSE_DRAWER",
        actual_closing_cash: closingCashCount,
        notes: drawerNotes,
      });
      setCashDrawerData(res.data);
      setFeedback({
        type: "success",
        text: `Daily cash drawer count recorded (Variance: ₹${res.data.variance || 0}).`,
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to close cash drawer.");
    } finally {
      setDrawerLoading(false);
    }
  };

  // Open Reconciliation Anomalies
  const handleOpenReconciliation = async () => {
    setIsReconOpen(true);
    setReconLoading(true);
    try {
      const res = await api.get("/payments/reconciliation/");
      setAnomalies(res.data.anomalies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setReconLoading(false);
    }
  };

  const handleResolveAnomaly = async (anomaly: any) => {
    setReconLoading(true);
    try {
      const res = await api.post("/payments/reconciliation/resolve/", {
        anomaly_type: anomaly.type,
        payment_id: anomaly.payment_id,
        booking_id: anomaly.booking_id,
      });

      setFeedback({
        type: "success",
        text: res.data.message || "Anomaly resolved successfully.",
      });

      // Refresh reconciliation
      const reconRes = await api.get("/payments/reconciliation/");
      setAnomalies(reconRes.data.anomalies || []);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to resolve anomaly.");
    } finally {
      setReconLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open(`${api.defaults.baseURL || "/api"}/payments/export/`, "_blank");
  };

  const todayStats = stats?.today || {
    revenue: 0,
    payments_count: 0,
    pending_count: 0,
    refunds_amount: 0,
    offline_amount: 0,
    online_amount: 0,
  };

  const needsAttention = stats?.needs_attention || {
    pending_payments: 0,
    refunds_pending: 0,
    reconciliation_issues: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Primary Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Financial Operations & Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Payments & Cash Flow
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time digital gateway settlements, counter cash drawers, and one-click refund operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 text-[#059669] ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCashDrawer}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Daily Cash Drawer</span>
          </button>

          <button
            onClick={() => {
              setSelectedBookingForCollect(null);
              setCollectBookingSearch("");
              setCollectAmount("");
              setIsCollectModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-emerald-glow transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-[#ECFDF5] border-emerald-200 text-[#059669]"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Metric Tiles: "What is happening with money today?" (Requirement #19) */}
      <div className="space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          What is happening with money today?
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Revenue Today */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Revenue Today
            </span>
            <p className="text-2xl font-black text-[#059669] font-mono">
              ₹{Number(todayStats.revenue).toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold block truncate">
              {todayStats.payments_count} transactions
            </span>
          </div>

          {/* Payments Count */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Payments
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {todayStats.payments_count}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold block">
              Completed today
            </span>
          </div>

          {/* Pending */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Pending
            </span>
            <p className="text-2xl font-black text-amber-600 font-mono">
              {todayStats.pending_count}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold block">
              Awaiting checkout
            </span>
          </div>

          {/* Refunds */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Refunds
            </span>
            <p className="text-2xl font-black text-purple-700 font-mono">
              ₹{Number(todayStats.refunds_amount).toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold block">
              {todayStats.refunds_count || 0} processed
            </span>
          </div>

          {/* Offline (Desk) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Offline (Desk)
            </span>
            <p className="text-2xl font-black text-amber-700 font-mono">
              ₹{Number(todayStats.offline_amount).toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold block">
              Cash / Spot UPI
            </span>
          </div>

          {/* Online (Razorpay) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Online (Razorpay)
            </span>
            <p className="text-2xl font-black text-blue-600 font-mono">
              ₹{Number(todayStats.online_amount).toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold block">
              Gateway captured
            </span>
          </div>
        </div>
      </div>

      {/* 3. "Needs Attention" Section (Requirement #19 & #35) */}
      {(needsAttention.pending_payments > 0 ||
        needsAttention.refunds_pending > 0 ||
        needsAttention.reconciliation_issues > 0) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="text-sm font-black text-amber-900">Needs Attention</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {needsAttention.pending_payments > 0 && (
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-slate-900">
                    {needsAttention.pending_payments} pending payment{needsAttention.pending_payments > 1 ? "s" : ""}
                  </p>
                  <p className="text-[11px] text-slate-500">Hold active or awaiting capture</p>
                </div>
                <button
                  onClick={() => setStatusFilter("PENDING")}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  Filter
                </button>
              </div>
            )}

            {needsAttention.refunds_pending > 0 && (
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-slate-900">
                    {needsAttention.refunds_pending} refund pending
                  </p>
                  <p className="text-[11px] text-slate-500">Awaiting admin approval</p>
                </div>
                <button
                  onClick={() => setStatusFilter("REFUNDED")}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  Review
                </button>
              </div>
            )}

            {needsAttention.reconciliation_issues > 0 && (
              <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-rose-900">
                    {needsAttention.reconciliation_issues} payment requiring reconciliation
                  </p>
                  <p className="text-[11px] text-slate-500">Accounting / provider mismatch</p>
                </div>
                <button
                  onClick={handleOpenReconciliation}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shadow-sm cursor-pointer"
                >
                  Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Bar (#36, #37) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Global Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by customer name, phone, booking ID (FT-26-XXXXX), payment ID, or Razorpay ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_week", label: "This Week" },
              { id: "this_month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  dateFilter === d.id
                    ? "bg-[#059669] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d.label}
              </button>
            ))}

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>More Filters</span>
              {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#059669]"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid / Settled</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Channel Origin</label>
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#059669]"
              >
                <option value="">All Channels</option>
                <option value="ONLINE">Online (Razorpay)</option>
                <option value="OFFLINE">Offline (Counter Desk)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#059669]"
              >
                <option value="">All Payment Methods</option>
                <option value="UPI">UPI / QR</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash on Counter</option>
                <option value="WALLET">Turf Wallet</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            {(statusFilter || methodFilter || originFilter) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setMethodFilter("");
                  setOriginFilter("");
                }}
                className="text-xs font-bold text-rose-600 hover:underline pt-4 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. Clean Payments Table (Requirement #20) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-pitch-card">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading transactions ledger...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-900">No payments yet.</p>
            <p className="text-xs text-slate-500">No transactions matched your current search or date filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => {
              const isPaid = p.status === "PAID" || p.status === "SUCCESSFUL";
              const isPending = p.status === "PENDING";
              const isRefunded = p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED";
              const isFailed = p.status === "FAILED";

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPaymentForDrawer(p)}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Customer & Pitch */}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-xs ${
                        isPaid
                          ? "bg-emerald-50 text-[#059669]"
                          : isPending
                          ? "bg-amber-50 text-amber-600"
                          : isRefunded
                          ? "bg-purple-50 text-purple-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {p.payment_method === "CASH" ? "💵" : p.payment_method === "CARD" ? "💳" : "📱"}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-sm">{p.customer_name || "Guest"}</h3>
                        <span className="font-mono text-xs font-bold text-[#059669]">
                          {p.booking_reference || "FT-BOOKING"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {p.turf_name} • {p.match_date} ({p.match_time || "Match"})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(p.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount, Status Dot & Quick Action */}
                  <div className="flex items-center space-x-4 sm:space-x-6 self-end sm:self-center">
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 font-mono">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold">{p.payment_origin}</p>
                    </div>

                    {/* Status Dot */}
                    <div className="w-28 text-left">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPaid
                            ? "text-[#059669] bg-emerald-50 border border-emerald-200"
                            : isPending
                            ? "text-amber-700 bg-amber-50 border border-amber-200"
                            : isRefunded
                            ? "text-purple-700 bg-purple-50 border border-purple-200"
                            : "text-rose-700 bg-rose-50 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPaid
                              ? "bg-[#059669]"
                              : isPending
                              ? "bg-amber-500"
                              : isRefunded
                              ? "bg-purple-600"
                              : "bg-rose-500"
                          }`}
                        />
                        <span>{p.status === "PAID" ? "Paid" : p.status}</span>
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedPaymentForDrawer(p)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setReceiptIdentifier(p.payment_id)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="View Official Receipt"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#059669]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Payment Detail Drawer (Requirement #21 & #54) */}
      {selectedPaymentForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col border-l border-slate-200">
            {/* Drawer Top */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Payment Detail
                </span>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-black text-slate-900 font-mono">
                    ₹{Number(selectedPaymentForDrawer.amount).toLocaleString("en-IN")}
                  </h3>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedPaymentForDrawer.status === "PAID"
                        ? "bg-emerald-50 text-[#059669]"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{selectedPaymentForDrawer.status}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPaymentForDrawer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking & Customer Info */}
            <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Booking ID</span>
                <span className="font-mono font-bold text-[#059669]">
                  {selectedPaymentForDrawer.booking_reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Turf Pitch</span>
                <span className="font-bold text-slate-900">{selectedPaymentForDrawer.turf_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer</span>
                <span className="font-bold text-slate-900">{selectedPaymentForDrawer.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Phone / Email</span>
                <span className="text-slate-700 font-mono">
                  {selectedPaymentForDrawer.customer_phone || selectedPaymentForDrawer.customer_email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Origin</span>
                <span className="font-bold text-slate-900">{selectedPaymentForDrawer.payment_origin}</span>
              </div>

              {/* Balance Tracking (Requirement #24) */}
              <div className="pt-2 border-t border-slate-200/70 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Total</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{Number(selectedPaymentForDrawer.booking_final_amount || selectedPaymentForDrawer.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-emerald-200 text-[#059669]">
                  <span className="text-[10px] uppercase font-bold block">Paid</span>
                  <span className="font-mono font-bold">
                    ₹{Number(selectedPaymentForDrawer.booking_amount_paid || selectedPaymentForDrawer.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-200 text-amber-700">
                  <span className="text-[10px] uppercase font-bold block">Remaining</span>
                  <span className="font-mono font-bold">
                    ₹{Number(selectedPaymentForDrawer.booking_balance_due || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Human-readable Timeline (Requirement #54) */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Payment Timeline
              </span>
              <div className="space-y-3 pl-2 border-l-2 border-slate-200 text-xs text-slate-700">
                <div className="relative pl-4">
                  <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <p className="font-bold text-slate-900">Payment Initiated</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(selectedPaymentForDrawer.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {selectedPaymentForDrawer.paid_at && (
                  <div className="relative pl-4">
                    <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    <p className="font-bold text-slate-900">Payment Verified & Settled</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(selectedPaymentForDrawer.paid_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                <div className="relative pl-4">
                  <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-[#059669]" />
                  <p className="font-bold text-slate-900">Booking Confirmed & QR Pass Issued</p>
                  <p className="text-[11px] text-slate-500">Instant digital check-in access active</p>
                </div>

                <div className="relative pl-4">
                  <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <p className="font-bold text-slate-900">Receipt Generated</p>
                  <p className="text-[11px] text-slate-500">Computer-generated tax invoice available</p>
                </div>
              </div>
            </div>

            {/* Collapsible Technical Details (Requirement #21) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-slate-700 py-2 cursor-pointer"
              >
                <span>Advanced Technical Details</span>
                {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTechnicalDetails && (
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-[11px] font-mono text-slate-700 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment ID:</span>
                    <span>{selectedPaymentForDrawer.payment_id}</span>
                  </div>
                  {selectedPaymentForDrawer.provider_order_id && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Razorpay Order ID:</span>
                      <span>{selectedPaymentForDrawer.provider_order_id}</span>
                    </div>
                  )}
                  {selectedPaymentForDrawer.provider_payment_id && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Razorpay Payment ID:</span>
                      <span>{selectedPaymentForDrawer.provider_payment_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Txn Reference:</span>
                    <span>{selectedPaymentForDrawer.transaction_reference}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 mt-auto border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => setReceiptIdentifier(selectedPaymentForDrawer.payment_id)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#059669]" />
                <span>View Official Receipt</span>
              </button>

              {Number(selectedPaymentForDrawer.booking_balance_due || 0) > 0 && (
                <button
                  onClick={() => {
                    setSelectedBookingForCollect({
                      booking_id: selectedPaymentForDrawer.booking_reference,
                      customer_name: selectedPaymentForDrawer.customer_name,
                      balance_due: selectedPaymentForDrawer.booking_balance_due,
                      turf_details: { name: selectedPaymentForDrawer.turf_name },
                      date: selectedPaymentForDrawer.match_date,
                    });
                    setCollectAmount(String(selectedPaymentForDrawer.booking_balance_due));
                    setIsCollectModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Record Remaining Payment (₹{selectedPaymentForDrawer.booking_balance_due})</span>
                </button>
              )}

              {selectedPaymentForDrawer.status === "PAID" && (
                <button
                  onClick={() => handleStartRefund(selectedPaymentForDrawer)}
                  className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span>Initiate Refund</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Fast Record Offline Payment Modal (< 10 seconds per #22, #62) */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-500">Collect cash, spot UPI, or POS card at the desk</p>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordOfflinePayment} className="space-y-4 text-xs">
              {/* Step 1: Select Booking */}
              {!selectedBookingForCollect ? (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Find Booking</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search booking ID (FT-26-XXXXX) or customer name..."
                      value={collectBookingSearch}
                      onChange={(e) => setCollectBookingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                      autoFocus
                    />
                  </div>

                  {foundBookings.length > 0 && (
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white shadow-lg">
                      {foundBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedBookingForCollect(b);
                            setCollectAmount(String(b.balance_due || b.final_amount || "0"));
                          }}
                          className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              {b.booking_id} • {b.customer_details?.full_name || "Customer"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {b.turf_details?.name} • Due: ₹{Number(b.balance_due || b.final_amount).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[#059669]">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{selectedBookingForCollect.booking_id}</p>
                    <p className="text-[11px] text-slate-600">
                      Amount Due:{" "}
                      <strong className="text-amber-700 font-mono text-xs font-black">
                        ₹{Number(selectedBookingForCollect.balance_due || selectedBookingForCollect.final_amount || 0).toLocaleString("en-IN")}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForCollect(null)}
                    className="text-xs text-slate-500 hover:text-rose-600 font-bold"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Step 2: Amount & Method */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
              </div>

              {/* Method Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CASH", label: "💵 Cash" },
                    { id: "UPI", label: "📱 Spot UPI" },
                    { id: "CARD", label: "💳 POS Card" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCollectMethod(m.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                        collectMethod === m.id
                          ? "bg-emerald-50 text-[#059669] border-[#059669]"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Reference / UTR (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-12345678"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collectLoading || !selectedBookingForCollect}
                  className="px-5 py-2 bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-emerald-glow cursor-pointer"
                >
                  {collectLoading ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Refund Flow Modal (Requirement #27) */}
      {isRefundModalOpen && refundPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {refundStep === "SELECT" ? "Refund Booking" : "Review Refund"}
                </h3>
                <p className="text-xs text-slate-500">
                  Paid: ₹{Number(refundPayment.amount).toLocaleString("en-IN")} via {refundPayment.provider}
                </p>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {refundStep === "SELECT" ? (
              <div className="space-y-4 text-xs">
                {/* Quick Choices */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Select Refund Amount</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="refundChoice"
                        checked={refundChoice === "FULL"}
                        onChange={() => setRefundChoice("FULL")}
                        className="text-[#059669] focus:ring-[#059669]"
                      />
                      <span className="font-bold text-slate-900">
                        Full Refund (₹{Number(refundPayment.amount).toLocaleString("en-IN")})
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="refundChoice"
                        checked={refundChoice === "50"}
                        onChange={() => setRefundChoice("50")}
                        className="text-[#059669] focus:ring-[#059669]"
                      />
                      <span className="font-bold text-slate-900">
                        50% Refund (₹{Math.round(Number(refundPayment.amount) * 0.5).toLocaleString("en-IN")})
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="refundChoice"
                        checked={refundChoice === "CUSTOM"}
                        onChange={() => setRefundChoice("CUSTOM")}
                        className="text-[#059669] focus:ring-[#059669]"
                      />
                      <span className="font-bold text-slate-900">Custom Amount</span>
                    </label>
                  </div>

                  {refundChoice === "CUSTOM" && (
                    <input
                      type="number"
                      placeholder="Enter amount to refund (₹)"
                      value={customRefundAmount}
                      onChange={(e) => setCustomRefundAmount(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669] mt-2"
                    />
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Reason for Refund</label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsRefundModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundStep("REVIEW")}
                    className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl text-xs shadow-emerald-glow cursor-pointer"
                  >
                    Review Refund
                  </button>
                </div>
              </div>
            ) : (
              /* Review Step */
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2 text-purple-950">
                  <div className="flex justify-between">
                    <span>Refund Amount</span>
                    <strong className="text-sm font-black font-mono">
                      ₹
                      {refundChoice === "FULL"
                        ? Number(refundPayment.amount)
                        : refundChoice === "50"
                        ? Math.round(Number(refundPayment.amount) * 0.5)
                        : customRefundAmount}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking Reference</span>
                    <span className="font-mono font-bold">{refundPayment.booking_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer</span>
                    <span>{refundPayment.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Destination</span>
                    <span className="font-bold">{refundTo === "ORIGINAL" ? "Original Razorpay Gateway" : "Cash / Desk"}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Note: This will execute the refund transaction through the payment engine. Booking status and payment status remain decoupled.
                </p>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setRefundStep("SELECT")}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRefund}
                    disabled={refundLoading}
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    {refundLoading ? "Processing Refund..." : "Confirm Refund"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Daily Cash Drawer Modal (#41) */}
      {isCashDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Daily Cash Operations</h3>
                <p className="text-xs text-slate-500">Walk-in counter register reconciliation</p>
              </div>
              <button
                onClick={() => setIsCashDrawerOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cashDrawerData ? (
              <form onSubmit={handleCloseCashDrawer} className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opening Cash:</span>
                    <strong className="font-mono text-slate-900">₹{cashDrawerData.opening_cash}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Offline Cash Collected:</span>
                    <strong className="font-mono text-emerald-700">+₹{cashDrawerData.offline_cash_collected}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash Refunds:</span>
                    <strong className="font-mono text-rose-700">-₹{cashDrawerData.cash_refunds_processed}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                    <span className="text-slate-900">Expected Closing:</span>
                    <strong className="font-mono text-[#059669]">₹{cashDrawerData.expected_closing}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Actual Closing Cash Count (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter physical cash count at register..."
                    value={closingCashCount}
                    onChange={(e) => setClosingCashCount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>

                {closingCashCount && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold flex justify-between ${
                      Math.abs(Number(closingCashCount) - Number(cashDrawerData.expected_closing)) > 0
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    <span>Variance / Difference:</span>
                    <span className="font-mono font-black">
                      ₹{Number(closingCashCount) - Number(cashDrawerData.expected_closing)}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCashDrawerOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={drawerLoading}
                    className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl text-xs shadow-emerald-glow"
                  >
                    {drawerLoading ? "Recording..." : "Record Closing Count"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}

      {/* 10. Reconciliation Anomalies Modal (#34, #35) */}
      {isReconOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Reconciliation Needs Review</h3>
                <p className="text-xs text-slate-500">Automated ledger anomaly detection</p>
              </div>
              <button onClick={() => setIsReconOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 text-xs">
              {anomalies.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto" />
                  <p className="font-bold text-slate-900">Everything is reconciled.</p>
                  <p className="text-slate-500 text-xs">✓ No payment issues require attention.</p>
                </div>
              ) : (
                anomalies.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          {a.type}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{a.booking_id}</span>
                      </div>
                      <p className="text-slate-700 font-medium">{a.description}</p>
                      <p className="text-[11px] text-slate-500">Customer: {a.customer_name}</p>
                    </div>

                    <button
                      onClick={() => handleResolveAnomaly(a)}
                      disabled={reconLoading}
                      className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-sm text-xs shrink-0 cursor-pointer"
                    >
                      {a.action_label || "Resolve"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. Official Tax Receipt Modal */}
      {receiptIdentifier && (
        <ReceiptModal
          isOpen={!!receiptIdentifier}
          onClose={() => setReceiptIdentifier(null)}
          identifier={receiptIdentifier}
        />
      )}
    </div>
  );
};
