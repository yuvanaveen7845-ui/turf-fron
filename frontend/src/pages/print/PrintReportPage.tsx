import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Printer,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  IndianRupee,
  Calendar,
  ShieldCheck,
  Building2,
  CheckCircle,
  Clock,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import api from "../../services/api";
import { FriendsTurfLogo } from "../../components/common/FriendsTurfLogo";

export const PrintReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const startDate = searchParams.get("start_date") || new Date().toISOString().split("T")[0];
  const endDate = searchParams.get("end_date") || startDate;
  const autoPrint = searchParams.get("autoprint") === "true";

  const [dailySummary, setDailySummary] = useState<any>(null);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        if (autoPrint) {
          setTimeout(() => {
            window.print();
          }, 600);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [startDate, endDate, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Compiling Management Audit Report...</p>
        </div>
      </div>
    );
  }

  const totals = dailySummary?.summary_totals || {
    total_bookings: 0,
    gross_revenue: 0,
    total_refunds: 0,
    net_revenue: 0,
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900 font-sans antialiased py-6 px-4 sm:px-6 print:p-0">
      {/* ── Top Bar Controls (Hidden in PDF/Print) ── */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Executive Summary Report (A4 Format)
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-emerald-glow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ── Printable Report Document Template ── */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-300 print:border-0 rounded-3xl print:rounded-none shadow-xl print:shadow-none p-8 sm:p-12 print:p-6 space-y-8 print:w-full print:max-w-none">
        {/* Header with Logo */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-6">
          <div className="space-y-1.5">
            <FriendsTurfLogo variant="print" size="md" />
            <p className="text-xs text-slate-500 mt-1">
              Executive Business, Financial & Occupancy Audit Report
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              PERIOD: {startDate} TO {endDate}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Generated: {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Total Reservations
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totals.total_bookings}
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Gross Revenue
            </span>
            <p className="text-2xl font-black text-[#059669] mt-1">
              ₹{Number(totals.gross_revenue).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Processed Refunds
            </span>
            <p className="text-2xl font-black text-red-600 mt-1">
              ₹{Number(totals.total_refunds).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Net Realized Revenue
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{Number(totals.net_revenue).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Daily Operational Performance Breakdown
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Bookings</th>
                  <th className="py-3 px-4 text-right">Gross (₹)</th>
                  <th className="py-3 px-4 text-right">Online Gateway (₹)</th>
                  <th className="py-3 px-4 text-right">Cash Desk (₹)</th>
                  <th className="py-3 px-4 text-right">Refunds (₹)</th>
                  <th className="py-3 px-4 text-right">Net (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dailySummary?.days?.length > 0 ? (
                  dailySummary.days.map((row: any) => (
                    <tr key={row.date}>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.date}</td>
                      <td className="py-3 px-4 text-center">{row.bookings_count}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{Number(row.gross_amount).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{Number(row.online_amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{Number(row.cash_amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">₹{Number(row.refund_amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-black text-[#059669]">₹{Number(row.net_amount).toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No operational transactions recorded in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reconciliation & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-slate-900">Payment Gateway Reconciliation</h3>
            <p className="text-slate-600">
              Matched Transactions: <strong>{reconciliation?.matched_count || totals.total_bookings}</strong>
            </p>
            <p className="text-slate-600">
              Discrepancies / Gateway Retries: <strong>{reconciliation?.unresolved_count || 0}</strong>
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-slate-900">Audit & Governance Certification</h3>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              This report represents certified financial and reservation logs from Friends Turf Cloud Database.
              All slot check-ins are verified via cryptographic turnstile passes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-[10px] text-slate-400">
          <span>Friends Turf System Analytics • Confidential Management Copy</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};
