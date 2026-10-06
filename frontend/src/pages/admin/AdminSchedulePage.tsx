import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Lock,
  DollarSign,
  RefreshCw,
  Sparkles,
  Sliders,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import { Turf } from "../../types";
import { Button, Skeleton } from "../../components/ui";
import { NewBookingWizardModal } from "../../components/admin/NewBookingWizardModal";
import { DirectAdminBookingModal } from "../../components/admin/DirectAdminBookingModal";
import { ContextualBookingDrawer } from "../../components/admin/ContextualBookingDrawer";
import { QuickBlockSlotModal } from "../../components/admin/QuickBlockSlotModal";
import { QuickPriceChangeModal } from "../../components/admin/QuickPriceChangeModal";
import { RecordOfflinePaymentModal } from "../../components/admin/RecordOfflinePaymentModal";
import { formatRelativeTime } from "../../utils/timeFormat";

interface SlotGridItem {
  id: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "LOCKED" | "BLOCKED" | "MAINTENANCE";
  price: number;
  booking_info?: {
    id: string;
    booking_id: string;
    customer_name: string;
    customer_phone: string;
    amount_paid: number;
    balance_due: number;
    status: string;
  };
}

interface TurfScheduleRow {
  turf: Turf;
  slots: SlotGridItem[];
}

