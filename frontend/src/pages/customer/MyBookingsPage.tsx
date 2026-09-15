import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  XCircle,
  RefreshCw,
  Star,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";
import { useAuth } from "../../context/AuthContext";

export const MyBookingsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedBookingForQR, setSelectedBookingForQR] =
    useState<Booking | null>(null);
  const [selectedBookingForCancel, setSelectedBookingForCancel] =
    useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  // Review modal state
  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState<Booking | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    facility_rating: 5,
    staff_rating: 5,
    review_text: "",
    suggestions: "",
  });
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    api
      .get(`/bookings/?tab=${activeTab}`)
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    setCancelLoading(true);
    try {
      await api.post(
        `/bookings/${selectedBookingForCancel.booking_id}/cancel/`,
        {
          reason: cancelReason || "Customer self-cancellation",
        },
      );
      setSelectedBookingForCancel(null);
      setCancelReason("");
      setFeedbackSuccess(
        "Booking cancelled. Any paid amount has been credited back to your Turf Wallet!",
      );
      await refreshProfile();
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || "Cancellation failed.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;
    setReviewLoading(true);
    try {
      await api.post("/reviews/", {
        booking_id: selectedBookingForReview.booking_id,
        ...reviewForm,
      });
      setSelectedBookingForReview(null);
      setFeedbackSuccess("Thank you for rating your match experience!");
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Player Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Match Bookings
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "upcoming"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming Matches
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "past"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Past & History
          </button>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
          <span>{feedbackSuccess}</span>
          <button
            onClick={() => setFeedbackSuccess("")}
            className="text-emerald-400 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-slate-900 rounded-2xl border border-slate-800"
            />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-base font-bold text-slate-300">
            {activeTab === "upcoming"
              ? "No upcoming matches scheduled."
              : "No past matches found."}
          </p>
          <Link
            to="/turfs"
            className="inline-block px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors"
          >
            Book a Pitch Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isConfirmed =
              booking.status === "CONFIRMED" || booking.status === "UPCOMING";
            const isCheckedIn = booking.status === "CHECKED_IN";
            const isCompleted = booking.status === "COMPLETED";
            const isCancelled = booking.status === "CANCELLED";

            return (
              <div
                key={booking.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-black text-sm text-white tracking-wide">
                      {booking.booking_id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Booked on{" "}
                      {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isConfirmed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isCheckedIn
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : isCompleted
                              ? "bg-slate-800 text-slate-300"
                              : isCancelled
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Turf / Arena
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {booking.turf_details?.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {booking.turf_details?.location}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Date & Time
                    </span>
                    <p className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {new Date(booking.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                    <p className="text-xs font-semibold text-slate-300 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>
                        {booking.start_time.slice(0, 5)} -{" "}
                        {booking.end_time.slice(0, 5)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Payment & Balance
                    </span>
                    <p className="text-xs font-black text-emerald-400 mt-0.5">
                      Paid: ₹{booking.amount_paid}
                    </p>
                    <p className="text-xs text-slate-400">
                      Balance: ₹{booking.balance_due}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 pt-2 md:pt-0">
                    {/* View QR Code button */}
                    <button
                      onClick={() => setSelectedBookingForQR(booking)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-500 text-xs font-bold text-emerald-400 flex items-center space-x-1.5 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Ticket</span>
                    </button>

                    {/* Cancel button if upcoming */}
                    {activeTab === "upcoming" && isConfirmed && (
                      <button
                        onClick={() => setSelectedBookingForCancel(booking)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-950/40 border border-red-800 hover:bg-red-900/60 text-xs font-bold text-red-400 flex items-center space-x-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {/* Review button if completed */}
                    {activeTab === "past" && isCompleted && (
                      <button
                        onClick={() => setSelectedBookingForReview(booking)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-700 hover:bg-amber-900/60 text-xs font-bold text-amber-400 flex items-center space-x-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Rate Match</span>
                      </button>
                    )}
                  </div>
                </div>

                {isCancelled && booking.cancel_reason && (
                  <p className="text-xs text-slate-500 italic bg-slate-950/50 p-2.5 rounded-xl">
                    Cancellation note: {booking.cancel_reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QR Ticket Popup Modal */}
      {selectedBookingForQR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 max-w-sm w-full rounded-3xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                {selectedBookingForQR.booking_id}
              </span>
              <button
                onClick={() => setSelectedBookingForQR(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {selectedBookingForQR.turf_details?.name}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedBookingForQR.date} (
                {selectedBookingForQR.start_time.slice(0, 5)} -{" "}
                {selectedBookingForQR.end_time.slice(0, 5)})
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl inline-block shadow-xl">
              {selectedBookingForQR.qr_ticket_data?.qr_base64 ? (
                <img
                  src={selectedBookingForQR.qr_ticket_data.qr_base64}
                  alt="QR Ticket"
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-800 font-bold text-xs">
                  Pass Active
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Show this QR code at the gate. Fast staff check-in guaranteed.
            </p>

            <button
              onClick={() => setSelectedBookingForQR(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/60 max-w-md w-full rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Cancel Booking {selectedBookingForCancel.booking_id}</span>
            </h3>

            <p className="text-xs text-slate-400">
              Are you sure you want to cancel? Any amount paid (₹
              {selectedBookingForCancel.amount_paid}) will be refunded
              immediately to your Turf Wallet.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Squad unavailable, rainy weather, reschedule etc."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-red-500 h-20"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {cancelLoading ? "Cancelling..." : "Confirm & Refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 max-w-md w-full rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>How was your match experience?</span>
            </h3>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Overall Rating (1 to 5 stars)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: star })
                      }
                      className="text-2xl"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Pitch / Turf Condition
                  </label>
                  <select
                    value={reviewForm.facility_rating}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        facility_rating: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} Stars
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Staff / Gate Service
                  </label>
                  <select
                    value={reviewForm.staff_rating}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        staff_rating: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} Stars
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Your Review & Feedback
                </label>
                <textarea
                  required
                  value={reviewForm.review_text}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      review_text: e.target.value,
                    })
                  }
                  placeholder="How was the turf bounce, floodlights, ball pace?"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none h-20"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Suggestions for Venue Management
                </label>
                <input
                  type="text"
                  value={reviewForm.suggestions}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      suggestions: e.target.value,
                    })
                  }
                  placeholder="e.g. Add more bench seating, chilled energy drinks"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForReview(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold disabled:opacity-50"
                >
                  {reviewLoading ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
