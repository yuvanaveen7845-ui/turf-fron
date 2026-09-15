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
} from "lucide-react";
import api from "../../services/api";
import { AuditLogEntry } from "../../types";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [search, setSearch] = useState("");

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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.resource_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("BOOKING"))
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    if (action.includes("CHECK_IN") || action.includes("SUCCESS"))
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (action.includes("REFUND") || action.includes("CANCEL"))
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    if (action.includes("WALLET") || action.includes("PAYMENT"))
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Compliance & Security
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            System Audit Trail
          </h1>
        </div>

        <button
          onClick={fetchLogs}
          className="text-xs font-bold text-purple-400 hover:underline"
        >
          ↻ Refresh Audit Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user, action, resource, details..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
          >
            <option value="ALL">All Actions</option>
            <option value="BOOKING">Booking Actions</option>
            <option value="CHECK_IN">Check-ins</option>
            <option value="WALLET">Wallet Adjustments</option>
            <option value="CANCEL">Cancellations & Refunds</option>
            <option value="LOGIN">Auth & Logins</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Initiator / User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resource Target</th>
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {log.created_at}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.user_email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                      {log.resource_type}:{" "}
                      <span className="text-white font-bold">
                        {log.resource_id}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-4 max-w-xs truncate text-slate-300"
                      title={log.details}
                    >
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-[11px]">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
