import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  QrCode,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";

export const ManageBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    api
      .get("/bookings/")
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchesSearch =
      b.booking_id.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_details?.email.toLowerCase().includes(search.toLowerCase()) ||
      b.turf_details?.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Master Operations
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            All System Bookings
          </h1>
        </div>

        <button
          onClick={fetchBookings}
          className="text-xs font-bold text-purple-400 hover:underline"
        >
          ↻ Refresh Bookings
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking ID, customer email, turf..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-purple-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked-In</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="PAYMENT_PENDING">Payment Pending</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No-Show</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs animate-pulse">
            Loading all bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No bookings found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Turf</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {b.booking_id}
                    </td>
                    <td className="py-4 px-4 font-medium text-white">
                      {b.turf_details?.name}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">
                        {b.customer_details?.full_name || "Player"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {b.customer_details?.email}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-white">{b.date}</p>
                      <p className="text-[11px] text-slate-400">
                        {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-emerald-400">
                        ₹{b.final_amount}
                      </span>
                      {Number(b.balance_due) > 0 && (
                        <p className="text-[10px] text-amber-400">
                          Due: ₹{b.balance_due}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-700 text-slate-200">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono font-bold text-purple-400 text-sm">
                {selectedBooking.booking_id}
              </span>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Turf
                </span>
                <p className="font-bold text-white mt-0.5">
                  {selectedBooking.turf_details?.name}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Customer
                </span>
                <p className="font-bold text-white mt-0.5">
                  {selectedBooking.customer_details?.full_name}
                </p>
                <p className="text-slate-400">
                  {selectedBooking.customer_details?.email}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Date & Time
                </span>
                <p className="font-bold text-white mt-0.5">
                  {selectedBooking.date} (
                  {selectedBooking.start_time.slice(0, 5)} -{" "}
                  {selectedBooking.end_time.slice(0, 5)})
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Financials
                </span>
                <p className="font-bold text-emerald-400 mt-0.5">
                  Paid: ₹{selectedBooking.amount_paid} / Total: ₹
                  {selectedBooking.final_amount}
                </p>
              </div>
            </div>

            {selectedBooking.pricing_breakdown && (
              <div className="p-3 bg-slate-950 rounded-xl text-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Pricing Breakdown
                </span>
                <div className="flex justify-between text-slate-400">
                  <span>
                    Subtotal: ₹{selectedBooking.pricing_breakdown.subtotal}
                  </span>
                  <span>
                    GST: ₹{selectedBooking.pricing_breakdown.tax_amount}
                  </span>
                  <span>
                    Discount: -₹
                    {selectedBooking.pricing_breakdown.total_discount}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
