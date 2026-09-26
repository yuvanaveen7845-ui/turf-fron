import React from "react";
import {
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  QrCode,
  CalendarCheck2,
} from "lucide-react";
import { Turf } from "../../types";
import { triggerHaptic } from "../../utils/haptics";

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
    { id: "MORNING", label: "Morning (06:00 – 12:00)" },
    { id: "AFTERNOON", label: "Afternoon (12:00 – 17:00)" },
    { id: "NIGHT", label: "Floodlit Evening (17:00 – 23:00)" },
  ];

  const displayPitches = turfs.slice(0, 3).map((t) => ({
    id: String(t.id),
    name: t.name,
    sport_type: t.sport_type,
    sport_label:
      t.sport_type === "FOOTBALL"
        ? "7v7 Football"
        : t.sport_type === "CRICKET"
        ? "Box Cricket"
        : "Multi-Sport Arena",
    surface: t.surface_spec ? t.surface_spec.split(" ")[0] + " Grass" : "FIFA Standard",
    base_price: Number(t.base_price),
  }));

  const matchedPitchBySport = selectedSport
    ? displayPitches.find((p) => p.sport_type.toUpperCase() === selectedSport.toUpperCase())
    : null;

  const currentActiveId = selectedTurfId
    ? String(selectedTurfId)
    : matchedPitchBySport
    ? String(matchedPitchBySport.id)
    : String(displayPitches[0]?.id || "");

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
    <div className="relative w-full bg-white/65 sm:bg-white/70 backdrop-blur-3xl backdrop-saturate-200 rounded-3xl border border-white/80 shadow-[0_32px_84px_rgba(15,23,42,0.12),0_8px_24px_rgba(15,23,42,0.06),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(15,23,42,0.03)] ring-1 ring-slate-900/[0.05] p-5 sm:p-7 space-y-6 overflow-hidden">
      {/* Top Specular Gradient Highlight Accent */}
      <div className="absolute top-0 inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-[#10B981]/70 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-24 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
      
      {/* Dynamic Ambient Glowing Light Pools for Real Optical Frosted Diffusion */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-gradient-to-br from-emerald-400/25 to-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-gradient-to-tl from-teal-400/20 via-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ─── 1. Pitch / Arena Selector Header ───────────────────────── */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
            <span className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-[#059669] to-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs ring-2 ring-emerald-500/20">
              1
            </span>
            <span>Select Pitch / Arena</span>
          </label>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-white/80 text-[11px] font-bold text-[#059669] shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>{turfs.length} {turfs.length === 1 ? "Pitch" : "Pitches"} Available</span>
          </span>
        </div>

        {/* Spacious Responsive Pitch Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {displayPitches.length === 0 ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/40 border border-white/60 animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold"
              >
                Loading arenas...
              </div>
            ))
          ) : (
            displayPitches.map((pitch) => {
              const isSelected = pitch.id === currentActiveId;
            return (
              <button
                key={pitch.id}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  if (onSelectTurfId) onSelectTurfId(pitch.id);
                  onSelectSport(pitch.sport_type);
                }}
                className={`p-4 sm:p-5 rounded-2xl text-left border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3.5 group active:scale-[0.98] ${
                  isSelected
                    ? "bg-gradient-to-br from-emerald-600/70 via-emerald-600/55 to-teal-800/70 backdrop-blur-2xl backdrop-saturate-200 border border-white/50 border-t-white/80 border-l-white/60 border-b-emerald-400/30 text-white shadow-[0_22px_48px_rgba(5,150,105,0.36),0_6px_16px_rgba(5,150,105,0.2),inset_0_1.5px_1.5px_rgba(255,255,255,0.7),inset_0_-1.5px_2px_rgba(0,0,0,0.2)] ring-4 ring-emerald-400/25 scale-[1.02]"
                    : "bg-white/45 hover:bg-emerald-500/10 backdrop-blur-xl border-white/80 hover:border-emerald-400/60 text-slate-800 shadow-[0_4px_16px_rgba(15,23,42,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)] hover:shadow-[0_16px_36px_rgba(5,150,105,0.18)] hover:-translate-y-1"
                }`}
              >
                {/* Active Green Glassmorphic Light Flares, Optical Diffusion & Specular Sheen */}
                {isSelected && (
                  <>
                    {/* Ambient Colored Light Pools for Optical Refraction */}
                    <div className="absolute -top-14 -left-12 w-44 h-44 bg-emerald-300/45 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -right-10 w-44 h-44 bg-teal-200/35 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 bg-emerald-400/25 rounded-full blur-xl pointer-events-none" />
                    
                    {/* High-Gloss Diagonal Specular Glass Reflection Layer */}
                    <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0.08)_32%,transparent_65%)] pointer-events-none rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/15 pointer-events-none rounded-2xl" />
                    
                    {/* Top Beveled Specular Glass Rim Light */}
                    <div className="absolute top-0 inset-x-3 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
                  </>
                )}

                {/* Top Badge & Status Indicator */}
                <div className="flex items-center justify-between relative z-10">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-flex items-center space-x-1 transition-all ${
                      isSelected
                        ? "bg-white/20 backdrop-blur-xl border-white/40 text-white shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.6)]"
                        : "bg-white/60 group-hover:bg-emerald-50/80 border-white/80 group-hover:border-emerald-200/80 text-slate-700 group-hover:text-[#059669] backdrop-blur-md shadow-2xs"
                    }`}
                  >
                    <span>{pitch.sport_label}</span>
                  </span>

                  {isSelected ? (
                    <div className="w-6.5 h-6.5 rounded-full bg-white/90 backdrop-blur-xl text-[#059669] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-white/90 ring-2 ring-white/30">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform ring-2 ring-emerald-500/20" />
                  )}
                </div>

                {/* Pitch Title */}
                <div className="relative z-10">
                  <h3
                    className={`text-base font-black tracking-tight leading-snug transition-colors ${
                      isSelected
                        ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
                        : "text-slate-900 group-hover:text-[#059669]"
                    }`}
                  >
                    {pitch.name}
                  </h3>
                </div>

                {/* Bottom Specifications & Pricing Row */}
                <div
                  className={`flex items-center justify-between pt-3 border-t relative z-10 ${
                    isSelected ? "border-white/25" : "border-slate-200/40"
                  }`}
                >
                  {isSelected ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-950/20 backdrop-blur-md border border-white/30 text-emerald-50 text-[11px] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                      {pitch.surface}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                      {pitch.surface}
                    </span>
                  )}

                  {isSelected ? (
                    <div className="px-3.5 py-1 rounded-xl bg-white/90 backdrop-blur-xl text-slate-900 shadow-[0_6px_18px_rgba(0,0,0,0.12),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center space-x-0.5 border border-white/95">
                      <span className="text-sm font-black font-mono text-slate-950">
                        ₹{pitch.base_price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        /hr
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-base font-black font-mono text-slate-900 group-hover:text-[#059669] transition-colors">
                        ₹{pitch.base_price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 ml-0.5">
                        /hr
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
        </div>
      </div>

      {/* ─── 2. Match Date & Time Session Controls ────────────────── */}
      <div className="space-y-3 pt-3 border-t border-slate-200/50 relative z-10">
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
          <span className="w-5.5 h-5.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-xs ring-2 ring-slate-900/10">
            2
          </span>
          <span>Match Date & Session</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Quick Date Tabs & Native Picker */}
          <div className="sm:col-span-7 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onDateChange(todayStr);
              }}
              className={`px-4 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isToday
                  ? "bg-gradient-to-r from-[#059669] to-emerald-600 text-white shadow-[0_4px_16px_rgba(5,150,105,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-2 ring-emerald-500/30 font-black"
                  : "bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/80 hover:border-emerald-300/60 text-slate-700 hover:text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)]"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onDateChange(tomorrowStr);
              }}
              className={`px-4 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isTomorrow
                  ? "bg-gradient-to-r from-[#059669] to-emerald-600 text-white shadow-[0_4px_16px_rgba(5,150,105,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-2 ring-emerald-500/30 font-black"
                  : "bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/80 hover:border-emerald-300/60 text-slate-700 hover:text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)]"
              }`}
            >
              Tomorrow
            </button>

            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#059669]">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={todayStr}
                className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-white/50 hover:bg-white/75 focus:bg-white/90 backdrop-blur-md border border-white/80 focus:border-[#059669] focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-900 font-bold outline-none transition-all cursor-pointer shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]"
              />
            </div>
          </div>

          {/* Time Session Dropdown */}
          <div className="sm:col-span-5 relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#059669]">
              <Clock className="w-4 h-4" />
            </div>
            <select
              value={selectedSession}
              onChange={(e) => onSessionChange && onSessionChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-white/50 hover:bg-white/75 focus:bg-white/90 backdrop-blur-md border border-white/80 focus:border-[#059669] focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-900 font-bold outline-none transition-all appearance-none cursor-pointer shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]"
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Full-Width Direct Booking CTA ─────────────────────── */}
      <div className="pt-2 relative z-10">
        <button
          type="button"
          onClick={onSearchSubmit}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#059669] via-emerald-600 to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-[0_14px_34px_rgba(5,150,105,0.38),0_2px_6px_rgba(5,150,105,0.2),inset_0_1.5px_1px_rgba(255,255,255,0.45)] hover:shadow-[0_18px_40px_rgba(5,150,105,0.48)] border border-emerald-400/40 transition-all duration-200 active:scale-[0.99] cursor-pointer group"
        >
          <CalendarCheck2 className="w-5 h-5 text-emerald-100 group-hover:scale-105 transition-transform" />
          <span className="tracking-tight">
            Select Slots on {activePitch?.name.split("—")[0].trim() || "Pitch"} for {dateLabel}
          </span>
          <ArrowRight className="w-4.5 h-4.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Reassurance & Trust Guarantee Frosted Micro-Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-md border border-white/80 text-[11px] font-bold text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)] transition-all">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>5-Minute Slot Hold Lock Guaranteed</span>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-md border border-white/80 text-[11px] font-bold text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)] transition-all">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
            <span>Zero Double Bookings</span>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-md border border-white/80 text-[11px] font-bold text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)] transition-all">
            <QrCode className="w-3.5 h-3.5 text-[#059669]" />
            <span>Instant Digital Match Pass</span>
          </div>
        </div>
      </div>
    </div>
  );
};
