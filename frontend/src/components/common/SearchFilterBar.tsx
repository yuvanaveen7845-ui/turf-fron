import React from "react";
import { Calendar, Clock, Sparkles, Zap, ShieldCheck, Check } from "lucide-react";
import { Turf } from "../../types";

interface SearchFilterBarProps {
  turfs?: Turf[];
  selectedTurfId?: string | number;
  onSelectTurfId?: (turfId: string | number) => void;
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSession?: string;
  onSessionChange?: (session: string) => void;
  onSearchSubmit: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  turfs = [],
  selectedTurfId,
  onSelectTurfId,
  selectedSport,
  onSelectSport,
  selectedDate,
  onDateChange,
  selectedSession = "ALL",
  onSessionChange,
  onSearchSubmit,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const sessions = [
    { id: "ALL", label: "All Match Hours" },
    { id: "MORNING", label: "🌅 Morning (6am – 12pm)" },
    { id: "AFTERNOON", label: "☀️ Afternoon (12pm – 5pm)" },
    { id: "NIGHT", label: "🌙 Floodlit Night (5pm – 11pm)" },
  ];

  // Default fallback pitches if turfs list is loading
  const defaultPitches = [
    {
      id: "1",
      name: "Pitch 1 — Champions Arena",
      sport_type: "FOOTBALL",
      sport_label: "⚽ 7v7 Football",
      surface: "50mm FIFA Turf",
      base_price: 1400,
    },
    {
      id: "2",
      name: "Pitch 2 — Legends Arena",
      sport_type: "CRICKET",
      sport_label: "🏏 Box Cricket & Futsal",
      surface: "High-Bounce Turf",
      base_price: 1200,
    },
    {
      id: "3",
      name: "Pitch 3 — Strikers Arena",
      sport_type: "MULTI_SPORT",
      sport_label: "🏟️ Multi-Sport Dome",
      surface: "All-Weather Turf",
      base_price: 1600,
    },
  ];

  const displayPitches = turfs.length > 0
    ? turfs.slice(0, 3).map((t) => ({
        id: String(t.id),
        name: t.name,
        sport_type: t.sport_type,
        sport_label:
          t.sport_type === "FOOTBALL"
            ? "⚽ 7v7 Football"
            : t.sport_type === "CRICKET"
            ? "🏏 Box Cricket"
            : "🏟️ Multi-Sport Arena",
        surface: t.surface_spec ? t.surface_spec.split(" ")[0] + " Grass" : "FIFA Standard",
        base_price: Number(t.base_price),
      }))
    : defaultPitches;

  const currentActiveId = String(selectedTurfId || displayPitches[0]?.id || "1");
  const activePitch = displayPitches.find((p) => p.id === currentActiveId) || displayPitches[0];

  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;

  const dateLabel = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : new Date(selectedDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-7 space-y-6">
      {/* ─── 1. Pitch / Arena Selector Header ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <span>Select Pitch / Arena</span>
          </label>
          <span className="text-[11px] font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● 3 Pitches Available
          </span>
        </div>

        {/* Spacious Responsive Pitch Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {displayPitches.map((pitch) => {
            const isSelected = pitch.id === currentActiveId;
            return (
              <button
                key={pitch.id}
                type="button"
                onClick={() => {
                  if (onSelectTurfId) onSelectTurfId(pitch.id);
                  onSelectSport(pitch.sport_type);
                }}
                className={`p-4 sm:p-5 rounded-2xl text-left border-2 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3 group ${
                  isSelected
                    ? "bg-gradient-to-br from-[#059669] via-[#047857] to-[#065F46] border-emerald-400 text-white shadow-xl shadow-emerald-950/20 ring-4 ring-emerald-500/20 scale-[1.02]"
                    : "bg-white hover:bg-slate-50 border-slate-200/90 hover:border-emerald-400/80 text-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Top Badge & Status Indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center space-x-1 ${
                      isSelected
                        ? "bg-white/20 border-white/30 text-white backdrop-blur-md"
                        : "bg-emerald-50 border-emerald-200 text-[#059669]"
                    }`}
                  >
                    <span>{pitch.sport_label}</span>
                  </span>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-white text-[#059669] flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>

                {/* Pitch Title */}
                <div>
                  <h3
                    className={`text-base font-black tracking-tight leading-snug ${
                      isSelected ? "text-white" : "text-slate-900 group-hover:text-[#059669] transition-colors"
                    }`}
                  >
                    {pitch.name}
                  </h3>
                </div>

                {/* Bottom Specifications & Pricing Row */}
                <div
                  className={`flex items-center justify-between pt-3 border-t ${
                    isSelected ? "border-white/20" : "border-slate-100"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? "text-emerald-100" : "text-slate-500"
                    }`}
                  >
                    {pitch.surface}
                  </span>

                  {isSelected ? (
                    <div className="px-3 py-1 rounded-xl bg-white text-slate-900 shadow-sm flex items-center space-x-0.5">
                      <span className="text-sm font-black">
                        ₹{pitch.base_price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        /hr
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">
                        ₹{pitch.base_price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 ml-0.5">
                        /hr
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Match Date & Time Session Controls ────────────────── */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
            2
          </span>
          <span>Match Date & Session</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Quick Date Tabs & Native Picker */}
          <div className="sm:col-span-7 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onDateChange(todayStr)}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isToday
                  ? "bg-[#059669] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => onDateChange(tomorrowStr)}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isTomorrow
                  ? "bg-[#059669] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tomorrow
            </button>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#059669]">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={todayStr}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Time Session Dropdown */}
          <div className="sm:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#059669]">
              <Clock className="w-4 h-4" />
            </div>
            <select
              value={selectedSession}
              onChange={(e) => onSessionChange && onSessionChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none cursor-pointer"
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Full-Width Direct Booking CTA ─────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSearchSubmit}
          className="w-full py-4 px-6 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-emerald-glow transition-all duration-200 active:scale-[0.99] cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>
            Select Slots on {activePitch?.name.split("—")[0].trim() || "Pitch"} for {dateLabel} →
          </span>
        </button>
        <p className="text-[11px] text-center text-slate-400 font-semibold mt-2">
          ⚡ 5-Minute Slot Hold Lock Guaranteed • Zero Double Bookings • Instant Pass
        </p>
      </div>
    </div>
  );
};
