import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  QrCode,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";

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
        err.response?.data?.error || "No booking found with this reference.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="border-b border-slate-800 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
          <Search className="w-4 h-4" />
          <span>Lookup Console</span>
        </span>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Search Booking by Reference
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Locate match passes, verify payment history, or launch quick check-in
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Enter Booking ID (e.g. FT-20260915-XXXXX)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              required
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="FT-20260915-XXXXX"
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-sm text-white uppercase placeholder-slate-500 focus:border-amber-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs disabled:opacity-50 transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-950/70 border border-red-800 rounded-2xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Booking Reference
              </span>
              <p className="text-lg font-black font-mono text-white mt-0.5">
                {result.booking_id}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-xs font-bold uppercase text-emerald-400">
              {result.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Turf
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {result.turf_details?.name}
              </p>
              <p className="text-slate-400 mt-0.5">
                {result.turf_details?.location}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Player Details
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {result.customer_details?.full_name}
              </p>
              <p className="text-slate-400 mt-0.5">
                {result.customer_details?.phone ||
                  result.customer_details?.email}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Date & Time
              </span>
              <p className="text-xs font-bold text-white mt-0.5">
                {result.date}
              </p>
              <p className="text-slate-300">
                {result.start_time.slice(0, 5)} - {result.end_time.slice(0, 5)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Payment Breakdown
              </span>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">
                Paid: ₹{result.amount_paid}
              </p>
              <p className="text-slate-400">Balance: ₹{result.balance_due}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Link
              to={`/staff/scanner?code=${result.booking_id}`}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Validate / Check-in</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
