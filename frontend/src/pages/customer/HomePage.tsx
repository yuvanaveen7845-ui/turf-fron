import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  ArrowRight,
  ShieldCheck,
  Zap,
  QrCode,
  Gift,
  Sparkles,
  Flame,
  Star,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Activity,
} from "lucide-react";
import api from "../../services/api";
import { Turf } from "../../types";
import { normalizeList } from "../../utils/helpers";
import { PitchCard } from "../../components/common/PitchCard";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { AmenityGrid } from "../../components/common/AmenityGrid";
import { DailyScheduleMatrix } from "../../components/common/DailyScheduleMatrix";
import { SquadSplitWidget } from "../../components/common/SquadSplitWidget";
import { VerifiedReviewsSection } from "../../components/common/VerifiedReviewsSection";
import { MatchDayFAQ } from "../../components/common/MatchDayFAQ";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedSession, setSelectedSession] = useState<string>("ALL");

  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => {
        setTurfs(normalizeList<Turf>(res.data));
      })
      .catch((err) => {
        console.error("Failed to load turfs:", err);
        setTurfs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = () => {
    navigate(
      `/turfs?sport=${selectedSport}&date=${selectedDate}&session=${selectedSession}`
    );
  };

  const filteredTurfs =
    selectedSport === "ALL"
      ? turfs
      : turfs.filter((t) => t.sport_type === selectedSport);

  return (
    <div className="space-y-14 sm:space-y-20 pb-20">
      {/* 1. Hero Section with Athletic Pitch Geometry & Ambient Stadium Atmosphere */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-16 sm:pb-20 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/60 border-b border-slate-200/80">
        {/* Subtle Pitch Geometry Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center">
          <svg
            className="w-full h-full max-w-6xl"
            viewBox="0 0 1000 600"
            fill="none"
            stroke="#059669"
            strokeWidth="3"
          >
            {/* Outer Pitch Boundary */}
            <rect x="50" y="30" width="900" height="540" rx="8" />
            {/* Halfway Line */}
            <line x1="500" y1="30" x2="500" y2="570" />
            {/* Center Circle & Spot */}
            <circle cx="500" cy="300" r="110" />
            <circle cx="500" cy="300" r="6" fill="#059669" />
            {/* Left Penalty Box & Arc */}
            <rect x="50" y="150" width="180" height="300" />
            <rect x="50" y="210" width="70" height="180" />
            <path d="M 230 240 A 80 80 0 0 1 230 360" />
            {/* Right Penalty Box & Arc */}
            <rect x="770" y="150" width="180" height="300" />
            <rect x="880" y="210" width="70" height="180" />
            <path d="M 770 240 A 80 80 0 0 0 770 360" />
          </svg>
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 sm:space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-5">
            {/* Live Operational Ticker Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200 text-[#059669] text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="tracking-wide">
                OFFICIAL BOOKING PORTAL • FRIENDS TURF, TIRUPPUR
              </span>
            </div>

            {/* Display / Hero H1 */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              PLAY HARD.{" "}
              <span className="text-[#059669] drop-shadow-sm">
                BOOK DIRECT.
              </span>
              <br />
              OWN THE PITCH.
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Reserve our tournament-grade artificial football & box cricket pitches in Tiruppur (Near Sirupooluvapatti, RTO Office Backside) with guaranteed 5-minute slot lock and instant digital pass.
            </p>
          </div>

          {/* 2. Embedded Pitch & Slot Finder Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchFilterBar
              selectedSport={selectedSport}
              onSelectSport={setSelectedSport}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedSession={selectedSession}
              onSessionChange={setSelectedSession}
              onSearchSubmit={handleSearchSubmit}
            />
          </div>

          {/* 3. Live Stats Counter Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center hover:border-emerald-300 transition-all">
              <p className="text-2xl sm:text-3xl font-black text-[#059669]">Pro</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Tournament Pitches</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center hover:border-emerald-300 transition-all">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">100%</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Direct Booking (0% Brokerage)</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center hover:border-emerald-300 transition-all">
              <p className="text-2xl sm:text-3xl font-black text-[#059669]">5 Min</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Auto Slot Hold Lock</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center hover:border-emerald-300 transition-all">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">4.9 ★</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Verified Player Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Daily Pitch Schedule Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailyScheduleMatrix selectedSport={selectedSport} />
      </section>

      {/* 3. Featured Grounds Section (PitchCard Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
              Our Athletic Arenas
            </span>
            <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
              Pitches & Courts at Friends Turf, Tiruppur
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              High-performance artificial turf with anti-glare floodlights at our facility in Kamatchepuram (Near Sirupooluvapatti).
            </p>
          </div>

          <Link
            to="/turfs"
            className="inline-flex items-center space-x-1.5 text-sm font-bold text-[#059669] hover:text-[#047857] hover:underline"
          >
            <span>View pitch specs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pitch Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTurfs.map((turf) => (
              <PitchCard key={turf.id} turf={turf} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Interactive Squad Fee Split Calculator Widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SquadSplitWidget turfs={turfs} />
      </section>

      {/* 5. Amenity Section (AmenityGrid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
            Match-Day Amenities
          </span>
          <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
            Engineered for High Performance
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Every match at Friends Turf comes standard with tournament-ready amenities.
          </p>
        </div>

        <AmenityGrid />
      </section>

      {/* 6. Frictionless Workflow (4 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
              Seamless Match Access
            </span>
            <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
              From Screen to Kickoff in 60 Seconds
            </h2>
            <p className="text-sm text-slate-600">
              Direct booking, zero double bookings. Instant digital verification at the Friends Turf gate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                1
              </div>
              <h4 className="text-[16px] font-bold text-slate-900">Select Pitch & Date</h4>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Choose your preferred pitch and game slot at Friends Turf, Tiruppur.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                2
              </div>
              <h4 className="text-[16px] font-bold text-slate-900">5-Minute Slot Hold</h4>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Our reservation lock guarantees nobody snatches your slot while you confirm your squad.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                3
              </div>
              <h4 className="text-[16px] font-bold text-slate-900">Pay Full or 50% Advance</h4>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Pay online via UPI, credit card, turf wallet, or reserve with a 50% partial advance deposit.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                4
              </div>
              <h4 className="text-[16px] font-bold text-slate-900">Scan QR & Play</h4>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Show your cryptographic QR pass at the entrance counter for instant contactless check-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Verified Player Reviews & Community Feedback */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VerifiedReviewsSection />
      </section>

      {/* 8. Match-Day FAQs & Guidelines Accordion */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MatchDayFAQ />
      </section>

      {/* 9. Friends Turf Campus Location & Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>VISIT OUR COMPLEX</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Friends Turf, Tiruppur
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside). Easy access with secure two-wheeler and four-wheeler parking, high-output floodlit arenas, clean washrooms, and player seating dugouts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block font-medium">Daily Hours</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">05:00 AM – 12:00 AM</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block font-medium">Contact & Booking</span>
                  <a href="tel:9361989494" className="font-bold text-white mt-0.5 block hover:text-emerald-400">
                    +91 93619 89494
                  </a>
                  <a href="tel:9363989494" className="font-bold text-white block hover:text-emerald-400">
                    +91 93639 89494
                  </a>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block font-medium">Landmark & Parking</span>
                  <span className="font-bold text-white mt-0.5 block">RTO Office Backside</span>
                  <span className="text-slate-400 text-[11px] block">Free On-Site Parking</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#059669] flex items-center justify-center text-white shadow-emerald-glow">
                <Navigation className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Find Us on Maps</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Near Sirupooluvapatti, Kamatchepuram, Tiruppur
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <a
                  href="https://maps.google.com/?q=Friends+Turf+Near+Sirupooluvapatti+Kamatchepuram+Tiruppur+Tamil+Nadu+641603"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
                <Link
                  to="/turfs"
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-600 transition-all"
                >
                  <span>Book Pitch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
