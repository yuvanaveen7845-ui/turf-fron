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

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const getSocialUrl = (handle?: string, platform: "instagram" | "facebook" = "instagram"): string => {
  if (!handle) {
    return platform === "instagram"
      ? "https://www.instagram.com/friendsturf_tiruppur"
      : "https://www.facebook.com/friendsturf_tiruppur";
  }
  const trimmed = handle.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  return platform === "instagram"
    ? `https://www.instagram.com/${username}`
    : `https://www.facebook.com/${username}`;
};

export const Footer: React.FC = () => {
  const { company, hours, booking } = useBusinessSettings();

  const instagramUrl = getSocialUrl(company.instagram, "instagram");
  const facebookUrl = getSocialUrl(company.facebook, "facebook");

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
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs text-emerald-300 font-bold">
                <Zap className="w-3.5 h-3.5 text-[#10B981] fill-[#10B981]" />
                <span>Real-Time {booking.slotHoldMinutes}-Min Slot Lock Active</span>
              </div>
            </div>
            {/* Social Redirect Buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-purple-600/40 hover:via-pink-600/40 hover:to-amber-500/40 border border-white/10 hover:border-pink-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200 active:scale-95 shadow-sm"
                title={`Follow ${company.name} on Instagram`}
              >
                <InstagramIcon className="w-3.5 h-3.5 fill-current text-pink-400" />
                <span>Instagram</span>
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-blue-600/30 border border-white/10 hover:border-blue-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200 active:scale-95 shadow-sm"
                title={`Visit ${company.name} on Facebook`}
              >
                <FacebookIcon className="w-3.5 h-3.5 fill-current text-blue-400" />
                <span>Facebook</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Our Pitches & Arenas
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-emerald-400 transition-colors">
                  Squad Passes & Offers
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
