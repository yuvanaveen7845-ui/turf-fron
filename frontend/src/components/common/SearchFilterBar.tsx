import React from "react";
import { Search, Calendar, Clock, Sparkles, Trophy } from "lucide-react";

interface SearchFilterBarProps {
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSession?: string;
  onSessionChange?: (session: string) => void;
  searchKeyword?: string;
  onSearchKeywordChange?: (keyword: string) => void;
  onSearchSubmit: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  selectedSport,
  onSelectSport,
  selectedDate,
  onDateChange,
  selectedSession = "ALL",
  onSessionChange,
  searchKeyword = "",
  onSearchKeywordChange,
  onSearchSubmit,
}) => {
  const sports = [
    { id: "ALL", label: "All Pitches & Arenas" },
    { id: "FOOTBALL", label: "⚽ Pitch 1: FIFA Football" },
    { id: "CRICKET", label: "🏏 Pitch 2: Box Cricket" },
    { id: "MULTI_SPORT", label: "🏟️ Pitch 3: Multi-Sport Dome" },
  ];

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const sessions = [
    { id: "ALL", label: "All Hours" },
    { id: "MORNING", label: "🌅 Morning (6am-12pm)" },
    { id: "AFTERNOON", label: "☀️ Afternoon (12pm-5pm)" },
    { id: "NIGHT", label: "🌙 Floodlit (5pm-11pm)" },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-pitch-card p-4 sm:p-5 space-y-4">
      {/* 1. Sport & Pitch Selection Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {sports.map((s) => {
          const isActive = selectedSport === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSport(s.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[#059669] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* 2. Interactive Date & Session Filters + Check Availability CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Quick Date Presets & Picker */}
        <div className="lg:col-span-5 flex items-center space-x-2">
          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => onDateChange(todayStr)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedDate === todayStr
                  ? "bg-emerald-50 text-[#059669] border border-emerald-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => onDateChange(tomorrowStr)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedDate === tomorrowStr
                  ? "bg-emerald-50 text-[#059669] border border-emerald-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tomorrow
            </button>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-[#059669]" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              min={todayStr}
              className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-900 font-semibold focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Time of Day Session Selector */}
        <div className="lg:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Clock className="w-4 h-4 text-[#059669]" />
          </div>
          <select
            value={selectedSession}
            onChange={(e) => onSessionChange && onSessionChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-900 font-medium focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none cursor-pointer"
          >
            {sessions.map((sess) => (
              <option key={sess.id} value={sess.id}>
                {sess.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            ▼
          </div>
        </div>

        {/* Find Pitch Slots CTA */}
        <div className="lg:col-span-3">
          <button
            type="button"
            onClick={onSearchSubmit}
            className="w-full py-2.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-[14px] flex items-center justify-center space-x-2 shadow-emerald-glow transition-all active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Check Availability</span>
          </button>
        </div>
      </div>
    </div>
  );
};
