import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Globe,
  FileText,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import { AuditLogEntry } from "../../types";
import { Button, DataTable, StatusBadge, EmptyState } from "../../components/ui";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = () => {
    setLoading(true);
    const query = actionFilter !== "ALL" ? `?action=${actionFilter}` : "";
    api
      .get(`/audit/${query}`)
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const columns = [
    {
      key: "created_at",
      header: "Timestamp",
      sortable: true,
      render: (log: AuditLogEntry) => (
        <div className="text-slate-500 font-mono text-xs flex items-center gap-1.5 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{log.created_at}</span>
        </div>
      ),
    },
    {
      key: "user_email",
      header: "Initiator / Actor",
      render: (log: AuditLogEntry) => (
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
          <User className="w-3.5 h-3.5 text-[#059669]" />
          <span>{log.user_email}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action Executed",
      render: (log: AuditLogEntry) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-700 uppercase tracking-wide">
          {log.action}
        </span>
      ),
    },
    {
      key: "resource",
      header: "Target Resource",
      render: (log: AuditLogEntry) => (
        <div className="font-mono text-slate-600 text-xs">
          <span className="font-semibold text-slate-800">{log.resource_type}:</span>{" "}
          <span className="font-bold text-[#059669]">{log.resource_id}</span>
        </div>
      ),
    },
    {
      key: "details",
      header: "Event Payload Details",
      render: (log: AuditLogEntry) => (
        <div
          className="max-w-xs truncate font-mono text-[11px] text-slate-600"
          title={typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "")}
        >
          {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "—")}
        </div>
      ),
    },
    {
      key: "ip_address",
      header: "IP Address",
      align: "right" as const,
      render: (log: AuditLogEntry) => (
        <span className="font-mono text-slate-400 text-xs">
          {log.ip_address || "127.0.0.1"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Compliance, Security & Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            System Security Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable log of all administrative actions, gate check-ins, refunds, and clearances
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Audit Trail
        </Button>
      </div>

      {/* Audit DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search actor, action, resource, details..."
        searchableKey={(l) => `${l.user_email} ${l.action} ${l.resource_id} ${String(l.details || "")}`}
        emptyTitle="No audit records found"
        emptyDescription="System security and administrative events will appear here in chronological order."
        headerActions={
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#059669]"
            >
              <option value="ALL">All Actions</option>
              <option value="BOOKING">Booking Actions</option>
              <option value="CHECK_IN">Check-ins</option>
              <option value="WALLET">Wallet Adjustments</option>
              <option value="CANCEL">Cancellations & Refunds</option>
              <option value="LOGIN">Auth & Logins</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
