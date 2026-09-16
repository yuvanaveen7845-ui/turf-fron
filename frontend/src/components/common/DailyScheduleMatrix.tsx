import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Flame,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { useSlotRealtime } from "../../hooks/useRealtime";

interface ScheduleSlot {
  id: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "LOCKED" | "MAINTENANCE";
  price: number;
  is_available: boolean;
}

interface ScheduleTurf {
  id: string;
  name: string;
  slug: string;
  sport_type: string;
  base_price: number;
  capacity: number;
  dimensions: string;
  surface_spec: string;
  lighting_spec: string;
  available_slots_count: number;
  is_fast_fill: boolean;
  slots: ScheduleSlot[];
}

interface DailyScheduleMatrixProps {
  initialDate?: string;
  selectedSport?: string;
  compact?: boolean;
}

export const DailyScheduleMatrix: React.FC<DailyScheduleMatrixProps> = ({
  initialDate,
  selectedSport = "ALL",
  compact = false,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || (() => new Date().toISOString().split("T")[0])
  );
  const [scheduleTurfs, setScheduleTurfs] = useState<ScheduleTurf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>("ALL");

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const fetchSchedule = () => {
    const sportParam = selectedSport && selectedSport !== "ALL" ? `&sport_type=${selectedSport}` : "";
    api
      .get(`/turfs/schedule/?date=${selectedDate}${sportParam}`)
      .then((res) => {
        setScheduleTurfs(res.data.turfs || []);
      })
      .catch((err) => console.error("Failed to load schedule matrix:", err));
  };

  useEffect(() => {
    setLoading(true);
    const sportParam = selectedSport && selectedSport !== "ALL" ? `&sport_type=${selectedSport}` : "";
    api
      .get(`/turfs/schedule/?date=${selectedDate}${sportParam}`)
      .then((res) => {
        setScheduleTurfs(res.data.turfs || []);
      })
      .catch((err) => console.error("Failed to load schedule matrix:", err))
      .finally(() => setLoading(false));
  }, [selectedDate, selectedSport]);

  // Live Realtime Synchronization for Daily Matrix
  useSlotRealtime(undefined, selectedDate, () => {
    fetchSchedule();
  });

  const filterSlotsByTime = (slots: ScheduleSlot[]) => {
    if (selectedTimeFilter === "MORNING") {
      return slots.filter((s) => s.start_time >= "06:00" && s.start_time < "12:00");
    }
    if (selectedTimeFilter === "AFTERNOON") {
      return slots.filter((s) => s.start_time >= "12:00" && s.start_time < "17:00");
    }
    if (selectedTimeFilter === "NIGHT") {
      return slots.filter((s) => s.start_time >= "17:00");
    }
    return slots;
  };

  const formatTimeSlot = (timeStr: string) => {
    const parts = timeStr.split(":");
    const hour = parseInt(parts[0], 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${parts[1]} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-pitch-card overflow-hidden">
      {/* 1. Header with Title & Date Switcher */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F8FAFC]/50">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Ground Schedule</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Today & Upcoming Pitch Availability
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time slots across Pitch 1, Pitch 2, and Pitch 3 at Friends Turf Sports Complex.
          </p>
        </div>

        {/* Date & Time of Day Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDate === tomorrowStr
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tomorrow
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={todayStr}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-sm focus:border-[#059669] outline-none cursor-pointer"
          />

          {/* Time Filter */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedTimeFilter("ALL")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedTimeFilter === "ALL"
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeFilter("MORNING")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedTimeFilter === "MORNING"
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Morning
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeFilter("AFTERNOON")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedTimeFilter === "AFTERNOON"
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Afternoon
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeFilter("NIGHT")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedTimeFilter === "NIGHT"
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Night (Floodlit)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Schedule Grid Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 rounded-2xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : scheduleTurfs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No pitches found matching your criteria.
          </div>
        ) : (
          <div className="space-y-6">
            {scheduleTurfs.map((turf) => {
              const filteredSlots = filterSlotsByTime(turf.slots);
              const availableCount = filteredSlots.filter((s) => s.is_available).length;

              return (
                <div
                  key={turf.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 transition-all hover:border-emerald-300"
                >
                  {/* Pitch Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-extrabold uppercase tracking-wide">
                          {turf.sport_type}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900">
                          {turf.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                        <span>{turf.dimensions}</span>
                        <span>•</span>
                        <span>{turf.surface_spec ? turf.surface_spec.split(" ")[0] : "50mm"} Turf</span>
                        <span>•</span>
                        <span className="text-[#059669] font-bold">
                          {availableCount} slots open
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-semibold block">Base Rate</span>
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{Number(turf.base_price).toLocaleString("en-IN")}/hr
                        </span>
                      </div>
                      <Link
                        to={`/turfs/${turf.id}`}
                        className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-sm"
                      >
                        <span>View Pitch</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Slot Pills Horizontal Scrollable / Wrap Strip */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Available Time Slots ({filteredSlots.length})
                      </span>
                      <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-[#059669]" />
                          <span>Available</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                          <span>Booked</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>Locked</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {filteredSlots.map((slot) => {
                        const isAvail = slot.is_available;
                        const isLocked = slot.status === "LOCKED";
                        const isBooked = slot.status === "BOOKED";

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!isAvail}
                            onClick={() => navigate(`/turfs/${turf.id}`)}
                            title={
                              isAvail
                                ? `Click to book ${formatTimeSlot(slot.start_time)} (₹${slot.price})`
                                : slot.status
                            }
                            className={`group px-3 py-2 rounded-xl text-left transition-all text-xs font-semibold cursor-pointer ${
                              isAvail
                                ? "bg-emerald-50 hover:bg-[#059669] hover:text-white border border-emerald-200 text-[#059669] hover:shadow-emerald-glow"
                                : isLocked
                                  ? "bg-amber-50 border border-amber-200 text-amber-800 cursor-not-allowed opacity-80"
                                  : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed line-through"
                            }`}
                          >
                            <div className="font-bold whitespace-nowrap">
                              {formatTimeSlot(slot.start_time)}
                            </div>
                            <div className="text-[10px] mt-0.5 opacity-80">
                              {isAvail ? `₹${Number(slot.price)}` : slot.status.toLowerCase()}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Footer Strip */}
      <div className="p-4 bg-[#F8FAFC] border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center space-x-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
          <span>Direct booking with guaranteed 5-minute checkout lock</span>
        </span>
        <Link
          to="/turfs"
          className="font-bold text-[#059669] hover:underline flex items-center space-x-1"
        >
          <span>See all pitches & detailed specs</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
