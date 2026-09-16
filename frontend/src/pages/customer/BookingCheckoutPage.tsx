import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  ShieldCheck,
  Tag,
  CreditCard,
  Wallet,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  ChevronLeft,
  Calendar,
  MapPin,
  Lock,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Turf, TimeSlot } from "../../types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const BookingCheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const state = location.state as {
    turf: Turf;
    date: string;
    selectedDate?: string;
    slotIds?: string[];
    selectedSlotIds?: string[];
    selectedSlots: TimeSlot[];
    lockData?: { locked_until: string; slot_ids: string[] };
    lockedSlots?: any[];
    expiresAt?: string;
  } | null;

  const actualSlotIds = state?.slotIds || state?.selectedSlotIds || [];
  const actualDate = state?.date || state?.selectedDate || "";

  // Countdown timer for 5-min slot lock
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Pricing breakdown
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Payment configuration (Full vs 50% Partial)
  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "WALLET">(
    "RAZORPAY"
  );
  const [notes, setNotes] = useState("");

  // Processing states
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load Razorpay Checkout Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!state?.turf || !actualSlotIds || actualSlotIds.length === 0) {
      navigate("/turfs");
      return;
    }

    // Initialize 5-minute countdown from locked_until / expiresAt
    const expiryTimeStr = state.lockData?.locked_until || state.expiresAt;
    if (expiryTimeStr) {
      const lockExpiry = new Date(expiryTimeStr).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((lockExpiry - now) / 1000));
      setTimeLeftSeconds(diff > 0 ? diff : 300);
    }

    fetchPricePreview("");
  }, [state]);

  // Countdown interval
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage(
            "Slot reservation lock has expired. Please select your slots again."
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

  const fetchPricePreview = async (codeToApply: string) => {
    if (!state || !actualSlotIds.length) return;
    setLoadingPrice(true);
    try {
      const res = await api.post("/bookings/preview-price/", {
        turf_id: state.turf.id,
        date: actualDate,
        slot_ids: actualSlotIds,
        coupon_code: codeToApply,
      });
      setPriceBreakdown(res.data);
      if (res.data.coupon_error) {
        setCouponError(res.data.coupon_error);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");

    try {
      const subtotal = priceBreakdown?.subtotal || state?.turf.base_price;
      const res = await api.post("/promotions/validate/", {
        code: couponCode,
        amount: subtotal,
      });
      setAppliedCoupon(res.data);
      await fetchPricePreview(couponCode);
    } catch (err: any) {
      setCouponError(err.response?.data?.message || "Invalid coupon code.");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError("");
    fetchPricePreview("");
  };

  const [paymentAttemptFailed, setPaymentAttemptFailed] = useState(false);

  const handlePayAndConfirm = async () => {
    if (processing) return; // Duplicate click protection
    if (timeLeftSeconds <= 0) {
      setPaymentAttemptFailed(true);
      setErrorMessage("Your slot reservation hold has expired. Please select a slot again.");
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setPaymentAttemptFailed(false);
    setStatusMessage("Processing your payment…");

    try {
      // 1. Create server-calculated Razorpay order and slot reservation
      const orderRes = await api.post("/payments/razorpay/create-order/", {
        turf_id: state?.turf.id,
        date: actualDate,
        slot_ids: actualSlotIds,
        coupon_code: appliedCoupon ? appliedCoupon.code : "",
        payment_type: paymentType,
        notes,
      });

      const orderData = orderRes.data;

      // 2. Launch Razorpay Checkout Modal
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay SDK is loading. Please check your internet connection and retry."
        );
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount, // in paise
        currency: orderData.currency || "INR",
        name: "Friends Turf Sports Complex",
        description: `Official Match Pass (${orderData.booking_id})`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.full_name || user?.first_name || "Friends Turf Player",
          email: user?.email || "customer@friendsturf.com",
          contact: user?.phone || "9999999999",
        },
        theme: {
          color: "#059669",
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setStatusMessage("");
            setPaymentAttemptFailed(true);
          },
        },
        handler: async (response: any) => {
          setStatusMessage("We're confirming your payment…");
          try {
            const verifyRes = await api.post("/payments/razorpay/verify/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking_id,
            });

            await refreshProfile();
            navigate(`/confirmation/${orderData.booking_id}`, {
              state: {
                booking: verifyRes.data.booking,
                payment: verifyRes.data.payment,
              },
            });
          } catch (vErr: any) {
            setPaymentAttemptFailed(true);
            setErrorMessage(
              vErr.response?.data?.error ||
                "Payment verification is taking a moment. Please check My Bookings or contact support."
            );
          } finally {
            setProcessing(false);
            setStatusMessage("");
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", (response: any) => {
        setProcessing(false);
        setStatusMessage("");
        setPaymentAttemptFailed(true);
        setErrorMessage(
          response.error?.description || "Transaction was declined by your bank."
        );
      });

      rzpInstance.open();
    } catch (err: any) {
      setProcessing(false);
      setStatusMessage("");
      setPaymentAttemptFailed(true);
      setErrorMessage(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to initialize payment."
      );
    }
  };

  if (!state?.turf) return null;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const walletBal = Number(user?.customer_profile?.wallet_balance || 0);
  const finalPayable = priceBreakdown ? Number(priceBreakdown.final_amount) : 0;
  const advancePayable = Math.round(finalPayable * 0.5); // 50% partial deposit
  const amountToCharge = paymentType === "FULL" ? finalPayable : advancePayable;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* 1. 5-Minute Slot Lock Countdown Alert */}
      <div
        className={`p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border transition-all ${
          timeLeftSeconds < 60
            ? "bg-red-50 border-red-200 text-red-900 animate-pulse"
            : "bg-[#F0FDF4] border-emerald-200 text-emerald-900"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock
              className={`w-5 h-5 ${timeLeftSeconds < 60 ? "text-red-600" : "text-[#059669]"}`}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">
              {timeLeftSeconds > 0
                ? "5-Minute Pitch Lock Active"
                : "Slot Reservation Expired"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {timeLeftSeconds > 0
                ? "Your selected pitch slots are temporarily reserved so no other customer can book them."
                : "Your slot hold has expired and returned to the public pool."}
            </p>
          </div>
        </div>

        <div className="text-right self-end sm:self-center shrink-0">
          <span className="text-[11px] uppercase font-bold text-slate-500 block">
            Time Remaining
          </span>
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              timeLeftSeconds < 60 ? "text-red-600" : "text-[#059669]"
            }`}
          >
            {timerFormatted}
          </span>
        </div>
      </div>

      {paymentAttemptFailed && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-black">Payment Not Completed</h3>
          </div>
          {errorMessage && <p className="text-xs text-amber-800">{errorMessage}</p>}
          {timeLeftSeconds > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-amber-200/60 text-xs">
              <p className="text-slate-700">
                Your booking hold is still active for:{" "}
                <strong className="font-mono font-black text-amber-900 text-sm">{timerFormatted}</strong>
              </p>
              <button
                onClick={handlePayAndConfirm}
                disabled={processing}
                className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-sm text-xs cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-amber-200/60 text-xs">
              <p className="text-slate-700">Your slot is no longer reserved.</p>
              <Link
                to="/turfs"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm text-xs"
              >
                Choose Another Slot
              </Link>
            </div>
          )}
        </div>
      )}

      {statusMessage && (
        <div className="flex items-center space-x-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#059669] animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Match & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Match Details Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Match Details & Pitch Ground</span>
            </h2>

            <div className="flex items-start space-x-4">
              <img
                src={state.turf.images[0]}
                alt={state.turf.name}
                className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {state.turf.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{state.turf.location}</span>
                </p>
                <p className="text-xs text-[#059669] font-bold">
                  {new Date(actualDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Selected slots chips */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600">
                Reserved 1-Hour Time Slots:
              </p>
              <div className="flex flex-wrap gap-2">
                {state.selectedSlots?.map((slot) => (
                  <span
                    key={slot.id}
                    className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-xs font-bold text-[#059669]"
                  >
                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)} (₹{Number(slot.price)})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Option Switcher (Full vs 50% Partial) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Choose Payment Option
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("FULL")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentType === "FULL"
                    ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                    : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">
                    100% Online
                  </span>
                  <CheckCircle2
                    className={`w-4 h-4 ${paymentType === "FULL" ? "text-[#059669]" : "text-slate-400"}`}
                  />
                </div>
                <p className="text-base font-black text-slate-900">Pay Full Amount</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Zero balance due at venue. Instant QR pass activation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("PARTIAL")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentType === "PARTIAL"
                    ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                    : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                    50% Partial Advance
                  </span>
                  <CheckCircle2
                    className={`w-4 h-4 ${paymentType === "PARTIAL" ? "text-[#059669]" : "text-slate-400"}`}
                  />
                </div>
                <p className="text-base font-black text-slate-900">
                  Pay ₹{advancePayable} Deposit
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pay remaining ₹{finalPayable - advancePayable} balance at venue reception.
                </p>
              </button>
            </div>
          </div>

          {/* Secure Payment Gateway Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Secure Payment Gateway</span>
              <span className="flex items-center space-x-1 text-[#059669] text-[11px]">
                <Lock className="w-3.5 h-3.5" />
                <span>256-Bit SSL Encrypted</span>
              </span>
            </h2>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-blue-600 text-sm shadow-sm">
                  ₹
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Razorpay Unified Checkout</p>
                  <p className="text-[11px] text-slate-500">
                    Supports UPI (GPay/PhonePe), Credit & Debit Cards, NetBanking, and Wallets
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-[10px] font-bold">
                OFFICIAL GATEWAY
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Checkout Action */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coupon Box */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-[#059669]" />
              <span>Promo Coupon Code</span>
            </h3>

            {appliedCoupon ? (
              <div className="p-3 bg-[#ECFDF5] border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#059669]">
                    Applied: {appliedCoupon.code}
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    {appliedCoupon.message}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME100 / TURF20"
                  className="flex-1 px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono uppercase font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#059669] outline-none"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {validatingCoupon ? "Checking..." : "Apply"}
                </button>
              </form>
            )}

            {couponError && (
              <p className="text-xs text-red-600 font-semibold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{couponError}</span>
              </p>
            )}
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Price Breakdown
            </h3>

            {loadingPrice ? (
              <div className="space-y-2 animate-pulse py-4">
                <div className="h-4 bg-slate-100 rounded" />
                <div className="h-4 bg-slate-100 rounded" />
                <div className="h-4 bg-slate-100 rounded" />
              </div>
            ) : priceBreakdown ? (
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Base Slot Rate</span>
                  <span className="font-bold text-slate-900">
                    ₹{priceBreakdown.total_base}
                  </span>
                </div>

                {priceBreakdown.total_adjustments !== 0 && (
                  <div className="flex justify-between text-[#F59E0B]">
                    <span>Peak / Weekend Surge Adjustment</span>
                    <span className="font-bold">
                      {priceBreakdown.total_adjustments > 0 ? "+" : ""}₹
                      {priceBreakdown.total_adjustments}
                    </span>
                  </div>
                )}

                {priceBreakdown.coupon_discount > 0 && (
                  <div className="flex justify-between text-[#059669]">
                    <span>Coupon Discount ({priceBreakdown.coupon_code})</span>
                    <span className="font-bold">
                      -₹{priceBreakdown.coupon_discount}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>GST Taxes ({priceBreakdown.tax_rate_percent}%)</span>
                  <span className="font-bold text-slate-900">
                    ₹{priceBreakdown.tax_amount}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                  <span>Total Match Price</span>
                  <span className="text-[#059669]">
                    ₹{priceBreakdown.final_amount}
                  </span>
                </div>

                {paymentType === "PARTIAL" && (
                  <div className="p-3 bg-[#F0FDF4] border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-emerald-900 text-xs">
                      <span>Deposit Payable Now (50%)</span>
                      <span>₹{advancePayable}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Balance Due at Venue (50%)</span>
                      <span>₹{priceBreakdown.final_amount - advancePayable}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Pay Button */}
            <div className="pt-4 space-y-2">
              <button
                onClick={handlePayAndConfirm}
                disabled={processing || timeLeftSeconds <= 0}
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                {processing ? (
                  <span>Processing Secure Checkout...</span>
                ) : (
                  <>
                    <span>Pay ₹{amountToCharge} via Razorpay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span>Instant Cryptographic QR Pass Upon Verified Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
