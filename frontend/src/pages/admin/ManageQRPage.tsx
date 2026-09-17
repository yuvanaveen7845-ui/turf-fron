import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  Camera,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  Eye,
  Trash2,
  Clock,
  User,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import {
  Button,
  DataTable,
  Modal,
  ConfirmDialog,
  StatusBadge,
} from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import { normalizeList } from "../../utils/helpers";

export const ManageQRPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"logs" | "active_passes">("logs");
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [decisionFilter, setDecisionFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Revoke & Regenerate Modals
  const [revokeTargetBookingId, setRevokeTargetBookingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [regenTargetBookingId, setRegenTargetBookingId] = useState<string | null>(null);
  const [regenReason, setRegenReason] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  const [inspectLog, setInspectLog] = useState<any>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const fetchData = () => {
    setLoading(true);

    api
      .get("/qr/analytics/")
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error("Failed to load QR analytics:", err));

    let url = "/qr/logs/";
    const params = new URLSearchParams();
    if (decisionFilter) params.append("decision", decisionFilter);
    if (dateFilter) params.append("date", dateFilter);
    if (params.toString()) url += `?${params.toString()}`;

    api
      .get(url)
      .then((res) => setLogs(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to load gate logs:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [decisionFilter, dateFilter]);

  const handleRevokePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTargetBookingId) return;

    setRevokeLoading(true);
    try {
      await api.post("/qr/admin/revoke/", {
        booking_id: revokeTargetBookingId,
        reason: revokeReason || "Administrative cancellation",
      });
      const msg = `Pass for booking ${revokeTargetBookingId} has been revoked.`;
      setFeedbackMsg(msg);
      toast.success(msg);
      setRevokeTargetBookingId(null);
      setRevokeReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revoke pass.");
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleRegeneratePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regenTargetBookingId) return;

    setRegenLoading(true);
    try {
      const res = await api.post("/qr/admin/regenerate/", {
        booking_id: regenTargetBookingId,
        reason: regenReason || "Customer requested pass replacement",
      });
      const msg = `New version (${res.data.credential_version}) issued for ${regenTargetBookingId}.`;
      setFeedbackMsg(msg);
      toast.success(msg);
      setRegenTargetBookingId(null);
      setRegenReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to regenerate pass.");
    } finally {
      setRegenLoading(false);
    }
  };

  const columns = [
    {
      key: "booking_id",
      header: "Booking Reference",
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {row.booking_id}
        </span>
      ),
      sortable: true,
    },
    {
      key: "customer_name",
      header: "Customer",
      render: (row: any) => (
        <div>
          <p className="font-bold text-slate-900">{row.customer_name}</p>
          <p className="text-[11px] text-slate-500">{row.customer_phone}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: "turf_name",
      header: "Arena Ground",
      render: (row: any) => (
        <span className="text-slate-700 font-semibold">{row.turf_name}</span>
      ),
      sortable: true,
    },
    {
      key: "check_in_time",
      header: "Admission Time",
      render: (row: any) => (
        <span className="text-slate-600 text-xs">{row.check_in_time}</span>
      ),
      sortable: true,
    },
    {
      key: "method",
      header: "Method",
      render: (row: any) => (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {row.method}
        </span>
      ),
      sortable: true,
    },
    {
      key: "decision",
      header: "Decision",
      render: (row: any) => (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
          row.decision === "ALLOW"
            ? "bg-emerald-50 text-[#059669] border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {row.decision === "ALLOW" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span>{row.reason_code.replace("_", " ")}</span>
        </span>
      ),
      sortable: true,
    },
    {
      key: "staff_name",
      header: "Staff Operator",
      render: (row: any) => (
        <span className="text-slate-600 text-xs font-semibold truncate block max-w-[140px]">
          {row.staff_name}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setInspectLog(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Inspect check-in audit"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRegenTargetBookingId(row.booking_id)}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
            title="Regenerate Pass"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRevokeTargetBookingId(row.booking_id)}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Revoke Pass"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <QrCode className="w-3.5 h-3.5" />
            <span>Gate Access Security & Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            QR Credentials & Gate Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Monitor real-time turnstile check-ins, investigate duplicate scan anomalies, and manage cryptographic pass credentials.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/admin/scanner"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-extrabold shadow-sm transition-all active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Live Scanner</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className={`w-4 h-4 text-[#059669] ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh Feed
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

      {/* KPI Stats Bar */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Today's Admitted
            </span>
            <p className="text-3xl font-black text-[#059669]">
              {analytics.checked_in_bookings || analytics.today_approved || 0}
            </p>
            <span className="text-xs text-slate-500 font-semibold">
              Verified players on turf
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Pending Check-Ins
            </span>
            <p className="text-3xl font-black text-amber-600">
              {analytics.pending_checkins || 0}
            </p>
            <span className="text-xs text-slate-500 font-semibold">
              Expected at entrance
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Total Scans
            </span>
            <p className="text-3xl font-black text-slate-900">
              {analytics.today_scans || 0}
            </p>
            <span className="text-xs text-slate-500 font-semibold">
              {analytics.approval_rate}% Approval Rate
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Duplicate Attempts
            </span>
            <p className={`text-3xl font-black ${analytics.duplicate_attempts > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {analytics.duplicate_attempts || 0}
            </p>
            <span className="text-xs text-slate-500 font-semibold">
              Replay attempts stopped
            </span>
          </div>
        </div>
      )}

      {/* Security Anomalies Banner */}
      {analytics?.anomalies && analytics.anomalies.length > 0 && (
        <div className="space-y-3">
          {analytics.anomalies.map((a: any, i: number) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3.5 text-xs text-amber-900"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-amber-950">{a.title}</h4>
                <p className="mt-0.5">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filter Decision:</span>
          </div>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#059669]"
          >
            <option value="">All Decisions</option>
            <option value="ALLOW">Approved Only</option>
            <option value="DENY">Denied Only</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#059669]"
          />
        </div>

        {(decisionFilter || dateFilter) && (
          <button
            onClick={() => {
              setDecisionFilter("");
              setDateFilter("");
            }}
            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Gate Activity Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-pitch-card">
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(row) => String(row.id || row.booking_id)}
          isLoading={loading}
          searchPlaceholder="Search by booking reference, customer name, staff operator..."
        />
      </div>

      {/* Revoke Modal */}
      <Modal
        isOpen={!!revokeTargetBookingId}
        onClose={() => setRevokeTargetBookingId(null)}
        title="Revoke Digital Match Pass"
      >
        <form onSubmit={handleRevokePass} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Revoking this pass immediately disables its QR code at all turnstiles. The customer will no longer be admitted.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Booking Reference
            </label>
            <input
              type="text"
              disabled
              value={revokeTargetBookingId || ""}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Revocation Reason
            </label>
            <textarea
              required
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Booking cancelled / refund requested / unauthorized pass usage..."
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#059669] outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRevokeTargetBookingId(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={revokeLoading}
            >
              Confirm Revocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Regenerate Modal */}
      <Modal
        isOpen={!!regenTargetBookingId}
        onClose={() => setRegenTargetBookingId(null)}
        title="Regenerate Match Pass"
      >
        <form onSubmit={handleRegeneratePass} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Regenerating a match pass automatically revokes the old cryptographic QR code and generates a new version (v+1) for the customer.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Booking Reference
            </label>
            <input
              type="text"
              disabled
              value={regenTargetBookingId || ""}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Regeneration Reason
            </label>
            <textarea
              required
              rows={3}
              value={regenReason}
              onChange={(e) => setRegenReason(e.target.value)}
              placeholder="e.g. Customer lost old link / regenerated after slot reschedule..."
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#059669] outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRegenTargetBookingId(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={regenLoading}
            >
              Generate New Pass
            </Button>
          </div>
        </form>
      </Modal>

      {/* Inspect Log Modal */}
      <Modal
        isOpen={!!inspectLog}
        onClose={() => setInspectLog(null)}
        title="Gate Admission Audit Details"
      >
        {inspectLog && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Booking Reference</span>
                <span className="font-mono font-bold text-slate-900">{inspectLog.booking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Customer Name</span>
                <span className="font-bold text-slate-900">{inspectLog.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Arena Pitch</span>
                <span className="font-bold text-slate-900">{inspectLog.turf_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Admission Timestamp</span>
                <span className="font-bold text-slate-900">{inspectLog.check_in_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Gate Operator</span>
                <span className="font-bold text-slate-900">{inspectLog.staff_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Admission Method</span>
                <span className="font-mono font-bold text-slate-900">{inspectLog.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Decision & Reason</span>
                <span className="font-bold text-[#059669]">{inspectLog.decision} ({inspectLog.reason_code})</span>
              </div>
            </div>

            {inspectLog.override_reason && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
                <span className="font-bold block text-[11px]">Override Justification:</span>
                <p>{inspectLog.override_reason}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setInspectLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
