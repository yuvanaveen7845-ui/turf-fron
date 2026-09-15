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
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                FRIENDS TURF
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              India's state-of-the-art sports turf network. Experience seamless
              slot bookings, dynamic pricing, instant QR match entry, and elite
              tournament grounds.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>Real-Time Instant Slot Locking Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/turfs"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Browse Turfs & Pitches
                </Link>
              </li>
              <li>
                <Link
                  to="/offers"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Discounts & Promo Coupons
                </Link>
              </li>
              <li>
                <Link
                  to="/membership"
                  className="hover:text-emerald-400 transition-colors"
                >
                  VIP Memberships
                </Link>
              </li>
              <li>
                <Link
                  to="/loyalty"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Loyalty Rewards Program
                </Link>
              </li>
              <li>
                <Link
                  to="/wallet"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Turf Cash Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Turf Amenities
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>FIFA-Standard Turf</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>High-Lumen Night Floodlights</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Lockers & Showers</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Secure Camera Parking</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Purified Chilled Water</span>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Venue & Support
            </h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Koramangala, Indiranagar & HSR Layout, Bengaluru</span>
              </p>
              <p className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 98765 43210 (24/7 Match Line)</span>
              </p>
              <p className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>play@friendsturf.com</span>
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-xs font-semibold">
                  Open Daily: 06:00 AM – 11:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Friends Turf. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for sports lovers</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
