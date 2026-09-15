import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Star,
  Clock,
  Activity,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../services/api";
import { DashboardMetrics } from "../../types";

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/reports/dashboard/")
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-slate-900 rounded-2xl border border-slate-800"
            />
          ))}
        </div>
        <div className="h-80 bg-slate-900 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  const { kpis, revenue_trend, peak_hours, turf_utilization } = metrics;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Business Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live performance metrics, revenue trends, and venue occupancy
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-time Live Sync</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            ₹{kpis.today_revenue.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-400 flex items-center space-x-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Settled & confirmed today</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Today's Matches</span>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {kpis.today_bookings}
          </p>
          <span className="text-[11px] text-slate-400">
            {kpis.upcoming_bookings} upcoming future bookings
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Occupancy Rate</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">
            {kpis.occupancy_rate}%
          </p>
          <span className="text-[11px] text-slate-400">
            {kpis.available_slots} slots still open today
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Player Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {kpis.average_rating} ★
          </p>
          <span className="text-[11px] text-slate-400">
            {kpis.active_customers} registered players
          </span>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>7-Day Revenue Trend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily gross bookings revenue across all turf pitches
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue_trend}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [`₹${value}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Charts: Peak Hours & Turf Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Peak Hours Booking Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Most active match time windows
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peak_hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [value, "Matches"]}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Turf Utilization Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Pitch Utilization Metrics</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Booking volume by venue & base price
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {turf_utilization.map((t, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{t.turf_name}</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {t.sport}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-black text-white">
                    {t.total_bookings} Bookings
                  </p>
                  <span className="text-[10px] text-slate-500">
                    ₹{t.base_price}/hr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
