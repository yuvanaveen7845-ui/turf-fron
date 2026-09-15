import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  ArrowRight,
  MapPin,
  Star,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  Zap,
  QrCode,
  Gift,
  Sparkles,
  ChevronRight,
  Flame,
} from "lucide-react";
import api from "../../services/api";
import { Turf } from "../../types";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>("ALL");

  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => {
        setTurfs(res.data);
      })
      .catch((err) => console.error("Failed to load turfs:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredTurfs =
    selectedSport === "ALL"
      ? turfs
      : turfs.filter((t) => t.sport_type === selectedSport);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800/80">
        {/* Background glow & mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[200px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-bold tracking-wide animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>BENGALURU'S PREMIER MULTI-SPORT TURF NETWORK</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              PLAY HARD.{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                BOOK FAST.
              </span>
              <br />
              OWN THE PITCH.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Real-time slot availability, instant 5-minute slot reservations,
              smart dynamic pricing, and frictionless QR gate entry.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                to="/turfs"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2.5 transition-all hover:scale-105"
              >
                <span>Book a Pitch Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/offers"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold text-base flex items-center justify-center space-x-2 transition-all"
              >
                <Gift className="w-5 h-5 text-amber-400" />
                <span>View Offers & Coupons</span>
              </Link>
            </div>

            {/* Quick Live Stats Pill */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 max-w-4xl mx-auto">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-2xl font-black text-emerald-400">3</p>
                <p className="text-xs text-slate-400 font-medium">
                  FIFA-Grade Venues
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-slate-400 font-medium">
                  Real-Time Slots
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-2xl font-black text-amber-400">4.9 ★</p>
                <p className="text-xs text-slate-400 font-medium">
                  Player Rating
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-2xl font-black text-teal-400">QR Gate</p>
                <p className="text-xs text-slate-400 font-medium">
                  Instant Check-in
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Turfs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Pitches & Arenas
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Available Turf Arenas
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select an arena to check live slots, floodlight availability, and
              prices
            </p>
          </div>

          {/* Sport filter tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {["ALL", "FOOTBALL", "CRICKET", "MULTI_SPORT"].map((sp) => (
              <button
                key={sp}
                onClick={() => setSelectedSport(sp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSport === sp
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {sp === "ALL"
                  ? "All Sports"
                  : sp === "MULTI_SPORT"
                    ? "Multi-Sport"
                    : sp}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 bg-slate-900 rounded-3xl border border-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTurfs.map((turf) => (
              <div
                key={turf.id}
                className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
              >
                {/* Image & Badges */}
                <div className="relative h-48 overflow-hidden bg-slate-800">
                  <img
                    src={
                      turf.images[0] ||
                      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={turf.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                      {turf.sport_type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{turf.rating}</span>
                    <span className="text-slate-400 font-normal">
                      ({turf.total_reviews})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {turf.name}
                    </h3>
                    <p className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{turf.location}</span>
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {turf.description}
                    </p>
                  </div>

                  {/* Amenities preview */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {turf.facilities_data?.slice(0, 3).map((f) => (
                      <span
                        key={f.id}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium"
                      >
                        {f.name}
                      </span>
                    ))}
                    {turf.facilities_data?.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-400 font-medium">
                        +{turf.facilities_data.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Starting from
                      </span>
                      <p className="text-lg font-black text-white">
                        ₹{turf.base_price}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          / hour
                        </span>
                      </p>
                    </div>

                    <Link
                      to={`/turfs/${turf.id}`}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Check Slots</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modern Value Prop Section */}
      <section className="bg-slate-900/60 border-y border-slate-800/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Friends Turf Advantage
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-1">
              Engineered for Real Squads
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Say goodbye to double-booking disputes, slow manual confirmations,
              and lost entrance tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Instant 5-Min Slot Lock
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you click a slot, it is locked automatically on the server
                for 5 minutes. No other player can snatch it while you enter
                payment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Tamper-Proof QR Pass
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive an encrypted JWT QR ticket instantly. Gate staff scans
                in seconds, verifying payment and preventing duplicate entry.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Dynamic Fair Pricing
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enjoy weekday afternoon discounts, happy hours, and transparent
                breakdown with zero surprise fees at checkout.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Wallet & Loyalty Cash
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Earn 5% loyalty points on every game played. Instant 100% wallet
                refunds if you cancel before match time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral & Community Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900/60 via-slate-900 to-amber-950/40 border border-emerald-500/30 p-8 sm:p-12">
          <div className="max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Referral Rewards Program
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Bring your squad, earn ₹100 for every player.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Share your unique referral code with teammates. When they register
              and play their first match, both of you get instant wallet
              credits!
            </p>
            <div className="pt-2">
              <Link
                to="/offers"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-colors"
              >
                <span>Get Your Referral Code</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
