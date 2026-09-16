import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, ShieldCheck, MapPin, Sparkles, LayoutGrid, ListFilter, Calendar } from "lucide-react";
import api from "../../services/api";
import { Turf } from "../../types";
import { PitchCard } from "../../components/common/PitchCard";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { DailyScheduleMatrix } from "../../components/common/DailyScheduleMatrix";

export const TurfListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  const initialSport = searchParams.get("sport") || "ALL";
  const initialDate = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const initialSession = searchParams.get("session") || "ALL";

  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedSession, setSelectedSession] = useState<string>(initialSession);
  const [viewMode, setViewMode] = useState<"cards" | "matrix">("cards");
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc">("rating");

  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => setTurfs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = () => {
    setSearchParams({
      sport: selectedSport,
      date: selectedDate,
      session: selectedSession,
    });
  };

  const filteredTurfs = turfs
    .filter((t) => {
      return selectedSport === "ALL" || t.sport_type === selectedSport;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")
        return Number(a.base_price) - Number(b.base_price);
      if (sortBy === "price_desc")
        return Number(b.base_price) - Number(a.base_price);
      return Number(b.rating) - Number(a.rating);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* 1. Header */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
          FRIENDS TURF • TIRUPPUR
        </span>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
          Our Pitches & Arenas
        </h1>
        <p className="text-sm text-slate-600">
          Tournament-grade football pitches, box cricket arenas, and multi-sport grounds in Tiruppur. Direct booking with guaranteed 5-minute slot lock.
        </p>
      </div>

      {/* 2. Pitch & Slot Finder */}
      <SearchFilterBar
        selectedSport={selectedSport}
        onSelectSport={setSelectedSport}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedSession={selectedSession}
        onSessionChange={setSelectedSession}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* 3. Results Header, View Mode Switcher & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-bold text-slate-900">
            {filteredTurfs.length} {filteredTurfs.length === 1 ? "Pitch" : "Pitches"} at Complex
          </span>
          {selectedSport !== "ALL" && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-bold border border-emerald-200">
              {selectedSport}
            </span>
          )}
        </div>

        {/* View Switcher & Sort */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pitch Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-white text-[#059669] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Live Timeline</span>
            </button>
          </div>

          {/* Sort Select */}
          {viewMode === "cards" && (
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
              >
                <option value="rating">Top Rated (★)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Display Content: Either Cards or Daily Schedule Matrix */}
      {viewMode === "matrix" ? (
        <DailyScheduleMatrix initialDate={selectedDate} selectedSport={selectedSport} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTurfs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTurfs.map((turf) => (
            <PitchCard key={turf.id} turf={turf} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No pitches match your selected sport</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Choose "All Pitches & Arenas" to view all grounds at Friends Turf Sports Complex.
          </p>
          <button
            onClick={() => setSelectedSport("ALL")}
            className="px-4 py-2 rounded-xl bg-[#059669] text-white font-bold text-xs shadow-sm hover:bg-[#047857] cursor-pointer"
          >
            Show All Pitches
          </button>
        </div>
      )}
    </div>
  );
};
