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
  Layers,
  Filter,
  FileSpreadsheet,
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
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchReports = () => {
    setLoading(true);
    Promise.all([
      api.get(`/reports/daily-summary/?start_date=${startDate}&end_date=${endDate}`),
      api.get(`/reports/reconciliation/?start_date=${startDate}&end_date=${endDate}`),
      api.get("/reports/dashboard/"),
    ])
      .then(([sRes, rRes, mRes]) => {
        setDailySummary(sRes.data);
        setReconciliation(rRes.data);
        setMetrics(mRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const downloadCSV = async (type: "bookings" | "revenue" | "utilization") => {
    try {
      const response = await api.get(`/reports/export-csv/?type=${type}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `friends_turf_${type}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export CSV report.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
            Financial & Operational Intelligence
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Business & Revenue Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit venue revenue, slot occupancy rates, and download reconciliation CSVs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadCSV("revenue")}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 font-bold px-3.5 py-2 rounded-xl transition text-xs cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Revenue CSV</span>
          </button>
          <button
            onClick={() => downloadCSV("bookings")}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl transition text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Bookings Log</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-xl transition text-xs border border-slate-200 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter Strip */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Filter className="w-4 h-4 text-[#059669]" />
          <span>Report Filter:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#059669] cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#059669] cursor-pointer"
          />
        </div>

        <button
          onClick={fetchReports}
          className="ml-auto text-xs font-bold text-[#059669] hover:underline cursor-pointer"
        >
          ↻ Refresh Data
        </button>
      </div>

      {/* Reconciliation Card */}
      {reconciliation && (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-pitch-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#059669] tracking-wider block">
                Accounting Reconciliation
              </span>
              <h3 className="font-extrabold text-base text-slate-900">
                Ledger Audit & Balance Verification
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                reconciliation.summary.is_reconciled
                  ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {reconciliation.summary.is_reconciled ? "✓ Ledger Reconciled" : "⚠ Discrepancy Flagged"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Contracted</span>
              <p className="font-bold text-slate-900 text-lg">₹{reconciliation.summary.gross_contract_value}</p>
            </div>
            <div className="p-3.5 bg-[#ECFDF5] rounded-2xl">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Verified Payments</span>
              <p className="font-bold text-[#059669] text-lg">₹{reconciliation.summary.total_payments_verified}</p>
            </div>
            <div className="p-3.5 bg-purple-50 rounded-2xl">
              <span className="text-[10px] text-purple-700 font-bold uppercase block">Total Refunds</span>
              <p className="font-bold text-purple-700 text-lg">₹{reconciliation.summary.total_refunds_processed}</p>
            </div>
            <div className="p-3.5 bg-amber-50 rounded-2xl">
              <span className="text-[10px] text-amber-800 font-bold uppercase block">Outstanding Balance</span>
              <p className="font-bold text-amber-600 text-lg">₹{reconciliation.summary.outstanding_balance}</p>
            </div>
          </div>
        </div>
      )}


      {loading ? (
        <div className="py-20 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl text-xs animate-pulse">
          Compiling business reports & financial reconciliation...
        </div>
      ) : (
        dailySummary && (
          <>
            {/* Reconciliation Banner */}
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-pitch-card relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                    Revenue Audit Window
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    {dailySummary.start_date} {dailySummary.start_date !== dailySummary.end_date ? `to ${dailySummary.end_date}` : ""}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Report Timestamp: {dailySummary.generated_at}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-[#ECFDF5] border border-emerald-200 px-5 py-3.5 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-[#059669]">
                      Revenue Collected
                    </div>
                    <div className="text-2xl font-extrabold text-[#059669] flex items-center gap-1 mt-0.5">
                      <IndianRupee className="w-5 h-5" />
                      {dailySummary.revenue_collected?.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 px-5 py-3.5 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-amber-800">
                      Pending Receivables
                    </div>
                    <div className="text-2xl font-extrabold text-[#F59E0B] flex items-center gap-1 mt-0.5">
                      <IndianRupee className="w-5 h-5" />
                      {dailySummary.pending_receivables?.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  Total Bookings
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {dailySummary.total_bookings}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  In selected period
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  Confirmed
                </div>
                <div className="text-2xl font-extrabold text-[#059669] mt-1">
                  {dailySummary.confirmed_bookings}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Upcoming matches
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  Checked In
                </div>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">
                  {dailySummary.checked_in_bookings}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Verified entry
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  Completed
                </div>
                <div className="text-2xl font-extrabold text-purple-600 mt-1">
                  {dailySummary.completed_bookings}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Matches played
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  Cancelled
                </div>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">
                  {dailySummary.cancelled_bookings}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Refunded to wallet
                </div>
              </div>
            </div>

            {/* Turf Utilization Chart */}
            {metrics?.turf_utilization && (
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-pitch-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Turf Facility Utilization
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total bookings distribution across all sports pitches
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.turf_utilization}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="turf_name"
                        stroke="#64748b"
                        tick={{ fill: "#475569", fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: "#475569", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2E8F0",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#0F172A",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(val: any) => [
                          `${val} Matches`,
                          "Total Bookings",
                        ]}
                      />
                      <Bar
                        dataKey="total_bookings"
                        fill="#059669"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Revenue Breakdown Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-pitch-card">
              <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>Pitch Revenue & Occupancy Breakdown</span>
                <button
                  onClick={() => downloadCSV("utilization")}
                  className="text-xs font-bold text-[#059669] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Table CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Turf Name</th>
                      <th className="py-3 px-4">Sport Category</th>
                      <th className="py-3 px-4">Base Hourly Price</th>
                      <th className="py-3 px-4">Cumulative Matches</th>
                      <th className="py-3 px-4 text-right">Est. Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {metrics?.turf_utilization?.map(
                      (item: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 transition"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {item.turf_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {item.sport}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#059669] font-bold">
                            ₹{item.base_price}/hr
                          </td>
                          <td className="py-3.5 px-4">
                            {item.total_bookings} matches
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
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
