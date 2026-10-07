import React from "react";
import {
  Gift,
  ArrowRight,
  Sparkles,
  Percent,
  Compass,
  ShieldCheck,
  Wallet,
  Zap,
  Clock,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";

export const OffersPage: React.FC = () => {
  const { company } = useBusinessSettings();

  const benefits = [
    {
      title: "Direct Venue Rates",
      badge: "0% Commission",
      icon: Zap,
      desc: "Zero hidden convenience fees or third-party markups. What you see is the direct pitch price set by the venue management.",
      ctaText: "Book Pitch Now",
      ctaLink: "/",
    },
    {
      title: "Turf Cash Cashback",
      badge: "Automatic Reward",
      icon: Wallet,
      desc: "Earn instant Turf Cash wallet credits on completed match bookings. Use wallet balance for 1-click lightning checkout.",
      ctaText: "View My Wallet",
      ctaLink: "/wallet",
    },
    {
      title: "Squad Block Passes",
      badge: "Team Savings",
      icon: Users,
      desc: "Organizing tournaments or weekly league training? Contact management for custom squad packages and discounted slot bundles.",
      ctaText: "Contact Turf Desk",
      ctaLink: "/contact",
    },
    {
      title: "Flexible Rescheduling",
      badge: "Fair Play",
      icon: Clock,
      desc: "Weather changes or teammate emergency? Reschedule your slot hassle-free up to 2 hours before kickoff directly from your pass.",
      ctaText: "My Bookings",
      ctaLink: "/my-bookings",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* 1. Header */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
          {company.name} • Match Rewards & Value
        </span>
        <h1 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-tight">
          Direct Pricing & Player Privileges
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          At {company.name}, we believe in direct, transparent pricing without coupon gimmicks or arbitrary markups. Every registered player gets guaranteed benefits and automatic match rewards.
        </p>
      </div>

      {/* 2. Value Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefits.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-pitch-card flex flex-col justify-between space-y-6 hover:border-emerald-300 hover:shadow-lg transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-[#059669]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                    {b.badge}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={b.ctaLink}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors"
                >
                  <span>{b.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] text-slate-400 font-medium">
                  Verified Pitch Guarantee
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Direct Booking Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FIFA Pro Turf Quality</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Ready to Lock in Your Next Match?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            Choose your pitch, pick your hourly slot, and get instant digital Match Pass confirmation with zero hassle.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-lg hover:shadow-emerald-600/30 transition-all shrink-0 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>Explore Available Pitches</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
