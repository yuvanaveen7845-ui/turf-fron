import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  PlusCircle,
  Clock,
  ArrowRight,
  Wallet,
  Download,
  Printer,
  CreditCard,
  Coins,
  ShieldCheck,
  Check,
  AlertTriangle,
  Calendar,
  User,
  Phone,
  FileText,
} from "lucide-react";
import { DataTable } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";

export const ManageRefundsPage: React.FC = () => {
  const toast = useToast();
  const { company } = useBusinessSettings();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");

  // Inspect Modal
  const [inspectRefund, setInspectRefund] = useState<any | null>(null);
  const [showPrintVoucher, setShowPrintVoucher] = useState(false);

  // Process Refund Modal
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [lookupType, setLookupType] = useState<"BOOKING" | "PAYMENT">("BOOKING");
  const [lookupIdentifier, setLookupIdentifier] = useState("");
  const [lookedUpData, setLookedUpData] = useState<any | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [refundAmount, setRefundAmount] = useState("");
  const [refundTo, setRefundTo] = useState<"WALLET" | "ORIGINAL" | "CASH">("WALLET");
  const [refundReason, setRefundReason] = useState("Customer cancellation refund");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payments/refunds/");
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.results)
          ? raw.results
          : [];
      setRefunds(list);
    } catch (err) {
      console.error("Failed to load refunds:", err);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick lookup of booking details to prevent blind manual input
  const handleLookupBooking = async () => {
    const ident = lookupIdentifier.trim();
    if (!ident) return;
    setLookingUp(true);
    setLookupError("");
    setLookedUpData(null);

    try {
      if (lookupType === "BOOKING") {
        // Try direct booking query or search
        const res = await api.get(`/bookings/?search=${encodeURIComponent(ident)}`);
        const results = res.data?.results || (Array.isArray(res.data) ? res.data : []);
        const matched = results.find(
          (b: any) =>
            String(b.id) === ident ||
            b.booking_id?.toUpperCase() === ident.toUpperCase()
        ) || results[0];

        if (!matched) {
          setLookupError(`No booking found matching "${ident}".`);
          return;
        }

        const paid = Number(matched.amount_paid || 0);
        const refunded = Number(matched.already_refunded || 0);
        const maxRefund = Math.max(0, paid - refunded);

        setLookedUpData({
          booking: matched,
          bookingId: matched.booking_id || matched.id,
          customerName: matched.customer_details?.full_name || matched.customer_details?.email || "Guest Player",
          customerPhone: matched.customer_details?.phone || "",
          turfName: matched.turf_details?.name || "Pitch Arena",
          matchDate: matched.date,
          status: matched.status,
          totalPaid: paid,
          alreadyRefunded: refunded,
          maxRefundable: maxRefund,
        });

        setRefundAmount(String(maxRefund));
      } else {
        // Lookup by Payment ID
        const res = await api.get(`/payments/`);
        const results = res.data?.results || (Array.isArray(res.data) ? res.data : []);
        const matched = results.find(
          (p: any) =>
            p.payment_id?.toUpperCase() === ident.toUpperCase() ||
            String(p.id) === ident
        );

        if (!matched) {
          setLookupError(`No payment record found matching "${ident}".`);
          return;
        }

        const amount = Number(matched.amount || 0);
        setLookedUpData({
          payment: matched,
          bookingId: matched.booking?.booking_id || matched.booking_id || "N/A",
          customerName: matched.customer_details?.full_name || "Customer",
          customerPhone: "",
          turfName: "Venue Match",
          matchDate: matched.created_at?.slice(0, 10),
          status: matched.status,
          totalPaid: amount,
          alreadyRefunded: 0,
          maxRefundable: amount,
        });
        setRefundAmount(String(amount));
      }
    } catch (err: any) {
      setLookupError("Failed to lookup booking details. Please verify the ID.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(refundAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid refund amount.");
      return;
    }

    if (lookedUpData && amt > lookedUpData.maxRefundable) {
      toast.error(`Refund amount cannot exceed remaining refundable balance (₹${lookedUpData.maxRefundable}).`);
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        amount: amt,
        refund_to: refundTo,
        reason: refundReason,
      };

      if (lookupType === "BOOKING") {
        payload.booking_id = lookedUpData ? lookedUpData.bookingId : lookupIdentifier.trim();
      } else {
        payload.payment_id = lookupIdentifier.trim();
      }

      const res = await api.post(`/payments/refunds/`, payload);
      const msg = res.data?.message || `Refund of ₹${amt.toFixed(2)} processed successfully via ${refundTo}!`;
      setFeedbackMsg(msg);
      toast.success(msg);
      setIsProcessModalOpen(false);
      setLookupIdentifier("");
      setLookedUpData(null);
      setRefundAmount("");
      setRefundReason("Customer cancellation refund");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to process refund.");
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalCount = refunds.length;
    let totalAmount = 0;
    let walletAmount = 0;
    let walletCount = 0;
    let gatewayAmount = 0;
    let gatewayCount = 0;
    let cashAmount = 0;
    let cashCount = 0;

    for (const r of refunds) {
      if (r.status === "COMPLETED" || r.status === "SUCCESS") {
        const amt = parseFloat(r.amount || 0);
        totalAmount += amt;
        if (r.refund_to === "WALLET") {
          walletAmount += amt;
          walletCount++;
        } else if (r.refund_to === "ORIGINAL") {
          gatewayAmount += amt;
          gatewayCount++;
        } else if (r.refund_to === "CASH") {
          cashAmount += amt;
          cashCount++;
        }
      }
    }

    return {
      totalCount,
      totalAmount,
      walletAmount,
      walletCount,
      gatewayAmount,
      gatewayCount,
      cashAmount,
      cashCount,
    };
  }, [refunds]);

  // Date Filtering
  const now = new Date();
  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (destinationFilter && r.refund_to !== destinationFilter) return false;

    if (dateRangeFilter !== "ALL") {
      const createdDate = new Date(r.created_at);
      const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      if (dateRangeFilter === "TODAY" && diffDays > 1) return false;
      if (dateRangeFilter === "7DAYS" && diffDays > 7) return false;
      if (dateRangeFilter === "30DAYS" && diffDays > 30) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (r.refund_id || "").toLowerCase().includes(q);
      const matchBook = (r.booking?.booking_id || r.booking_reference || r.booking_id || "").toLowerCase().includes(q);
      const matchCust = (r.customer_name || r.customer_email || r.booking?.customer?.email || "").toLowerCase().includes(q);
      const matchReason = (r.reason || "").toLowerCase().includes(q);
      const matchProv = (r.provider_refund_id || "").toLowerCase().includes(q);
      if (!matchId && !matchBook && !matchCust && !matchReason && !matchProv) return false;
    }

    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRefunds.length === 0) {
      toast.error("No refund records available to export.");
      return;
    }

    const headers = [
      "Refund ID",
      "Booking Reference",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Turf Arena",
      "Refund Amount (INR)",
      "Type",
      "Destination",
      "Status",
      "Initiated By",
      "Reason",
      "Date Processed",
    ];

    const rows = filteredRefunds.map((r) => [
      r.refund_id,
      r.booking?.booking_id || r.booking_reference || r.booking_id || "N/A",
      r.customer_name || r.booking?.customer?.full_name || "Player",
      r.customer_email || r.booking?.customer?.email || "",
      r.customer_phone || r.booking?.customer?.phone || "",
      r.turf_name || r.booking?.turf?.name || "Friends Turf",
      Number(r.amount || 0).toFixed(2),
      r.refund_type,
      r.refund_to,
      r.status,
      r.initiated_by_email || "System",
      `"${(r.reason || "").replace(/"/g, '""')}"`,
      r.created_at ? new Date(r.created_at).toISOString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `friends_turf_refunds_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredRefunds.length} refund records to CSV.`);
  };

  const columns = [
    {
      key: "refund_id",
      header: "Refund ID",
      render: (row: any) => (
        <span className="font-mono text-xs font-bold text-slate-900 block">
          {row.refund_id}
        </span>
      ),
      sortable: true,
    },
    {
      key: "booking_id",
      header: "Booking Ref",
      render: (row: any) => (
        <div>
          <span className="font-mono text-xs font-black text-[#059669] block">
            {row.booking?.booking_id || row.booking_reference || row.booking_id || "N/A"}
          </span>
          <span className="text-[11px] text-slate-500 font-medium truncate block max-w-[140px]">
            {row.customer_name || row.customer_email || "Player"}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "amount",
      header: "Refund Amount",
      render: (row: any) => (
        <span className="font-black text-xs text-rose-700">
          ₹{Number(row.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
      sortable: true,
    },
    {
      key: "refund_type",
      header: "Type",
      render: (row: any) => (
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {row.refund_type}
        </span>
      ),
      sortable: true,
    },
    {
      key: "refund_to",
      header: "Destination",
      render: (row: any) => (
        <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
          {row.refund_to === "WALLET" ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 text-[11px] font-bold">
              <Wallet className="w-3 h-3" />
              <span>Turf Wallet</span>
            </span>
          ) : row.refund_to === "ORIGINAL" ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
              <CreditCard className="w-3 h-3" />
              <span>Razorpay / UPI</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
              <Coins className="w-3 h-3" />
              <span>Cash Handover</span>
            </span>
          )}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
            row.status === "COMPLETED" || row.status === "SUCCESS"
              ? "bg-emerald-50 text-[#059669] border border-emerald-200"
              : row.status === "FAILED"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {row.status === "COMPLETED" || row.status === "SUCCESS" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          <span>{row.status}</span>
        </span>
      ),
      sortable: true,
    },
    {
      key: "created_at",
      header: "Processed At",
      render: (row: any) => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInspectRefund(row)}
            leftIcon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund &amp; Settlement Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Refunds &amp; Dispute Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Process full and partial refunds, execute Razorpay payment gateway reversals, and grant instant customer wallet credits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className={`w-4 h-4 text-[#059669] ${loading ? "animate-spin" : ""}`} />}
          >
            Sync
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4 text-slate-700" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setLookupIdentifier("");
              setLookedUpData(null);
              setLookupError("");
              setRefundAmount("");
              setIsProcessModalOpen(true);
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Process New Refund
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-xs font-bold text-[#059669] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg("")} className="text-emerald-700 font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Refunded */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-pitch-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Refunded Value</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{metrics.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Across <strong className="text-slate-800">{metrics.totalCount}</strong> recorded refund transactions
          </p>
        </div>

        {/* Metric 2: Wallet Instant Credits */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-pitch-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Wallet Credits</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#059669] tracking-tight">
            ₹{metrics.walletAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            <strong className="text-[#059669]">{metrics.walletCount}</strong> instant credits (0 gateway fees)
          </p>
        </div>

        {/* Metric 3: Gateway / Razorpay Reversals */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-pitch-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Gateway Reversals</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">
            ₹{metrics.gatewayAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            <strong className="text-blue-700">{metrics.gatewayCount}</strong> reversed via Razorpay API
          </p>
        </div>

        {/* Metric 4: Cash Desk Handover */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-pitch-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Cash Handover</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            ₹{metrics.cashAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            <strong className="text-amber-700">{metrics.cashCount}</strong> physical cash desk payouts
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Refund ID, Booking Ref, Customer..."
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#059669]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#059669]"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Destination Filter */}
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#059669]"
          >
            <option value="">All Destinations</option>
            <option value="WALLET">Turf Wallet (Instant)</option>
            <option value="ORIGINAL">Original Gateway (Razorpay)</option>
            <option value="CASH">Cash Desk Handover</option>
          </select>

          {/* Date Range Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            {[
              { id: "ALL", label: "All Time" },
              { id: "TODAY", label: "Today" },
              { id: "7DAYS", label: "7 Days" },
              { id: "30DAYS", label: "30 Days" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRangeFilter(d.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  dateRangeFilter === d.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {(statusFilter || destinationFilter || searchQuery || dateRangeFilter !== "ALL") && (
          <button
            onClick={() => {
              setStatusFilter("");
              setDestinationFilter("");
              setSearchQuery("");
              setDateRangeFilter("ALL");
            }}
            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer shrink-0"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Refunds Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-pitch-card">
        <DataTable
          columns={columns}
          data={filteredRefunds}
          keyExtractor={(row) => row.refund_id}
          isLoading={loading}
          searchPlaceholder="Filter listed records..."
        />
      </div>

      {/* Inspect Refund & Printable Voucher Modal */}
      <Modal
        isOpen={!!inspectRefund}
        onClose={() => {
          setInspectRefund(null);
          setShowPrintVoucher(false);
        }}
        title="Refund Audit &amp; Settlement Voucher"
        maxWidth="md"
      >
        {inspectRefund && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Refund ID</span>
                  <span className="font-mono font-black text-sm text-slate-900">{inspectRefund.refund_id}</span>
                </div>
                <span
                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black uppercase ${
                    inspectRefund.status === "COMPLETED" || inspectRefund.status === "SUCCESS"
                      ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{inspectRefund.status}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Booking Reference</span>
                  <span className="font-mono font-bold text-[#059669]">
                    {inspectRefund.booking?.booking_id || inspectRefund.booking_reference || inspectRefund.booking_id || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Name</span>
                  <span className="font-bold text-slate-900">
                    {inspectRefund.customer_name || inspectRefund.customer_email || "Customer"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Refund Amount</span>
                  <span className="font-black text-base text-rose-700">₹{Number(inspectRefund.amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Destination Channel</span>
                  <span className="font-bold text-slate-900">{inspectRefund.refund_to}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Initiated By</span>
                  <span className="font-medium text-slate-700">{inspectRefund.initiated_by_email || "Platform System"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Processed Timestamp</span>
                  <span className="font-medium text-slate-700">
                    {new Date(inspectRefund.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {inspectRefund.provider_refund_id && (
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Razorpay Refund ID:</span>
                  <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {inspectRefund.provider_refund_id}
                  </span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="font-bold block text-[11px] text-slate-700">Reason / Policy Justification:</span>
              <p className="text-slate-600 leading-relaxed">{inspectRefund.reason}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Formal Voucher</span>
              </button>

              <Button variant="secondary" size="sm" onClick={() => setInspectRefund(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Smart Process New Refund Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Issue Booking Refund / Credit"
        maxWidth="md"
      >
        <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
          {/* Lookup Toggle */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Select Lookup Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLookupType("BOOKING");
                  setLookedUpData(null);
                  setLookupError("");
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  lookupType === "BOOKING"
                    ? "bg-[#059669] text-white border-[#059669]"
                    : "bg-[#F8FAFC] text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                By Booking Reference (e.g. FT-26-XXXXXX)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLookupType("PAYMENT");
                  setLookedUpData(null);
                  setLookupError("");
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  lookupType === "PAYMENT"
                    ? "bg-[#059669] text-white border-[#059669]"
                    : "bg-[#F8FAFC] text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                By Payment ID (e.g. PAY-XXXXXX)
              </button>
            </div>
          </div>

          {/* Identifier Input with Lookup Button */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              {lookupType === "BOOKING" ? "Enter Booking ID / Reference *" : "Enter Payment Record ID *"}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={lookupIdentifier}
                onChange={(e) => {
                  setLookupIdentifier(e.target.value);
                  setLookupError("");
                }}
                placeholder={lookupType === "BOOKING" ? "e.g. FT-26-824629 or numeric ID" : "e.g. PAY-12345678"}
                className="flex-1 p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-900 outline-none focus:bg-white focus:border-[#059669]"
              />
              <button
                type="button"
                onClick={handleLookupBooking}
                disabled={lookingUp || !lookupIdentifier.trim()}
                className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {lookingUp ? "Verifying..." : "Verify & Load"}
              </button>
            </div>
            {lookupError && (
              <p className="text-rose-600 font-semibold text-xs mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lookupError}</span>
              </p>
            )}
          </div>

          {/* Verified Booking Card Preview */}
          {lookedUpData && (
            <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between border-b border-emerald-200 pb-2">
                <div>
                  <span className="font-mono font-black text-slate-900 text-sm">#{lookedUpData.bookingId}</span>
                  <p className="text-slate-600 text-[11px] font-semibold">
                    {lookedUpData.customerName} {lookedUpData.customerPhone && `• ${lookedUpData.customerPhone}`}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#059669] border border-emerald-200">
                  {lookedUpData.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Paid</span>
                  <span className="font-black text-slate-900 text-sm">₹{lookedUpData.totalPaid}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Already Refunded</span>
                  <span className="font-black text-rose-600 text-sm">₹{lookedUpData.alreadyRefunded}</span>
                </div>
                <div className="bg-emerald-100/70 p-2 rounded-xl border border-emerald-300">
                  <span className="text-[10px] font-bold uppercase text-[#059669] block">Max Refundable</span>
                  <span className="font-black text-[#059669] text-sm">₹{lookedUpData.maxRefundable}</span>
                </div>
              </div>
            </div>
          )}

          {/* Refund Amount Input & Quick Pills */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Refund Amount to Issue (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              max={lookedUpData ? lookedUpData.maxRefundable : undefined}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="e.g. 1652.00"
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-[#059669]"
            />
            {lookedUpData && lookedUpData.maxRefundable > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRefundAmount(String(lookedUpData.maxRefundable))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 text-[11px] cursor-pointer"
                >
                  100% (₹{lookedUpData.maxRefundable})
                </button>
                <button
                  type="button"
                  onClick={() => setRefundAmount(String(Math.round(lookedUpData.maxRefundable / 2)))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 text-[11px] cursor-pointer"
                >
                  50% (₹{Math.round(lookedUpData.maxRefundable / 2)})
                </button>
              </div>
            )}
          </div>

          {/* Refund Destination Selector */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Refund Credit Destination
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRefundTo("WALLET")}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                  refundTo === "WALLET"
                    ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                    : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span>Turf Wallet</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-[#059669] font-black">
                    INSTANT
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Zero fee, instant wallet credit</p>
              </button>

              <button
                type="button"
                onClick={() => setRefundTo("ORIGINAL")}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                  refundTo === "ORIGINAL"
                    ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                    : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">Original Gateway</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Razorpay / UPI reversal (3-5 days)</p>
              </button>

              <button
                type="button"
                onClick={() => setRefundTo("CASH")}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                  refundTo === "CASH"
                    ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                    : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">Cash Desk Handover</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Counter cash register payout</p>
              </button>
            </div>
          </div>

          {/* Refund Reason */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Cancellation / Refund Justification *
            </label>
            <input
              type="text"
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for issuing refund..."
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-[#059669]"
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                "Customer cancellation refund",
                "Weather Rain Blackout",
                "Facility Maintenance Blackout",
                "Double Booking Resolution",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRefundReason(preset)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Irrevocable Financial Entry:</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Issuing this refund will credit the customer via {refundTo} and log a debit entry in the daily cash reconciliation register.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsProcessModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={submitting}
              disabled={
                !refundAmount ||
                parseFloat(refundAmount) <= 0 ||
                (lookedUpData && parseFloat(refundAmount) > lookedUpData.maxRefundable)
              }
            >
              Confirm &amp; Execute Refund
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