export const AdminSchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [scheduleData, setScheduleData] = useState<TurfScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawer State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [preselectedTurfId, setPreselectedTurfId] = useState<number | undefined>();

  // Quick Direct Admin Booking Modal
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [quickBookingTurf, setQuickBookingTurf] = useState<Turf | null>(null);
  const [quickBookingSlot, setQuickBookingSlot] = useState<SlotGridItem | null>(null);

  const [isBlockSlotOpen, setIsBlockSlotOpen] = useState(false);
  const [isPriceChangeOpen, setIsPriceChangeOpen] = useState(false);
  const [isOfflinePaymentOpen, setIsOfflinePaymentOpen] = useState(false);

  // Timeline Granularity Switcher: 30-min detailed Gantt vs 1-hour executive summary
  const [granularity, setGranularity] = useState<"30MIN" | "60MIN">("30MIN");

  // NOW and Time References
  const nowColRef = useRef<HTMLTableCellElement | null>(null);
  const currentHour = new Date().getHours();
  const currentHourPrefix = String(currentHour).padStart(2, "0");
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const hoursHeader = useMemo(() => {
    if (granularity === "30MIN") {
      const list: string[] = [];
      for (let h = 6; h <= 23; h++) {
        const hh = String(h).padStart(2, "0");
        list.push(`${hh}:00`);
        list.push(`${hh}:30`);
      }
      return list;
    }
    return [
      "06:00",
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
      "23:00",
    ];
  }, [granularity]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const turfsRes = await api.get("/turfs/");
      const rawTurfs = turfsRes.data;
      const turfList: Turf[] = Array.isArray(rawTurfs)
        ? rawTurfs
        : Array.isArray(rawTurfs?.results)
          ? rawTurfs.results
          : [];
      const activeTurfs: Turf[] = turfList.filter((t: Turf) => t.is_active);
      setTurfs(activeTurfs);

      const rows: TurfScheduleRow[] = await Promise.all(
        activeTurfs.map(async (turf) => {
          try {
            const availRes = await api.get(
              `/turfs/${turf.id}/availability/?date=${selectedDate}`
            );
            return {
              turf,
              slots: availRes.data?.slots || [],
            };
          } catch (e) {
            return { turf, slots: [] };
          }
        })
      );
      setScheduleData(rows);
    } catch (err) {
      console.error(err);
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  // Premium Polish: Automatically scroll schedule horizontally to current time
  useEffect(() => {
    if (!loading && isToday && nowColRef.current) {
      const timer = setTimeout(() => {
        nowColRef.current?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, isToday, selectedDate]);

  // Premium Polish: Detect next upcoming booking
  const nextUpcomingSlotId = useMemo(() => {
    if (!isToday) return null;
    const nowTimeStr = `${String(new Date().getHours()).padStart(2, "0")}:${String(
      new Date().getMinutes()
    ).padStart(2, "0")}`;
    let candidate: { id: string; start_time: string } | null = null;

    for (const row of scheduleData) {
      for (const slot of row.slots) {
        if (slot.status === "BOOKED" && slot.start_time) {
          if (slot.start_time >= nowTimeStr) {
            if (!candidate || slot.start_time < candidate.start_time) {
              candidate = slot;
            }
          }
        }
      }
    }
    return candidate?.id || null;
  }, [scheduleData, isToday]);

  const changeDateBy = (days: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toISOString().split("T")[0]);
  };

  const handleSlotClick = async (turf: Turf, slot: SlotGridItem) => {
    if (slot.status === "BOOKED" && slot.booking_info) {
      try {
        const res = await api.get(`/bookings/${slot.booking_info.id}/`);
        setSelectedBooking(res.data);
      } catch (err) {
        setSelectedBooking({
          id: slot.booking_info.id,
          booking_id: slot.booking_info.booking_id,
          customer_details: {
            full_name: slot.booking_info.customer_name,
            phone: slot.booking_info.customer_phone,
          },
          turf_details: { name: turf.name },
          date: selectedDate,
          start_time: slot.start_time,
          end_time: slot.end_time,
          final_amount: slot.booking_info.amount_paid + slot.booking_info.balance_due,
          balance_due: slot.booking_info.balance_due,
          status: slot.booking_info.status,
        });
      }
      setIsDrawerOpen(true);
    } else if (slot.status === "AVAILABLE") {
      setQuickBookingTurf(turf);
      setQuickBookingSlot(slot);
      setPreselectedTurfId(Number(turf.id));
      setIsQuickBookingOpen(true);
    }
  };

  const getStatusColor = (status: string, isNextUp: boolean) => {
    if (isNextUp) {
      return "bg-indigo-50 text-indigo-900 border-indigo-400 ring-2 ring-indigo-500 shadow-xs";
    }
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-[#059669]";
      case "BOOKED":
        return "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 font-bold shadow-2xs";
      case "LOCKED":
        return "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100";
      case "MAINTENANCE":
      case "BLOCKED":
        return "bg-slate-700 text-white border-slate-800 cursor-not-allowed shadow-2xs font-semibold";
      default:
        return "bg-slate-50 text-slate-400 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Live Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Schedule & Operations Grid
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Click any open slot to book, or click any match to manage payments, rescheduling, and check-ins
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBlockSlotOpen(true)}
            leftIcon={<Lock className="w-3.5 h-3.5 text-amber-500" />}
          >
            Block Slot
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPriceChangeOpen(true)}
            leftIcon={<Sliders className="w-3.5 h-3.5 text-purple-500" />}
          >
            Change Price
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPreselectedTurfId(undefined);
              setIsNewBookingOpen(true);
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            + New Booking
          </Button>
        </div>
      </div>

      {/* Date Navigation & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeDateBy(-1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-600"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 border border-slate-200 rounded-xl bg-[#F8FAFC]">
            <CalendarIcon className="w-4 h-4 text-[#059669]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => changeDateBy(1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-600"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              isToday
                ? "bg-[#059669] text-white shadow-emerald-glow"
                : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeline View Granularity Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setGranularity("30MIN")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                granularity === "30MIN"
                  ? "bg-white text-[#059669] shadow-xs font-extrabold"
                  : "hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#059669]" />
              <span>30-Min Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setGranularity("60MIN")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                granularity === "60MIN"
                  ? "bg-white text-[#059669] shadow-xs font-extrabold"
                  : "hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
              <span>1-Hour Summary</span>
            </button>
          </div>

          {isToday && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Live Active</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSchedule}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Grid Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs px-1 text-slate-600 font-semibold">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-300" />
          <span>Available (Click to book)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-400" />
          <span>Customer Booked (Red)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-700 border border-slate-800" />
          <span>Admin / Business Blocked</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
          <span>Held in Checkout (5m)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-100 border-2 border-indigo-500" />
          <span>Next Upcoming Match</span>
        </div>
      </div>

      {/* Interactive Schedule Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((rowIdx) => (
                <div key={rowIdx} className="flex gap-3 items-center">
                  <Skeleton className="h-14 w-44 shrink-0" />
                  <div className="flex-1 grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slotIdx) => (
                      <Skeleton key={slotIdx} className="h-14 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : scheduleData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No active pitch facilities found.
          </div>
        ) : (
          <div className="overflow-x-auto relative w-full">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase">
                  <th className="p-4 sticky left-0 bg-slate-100 z-40 w-52 min-w-[210px] max-w-[210px] border-r border-b border-slate-200 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.1)] select-none">
                    Pitch Facility
                  </th>
                  {hoursHeader.map((timeHeader) => {
                    const isNowSlot =
                      isToday &&
                      (granularity === "30MIN"
                        ? timeHeader ===
                          `${currentHourPrefix}:${new Date().getMinutes() < 30 ? "00" : "30"}`
                        : timeHeader.startsWith(currentHourPrefix));
                    const isFullHour = timeHeader.endsWith(":00");

                    return (
                      <th
                        key={timeHeader}
                        ref={isNowSlot ? nowColRef : undefined}
                        className={`p-2.5 text-center min-w-[90px] border-r border-b transition ${
                          isNowSlot
                            ? "bg-[#059669] text-white font-black shadow-md border-emerald-600"
                            : isFullHour
                            ? "border-slate-200 text-slate-800 bg-slate-50 font-bold"
                            : "border-slate-100 text-slate-500 bg-slate-50/60 font-semibold"
                        }`}
                      >
                        {isNowSlot ? (
                          <div className="flex items-center justify-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>{timeHeader} • NOW</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center leading-tight">
                            <span>{timeHeader}</span>
                            {granularity === "30MIN" && (
                              <span className="text-[8px] tracking-widest text-slate-400 font-normal uppercase mt-0.5">
                                {timeHeader.slice(0, 2) >= "12" ? "PM" : "AM"}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="text-xs">
                {scheduleData.map(({ turf, slots }) => (
                  <tr key={turf.id} className="hover:bg-slate-50/50">
                    <td className="p-4 sticky left-0 bg-white border-r border-b border-slate-200 z-30 w-52 min-w-[210px] max-w-[210px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.1)] select-none">
                      <div className="font-bold text-slate-900 leading-snug">{turf.name}</div>
                      <div className="text-[11px] text-[#059669] font-bold">
                        {turf.sport_type} • ₹{turf.base_price}/hr
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {turf.slot_duration_minutes || 60}m base slots
                      </div>
                    </td>

                    {hoursHeader.map((timeHeader) => {
                      const isNowSlot =
                        isToday &&
                        (granularity === "30MIN"
                          ? timeHeader ===
                            `${currentHourPrefix}:${new Date().getMinutes() < 30 ? "00" : "30"}`
                          : timeHeader.startsWith(currentHourPrefix));

                      if (granularity === "30MIN") {
                        // 30-Minute Granular View: 1 clean card per exact timestamp
                        const matchingSlot = slots.find((s) =>
                          s.start_time?.startsWith(timeHeader)
                        );

                        if (!matchingSlot) {
                          return (
                            <td
                              key={timeHeader}
                              className={`p-2 text-center border-r border-b text-slate-300 text-[11px] ${
                                isNowSlot
                                  ? "bg-emerald-50/50 border-r-2 border-emerald-300"
                                  : "border-slate-100 bg-slate-50/40"
                              }`}
                            >
                              —
                            </td>
                          );
                        }

                        const isNextUp = matchingSlot.id === nextUpcomingSlotId;

                        return (
                          <td
                            key={timeHeader}
                            className={`p-1.5 border-r border-b text-center ${
                              isNowSlot
                                ? "bg-emerald-50/40 border-r-2 border-emerald-300"
                                : "border-slate-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSlotClick(turf, matchingSlot)}
                              className={`w-full h-14 p-1.5 rounded-xl border text-[11px] flex flex-col items-center justify-between transition cursor-pointer relative overflow-hidden ${getStatusColor(
                                matchingSlot.status,
                                isNextUp
                              )}`}
                            >
                              {/* Header Row with Times & Optional In-Card Next Up Pill */}
                              <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold leading-none">
                                <span className={isNextUp ? "text-indigo-950 font-black" : "text-slate-500"}>
                                  {matchingSlot.start_time.slice(0, 5)}
                                </span>
                                {isNextUp ? (
                                  <span className="px-1 py-0.5 rounded bg-indigo-600 text-white text-[7.5px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                    <Zap className="w-2 h-2 fill-white" />
                                    <span>Next</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    {matchingSlot.end_time.slice(0, 5)}
                                  </span>
                                )}
                              </div>

                              {matchingSlot.status === "AVAILABLE" && (
                                <>
                                  <span className="font-extrabold text-xs leading-none">₹{matchingSlot.price}</span>
                                  <span className="text-[9px] uppercase font-black text-emerald-700 leading-none">
                                    + Book
                                  </span>
                                </>
                              )}

                              {matchingSlot.status === "BOOKED" && (
                                <>
                                  <span className="font-black truncate max-w-[75px] leading-tight text-slate-900">
                                    {matchingSlot.booking_info?.customer_name?.split(" ")[0] || "Booked"}
                                  </span>
                                  {isNextUp ? (
                                    <span className="text-[8px] font-black text-indigo-700 leading-none">
                                      {formatRelativeTime(selectedDate, matchingSlot.start_time)}
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-black text-rose-700 leading-none uppercase">
                                      {matchingSlot.booking_info?.status || "CONFIRMED"}
                                    </span>
                                  )}
                                </>
                              )}

                              {matchingSlot.status === "LOCKED" && (
                                <span className="font-bold text-[9px] text-amber-700 leading-tight">Held (10m)</span>
                              )}

                              {(matchingSlot.status === "MAINTENANCE" ||
                                matchingSlot.status === "BLOCKED") && (
                                <span className="font-bold text-[9px] text-slate-400 leading-tight">
                                  Blocked
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      }

                      // 1-Hour Executive Summary View
                      const hourPrefix = timeHeader.slice(0, 2);
                      const matchingSlots = slots.filter((s) =>
                        s.start_time?.startsWith(hourPrefix + ":")
                      );

                      if (matchingSlots.length === 0) {
                        return (
                          <td
                            key={timeHeader}
                            className={`p-2 text-center border-r border-b text-slate-300 text-[11px] ${
                              isNowSlot
                                ? "bg-emerald-50/50 border-r-2 border-emerald-300"
                                : "border-slate-100 bg-slate-50/40"
                            }`}
                          >
                            —
                          </td>
                        );
                      }

                      if (matchingSlots.length === 1) {
                        const singleSlot = matchingSlots[0];
                        const isNextUp = singleSlot.id === nextUpcomingSlotId;
                        return (
                          <td
                            key={timeHeader}
                            className={`p-1.5 border-r border-b text-center ${
                              isNowSlot
                                ? "bg-emerald-50/40 border-r-2 border-emerald-300"
                                : "border-slate-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSlotClick(turf, singleSlot)}
                              className={`w-full h-14 p-1.5 rounded-xl border text-[11px] flex flex-col items-center justify-between transition cursor-pointer relative overflow-hidden ${getStatusColor(
                                singleSlot.status,
                                isNextUp
                              )}`}
                            >
                              <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold leading-none">
                                <span className={isNextUp ? "text-indigo-950 font-black" : "text-slate-500"}>
                                  {singleSlot.start_time.slice(0, 5)}
                                </span>
                                {isNextUp ? (
                                  <span className="px-1 py-0.5 rounded bg-indigo-600 text-white text-[7.5px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                    <Zap className="w-2 h-2 fill-white" />
                                    <span>Next</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    {singleSlot.end_time.slice(0, 5)}
                                  </span>
                                )}
                              </div>
                              {singleSlot.status === "AVAILABLE" && (
                                <>
                                  <span className="font-extrabold text-xs">₹{singleSlot.price}</span>
                                  <span className="text-[9px] uppercase font-black text-emerald-700">+ Book</span>
                                </>
                              )}
                              {singleSlot.status === "BOOKED" && (
                                <>
                                  <span className="font-black truncate max-w-[75px]">
                                    {singleSlot.booking_info?.customer_name?.split(" ")[0] || "Booked"}
                                  </span>
                                  <span className="text-[8px] font-black text-rose-700 uppercase">
                                    {singleSlot.booking_info?.status || "CONFIRMED"}
                                  </span>
                                </>
                              )}
                            </button>
                          </td>
                        );
                      }

                      // 2 slots in this hour (30m pitch)
                      const [s1, s2] = matchingSlots;
                      const bothAvailable = s1.status === "AVAILABLE" && s2.status === "AVAILABLE";
                      const bothBookedSame =
                        s1.status === "BOOKED" &&
                        s2.status === "BOOKED" &&
                        s1.booking_info?.id === s2.booking_info?.id;

                      return (
                        <td
                          key={timeHeader}
                          className={`p-1.5 border-r border-b text-center ${
                            isNowSlot
                              ? "bg-emerald-50/40 border-r-2 border-emerald-300"
                              : "border-slate-100"
                          }`}
                        >
                          {bothAvailable ? (
                            <div className="w-full h-14 rounded-xl border border-emerald-200 bg-emerald-50/70 p-1 flex flex-col justify-between hover:border-[#059669] transition shadow-2xs">
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 px-0.5">
                                <span>{timeHeader}</span>
                                <span className="text-[#059669] font-black">₹{Number(s1.price) + Number(s2.price)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(turf, s1)}
                                  className="py-1 rounded-lg bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200/80 text-[9px] font-black transition text-slate-700 cursor-pointer shadow-2xs"
                                >
                                  :00
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(turf, s2)}
                                  className="py-1 rounded-lg bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200/80 text-[9px] font-black transition text-slate-700 cursor-pointer shadow-2xs"
                                >
                                  :30
                                </button>
                              </div>
                            </div>
                          ) : bothBookedSame ? (
                            <button
                              type="button"
                              onClick={() => handleSlotClick(turf, s1)}
                              className="w-full h-14 p-1 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 flex flex-col items-center justify-between hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                            >
                              <span className="text-[9px] font-mono text-rose-600 font-bold">{timeHeader} (60m)</span>
                              <span className="text-xs font-black truncate max-w-[75px]">
                                {s1.booking_info?.customer_name?.split(" ")[0] || "Booked"}
                              </span>
                              <span className="text-[8px] font-black text-rose-700 uppercase">CONFIRMED</span>
                            </button>
                          ) : (
                            <div className="w-full h-14 rounded-xl border border-slate-200 overflow-hidden grid grid-cols-2 divide-x divide-slate-200 shadow-2xs">
                              {[s1, s2].map((slotItem, idx) => (
                                <button
                                  key={slotItem.id}
                                  type="button"
                                  onClick={() => handleSlotClick(turf, slotItem)}
                                  className={`h-full p-1 flex flex-col items-center justify-between transition cursor-pointer ${getStatusColor(
                                    slotItem.status,
                                    slotItem.id === nextUpcomingSlotId
                                  )}`}
                                >
                                  <span className="text-[8px] font-mono font-bold">{idx === 0 ? ":00" : ":30"}</span>
                                  {slotItem.status === "AVAILABLE" ? (
                                    <>
                                      <span className="font-extrabold text-[10px]">₹{slotItem.price}</span>
                                      <span className="text-[8px] font-black uppercase text-emerald-700">+ Book</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-bold text-[9px] truncate max-w-[34px]">
                                        {slotItem.booking_info?.customer_name?.split(" ")[0] || "Booked"}
                                      </span>
                                      <span className="text-[7px] font-black uppercase text-rose-700">Booked</span>
                                    </>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & Drawer */}
      <DirectAdminBookingModal
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        turf={quickBookingTurf}
        slot={quickBookingSlot}
        allSlots={scheduleData.find((r) => r.turf.id === quickBookingTurf?.id)?.slots || []}
        date={selectedDate}
        onSuccess={fetchSchedule}
        onOpenAdvancedWizard={() => {
          setIsQuickBookingOpen(false);
          setIsNewBookingOpen(true);
        }}
        onBlockSlot={() => {
          setIsQuickBookingOpen(false);
          setIsBlockSlotOpen(true);
        }}
      />

      <NewBookingWizardModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        defaultDate={selectedDate}
        defaultTurfId={preselectedTurfId}
        onBookingCreated={fetchSchedule}
      />

      <RecordOfflinePaymentModal
        isOpen={isOfflinePaymentOpen}
        onClose={() => setIsOfflinePaymentOpen(false)}
        onPaymentSuccess={fetchSchedule}
      />

      <QuickBlockSlotModal
        isOpen={isBlockSlotOpen}
        onClose={() => setIsBlockSlotOpen(false)}
        onSlotBlocked={fetchSchedule}
      />

      <QuickPriceChangeModal
        isOpen={isPriceChangeOpen}
        onClose={() => setIsPriceChangeOpen(false)}
        onPriceUpdated={fetchSchedule}
      />

      <ContextualBookingDrawer
        isOpen={isDrawerOpen}
        booking={selectedBooking}
        onClose={() => setIsDrawerOpen(false)}
        onBookingUpdated={fetchSchedule}
        onRecordPaymentClick={(id) => {
          setIsDrawerOpen(false);
          setIsOfflinePaymentOpen(true);
        }}
      />
    </div>
  );
};
