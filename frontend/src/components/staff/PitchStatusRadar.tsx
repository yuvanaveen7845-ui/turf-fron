import React, { useState, useEffect, memo } from "react";
import {
  Zap,
  Clock,
  QrCode,
} from "lucide-react";
import { Booking, Turf } from "../../types";
import { formatTime12h, formatRelativeTime } from "../../utils/timeFormat";
import { Link } from "react-router-dom";

export const LiveClock: React.FC = memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
      Live Clock: {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  );
});

interface PitchCardProps {
  turf: Turf;
  activeBooking?: Booking;
  nextBooking?: Booking;
  currentTimeStr: string;
  isNight: boolean;
  onSelectBookingForScan?: (bookingId: string) => void;
}

const PitchCard: React.FC<PitchCardProps> = memo(({
  turf,
  activeBooking,
  nextBooking,
  currentTimeStr,
  isNight,
  onSelectBookingForScan,
}) => {
  let minutesRemaining = 0;
  if (activeBooking) {
    const [endH, endM] = activeBooking.end_time.split(":").map(Number);
    const [curH, curM] = currentTimeStr.split(":").map(Number);
    minutesRemaining = Math.max(0, (endH * 60 + endM) - (curH * 60 + curM));
  }

  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-sm ${
        activeBooking
          ? "bg-gradient-to-br from-emerald-950/90 to-slate-900 border-emerald-500/40 text-white shadow-emerald-950/20"
          : nextBooking
          ? "bg-white border-slate-200 text-slate-900 hover:border-emerald-300"
          : "bg-slate-50 border-dashed border-slate-300 text-slate-700"
      }`}
    >
      {/* Pitch Header */}
      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeBooking
                  ? "bg-emerald-500 text-slate-950 font-extrabold"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {turf.sport_type || "Sports"}
            </span>
            <h4 className={`font-black text-base ${activeBooking ? "text-white" : "text-slate-900"}`}>
              {turf.name}
            </h4>
          </div>
          <p className={`text-[11px] mt-0.5 ${activeBooking ? "text-emerald-200" : "text-slate-500"}`}>
            {turf.surface_spec || "50mm Pro FIFA Certified"} • {turf.dimensions || "5v5 / 7v7"}
          </p>
        </div>

        <div className="flex items-center space-x-1">
          {isNight && (
            <span
              title="Floodlights Active"
              className="p-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs flex items-center"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
            </span>
          )}
          {activeBooking ? (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IN PLAY</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
              {nextBooking ? "READY" : "OPEN"}
            </span>
          )}
        </div>
      </div>

      {/* Active Match Body */}
      {activeBooking ? (
        <div className="py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Current Match (Pass #{activeBooking.booking_id})
              </p>
              <p className="text-sm font-black text-white mt-0.5">
                {activeBooking.customer_details?.full_name || "Guest Squad"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Remaining</p>
              <p className="text-lg font-black text-emerald-400 font-mono">
                {minutesRemaining}m
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(10, 100 - (minutesRemaining / 60) * 100)
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <span>
              Window: {formatTime12h(activeBooking.start_time)} - {formatTime12h(activeBooking.end_time)}
            </span>
            <span className="text-[11px] text-emerald-300 font-mono">
              Gate Admitted
            </span>
          </div>
        </div>
      ) : nextBooking ? (
        <div className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Next Squad Up
            </span>
            <span className="text-[11px] font-bold text-[#059669]">
              {formatRelativeTime(nextBooking.date, nextBooking.start_time)}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {nextBooking.customer_details?.full_name || "Guest"}
            </p>
            <p className="text-xs text-slate-500">
              {formatTime12h(nextBooking.start_time)} - {formatTime12h(nextBooking.end_time)} • #{nextBooking.booking_id}
            </p>
          </div>
          {Number(nextBooking.balance_due) > 0 && (
            <div className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg">
              Pending Collection: ₹{Number(nextBooking.balance_due).toLocaleString("en-IN")}
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">
          <Clock className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p>Pitch is vacant for this hour</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100/10 flex items-center justify-between gap-2">
        {nextBooking ? (
          <button
            onClick={() => {
              if (onSelectBookingForScan) {
                onSelectBookingForScan(nextBooking.booking_id);
              }
            }}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
              activeBooking
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-[#059669] hover:bg-[#047857] text-white shadow-sm"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Fast Check-In #{nextBooking.booking_id}</span>
          </button>
        ) : (
          <Link
            to="/staff/walk-in"
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#059669] text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Book Walk-In Slot</span>
          </Link>
        )}
      </div>
    </div>
  );
});

interface PitchStatusRadarProps {
  turfs: Turf[];
  bookings: Booking[];
  onSelectBookingForScan?: (bookingId: string) => void;
  onRefresh?: () => void;
}

export const PitchStatusRadar: React.FC<PitchStatusRadarProps> = ({
  turfs,
  bookings,
  onSelectBookingForScan,
}) => {
  const [radarTime, setRadarTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setRadarTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const nowHours = String(radarTime.getHours()).padStart(2, "0");
  const nowMinutes = String(radarTime.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${nowHours}:${nowMinutes}`;
  const isNight = radarTime.getHours() >= 18 || radarTime.getHours() < 6;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
            Live Turf Radar & Pitch Status
          </h3>
        </div>
        <LiveClock />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turfs.map((turf) => {
          const activeBooking = bookings.find(
            (b) =>
              b.turf === turf.id &&
              b.status === "CHECKED_IN" &&
              b.start_time <= currentTimeStr &&
              b.end_time >= currentTimeStr
          );

          const nextBooking = bookings
            .filter(
              (b) =>
                b.turf === turf.id &&
                (b.status === "CONFIRMED" || b.status === "UPCOMING" || b.status === "CHECKED_IN") &&
                b.start_time > currentTimeStr
            )
            .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

          return (
            <PitchCard
              key={turf.id}
              turf={turf}
              activeBooking={activeBooking}
              nextBooking={nextBooking}
              currentTimeStr={currentTimeStr}
              isNight={isNight}
              onSelectBookingForScan={onSelectBookingForScan}
            />
          );
        })}
      </div>
    </div>
  );
};
