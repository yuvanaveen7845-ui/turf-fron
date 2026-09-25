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
  ShieldCheck,
  CalendarCheck,
  ChevronRight,
  Receipt,
  CreditCard,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { normalizeList } from "../../utils/helpers";
import { FriendsTurfMatchPass } from "../../components/booking/FriendsTurfMatchPass";
import { ReceiptModal } from "../../components/payment/ReceiptModal";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";

export const MyBookingsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { booking: bookingRules } = useBusinessSettings();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedBookingForQR, setSelectedBookingForQR] =
    useState<Booking | null>(null);
  const [selectedBookingForCancel, setSelectedBookingForCancel] =
    useState<Booking | null>(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] =
    useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  // Reschedule modal state
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] =
    useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState<any[]>([]);
  const [selectedRescheduleSlotId, setSelectedRescheduleSlotId] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

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
  const [balancePayingId, setBalancePayingId] = useState<string | null>(null);

  const handlePayRemainingBalance = async (booking: Booking) => {
    if (balancePayingId) return;
    setBalancePayingId(booking.booking_id);
    try {
      const orderRes = await api.post("/payments/razorpay/pay-balance/", {
        booking_id: booking.booking_id,
      });
      const orderData = orderRes.data;

      const { initiateRazorpayCheckout } = await import("../../services/razorpay");
      await initiateRazorpayCheckout({
        orderData: {
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          key_id: orderData.key_id,
          booking_id: booking.booking_id,
          description: `Clear Remaining Balance (₹${orderData.amount_to_pay})`,
        },
        user: {
          full_name: user?.full_name || user?.first_name || "Player",
          email: user?.email || "customer@friendsturf.com",
          phone: user?.phone || "9999999999",
        },
        onSuccess: async (verifyPayload) => {
          await api.post("/payments/razorpay/verify-balance/", {
            razorpay_order_id: verifyPayload.razorpay_order_id,
            razorpay_payment_id: verifyPayload.razorpay_payment_id,
            razorpay_signature: verifyPayload.razorpay_signature,
            booking_id: booking.booking_id,
          });

          toast.success(
            `Remaining balance of ₹${orderData.amount_to_pay} settled successfully! Your match pass is 100% paid.`
          );
          await refreshProfile();
          fetchBookings();
        },
        onError: (errMsg) => {
          toast.error(errMsg || "Balance payment could not be completed.");
        },
        onDismiss: () => {
          setBalancePayingId(null);
        },
      });
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to initialize balance payment."
      );
    } finally {
      setBalancePayingId(null);
    }
  };

  const fetchBookings = () => {
    setLoading(true);
    api
      .get(`/bookings/?tab=${activeTab}`)
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
        setBookings(list);
      })
      .catch((err) => {
        console.error(err);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  // Load slots when opening reschedule modal or changing date
  const loadRescheduleSlots = async (turfId: string, date: string) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/turfs/${turfId}/availability/?date=${date}`);
      setAvailableRescheduleSlots(res.data.slots || []);
    } catch (err) {
      console.error(err);
      setAvailableRescheduleSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenReschedule = (booking: Booking) => {
    setSelectedBookingForReschedule(booking);
    setSelectedRescheduleSlotId("");
    // Default to booking's turf
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setRescheduleDate(dateStr);
    loadRescheduleSlots(booking.turf, dateStr);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBookingForReschedule || !selectedRescheduleSlotId) return;
    setRescheduleLoading(true);
    try {
      await api.post(
        `/bookings/${selectedBookingForReschedule.id}/reschedule/`,
        {
          new_date: rescheduleDate,
          new_slot_ids: [selectedRescheduleSlotId],
        }
      );
      toast.success(
        `Booking ${selectedBookingForReschedule.booking_id} successfully rescheduled to ${rescheduleDate}!`
      );
      setSelectedBookingForReschedule(null);
      fetchBookings();
      await refreshProfile();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          "Failed to reschedule booking. The selected slot may no longer be available."
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    setCancelLoading(true);
    try {
      const res = await api.post(
        `/bookings/${selectedBookingForCancel.id}/cancel/`,
        {
          reason: cancelReason || "Customer cancelled before match",
        }
      );
      toast.success(
        `Booking ${selectedBookingForCancel.booking_id} cancelled. ${res.data.refund_message || "Eligible refund credited to your wallet."}`
      );
      setSelectedBookingForCancel(null);
      setCancelReason("");
      fetchBookings();
      await refreshProfile();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          "Failed to cancel booking. Cancellations are restricted inside 6 hours."
      );
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
        booking_id: selectedBookingForReview.id,
        turf_id: selectedBookingForReview.turf,
        rating: reviewForm.rating,
        facility_rating: reviewForm.facility_rating,
        staff_rating: reviewForm.staff_rating,
        review_text: reviewForm.review_text,
        suggestions: reviewForm.suggestions,
      });
      toast.success("Thank you! Your verified match review has been submitted.");
      setSelectedBookingForReview(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center mx-auto shadow-sm">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Match Passes
          </h2>
          <p className="text-sm text-slate-600">
            Sign in to view your scheduled turf bookings, match QR passes, gate check-in status, and digital receipts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <span>Sign In / Register</span>
          </Link>
          <Link
            to="/turfs"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all"
          >
            <span>Book a Pitch</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* 1. Page Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
            Player Dashboard
          </span>
          <h1 className="text-[24px] sm:text-[30px] font-extrabold text-slate-900 tracking-tight">
            My Match Passes & Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage scheduled pitch reservations, match QR tickets, reschedule slots, and submit ground reviews.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-[#059669] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Upcoming Matches
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "past"
                ? "bg-[#059669] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Past Matches
          </button>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-4 bg-[#ECFDF5] border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-[#059669]">
          <span>{feedbackSuccess}</span>
          <button
            onClick={() => setFeedbackSuccess("")}
            className="text-emerald-700 font-black ml-2 cursor-pointer"
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
              className="h-36 bg-white rounded-2xl border border-slate-200"
            />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-900">
            {activeTab === "upcoming"
              ? "No upcoming matches scheduled."
              : "No past match history found."}
          </p>
          <Link
            to="/turfs"
            className="inline-block px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow transition-all"
          >
            Book a Ground Now
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
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-pitch-card transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-black text-sm text-slate-900 tracking-wide">
                      {booking.booking_id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Booked {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isConfirmed
                          ? "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                          : isCheckedIn
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : isCompleted
                              ? "bg-slate-100 text-slate-700"
                              : isCancelled
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
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
                      Turf / Ground
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {booking.turf_details?.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span className="truncate">
                        {booking.turf_details?.location}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Date & Timings
                    </span>
                    <p className="text-xs font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#059669]" />
                      <span>
                        {new Date(booking.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Pricing & Payment
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">
                      Total: ₹{Number(booking.final_amount).toLocaleString("en-IN")}
                    </p>
                    {Number(booking.balance_due) > 0 ? (
                      <p className="text-xs text-[#F59E0B] font-bold">
                        ₹{Number(booking.balance_due).toLocaleString("en-IN")} due at venue
                      </p>
                    ) : (
                      <p className="text-xs text-[#059669] font-semibold">
                        Paid Full (₹{Number(booking.amount_paid).toLocaleString("en-IN")})
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                    {/* Pay Remaining Balance via Razorpay */}
                    {isConfirmed && Number(booking.balance_due) > 0 && (
                      <button
                        onClick={() => handlePayRemainingBalance(booking)}
                        disabled={balancePayingId === booking.booking_id}
                        className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>
                          {balancePayingId === booking.booking_id
                            ? "Processing..."
                            : `Pay ₹${Number(booking.balance_due).toLocaleString("en-IN")} Balance`}
                        </span>
                      </button>
                    )}

                    {/* View QR Pass */}
                    {(isConfirmed || isCheckedIn) && (
                      <button
                        onClick={() => setSelectedBookingForQR(booking)}
                        className="px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-emerald-100 text-[#059669] border border-emerald-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Pass</span>
                      </button>
                    )}

                    {/* View Receipt */}
                    {Number(booking.amount_paid) > 0 && (
                      <button
                        onClick={() => setSelectedBookingForReceipt(booking)}
                        className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Receipt</span>
                      </button>
                    )}

                    {/* Reschedule Button */}
                    {isConfirmed && (
                      <button
                        onClick={() => handleOpenReschedule(booking)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {/* Review Completed Match */}
                    {isCompleted && (
                      <button
                        onClick={() => setSelectedBookingForReview(booking)}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Rate Ground</span>
                      </button>
                    )}

                    {/* Cancel Booking */}
                    {isConfirmed && (
                      <button
                        onClick={() => setSelectedBookingForCancel(booking)}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedBookingForReschedule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                  Reschedule Match
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Select New Date & Slot
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingForReschedule(null)}
                className="text-slate-400 hover:text-slate-800 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-900">
                Current Booking: {selectedBookingForReschedule.turf_details?.name}
              </p>
              <p className="text-slate-500">
                Scheduled on {new Date(selectedBookingForReschedule.date).toLocaleDateString()} at{" "}
                {selectedBookingForReschedule.start_time.slice(0, 5)} - {selectedBookingForReschedule.end_time.slice(0, 5)}
              </p>
            </div>

            {/* Date Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Choose New Match Date:
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  loadRescheduleSlots(selectedBookingForReschedule.turf, e.target.value);
                }}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#059669] cursor-pointer"
              />
            </div>

            {/* Slot Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Available Slots on {rescheduleDate}:
              </label>
              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                  Checking real-time slot availability...
                </div>
              ) : availableRescheduleSlots.filter((s) => s.status === "AVAILABLE").length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No slots available on this date. Please choose another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableRescheduleSlots
                    .filter((s) => s.status === "AVAILABLE")
                    .map((slot) => {
                      const isSelected = selectedRescheduleSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedRescheduleSlotId(slot.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                            isSelected
                              ? "bg-[#059669] text-white border-[#059669] shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <div>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-[#059669]"}`}>
                            ₹{slot.price}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBookingForReschedule(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedRescheduleSlotId || rescheduleLoading}
                onClick={handleConfirmReschedule}
                className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white font-bold text-xs shadow-emerald-glow cursor-pointer"
              >
                {rescheduleLoading ? "Rescheduling..." : "Confirm New Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Digital Match Pass Modal */}
      {selectedBookingForQR && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md overflow-y-auto flex min-h-full items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full my-auto py-6">
            <FriendsTurfMatchPass
              passData={{
                booking_id: selectedBookingForQR.booking_id,
                turf_name: selectedBookingForQR.turf_details?.name || "Friends Turf Arena",
                turf_location: selectedBookingForQR.turf_details?.location || "Tiruppur",
                surface_spec: selectedBookingForQR.turf_details?.surface_spec || "50mm Pro Turf",
                lighting_spec: selectedBookingForQR.turf_details?.lighting_spec || "500 Lux Anti-Glare LED",
                date: selectedBookingForQR.date,
                start_time: selectedBookingForQR.start_time,
                end_time: selectedBookingForQR.end_time,
                customer_name: user?.full_name || "Player",
                customer_phone: user?.phone || "",
                total_amount: Number(selectedBookingForQR.final_amount || selectedBookingForQR.total_amount || 0),
                amount_paid: Number(selectedBookingForQR.amount_paid || 0),
                balance_due: Number(selectedBookingForQR.balance_due || 0),
                status: selectedBookingForQR.status,
                booking_status: selectedBookingForQR.status,
                is_used: selectedBookingForQR.status === "CHECKED_IN",
                checked_in_at: selectedBookingForQR.checked_in_at,
                qr_base64: selectedBookingForQR.qr_ticket_data?.qr_base64,
              }}
              onClose={() => setSelectedBookingForQR(null)}
              showActions={true}
              onBalancePaid={() => {
                fetchBookings();
              }}
            />
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              Cancel Match Booking?
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel booking{" "}
              <strong className="text-slate-900">
                {selectedBookingForCancel.booking_id}
              </strong>
              ? As per our policy, eligible refunds are instantly credited to your Turf Wallet.
            </p>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5 text-[11px] text-amber-900">
              <span className="font-bold flex items-center space-x-1.5 text-amber-950">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Automated Cancellation &amp; Refund Policy</span>
              </span>
              <ul className="list-disc pl-4 space-y-1 text-amber-800">
                <li>
                  <strong>100% Refund:</strong> Cancellations &gt; {bookingRules?.cancellationFullRefundHours ?? 24} hours before kickoff
                </li>
                <li>
                  <strong>{bookingRules?.partialRefundPercent ?? 50}% Refund:</strong> Between {bookingRules?.cancellationPartialRefundHours ?? 6} and {bookingRules?.cancellationFullRefundHours ?? 24} hours before kickoff
                </li>
                <li>
                  <strong>Non-Refundable:</strong> Cancellations within {bookingRules?.cancellationPartialRefundHours ?? 6} hours of kickoff
                </li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Reason for cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Team unavailable, weather, schedule conflict..."
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#059669]"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                {cancelLoading ? "Processing..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReview}
            className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Rate Your Match Experience</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Overall Ground Rating (1 - 5 Stars):
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: star })
                      }
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewForm.rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Turf Surface & Lighting Quality:
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reviewForm.facility_rating}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      facility_rating: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#059669]"
                />
                <span className="text-[11px] text-slate-500">
                  Rating: {reviewForm.facility_rating} / 5
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Your Review / Comments:
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
                  placeholder="How was the turf bounce, floodlights, and changing rooms?"
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#059669]"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForReview(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow cursor-pointer"
              >
                {reviewLoading ? "Submitting..." : "Post Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Tax Receipt Modal */}
      {selectedBookingForReceipt && (
        <ReceiptModal
          isOpen={!!selectedBookingForReceipt}
          onClose={() => setSelectedBookingForReceipt(null)}
          identifier={selectedBookingForReceipt.booking_id}
        />
      )}
    </div>
  );
};

