import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  Copy,
  Check,
  Phone,
  Clock,
  Car,
  ShieldCheck,
  ExternalLink,
  Compass,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const address =
    "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)";
  const phone = "+91 98422 12345";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "Friends Turf Near Sirupooluvapatti Kamatchepuram Tiruppur Tamil Nadu 641603"
  )}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        throw new Error("Clipboard API not available");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = address;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Friends Turf Arena Location
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Tiruppur Sports Corridor • Easy Highway & City Access
            </p>
          </div>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Interactive Map Visual Mockup / Direction Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-4 text-white">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 opacity-90" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                <Compass className="w-3 h-3 text-[#10B981]" />
                <span>RTO Office Backside Landmark</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Tiruppur 641603</span>
            </div>

            <div>
              <div className="text-sm sm:text-base font-bold text-white">
                Near Sirupooluvapatti, Kamatchepuram
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Tiruppur, Tamil Nadu — Landmark: Just behind the RTO Office
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition shadow-md shadow-emerald-900/30 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Address Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Full Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Essential Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Operating Hours */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
            <Clock className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Operating Hours
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                06:00 AM – 11:00 PM Daily
              </div>
              <div className="text-[11px] text-slate-500">7 Days a week including holidays</div>
            </div>
          </div>

          {/* Direct Reception Line */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
            <Phone className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Arena Helpdesk
              </div>
              <a
                href={`tel:${phone}`}
                className="font-semibold text-[#059669] hover:underline block mt-0.5"
              >
                {phone}
              </a>
              <div className="text-[11px] text-slate-500">Call desk for route assistance</div>
            </div>
          </div>
        </div>

        {/* Venue Amenities & Parking */}
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>Player Convenience & Arrival Perks</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
            <div className="flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free 4-Wheeler & Bike Parking</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Full Dugout & Changing Rooms</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Purified Chilled Drinking Water</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>400 Lux Anti-Glare LED Floodlights</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
