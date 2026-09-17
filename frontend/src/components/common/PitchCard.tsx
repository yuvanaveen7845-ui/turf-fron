import React from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Users,
  Sun,
  ShieldCheck,
  Zap,
  ArrowRight,
  MapPin,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Turf } from "../../types";
import { resolveImageUrl, handleImageError, getTurfFallbackImage } from "../../utils/imageUrl";

interface PitchCardProps {
  turf: Turf;
  featured?: boolean;
}

export const PitchCard: React.FC<PitchCardProps> = ({ turf, featured = false }) => {
  const displayImage = resolveImageUrl(
    turf.images && turf.images.length > 0 ? turf.images[0] : null,
    turf.sport_type
  );

  const sportBadgeLabel: Record<string, string> = {
    FOOTBALL: "7v7 Football",
    CRICKET: "Box Cricket",
    MULTI_SPORT: "Multi-Sport Arena",
    BADMINTON: "Badminton Court",
    TENNIS: "Tennis Court",
  };

  // Determine pitch badge e.g. "PITCH 1", "PITCH 2", "PITCH 3"
  const pitchBadgeMatch = turf.name.match(/^Pitch\s*\d+/i);
  const pitchBadge = pitchBadgeMatch
    ? pitchBadgeMatch[0].toUpperCase()
    : turf.name.includes("—")
      ? turf.name.split("—")[0].trim()
      : turf.name.includes("-")
        ? turf.name.split("-")[0].trim()
        : turf.name || "Pitch Arena";

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-pitch-card overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/80 hover:shadow-lg">
      {/* 1. Image Banner with Gradient Overlay & Metadata Pills */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-100">
        <img
          src={displayImage}
          alt={turf.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => handleImageError(e, turf.sport_type)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

        {/* Top Badges Row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Pitch Identifier & Standard Pill */}
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-100 text-[11px] font-extrabold text-slate-900 tracking-tight">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>{pitchBadge}</span>
          </div>

          {/* Rating Pill */}
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-[11px] font-bold text-white shadow-sm">
            <Star className="w-3 h-3 text-[#FBBF24] fill-[#FBBF24]" />
            <span>{Number(turf.rating || 5.0).toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({turf.total_reviews || 28})</span>
          </div>
        </div>

        {/* Bottom Overlay Pill on Image: Surface & Sport Type */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-sm text-[11px] font-semibold border border-emerald-500/30 text-emerald-300">
            {sportBadgeLabel[turf.sport_type] || turf.sport_type}
          </span>
          <span className="text-[11px] font-medium text-slate-200">
            {turf.dimensions || "Standard Pitch"}
          </span>
        </div>
      </div>

      {/* 2. Venue Title + Hourly Rate Row */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[17px] sm:text-[18px] font-bold text-slate-900 leading-snug tracking-tight truncate group-hover:text-[#059669] transition-colors">
                {turf.name}
              </h3>
              <div className="flex items-center space-x-1 text-slate-500 text-[13px] mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span className="truncate">Friends Turf Sports Complex</span>
              </div>
            </div>

            {/* Price Badge */}
            <div className="text-right shrink-0">
              <div className="text-[18px] sm:text-[20px] font-extrabold text-slate-900 leading-none">
                ₹{Number(turf.base_price).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                per hr
              </span>
            </div>
          </div>

          {/* 3. Key Specifications Row */}
          <div className="grid grid-cols-3 gap-2 py-3 mt-3 border-y border-slate-100 text-slate-600 text-[12px]">
            <div className="flex items-center space-x-1.5" title="Recommended Players">
              <Users className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="font-semibold text-slate-700 truncate">
                {turf.capacity} Players
              </span>
            </div>
            <div className="flex items-center space-x-1.5" title="Lighting Specification">
              <Sun className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span className="font-medium text-slate-600 truncate">
                {turf.lighting_spec ? turf.lighting_spec.split(" ")[0] + " Lux" : "400 Lux"}
              </span>
            </div>
            <div className="flex items-center space-x-1.5" title="Surface Specification">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium text-slate-600 truncate">
                {turf.surface_spec ? turf.surface_spec.split(" ")[0] : "50mm"}
              </span>
            </div>
          </div>

          {/* 4. Fast-Fill Availability Banner */}
          <div className="mt-3.5 flex items-center justify-between px-3 py-2 rounded-xl bg-[#F0FDF4] border border-emerald-100 text-[12px] font-semibold text-emerald-800">
            <div className="flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B] animate-fast-pulse" />
              <span>Direct Booking • Zero Broker Fees</span>
            </div>
            <span className="text-[11px] font-bold text-[#059669]">Instant Pass</span>
          </div>
        </div>

        {/* 5. Action CTA */}
        <Link
          to={`/turfs/${turf.id}`}
          className="w-full py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-[14px] flex items-center justify-center space-x-2 shadow-sm transition-all duration-200 active:scale-[0.99]"
        >
          <span>Book Pitch Slots</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};
