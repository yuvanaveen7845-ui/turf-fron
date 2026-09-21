import React from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Zap,
  Heart,
  Calendar,
} from "lucide-react";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";

export const Footer: React.FC = () => {
  const { company, hours, booking } = useBusinessSettings();

  return (
    <footer className="relative z-20 bg-[#0F172A] text-slate-300 border-t border-slate-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-24 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden backdrop-blur-sm">
                <img
                  src={company.logo_url || "/logo.png"}
                  alt={`${company.name} Logo`}
                  className="w-full h-full object-contain filter drop-shadow-sm"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + "/logo.png") {
                      e.currentTarget.src = "/logo.png";
                    }
                  }}
                />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight block leading-tight">
                  {company.name.split(" ")[0]} <span className="text-[#10B981]">{company.name.split(" ").slice(1).join(" ") || "TURF"}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">
                  Sports Complex & Pitches
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {company.name} is Tiruppur's premier athletic complex featuring high-grade turf pitches for Football, Box Cricket, and multi-sport tournaments.
            </p>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs text-emerald-300 font-bold">
              <Zap className="w-3.5 h-3.5 text-[#10B981] fill-[#10B981]" />
              <span>Real-Time {booking.slotHoldMinutes}-Min Slot Lock Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/turfs" className="hover:text-emerald-400 transition-colors">
                  Our Pitches & Arenas
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-emerald-400 transition-colors">
                  Promo Coupons & Squad Passes
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:text-emerald-400 transition-colors">
                  Turf Cash Wallet & Top-Ups
                </Link>
              </li>
            </ul>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Pitch & Arena Quality
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Shockpad Artificial Grass</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Anti-Glare LED Floodlights</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Clean Restrooms & Washrooms</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Two-Wheeler & Car Parking</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Purified RO Drinking Water</span>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Campus & Booking Lines
            </h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-start space-x-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>{company.address}</span>
              </p>
              <div className="flex items-start space-x-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  {company.phone && (
                    <a href={`tel:${company.phone.replace(/[^\d+]/g, "")}`} className="font-semibold hover:text-emerald-400">
                      {company.phone}
                    </a>
                  )}
                  {company.whatsapp && company.whatsapp !== company.phone && (
                    <a href={`tel:${company.whatsapp.replace(/[^\d+]/g, "")}`} className="font-semibold hover:text-emerald-400">
                      {company.whatsapp}
                    </a>
                  )}
                </div>
              </div>
              <p className="flex items-center space-x-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>{company.email || company.support_email}</span>
              </p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold">
                  Open Daily: {hours.openTime} – {hours.closeTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-3">
          <p>© {new Date().getFullYear()} {company.name} Systems. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link to="/terms" className="hover:text-emerald-400 transition-colors font-semibold">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors font-semibold">
              Privacy Policy
            </Link>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-400">
              <span>FIFA-Certified Arena</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 ml-1" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
