import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { DataTable } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import api from "../../services/api";

export const ManageRefundsPage: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");

  // Inspect Modal
  const [inspectRefund, setInspectRefund] = useState<any | null>(null);

  // Process Refund Modal
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundTo, setRefundTo] = useState("WALLET");
  const [refundReason, setRefundReason] = useState("");
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

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId || !refundAmount) return;

    setSubmitting(true);
    try {
      await api.post(`/payments/${paymentId}/refund/`, {
        amount: refundAmount,
        refund_to: refundTo,
        reason: refundReason,
      });

      setFeedbackMsg(`Refund of ₹${refundAmount} processed successfully to ${refundTo}!`);
      setIsProcessModalOpen(false);
      setPaymentId("");
      setRefundAmount("");
      setRefundReason("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process refund.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (destinationFilter && r.refund_to !== destinationFilter) return false;
    return true;
  });

  const columns = [
    {
      key: "refund_id",
      header: "Refund ID",
      render: (row: any) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {row.refund_id}
        </span>
      ),
      sortable: true,
    },
    {
      key: "booking_id",
      header: "Booking Ref",
      render: (row: any) => (
        <span className="font-mono text-xs font-bold text-[#059669]">
          {row.booking?.booking_id || row.booking_id || "N/A"}
        </span>
      ),
      sortable: true,
    },
    {
      key: "amount",
      header: "Refund Amount",
      render: (row: any) => (
        <span className="font-black text-xs text-rose-700">
          ₹{row.amount}
        </span>
      ),
      sortable: true,
    },
    {
      key: "refund_type",
      header: "Type",
      render: (row: any) => (
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {row.refund_type}
        </span>
      ),
      sortable: true,
    },
    {
      key: "refund_to",
      header: "Destination",
      render: (row: any) => (
        <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
          {row.refund_to === "WALLET" ? <Wallet className="w-3.5 h-3.5 text-[#059669]" /> : <RotateCcw className="w-3.5 h-3.5 text-blue-600" />}
          <span>{row.refund_to === "WALLET" ? "Turf Wallet (Instant)" : "Original Gateway"}</span>
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
            row.status === "COMPLETED"
              ? "bg-emerald-50 text-[#059669] border border-emerald-200"
              : row.status === "FAILED"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {row.status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          <span>{row.status}</span>
        </span>
      ),
      sortable: true,
    },
    {
      key: "created_at",
      header: "Created At",
      render: (row: any) => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInspectRefund(row)}
          leftIcon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Refunds & Dispute Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Process full/partial cancellations, audit gateway refunds, and manage instant customer wallet compensations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className={`w-4 h-4 text-[#059669] ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProcessModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Process Refund
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-xs font-bold text-[#059669] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg("")} className="text-emerald-700 font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filter By:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#059669]"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#059669]"
          >
            <option value="">All Destinations</option>
            <option value="WALLET">Turf Wallet (Instant)</option>
            <option value="ORIGINAL">Original Gateway (Razorpay)</option>
          </select>
        </div>

        {(statusFilter || destinationFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setDestinationFilter("");
            }}
            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
          >
            Clear Filters
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
          searchPlaceholder="Search by Refund ID, Booking Ref, Reason..."
        />
      </div>

      {/* Inspect Refund Modal */}
      <Modal
        isOpen={!!inspectRefund}
        onClose={() => setInspectRefund(null)}
        title="Refund Audit & Settlement Details"
      >
        {inspectRefund && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Refund ID</span>
                <span className="font-mono font-bold text-slate-900">{inspectRefund.refund_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Booking Reference</span>
                <span className="font-mono font-bold text-[#059669]">{inspectRefund.booking?.booking_id || inspectRefund.booking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Refund Amount</span>
                <span className="font-black text-sm text-rose-700">₹{inspectRefund.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Destination Channel</span>
                <span className="font-bold text-slate-900">{inspectRefund.refund_to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
                <span className="font-bold text-slate-900">{inspectRefund.status}</span>
              </div>
              {inspectRefund.provider_refund_id && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Razorpay Refund ID</span>
                  <span className="font-mono text-slate-700">{inspectRefund.provider_refund_id}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold block text-[11px] text-slate-700">Reason / Policy Justification:</span>
              <p className="text-slate-600">{inspectRefund.reason}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setInspectRefund(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Process Refund Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Issue Refund for Payment"
      >
        <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Specify the Payment ID to reverse funds. If paying to original gateway, Razorpay API will be called immediately.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Payment Record ID or PK *
            </label>
            <input
              type="text"
              required
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder="e.g. PAY-12345678 or Payment PK"
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:border-[#059669]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Refund Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="e.g. 600"
                className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#059669]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Refund Destination
              </label>
              <select
                value={refundTo}
                onChange={(e) => setRefundTo(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-[#059669]"
              >
                <option value="WALLET">Turf Wallet (Instant Credit)</option>
                <option value="ORIGINAL">Original Gateway (Razorpay 3-5 Days)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Cancellation / Refund Justification *
            </label>
            <textarea
              required
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation outside 24h window / Bad weather compensation..."
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#059669]"
            />
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
            >
              Confirm & Execute Refund
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
