import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Download,
  Printer,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { Booking } from "../../types";

export const BookingConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { booking: Booking; payment?: any } | null;

  if (!state?.booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-400">No booking session found.</p>
        <Link to="/" className="text-emerald-400 font-bold hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  const { booking } = state;
  const qrImage = booking.qr_ticket_data?.qr_base64;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
          <CheckCircle className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Match Confirmed!
        </h1>
        <p className="text-sm text-slate-400">
          Your slot is confirmed. Show the QR ticket below at the venue entrance
          for gate verification.
        </p>
      </div>

      {/* Ticket Pass Card */}
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Top Header of Ticket */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
              FT
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                Official Match Pass
              </span>
              <p className="text-xl font-black text-white font-mono tracking-wider">
                {booking.booking_id}
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
            {booking.status}
          </span>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Match Details */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Venue / Ground
              </span>
              <h3 className="text-xl font-bold text-white">
                {booking.turf_details?.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{booking.turf_details?.location}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Match Date
                </span>
                <p className="text-sm font-bold text-white flex items-center space-x-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Match Time
                </span>
                <p className="text-sm font-bold text-white flex items-center space-x-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    {booking.start_time.slice(0, 5)} -{" "}
                    {booking.end_time.slice(0, 5)}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Amount Paid
                </span>
                <p className="text-base font-black text-emerald-400">
                  ₹{booking.amount_paid}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Balance Due at Venue
                </span>
                <p
                  className={`text-base font-black ${Number(booking.balance_due) > 0 ? "text-amber-400" : "text-slate-400"}`}
                >
                  ₹{booking.balance_due}
                </p>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Single-entry pass. Validated automatically at entrance.
                </span>
              </span>
            </div>
          </div>

          {/* QR Code Graphic */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            {qrImage ? (
              <img
                src={qrImage}
                alt="Booking QR Code"
                className="w-44 h-44 rounded-xl shadow-lg border border-slate-700 bg-white p-2"
              />
            ) : (
              <div className="w-44 h-44 rounded-xl bg-slate-800 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-500" />
              </div>
            )}
            <div className="text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest block">
                {booking.qr_ticket_data?.ticket_code || "QR CODE PASS"}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                Scan at Entrance
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Footer Actions */}
        <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/my-bookings"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <span>View My Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
