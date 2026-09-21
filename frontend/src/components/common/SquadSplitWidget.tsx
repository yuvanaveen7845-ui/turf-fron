import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Calculator,
  Flame,
  Layers,
} from "lucide-react";
import { Turf } from "../../types";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";

interface SquadSplitWidgetProps {
  turfs?: Turf[];
  basePrice?: number;
}

const DURATION_OPTIONS = [
  { val: 60, label: "1 hr", desc: "60 mins" },
  { val: 90, label: "1.5 hrs", desc: "90 mins" },
  { val: 120, label: "2 hrs", desc: "120 mins" },
  { val: 180, label: "3 hrs", desc: "180 mins" },
  { val: 240, label: "4 hrs", desc: "240 mins" },
];

const SQUAD_PRESETS = [
  { count: 4, label: "2v2 Doubles" },
  { count: 10, label: "5v5 Squad" },
  { count: 14, label: "7v7 Full Match" },
  { count: 16, label: "Box Cricket" },
  { count: 22, label: "11v11 Tournament" },
];

export const SquadSplitWidget: React.FC<SquadSplitWidgetProps> = ({
  turfs = [],
  basePrice = 1200,
}) => {
  const { booking, payments } = useBusinessSettings();
  // If turfs are provided, default to first turf
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [squadSize, setSquadSize] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customHours, setCustomHours] = useState<number>(1);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);

  useEffect(() => {
    if (turfs.length > 0 && !selectedTurfId) {
      setSelectedTurfId(turfs[0].id);
    }
  }, [turfs, selectedTurfId]);

  // Selected turf object
  const activeTurf = turfs.find((t) => String(t.id) === String(selectedTurfId)) || turfs[0];
  const activeRate = activeTurf ? Number(activeTurf.base_price) : basePrice;

  // Effective duration in hours
  const effectiveHours = isCustomDuration ? customHours : durationMinutes / 60;
  const effectiveMinutes = isCustomDuration ? customHours * 60 : durationMinutes;

  // Total cost and per-player split
  const totalAmount = Math.round(activeRate * effectiveHours);
  const perPlayerCost = Math.ceil(totalAmount / Math.max(1, squadSize));

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#059669]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Explanatory & Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Calculator className="w-3.5 h-3.5" />
              <span>DYNAMIC SQUAD COST CALCULATOR</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Split Match Fees Across All Arenas & Durations
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Calculate exact per-player shares for any pitch, extended tournament sessions (up to 8 hours), and squads of up to 32 players.
            </p>
          </div>

          {/* 1. Arena / Pitch Selector (Shows ALL real pitches) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Select Arena / Pitch ({turfs.length > 0 ? `${turfs.length} Available` : "All Pitches"})</span>
              {activeTurf && (
                <span className="text-emerald-400 text-[11px] font-mono">
                  Base: ₹{Number(activeTurf.base_price)}/hr
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {turfs.length > 0 ? (
                turfs.map((t) => {
                  const isSelected = String(t.id) === String(selectedTurfId);
                  const sportEmoji =
                    t.sport_type === "FOOTBALL"
                      ? "⚽"
                      : t.sport_type === "CRICKET"
                      ? "🏏"
                      : t.sport_type === "BADMINTON"
                      ? "🏸"
                      : t.sport_type === "TENNIS"
                      ? "🎾"
                      : "🏆";

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTurfId(t.id)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#059669] border-emerald-400 text-white shadow-lg shadow-emerald-950/50"
                          : "bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-750 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 text-xs font-bold truncate">
                        <span>{sportEmoji}</span>
                        <span className="truncate">{t.name}</span>
                      </div>
                      <p
                        className={`text-[11px] mt-1 font-mono ${
                          isSelected ? "text-emerald-100" : "text-slate-400"
                        }`}
                      >
                        ₹{Number(t.base_price)}/hr • {t.capacity || 14}p max
                      </p>
                    </button>
                  );
                })
              ) : (
                // Skeleton loaders while turfs load from backend
                <>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 animate-pulse h-14" />
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 animate-pulse h-14" />
                </>
              )}
            </div>
          </div>

          {/* 2. Match Duration Controls (Standard + Extended + Custom) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Match Duration
              </label>
              <button
                type="button"
                onClick={() => setIsCustomDuration(!isCustomDuration)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                {isCustomDuration ? "Use standard slots" : "Set custom hours"}
              </button>
            </div>

            {!isCustomDuration ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => setDurationMinutes(d.val)}
                    className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                      durationMinutes === d.val
                        ? "bg-emerald-500/20 border-emerald-400 text-white shadow-sm"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-xs font-bold">{d.label}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{d.desc}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Custom Duration</span>
                    <span className="text-emerald-400 font-mono">{customHours} Hours ({customHours * 60} mins)</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={customHours}
                    onChange={(e) => setCustomHours(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 hr</span>
                    <span>3 hrs (Half-Day League)</span>
                    <span>8 hrs (Full Tournament)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Squad Size Slider & Quick Presets (2 to 32 Players) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Squad Size
              </label>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-black text-sm border border-emerald-500/30">
                  {squadSize} Players
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={2}
              max={32}
              step={1}
              value={squadSize}
              onChange={(e) => setSquadSize(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SQUAD_PRESETS.map((p) => (
                <button
                  key={p.count}
                  type="button"
                  onClick={() => setSquadSize(p.count)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    squadSize === p.count
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  {p.label} ({p.count}p)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Instant Calculation & Direct Booking CTA */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 sm:p-8 space-y-6 text-center backdrop-blur-sm sticky top-6 shadow-xl">
            {/* Header info */}
            <div className="border-b border-slate-700/60 pb-4 text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Active Selection
              </span>
              <h4 className="text-base font-bold text-white mt-0.5 truncate">
                {activeTurf ? activeTurf.name : "Tournament Pitch"}
              </h4>
              <p className="text-xs text-slate-400">
                {effectiveMinutes} mins session • {squadSize} players squad
              </p>
            </div>

            {/* Price Callout */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Estimated Share Per Player
              </span>
              <div className="flex items-center justify-center space-x-1.5 pt-1">
                <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
                  ₹{perPlayerCost}
                </span>
                <span className="text-sm text-slate-400 font-medium">/ player</span>
              </div>
              <p className="text-xs text-slate-400 pt-1">
                Total pitch rental: <span className="font-bold text-white">₹{totalAmount.toLocaleString("en-IN")}</span> ({effectiveHours} hrs @ ₹{activeRate}/hr)
              </p>
            </div>

            {/* Quick Benefits Checklist */}
            <div className="space-y-2 py-3 border-y border-slate-700/60 text-left text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{booking.slotHoldMinutes}-Minute Slot Hold Lock with 0% drop risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pay {payments.advanceDepositPercent}% deposit now (₹{Math.round(totalAmount * (payments.advanceDepositPercent / 100))}), rest at counter</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Includes tournament bibs & match equipment</span>
              </div>
            </div>

            {/* Direct Booking Link to Specific Turf */}
            <Link
              to={activeTurf ? `/turfs/${activeTurf.id}` : "/turfs"}
              className="w-full py-3.5 px-6 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <span>Book {activeTurf?.name || "Pitch"} for ₹{perPlayerCost}/Player</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
