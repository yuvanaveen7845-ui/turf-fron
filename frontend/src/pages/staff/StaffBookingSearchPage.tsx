import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  QrCode,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";
import { Button, Input, StatusBadge } from "../../components/ui";

export const StaffBookingSearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [result, setResult] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/bookings/${searchTerm.trim()}/`);
      setResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "No booking pass found matching this reference."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200 text-xs font-bold uppercase tracking-wider text-[#059669]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Lookup Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
          Search Booking by Reference
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Locate match passes, verify payment balance, or launch gate check-in
        </p>
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-pitch-card"
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Enter Booking ID or Ticket Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. FT-20260915-XXXXX or TKT-XXXX"
              className="flex-1 px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl font-mono text-sm text-slate-900 uppercase placeholder:text-slate-400 focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              leftIcon={<Search className="w-4 h-4" />}
            >
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Result Card */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-pitch-card animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Booking Reference
              </span>
              <p className="text-xl font-black font-mono text-slate-900 mt-0.5">
                {result.booking_id}
              </p>
            </div>
            <StatusBadge status={result.status} size="md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Turf Arena
              </span>
              <p className="text-sm font-bold text-slate-900">
                {result.turf_details?.name}
              </p>
              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                <span>{result.turf_details?.location || "Friends Turf Venue"}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Player Details
              </span>
              <p className="text-sm font-bold text-slate-900">
                {result.customer_details?.full_name || "Guest Player"}
              </p>
              <p className="text-slate-500 text-[11px]">
                {result.customer_details?.phone || result.customer_details?.email}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Date & Timings
              </span>
              <p className="text-xs font-bold text-slate-900">
                {result.date}
              </p>
              <p className="text-[#059669] font-bold">
                {result.start_time.slice(0, 5)} - {result.end_time.slice(0, 5)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Payment Breakdown
              </span>
              <p className="text-xs font-bold text-slate-900">
                Paid: ₹{result.amount_paid}
              </p>
              <p className={Number(result.balance_due) > 0 ? "text-amber-600 font-bold" : "text-[#059669] font-bold"}>
                Balance Due: ₹{result.balance_due}
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              to={`/staff/scanner?code=${result.booking_id}`}
              className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center space-x-1.5 shadow-emerald-glow transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Validate / Check-in at Gate</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
