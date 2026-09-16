import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
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

  const [isBlockSlotOpen, setIsBlockSlotOpen] = useState(false);
  const [isPriceChangeOpen, setIsPriceChangeOpen] = useState(false);
  const [isOfflinePaymentOpen, setIsOfflinePaymentOpen] = useState(false);

  // NOW and Time References
  const nowColRef = useRef<HTMLTableCellElement | null>(null);
  const currentHour = new Date().getHours();
  const currentHourPrefix = String(currentHour).padStart(2, "0");
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const hoursHeader = [
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
      setPreselectedTurfId(Number(turf.id));
      setIsNewBookingOpen(true);
    }
  };

  const getStatusColor = (status: string, isNextUp: boolean) => {
    if (isNextUp) {
      return "bg-indigo-50 text-indigo-900 border-indigo-400 ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20";
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
        return "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed";
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

        <div className="flex items-center space-x-3">
          {isToday && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Live Timeline Active</span>
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
          <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-300" />
          <span>Booked Match (Click to manage)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-100 border-2 border-indigo-500" />
          <span>Next Upcoming Match</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-200 border border-slate-300" />
          <span>Maintenance / Blocked</span>
        </div>
      </div>

      {/* Interactive Schedule Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          /* Premium Polish: Skeleton Table Loading State */
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                  <th className="p-4 sticky left-0 bg-slate-50 z-20 w-48 border-r border-slate-200 shadow-2xs">
                    Pitch Facility
                  </th>
                  {hoursHeader.map((hour) => {
                    const isNowHour = isToday && hour.startsWith(currentHourPrefix);
                    return (
                      <th
                        key={hour}
                        ref={isNowHour ? nowColRef : undefined}
                        className={`p-3 text-center min-w-[95px] border-r transition ${
                          isNowHour
                            ? "bg-[#059669] text-white font-black shadow-md border-emerald-600"
                            : "border-slate-100 text-slate-600"
                        }`}
                      >
                        {isNowHour ? (
                          <div className="flex items-center justify-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>{hour} • NOW</span>
                          </div>
                        ) : (
                          hour
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {scheduleData.map(({ turf, slots }) => (
                  <tr key={turf.id} className="hover:bg-slate-50/50">
                    <td className="p-4 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-2xs">
                      <div className="font-bold text-slate-900">{turf.name}</div>
                      <div className="text-[11px] text-[#059669] font-bold">
                        {turf.sport_type} • ₹{turf.base_price}/hr
                      </div>
                    </td>

                    {hoursHeader.map((hour) => {
                      const isNowHour = isToday && hour.startsWith(currentHourPrefix);
                      const matchingSlot = slots.find((s) =>
                        s.start_time?.startsWith(hour)
                      );

                      if (!matchingSlot) {
                        return (
                          <td
                            key={hour}
                            className={`p-2 text-center border-r text-slate-300 text-[11px] ${
                              isNowHour
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
                          key={hour}
                          className={`p-1.5 border-r text-center ${
                            isNowHour
                              ? "bg-emerald-50/40 border-r-2 border-emerald-300"
                              : "border-slate-100"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSlotClick(turf, matchingSlot)}
                            className={`w-full h-14 p-1 rounded-xl border text-[11px] flex flex-col items-center justify-center transition cursor-pointer relative ${getStatusColor(
                              matchingSlot.status,
                              isNextUp
                            )}`}
                          >
                            {/* Premium Polish: NEXT UP Badge */}
                            {isNextUp && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 whitespace-nowrap">
                                <Zap className="w-2 h-2 fill-white" />
                                <span>Next Up</span>
                              </span>
                            )}

                            {matchingSlot.status === "AVAILABLE" && (
                              <>
                                <span className="font-bold">₹{matchingSlot.price}</span>
                                <span className="text-[9px] uppercase font-bold text-emerald-700">
                                  + Book
                                </span>
                              </>
                            )}

                            {matchingSlot.status === "BOOKED" && (
                              <>
                                <span className="font-extrabold truncate max-w-[80px]">
                                  {matchingSlot.booking_info?.customer_name?.split(" ")[0] || "Booked"}
                                </span>
                                {isNextUp ? (
                                  <span className="text-[9px] font-black text-indigo-700">
                                    {formatRelativeTime(selectedDate, matchingSlot.start_time)}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-rose-700">
                                    {matchingSlot.booking_info?.status || "CONFIRMED"}
                                  </span>
                                )}
                              </>
                            )}

                            {matchingSlot.status === "LOCKED" && (
                              <span className="font-bold text-[10px] text-amber-700">Held (10m)</span>
                            )}

                            {(matchingSlot.status === "MAINTENANCE" ||
                              matchingSlot.status === "BLOCKED") && (
                              <span className="font-bold text-[10px] text-slate-400">
                                Blocked
                              </span>
                            )}
                          </button>
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
