import React, { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";
import { Button, StatusBadge, DataTable, EmptyState, Skeleton } from "../../components/ui";
import { useGateRealtime, useOperationsRealtime } from "../../hooks/useRealtime";
import { formatTime12h, formatRelativeTime } from "../../utils/timeFormat";

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

  // Real-time live update for gate check-ins and operations
  useGateRealtime(() => {
    fetchToday();
  });

  useOperationsRealtime(() => {
    fetchToday();
  });

  const totalMatches = todayBookings.length;
  const checkedInCount = todayBookings.filter(
    (b) => b.status === "CHECKED_IN"
  ).length;
  const pendingCount = todayBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "UPCOMING"
  ).length;

  // Detect immediate next upcoming booking
  const nextBooking = useMemo(() => {
    const nowTimeStr = `${String(new Date().getHours()).padStart(2, "0")}:${String(
      new Date().getMinutes()
    ).padStart(2, "0")}`;

    const upcomingList = todayBookings
      .filter((b) => (b.status === "CONFIRMED" || b.status === "UPCOMING") && b.start_time >= nowTimeStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return upcomingList[0] || null;
  }, [todayBookings]);

  const columns = [
    {
      key: "time",
      header: "Match Window",
      render: (b: Booking) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">
            {formatTime12h(b.start_time)} - {formatTime12h(b.end_time)}
          </div>
          <div className="text-[10px] font-bold text-[#059669]">
            {formatRelativeTime(b.date, b.start_time)}
          </div>
        </div>
      ),
    },
    {
      key: "booking_id",
      header: "Booking ID",
      sortable: true,
      render: (b: Booking) => (
        <span className="font-mono font-bold text-[#059669]">
          #{b.booking_id}
        </span>
      ),
    },
    {
      key: "turf",
      header: "Pitch Arena",
      render: (b: Booking) => (
        <div>
          <div className="font-bold text-slate-900">
            {b.turf_details?.name || "Pitch Arena"}
          </div>
          <div className="text-[11px] text-slate-400">
            {b.turf_details?.sport_type}
          </div>
        </div>
      ),
    },
    {
      key: "player",
      header: "Player Contact",
      render: (b: Booking) => (
        <div>
          <p className="font-bold text-slate-900">
            {b.customer_details?.full_name || "Guest Player"}
          </p>
          <p className="text-[11px] text-slate-400">
            {b.customer_details?.phone || b.customer_details?.email}
          </p>
          {Number(b.balance_due) > 0 && (
            <p className="text-[10px] text-amber-600 font-bold">
              Balance Due: ₹{Number(b.balance_due).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b: Booking) => <StatusBadge status={b.status} size="sm" />,
    },
    {
      key: "action",
      header: "Gate Action",
      align: "right" as const,
      render: (b: Booking) => (
        <div>
          {b.status === "CONFIRMED" || b.status === "UPCOMING" ? (
            <Link
              to={`/staff/scanner?code=${b.booking_id}`}
              className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs inline-flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Verify Entry</span>
            </Link>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              {b.status === "CHECKED_IN" ? "Admitted" : "Closed"}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ground Operations Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Today's Operational Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
            className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-emerald-glow"
          >
            <QrCode className="w-4 h-4" />
            <span>Gate QR Scanner</span>
          </Link>
          <Link
            to="/staff/walk-in"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center space-x-1.5 transition-colors shadow-sm hover:border-[#059669]"
          >
            <UserPlus className="w-4 h-4 text-[#059669]" />
            <span>Walk-In Booking</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchToday}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Premium Polish: Immediate Next Up Highlight Banner */}
      {nextBooking && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 text-white shadow-emerald-glow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
              <Zap className="w-3 h-3 fill-white" />
              <span>Next Kick-Off • {formatRelativeTime(nextBooking.date, nextBooking.start_time)}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              {nextBooking.turf_details?.name} — #{nextBooking.booking_id}
            </h3>
            <p className="text-xs text-emerald-100 font-medium">
              Player: <strong>{nextBooking.customer_details?.full_name}</strong> • Time: {formatTime12h(nextBooking.start_time)} - {formatTime12h(nextBooking.end_time)}
            </p>
          </div>
          <Link
            to={`/staff/scanner?code=${nextBooking.booking_id}`}
            className="px-4 py-2.5 rounded-xl bg-white text-[#059669] font-black text-xs hover:bg-emerald-50 transition shadow-sm self-start sm:self-auto shrink-0"
          >
            Ready for Gate Check-In →
          </Link>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Total Matches Today</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalMatches}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Checked-In Players</p>
            <p className="text-2xl font-black text-[#059669] mt-1">{checkedInCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Pending Check-Ins</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <DataTable
        columns={columns}
        data={todayBookings}
        keyExtractor={(item) => String(item.id)}
        isLoading={loading}
        searchPlaceholder="Search player name, booking ID, phone..."
        searchableKey={(b) =>
          `${b.booking_id} ${b.customer_details?.full_name || ""} ${
            b.customer_details?.phone || ""
          } ${b.turf_details?.name || ""}`
        }
        emptyTitle="No matches scheduled for today"
        emptyDescription="All pitches are currently open. Create a walk-in or new booking to get started."
      />
    </div>
  );
};
