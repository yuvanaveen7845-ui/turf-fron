import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  Layers,
  Activity,
  ClipboardList,
} from "lucide-react";
import api from "../../services/api";
import { Booking, Turf } from "../../types";
import { Button, StatusBadge, DataTable, EmptyState, Skeleton } from "../../components/ui";
import { useGateRealtime, useOperationsRealtime } from "../../hooks/useRealtime";
import { formatTime12h, formatRelativeTime } from "../../utils/timeFormat";
import { PitchStatusRadar } from "../../components/staff/PitchStatusRadar";
import { RapidScannerEmbed } from "../../components/staff/RapidScannerEmbed";
import { WalkInPOSEmbed } from "../../components/staff/WalkInPOSEmbed";

type TabMode = "RADAR" | "SCANNER" | "WALKIN" | "SCHEDULE";

export const StaffDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabMode) || "RADAR";

  const [activeTab, setActiveTab] = useState<TabMode>(initialTab);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScanCode, setSelectedScanCode] = useState<string>("");

  const fetchToday = () => {
    setLoading(true);
    Promise.all([
      api.get("/bookings/staff/today/").then((res) => res.data),
      api.get("/turfs/").then((res) => {
        const raw = res.data;
        return Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
      }),
    ])
      .then(([bookingsData, turfsData]) => {
        setTodayBookings(bookingsData || []);
        setTurfs(turfsData || []);
      })
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

  const handleTabChange = (tab: TabMode) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleScanForBooking = (code: string) => {
    setSelectedScanCode(code);
    setActiveTab("SCANNER");
  };

  const totalMatches = todayBookings.length;
  const checkedInCount = todayBookings.filter((b) => b.status === "CHECKED_IN").length;
  const pendingCount = todayBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "UPCOMING"
  ).length;

  const nextBooking = useMemo(() => {
    const nowTimeStr = `${String(new Date().getHours()).padStart(2, "0")}:${String(
      new Date().getMinutes()
    ).padStart(2, "0")}`;

    const upcomingList = todayBookings
      .filter(
        (b) => (b.status === "CONFIRMED" || b.status === "UPCOMING") && b.start_time >= nowTimeStr
      )
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
      header: "Action",
      align: "right" as const,
      render: (b: Booking) => (
        <div>
          {b.status === "CONFIRMED" || b.status === "UPCOMING" ? (
            <button
              onClick={() => handleScanForBooking(b.booking_id)}
              className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs inline-flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Console Subheader Bar with Segmented Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ground Shift Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Ground Operations Console
          </h1>
        </div>

        {/* Console Segmented Control */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
          <button
            onClick={() => handleTabChange("RADAR")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "RADAR"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4 text-[#059669]" />
            <span>Pitch Radar</span>
          </button>

          <button
            onClick={() => handleTabChange("SCANNER")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "SCANNER"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-4 h-4 text-[#059669]" />
            <span>Rapid Scanner</span>
          </button>

          <button
            onClick={() => handleTabChange("WALKIN")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "WALKIN"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#059669]" />
            <span>Walk-In POS</span>
          </button>

          <button
            onClick={() => handleTabChange("SCHEDULE")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "SCHEDULE"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="w-4 h-4 text-[#059669]" />
            <span>Schedule ({totalMatches})</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Matches Today</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{totalMatches}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Admitted</p>
          <p className="text-xl sm:text-2xl font-black text-[#059669] mt-0.5">{checkedInCount}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Pending</p>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
        </div>
      </div>

      {/* Dynamic Tab Views */}
      {activeTab === "RADAR" && (
        <div className="space-y-6">
          <PitchStatusRadar
            turfs={turfs}
            bookings={todayBookings}
            onSelectBookingForScan={handleScanForBooking}
            onRefresh={fetchToday}
          />
        </div>
      )}

      {activeTab === "SCANNER" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <RapidScannerEmbed
            initialCode={selectedScanCode}
            onCheckInSuccess={() => fetchToday()}
          />
        </div>
      )}

      {activeTab === "WALKIN" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <WalkInPOSEmbed onSuccess={() => fetchToday()} />
        </div>
      )}

      {activeTab === "SCHEDULE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Today's Confirmed Lineup
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchToday}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            >
              Sync
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={todayBookings}
            keyExtractor={(item) => String(item.id)}
            isLoading={loading}
            searchPlaceholder="Search player, booking ref, or phone..."
            searchableKey={(b) =>
              `${b.booking_id} ${b.customer_details?.full_name || ""} ${
                b.customer_details?.phone || ""
              } ${b.turf_details?.name || ""}`
            }
            emptyTitle="No matches scheduled for today"
            emptyDescription="All pitches are currently open."
          />
        </div>
      )}
    </div>
  );
};
