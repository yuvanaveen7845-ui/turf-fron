import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  QrCode,
  UserPlus,
  Search,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";

export const StaffDashboardPage: React.FC = () => {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToday = () => {
    setLoading(true);
    api
      .get("/bookings/staff/today/")
      .then((res) => setTodayBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const totalMatches = todayBookings.length;
  const checkedInCount = todayBookings.filter(
    (b) => b.status === "CHECKED_IN",
  ).length;
  const pendingCount = todayBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "UPCOMING",
  ).length;

  return (
    <div className="space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Venue Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Today's Pitch Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/staff/scanner"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-colors shadow-md shadow-emerald-500/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch QR Scanner</span>
          </Link>
          <Link
            to="/staff/walk-in"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Walk-in Booking</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Total Matches Today
          </span>
          <p className="text-3xl font-black text-white mt-1">{totalMatches}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Checked-In / In Progress
          </span>
          <p className="text-3xl font-black text-emerald-400 mt-1">
            {checkedInCount}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Awaiting Entry Gate
          </span>
          <p className="text-3xl font-black text-amber-400 mt-1">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Today's Matches Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            All Matches Today
          </h2>
          <button
            onClick={fetchToday}
            className="text-xs text-amber-400 font-bold hover:underline"
          >
            ↻ Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse text-xs">
            Loading today's schedule...
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <p className="font-bold">No bookings scheduled for today.</p>
            <p className="text-slate-500">
              Walk-in players can be registered using the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Turf</th>
                  <th className="py-3.5 px-4">Player Details</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {todayBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-white whitespace-nowrap">
                      {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                      {b.booking_id}
                    </td>
                    <td className="py-4 px-4 font-medium text-white">
                      {b.turf_details?.name}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">
                        {b.customer_details?.full_name || "Guest"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {b.customer_details?.phone || b.customer_details?.email}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-emerald-400">
                        ₹{b.amount_paid}
                      </p>
                      {Number(b.balance_due) > 0 && (
                        <p className="text-[10px] text-amber-400 font-semibold">
                          Due: ₹{b.balance_due}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === "CHECKED_IN"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : b.status === "CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {b.status === "CONFIRMED" || b.status === "UPCOMING" ? (
                        <Link
                          to={`/staff/scanner?code=${b.booking_id}`}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] inline-flex items-center space-x-1"
                        >
                          <span>Check In</span>
                        </Link>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {b.status === "CHECKED_IN"
                            ? `In @ ${b.checked_in_at?.slice(11, 16)}`
                            : "Closed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
