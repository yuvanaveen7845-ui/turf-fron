import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  Share2,
  CalendarPlus,
  Navigation,
  Trophy,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { Button, StatusBadge } from "../ui";

export interface MatchPassProps {
  passData: {
    booking_id: string;
    ticket_code?: string;
    credential_version?: number;
    status?: string; // ACTIVE, USED, EXPIRED, REVOKED
    booking_status?: string; // CONFIRMED, CHECKED_IN, CANCELLED, etc.
    qr_base64?: string;
    turf_name: string;
    turf_location: string;
    surface_spec?: string;
    lighting_spec?: string;
    date: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone?: string;
    total_amount?: number;
    amount_paid?: number;
    balance_due?: number;
    valid_from?: string | null;
    valid_until?: string | null;
    is_used?: boolean;
    checked_in_at?: string | null;
  };
  onClose?: () => void;
  showActions?: boolean;
}

export const FriendsTurfMatchPass: React.FC<MatchPassProps> = ({
  passData,
  onClose,
  showActions = true,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(passData.booking_id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Friends Turf Match Pass - ${passData.booking_id}`,
      text: `Match Pass for ${passData.turf_name} on ${new Date(passData.date).toLocaleDateString("en-IN", { dateStyle: "medium" })} at ${passData.start_time} - ${passData.end_time}.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddToCalendar = () => {
    // Generate standard .ics calendar file
    const startDateTime = new Date(`${passData.date}T${passData.start_time}`);
    const endDateTime = new Date(`${passData.date}T${passData.end_time}`);

    const formatDateForIcs = (d: Date) => {
      return d.toISOString().replace(/-|:|\.\d+/g, "");
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Friends Turf//Match Pass//EN",
      "BEGIN:VEVENT",
      `SUMMARY:Turf Match at ${passData.turf_name} (Booking ${passData.booking_id})`,
      `DESCRIPTION:Friends Turf digital match reservation.\\nBooking ID: ${passData.booking_id}\\nArena: ${passData.turf_name}\\nLocation: ${passData.turf_location}`,
      `LOCATION:${passData.turf_location}`,
      `DTSTART:${formatDateForIcs(isNaN(startDateTime.getTime()) ? new Date() : startDateTime)}`,
      `DTEND:${formatDateForIcs(isNaN(endDateTime.getTime()) ? new Date(Date.now() + 3600000) : endDateTime)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `FriendsTurf-${passData.booking_id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCheckedIn = passData.is_used || passData.booking_status === "CHECKED_IN" || passData.status === "USED";
  const isCancelled = passData.booking_status === "CANCELLED" || passData.status === "CANCELLED";
  const isRevoked = passData.status === "REVOKED";
  const balanceDue = Number(passData.balance_due || 0);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Stadium Match Pass Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-pitch-card relative print:border-none print:shadow-none">
        {/* Pass Top Banner */}
        <div className="bg-[#059669] text-white p-6 sm:p-7 relative overflow-hidden">
          {/* Subtle athletic pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <img
                src="/logo.png"
                alt="Friends Turf"
                className="w-14 h-14 object-contain drop-shadow-md shrink-0"
              />
              <div>
                <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest block">
                  Official Digital Match Pass
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  FRIENDS TURF ARENA
                </h2>
              </div>
            </div>

            {/* Pass Status Badge */}
            <div>
              {isCheckedIn ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white text-[#059669] text-xs font-black uppercase tracking-wider shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Admitted / Verified</span>
                </span>
              ) : isCancelled ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  <span>Cancelled</span>
                </span>
              ) : isRevoked ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  <span>Pass Revoked</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Active Match Pass</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pass Body */}
        <div className="p-6 sm:p-8 space-y-7">
          {/* Main Grid: QR & Key Reference */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left Col: High-Res QR Code Card */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm inline-block">
                {passData.qr_base64 ? (
                  <img
                    src={passData.qr_base64}
                    alt={`Match Pass QR ${passData.booking_id}`}
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-48 sm:h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">
                    Generating Pass QR...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Scan at Entrance Gate
                </p>
                <p className="text-[10px] text-slate-500">
                  Hold screen 4-6 inches from turnstile scanner
                </p>
              </div>
            </div>

            {/* Right Col: Booking Specs & Player Details */}
            <div className="md:col-span-7 space-y-4">
              {/* Booking ID with Copy */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Booking Reference
                  </span>
                  <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                    {passData.booking_id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Copy booking reference"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-[#059669]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Pitch Info */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Ground & Arena
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {passData.turf_name}
                </h3>
                <p className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  <span>{passData.turf_location}</span>
                </p>
              </div>

              {/* Match Date & Time Row */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Match Date
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                    <span>
                      {new Date(passData.date).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Session Time
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                    <span>
                      {passData.start_time.slice(0, 5)} - {passData.end_time.slice(0, 5)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Player & Payment Status Row */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Lead Player
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {passData.customer_name}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Payment Status
                  </span>
                  {balanceDue > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 mt-0.5">
                      Partial (Due: ₹{balanceDue.toFixed(0)})
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-50 text-[#059669] border border-emerald-200 mt-0.5">
                      <Check className="w-3 h-3" />
                      <span>100% Paid</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Admission & Gate Rules Banner */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Gate Entry Guidelines:</span>
            </div>
            <p>• Check-in opens 30 minutes before kick-off. Please arrive 15 minutes early.</p>
            <p>• Wear appropriate turf boots / rubber studs (metal studs are strictly prohibited).</p>
            <p>• Complimentary locker keys and shower access available at reception.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 text-[#059669]" />}
          >
            Print Match Pass
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCalendar}
            leftIcon={<CalendarPlus className="w-4 h-4 text-[#059669]" />}
          >
            Add to Calendar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            leftIcon={<Share2 className="w-4 h-4 text-[#059669]" />}
          >
            {copiedLink ? "Link Copied!" : "Share Pass"}
          </Button>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent("Friends Turf " + passData.turf_location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-bold text-xs px-3 py-1.5 rounded-lg gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all"
          >
            <Navigation className="w-4 h-4 text-[#059669]" />
            <span>Get Directions</span>
          </a>
        </div>
      )}
    </div>
  );
};
