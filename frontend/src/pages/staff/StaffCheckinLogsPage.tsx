import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

export const StaffCheckinLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api
      .get("/qr/logs/")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <ClipboardCheck className="w-4 h-4" />
            <span>Gate Security Records</span>
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gate Entry & Check-In Logs
          </h1>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-300 flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh Records</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse text-xs">
            Loading gate records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No scan events recorded yet today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4">Pitch</th>
                  <th className="py-3.5 px-4">Gate Staff</th>
                  <th className="py-3.5 px-4">Verification Result</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.map((log) => {
                  const isValid = log.result === "VALID";
                  const isDuplicate = log.result === "ALREADY_USED";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono">
                        {log.scanned_at}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {log.booking_id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {log.customer_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {log.turf_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {log.scanned_by}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isValid
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : isDuplicate
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {isValid && <CheckCircle className="w-3 h-3" />}
                          {isDuplicate && <AlertTriangle className="w-3 h-3" />}
                          {!isValid && !isDuplicate && (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{log.result}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic">
                        {log.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
