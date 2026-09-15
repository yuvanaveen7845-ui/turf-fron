import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Calendar,
  Download,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const AdminReportsPage: React.FC = () => {
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    Promise.all([
      api.get("/reports/daily-summary/"),
      api.get("/reports/dashboard/"),
    ])
      .then(([sRes, mRes]) => {
        setDailySummary(sRes.data);
        setMetrics(mRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Financial Intelligence
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Business & Revenue Reports
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs border border-slate-700"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            Print Report
          </button>
          <button
            onClick={fetchReports}
            className="text-xs font-bold text-purple-400 hover:underline"
          >
            ↻ Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          Compiling business reports & revenue data...
        </div>
      ) : (
        dailySummary && (
          <>
            {/* Daily Reconciliation Banner */}
            <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40 p-6 rounded-3xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Daily Revenue Audit
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">
                    Summary for {dailySummary.report_date}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Generated: {dailySummary.generated_at}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Revenue Collected
                    </div>
                    <div className="text-2xl font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                      <IndianRupee className="w-5 h-5" />
                      {dailySummary.revenue_collected?.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Pending Receivables
                    </div>
                    <div className="text-2xl font-black text-amber-400 flex items-center gap-1 mt-0.5">
                      <IndianRupee className="w-5 h-5" />
                      {dailySummary.pending_receivables?.toLocaleString(
                        "en-IN",
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">
                  Total Bookings
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {dailySummary.total_bookings}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Scheduled today
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">
                  Confirmed
                </div>
                <div className="text-2xl font-black text-blue-400 mt-1">
                  {dailySummary.confirmed_bookings}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Upcoming games
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">
                  Checked In
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {dailySummary.checked_in_bookings}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  On pitch now
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">
                  Completed
                </div>
                <div className="text-2xl font-black text-purple-400 mt-1">
                  {dailySummary.completed_bookings}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Matches played
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">
                  Cancelled
                </div>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {dailySummary.cancelled_bookings}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Refunded to wallet
                </div>
              </div>
            </div>

            {/* Turf Utilization Chart */}
            {metrics?.turf_utilization && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white">
                      Turf Facility Utilization
                    </h3>
                    <p className="text-xs text-slate-400">
                      Total bookings distribution across pitches
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.turf_utilization}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="turf_name"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#fff",
                        }}
                        formatter={(val: any) => [
                          `${val} Bookings`,
                          "Total Bookings",
                        ]}
                      />
                      <Bar
                        dataKey="total_bookings"
                        fill="#8b5cf6"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Revenue Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 font-bold text-white text-sm">
                Turf Revenue Performance
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Turf Name</th>
                      <th className="py-3 px-4">Sport Category</th>
                      <th className="py-3 px-4">Base Hourly Price</th>
                      <th className="py-3 px-4">Cumulative Bookings</th>
                      <th className="py-3 px-4 text-right">Est. Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                    {metrics?.turf_utilization?.map(
                      (item: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3.5 px-4 font-bold text-white">
                            {item.turf_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {item.sport}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                            ₹{item.base_price}/hr
                          </td>
                          <td className="py-3.5 px-4">
                            {item.total_bookings} matches
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-400">
                            ₹
                            {(
                              item.total_bookings * item.base_price
                            ).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};
