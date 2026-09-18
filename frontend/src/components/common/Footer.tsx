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

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Friends Turf Logo"
                className="w-12 h-12 object-contain drop-shadow-sm"
              />
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight block leading-tight">
                  FRIENDS <span className="text-[#059669]">TURF</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Sports Complex & Pitches
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Friends Turf is Tiruppur's premier athletic complex featuring high-grade turf pitches for Football, Box Cricket, and multi-sport tournaments.
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-emerald-200 text-xs text-[#059669] font-bold">
              <Zap className="w-3.5 h-3.5 text-[#059669]" />
              <span>Real-Time 5-Min Slot Lock Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/turfs" className="hover:text-[#059669] transition-colors">
                  Our Pitches & Arenas
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-[#059669] transition-colors">
                  Promo Coupons & Squad Passes
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:text-[#059669] transition-colors">
                  Turf Cash Wallet & Top-Ups
                </Link>
              </li>
            </ul>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Pitch & Arena Quality
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Shockpad Artificial Grass</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Anti-Glare LED Floodlights</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Clean Restrooms & Washrooms</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Two-Wheeler & Car Parking</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Purified RO Drinking Water</span>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Campus & Booking Lines
            </h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-start space-x-2.5 text-slate-700">
                <MapPin className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <span>Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)</span>
              </p>
              <div className="flex items-start space-x-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <a href="tel:9361989494" className="font-semibold hover:text-[#059669]">+91 93619 89494</a>
                  <a href="tel:9363989494" className="font-semibold hover:text-[#059669]">+91 93639 89494</a>
                </div>
              </div>
              <p className="flex items-center space-x-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-[#059669] shrink-0" />
                <span>play@friendsturf.com</span>
              </p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1.5 bg-[#F0FDF4] border border-emerald-200 text-[#059669] rounded-xl text-xs font-bold">
                  Open Daily: 05:00 AM – 12:00 AM
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-3">
          <p>© {new Date().getFullYear()} Friends Turf Systems. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link to="/terms" className="hover:text-[#059669] transition-colors font-semibold">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-[#059669] transition-colors font-semibold">
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

