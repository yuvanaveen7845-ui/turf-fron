import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Clock,
  User,
} from "lucide-react";
import api from "../../services/api";
import { Button, DataTable, StatusBadge } from "../../components/ui";
import { useGateRealtime } from "../../hooks/useRealtime";

export const StaffCheckinLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api
      .get("/qr/logs/")
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
        setLogs(list);
      })
      .catch((err) => {
        console.error(err);
        setLogs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Real-time listener for incoming gate admissions
  useGateRealtime(() => {
    fetchLogs();
  });

  const columns = [
    {
      key: "scanned_at",
      header: "Scan Timestamp",
      sortable: true,
      render: (log: any) => (
        <div className="flex items-center gap-1 text-slate-500 font-mono text-xs whitespace-nowrap">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{log.scanned_at}</span>
        </div>
      ),
    },
    {
      key: "booking_id",
      header: "Booking ID",
      render: (log: any) => (
        <span className="font-mono font-bold text-[#059669]">
          {log.booking_id}
        </span>
      ),
    },
    {
      key: "customer_name",
      header: "Player Name",
      render: (log: any) => (
        <span className="font-bold text-slate-900">{log.customer_name}</span>
      ),
    },
    {
      key: "turf_name",
      header: "Pitch Venue",
      render: (log: any) => (
        <span className="text-slate-700 font-medium">{log.turf_name}</span>
      ),
    },
    {
      key: "scanned_by",
      header: "Staff Personnel",
      render: (log: any) => (
        <span className="text-slate-600 text-xs">{log.scanned_by}</span>
      ),
    },
    {
      key: "result",
      header: "Validation Result",
      render: (log: any) => {
        const isValid = log.result === "VALID";
        const isDuplicate = log.result === "ALREADY_USED";
        return (
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
              isValid
                ? "bg-emerald-50 text-[#059669] border-emerald-200"
                : isDuplicate
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isValid && <CheckCircle className="w-3 h-3" />}
            {isDuplicate && <AlertTriangle className="w-3 h-3" />}
            {!isValid && !isDuplicate && <XCircle className="w-3 h-3 text-rose-600" />}
            <span>{log.result}</span>
          </span>
        );
      },
    },
    {
      key: "notes",
      header: "Gate Notes",
      render: (log: any) => (
        <span className="text-slate-500 italic text-xs">
          {log.notes || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gate Security & Admission Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Gate Entry & Check-In Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit history of all cryptographic QR scans, manual code entries, and gate decisions
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#059669]" />}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Logs DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search gate logs by booking ID, player, turf..."
        searchableKey={(l) => `${l.booking_id} ${l.customer_name} ${l.turf_name} ${l.result}`}
        emptyTitle="No gate scans recorded yet"
        emptyDescription="When gate staff verify match pass QR codes at entry, admission logs will automatically appear here."
      />
    </div>
  );
};
