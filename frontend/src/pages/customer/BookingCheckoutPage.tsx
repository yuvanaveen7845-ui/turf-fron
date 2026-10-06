import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  ShieldCheck,
  Tag,
  CreditCard,
  Wallet,
  QrCode,
  CheckCircle2,
  Check,
  AlertCircle,
  ArrowRight,
  Info,
  ChevronLeft,
  Calendar,
  MapPin,
  Lock,
  RefreshCw,
  Sparkles,
  User,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";
import { Turf, TimeSlot } from "../../types";
import { initiateRazorpayCheckout } from "../../services/razorpay";
import { WalletPaymentProcessingModal } from "../../components/booking/WalletPaymentProcessingModal";
import { FriendsTurfMatchPass } from "../../components/booking/FriendsTurfMatchPass";
import { getBookingIntent, saveBookingIntent, clearBookingIntent } from "../../utils/bookingIntent";
import { resolveImageUrl, handleImageError } from "../../utils/imageUrl";

export const BookingCheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const {
    booking: bookingRules,
    company: companySettings,
    payments: paymentSettings,
    features: featureFlags,
  } = useBusinessSettings();

  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    booking: any;
    payment: any;
  } | null>(null);

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

  // Countdown timer for slot lock
  const defaultLockSecs = (bookingRules?.slotHoldMinutes || 5) * 60;
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(defaultLockSecs);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Pricing breakdown
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Payment configuration (Full vs Minimum Advance)
  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const [customAdvanceInput, setCustomAdvanceInput] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "WALLET">(
    "RAZORPAY"
  );
  const [notes, setNotes] = useState("");

  // Guest checkout state (for visitors booking without signing in)
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestTouched, setGuestTouched] = useState({ name: false, phone: false, email: false });

  // Guest validation rules
  const cleanGuestPhone = guestPhone.replace(/\D/g, "").slice(0, 10);
  const isGuestPhoneValid = /^[6-9]\d{9}$/.test(cleanGuestPhone);
  const isGuestNameValid = guestName.trim().length >= 2;
  const isGuestEmailValid = !guestEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());

  const guestPhoneError =
    guestTouched.phone && !isGuestPhoneValid
      ? !cleanGuestPhone
        ? "Mobile number is required"
        : cleanGuestPhone.length < 10
        ? `Enter 10 digits (${cleanGuestPhone.length}/10 entered)`
        : !/^[6-9]/.test(cleanGuestPhone)
        ? "Indian mobile numbers must start with 6, 7, 8, or 9"
        : "Invalid mobile number"
      : "";

  const guestNameError =
    guestTouched.name && !isGuestNameValid
      ? !guestName.trim()
        ? "Player or team name is required"
        : "Name must be at least 2 characters"
      : "";

  const guestEmailError =
    guestTouched.email && !isGuestEmailValid
      ? "Please enter a valid email address (e.g. name@domain.com)"
      : "";

  const onlinePaymentsEnabled = featureFlags?.ONLINE_PAYMENTS !== false;

  // Duration in hours (supports 1h, 2h, 3h, 3.5h, etc.)
  const bookingDurationHours = useMemo(() => {
    if (state?.selectedSlots && state.selectedSlots.length > 0) {
      let totalMins = 0;
      for (const s of state.selectedSlots) {
        if (s.start_time && s.end_time) {
          const [sh, sm] = s.start_time.split(":").map(Number);
          const [eh, em] = s.end_time.split(":").map(Number);
          let diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff < 0) diff += 24 * 60;
          totalMins += diff > 0 ? diff : 60;
        } else {
          totalMins += 60;
        }
      }
      return totalMins / 60;
    }
    return actualSlotIds.length > 0 ? actualSlotIds.length : 1;
  }, [state?.selectedSlots, actualSlotIds.length]);

  useEffect(() => {
    if (!onlinePaymentsEnabled && paymentMethod === "RAZORPAY") {
      setPaymentMethod("WALLET");
    }
  }, [onlinePaymentsEnabled, paymentMethod]);

  // Processing states
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [existingConfirmedBookingId, setExistingConfirmedBookingId] = useState<string | null>(null);


  useEffect(() => {
    if (authLoading) return;

    // If not authenticated, preserve booking intent without redirecting away (Express Guest Checkout)
    if (!user && state?.turf && actualSlotIds.length > 0) {
      saveBookingIntent({
        turfId: String(state.turf.id),
        turfName: state.turf.name,
        date: actualDate,
        slotIds: actualSlotIds,
        turf: state.turf,
        selectedSlots: state.selectedSlots,
        returnUrl: "/checkout",
      });
    }

    if (!state?.turf || !actualSlotIds || actualSlotIds.length === 0) {
      // Check if recoverable intent exists
      const intent = getBookingIntent();
      if (intent && intent.turfId && intent.slotIds?.length > 0) {
        navigate(`/turfs/${intent.turfId}?date=${intent.date}`, { replace: true });
        return;
      }
      navigate("/");
      return;
    }

    // Initialize countdown from locked_until / expiresAt
    const expiryTimeStr = state.lockData?.locked_until || state.expiresAt;
    if (expiryTimeStr) {
      const lockExpiry = new Date(expiryTimeStr).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((lockExpiry - now) / 1000));
      setTimeLeftSeconds(diff > 0 ? diff : defaultLockSecs);
    } else {
      setTimeLeftSeconds(defaultLockSecs);
    }

    fetchPricePreview("");
  }, [state, defaultLockSecs, user, authLoading]);

  // Countdown interval for slot reservation hold
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

    return () => {
      clearInterval(interval);
    };
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
  const [showWalletProcessing, setShowWalletProcessing] = useState(false);

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

    // Flow A: Instant Turf Cash Wallet Checkout with Interactive Processing Animation
    if (paymentMethod === "WALLET") {
      setShowWalletProcessing(true);
      setStatusMessage("Authorizing Turf Cash Wallet payment...");
      try {
        const [walletRes] = await Promise.all([
          api.post("/payments/wallet-checkout/", {
            turf_id: state?.turf.id,
            date: actualDate,
            slot_ids: actualSlotIds,
            coupon_code: appliedCoupon ? appliedCoupon.code : "",
            notes,
          }),
          new Promise((resolve) => setTimeout(resolve, 3200)), // Orchestrate smooth cinematic interactive progression
        ]);

        await refreshProfile();
        clearBookingIntent();
        setShowWalletProcessing(false);
        setProcessing(false);
        setStatusMessage("");
        const confirmedBookingId = walletRes.data?.booking?.booking_id;
        if (confirmedBookingId) {
          navigate(`/confirmation/${confirmedBookingId}`, {
            replace: true,
            state: {
              booking: walletRes.data.booking,
              payment: walletRes.data.payment,
            },
          });
        } else {
          setPaymentSuccessData({
            booking: walletRes.data.booking,
            payment: walletRes.data.payment,
          });
        }
      } catch (wErr: any) {
        setShowWalletProcessing(false);
        setProcessing(false);
        setStatusMessage("");
        setPaymentAttemptFailed(true);
        setErrorMessage(
          wErr.response?.data?.error ||
            "Wallet payment could not be processed. Please check your balance."
        );
      }
      return;
    }

    // Validate guest contact details if unauthenticated
    if (!user) {
      setGuestTouched({ name: true, phone: true, email: true });
      if (!isGuestNameValid) {
        setErrorMessage("Please enter a valid player or team name (minimum 2 characters).");
        setProcessing(false);
        return;
      }
      if (!isGuestPhoneValid) {
        if (!cleanGuestPhone) {
          setErrorMessage("Please enter your 10-digit mobile number for match pass delivery.");
        } else if (cleanGuestPhone.length < 10) {
          setErrorMessage(`Mobile number must be exactly 10 digits (${cleanGuestPhone.length}/10 entered).`);
        } else {
          setErrorMessage("Indian mobile numbers must start with 6, 7, 8, or 9.");
        }
        setProcessing(false);
        return;
      }
      if (!isGuestEmailValid) {
        setErrorMessage("Please enter a valid email address or leave it blank.");
        setProcessing(false);
        return;
      }
    }

    // Flow B: Razorpay Universal Payment Gateway
    setStatusMessage("Creating secure Razorpay order…");
    try {
      // 1. Create server-calculated Razorpay order and slot reservation
      const orderRes = await api.post("/payments/razorpay/create-order/", {
        turf_id: state?.turf.id,
        date: actualDate,
        slot_ids: actualSlotIds,
        coupon_code: appliedCoupon ? appliedCoupon.code : "",
        payment_type: effectivePaymentType,
        advance_amount: effectivePaymentType === "PARTIAL" ? amountToCharge : undefined,
        notes,
        customer_name: user ? (user.full_name || user.first_name) : guestName.trim(),
        customer_phone: user ? user.phone : guestPhone.trim(),
        customer_email: user ? user.email : guestEmail.trim(),
      });

      const orderData = orderRes.data;

      // 2. Open universal Razorpay checkout modal / test sandbox
      await initiateRazorpayCheckout({
        orderData: {
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          key_id: orderData.key_id,
          booking_id: orderData.booking_id,
          description: `Pitch Booking (${orderData.booking_id})`,
        },
        user: {
          full_name: user ? (user.full_name || user.first_name || "Player") : (guestName.trim() || "Guest Player"),
          email: user ? (user.email || "") : (guestEmail.trim() || ""),
          phone: user ? (user.phone || "") : (guestPhone.trim() || ""),
        },
        onStatusChange: (statusText) => setStatusMessage(statusText),
        onSuccess: async (response) => {
          setStatusMessage("Confirming verified payment with server…");
          const verifyRes = await api.post("/payments/razorpay/verify/", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            booking_id: orderData.booking_id,
          });

          await refreshProfile();
          clearBookingIntent();
          try {
            sessionStorage.removeItem("ft_active_razorpay_order");
            localStorage.removeItem("ft_active_razorpay_order");
          } catch (_) {}
          setProcessing(false);
          setStatusMessage("");
          const confirmedBookingId =
            verifyRes.data?.booking?.booking_id || orderData.booking_id;
          if (confirmedBookingId) {
            try {
              const existing = JSON.parse(localStorage.getItem("ft_guest_bookings") || "[]");
              const filtered = existing.filter((b: any) => b.booking_id !== confirmedBookingId);
              filtered.unshift({
                booking_id: confirmedBookingId,
                turf_name: state?.turf?.name || "Friends Turf",
                turf_location: state?.turf?.location || "Arena Ground",
                date: actualDate,
                start_time: state?.selectedSlots?.[0]?.start_time || "",
                end_time: state?.selectedSlots?.[state?.selectedSlots?.length - 1]?.end_time || "",
                amount_paid: amountToCharge,
                created_at: new Date().toISOString(),
              });
              localStorage.setItem("ft_guest_bookings", JSON.stringify(filtered.slice(0, 10)));
            } catch (_) {}

            navigate(`/confirmation/${confirmedBookingId}`, {
              replace: true,
              state: {
                booking: verifyRes.data.booking,
                payment: verifyRes.data.payment,
              },
            });
          } else {
            setPaymentSuccessData({
              booking: verifyRes.data.booking,
              payment: verifyRes.data.payment,
            });
          }
        },
        onError: (errText) => {
          setProcessing(false);
          setStatusMessage("");
          setPaymentAttemptFailed(true);
          setErrorMessage(errText);
        },
        onDismiss: () => {
          setProcessing(false);
          setStatusMessage("");
          setPaymentAttemptFailed(true);
        },
      });
    } catch (err: any) {
      setProcessing(false);
      setStatusMessage("");
      setPaymentAttemptFailed(true);
      const resData = err.response?.data;
      if (resData?.is_already_booked_by_user && resData?.booking_id) {
        setExistingConfirmedBookingId(resData.booking_id);
      } else if (err.response?.status === 409) {
        // Slot is already booked or occupied - expire hold timer so user picks another
        setTimeLeftSeconds(0);
      }
      setErrorMessage(
        resData?.error ||
          resData?.detail ||
          err.message ||
          "Failed to initialize payment gateway."
      );
    }
  };

  const handleRelockSlots = async () => {
    if (!state?.turf || !actualSlotIds.length) return;
    setProcessing(true);
    setErrorMessage("");
    try {
      const res = await api.post("/bookings/lock/", {
        turf_id: state.turf.id,
        date: actualDate,
        slot_ids: actualSlotIds,
      });
      const lockPayload = res.data.data || res.data;
      const lockedUntil =
        res.data.locked_until || lockPayload.locked_until || res.data.expires_at;
      if (lockedUntil) {
        const lockExpiry = new Date(lockedUntil).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((lockExpiry - now) / 1000));
        const holdSecs = (bookingRules?.slotHoldMinutes || 5) * 60;
        setTimeLeftSeconds(diff > 0 ? diff : holdSecs);
      } else {
        setTimeLeftSeconds((bookingRules?.slotHoldMinutes || 5) * 60);
      }
      setStatusMessage(`${bookingRules?.slotHoldMinutes || 5}-Minute slot hold successfully renewed!`);
      setTimeout(() => setStatusMessage(""), 3500);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error ||
          "Could not renew slot hold. The slot may have been reserved by another customer."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToPitch = async () => {
    try {
      if (state?.turf && actualSlotIds.length) {
        await api.post("/bookings/unlock/", {
          turf_id: state.turf.id,
          date: actualDate,
          slot_ids: actualSlotIds,
        });
      }
    } catch (e) {}
    navigate(`/?turf=${state?.turf.id || ""}&date=${actualDate}`);
  };

  if (paymentSuccessData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
        <div className="p-4 bg-[#ECFDF5] border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-[#059669]">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
            <span>Payment successfully confirmed & verified! Your official match pass is active.</span>
          </div>
        </div>

        <FriendsTurfMatchPass
          passData={{
            booking_id: paymentSuccessData.booking.booking_id,
            turf_name:
              paymentSuccessData.booking.turf_details?.name ||
              state?.turf?.name ||
              "Friends Turf Arena",
            turf_location:
              paymentSuccessData.booking.turf_details?.location ||
              state?.turf?.location ||
              "Tiruppur",
            surface_spec:
              paymentSuccessData.booking.turf_details?.surface_spec ||
              state?.turf?.surface_spec ||
              "50mm Pro Turf",
            lighting_spec:
              paymentSuccessData.booking.turf_details?.lighting_spec ||
              state?.turf?.lighting_spec ||
              "500 Lux Anti-Glare LED",
            date: paymentSuccessData.booking.date,
            start_time: paymentSuccessData.booking.start_time,
            end_time: paymentSuccessData.booking.end_time,
            customer_name: user?.full_name || user?.first_name || "Player",
            customer_phone: user?.phone || "",
            total_amount: Number(
              paymentSuccessData.booking.final_amount ||
                paymentSuccessData.booking.total_amount ||
                0
            ),
            amount_paid: Number(paymentSuccessData.booking.amount_paid || 0),
            balance_due: Number(paymentSuccessData.booking.balance_due || 0),
            status: paymentSuccessData.booking.status,
            booking_status: paymentSuccessData.booking.status,
            is_used: false,
            qr_base64: paymentSuccessData.booking.qr_ticket_data?.qr_base64,
          }}
          showActions={true}
        />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200/60 rounded-xl" />
        <div className="h-40 bg-slate-200/50 rounded-2xl" />
        <div className="h-64 bg-slate-200/40 rounded-2xl" />
      </div>
    );
  }

  if (!state?.turf) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#059669]">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full">
            No Active Slot Selection
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Select Your Pitch First
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            You don't have any reserved turf slots in this checkout session. Please choose your preferred pitch and time slot from the schedule.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <span>Explore Pitches & Slots</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }


  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const walletBal = Number(user?.customer_profile?.wallet_balance || 0);
  const finalPayable = priceBreakdown ? Number(priceBreakdown.final_amount) : 0;

  const hourlyAdvanceRate = paymentSettings?.hourlyAdvanceRate ?? 100;
  const rawMinAdvance = Math.round(bookingDurationHours * hourlyAdvanceRate);
  const minimumAdvance = finalPayable > 0 ? Math.min(rawMinAdvance, finalPayable) : rawMinAdvance;
  const parsedCustomAdvance = customAdvanceInput ? Number(customAdvanceInput) : null;
  const effectiveAdvanceAmount =
    parsedCustomAdvance !== null && !isNaN(parsedCustomAdvance) && parsedCustomAdvance >= minimumAdvance
      ? Math.min(parsedCustomAdvance, finalPayable)
      : (finalPayable > 0 ? Math.min(minimumAdvance, finalPayable) : minimumAdvance);

  const canPartialPay =
    paymentSettings?.enableSplitDeposit !== false &&
    featureFlags?.PARTIAL_PAYMENTS !== false;
  const effectivePaymentType = !canPartialPay && paymentType === "PARTIAL" ? "FULL" : paymentType;
  const amountToCharge = effectivePaymentType === "FULL" ? finalPayable : effectiveAdvanceAmount;
  const couponsEnabled = featureFlags?.COUPONS !== false;


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Breadcrumb & Return to Turf */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToPitch}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Pitch Schedule</span>
        </button>
        <span className="text-xs font-semibold text-slate-400">
          Booking Reference: FT-{new Date().getFullYear().toString().slice(-2)}-CHECKOUT
        </span>
      </div>

      {/* 1. 5-Minute Slot Lock Countdown Alert */}
      <div
        className={`p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border transition-all ${
          timeLeftSeconds <= 0
            ? "bg-red-50/90 border-red-200 text-red-950 shadow-sm"
            : timeLeftSeconds < 60
            ? "bg-amber-50 border-amber-300 text-amber-950 animate-pulse"
            : "bg-[#F0FDF4] border-emerald-200 text-emerald-900"
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200/50">
            <Clock
              className={`w-5 h-5 ${
                timeLeftSeconds <= 0
                  ? "text-red-600"
                  : timeLeftSeconds < 60
                  ? "text-amber-600 animate-spin"
                  : "text-[#059669]"
              }`}
            />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">
              {timeLeftSeconds > 0
                ? "5-Minute Pitch Lock Active"
                : "Slot Reservation Expired"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {timeLeftSeconds > 0
                ? "Your selected pitch slots are temporarily reserved so no other customer can book them."
                : "Your slot hold has expired. Renew your hold or choose other slots."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
          {timeLeftSeconds <= 0 ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRelockSlots}
                disabled={processing}
                className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                {processing ? "Renewing..." : "+ Renew 5-Min Hold"}
              </button>
              <button
                onClick={handleBackToPitch}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Change Slots
              </button>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Time Remaining
              </span>
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  timeLeftSeconds < 60 ? "text-amber-600" : "text-[#059669]"
                }`}
              >
                {timerFormatted}
              </span>
            </div>
          )}
        </div>
      </div>

      {paymentAttemptFailed && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-black">
              {existingConfirmedBookingId ? "Match Pass Already Confirmed" : "Payment Not Completed"}
            </h3>
          </div>
          {errorMessage && <p className="text-xs text-amber-800">{errorMessage}</p>}
          {existingConfirmedBookingId ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/60 text-xs">
              <p className="text-slate-700">
                You already hold a verified match ticket for this reservation.
              </p>
              <button
                onClick={() => navigate(`/confirmation/${existingConfirmedBookingId}`)}
                className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-sm text-xs cursor-pointer flex items-center space-x-1"
              >
                <span>View Match Pass #{existingConfirmedBookingId}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : timeLeftSeconds > 0 ? (
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
              <p className="text-slate-700">This slot is no longer reserved for this session.</p>
              <button
                onClick={handleBackToPitch}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm text-xs cursor-pointer"
              >
                Choose Another Slot
              </button>
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
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-6">
          {/* Match Details Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Match Details & Pitch Ground</span>
            </h2>

            <div className="flex items-start space-x-4">
              <img
                src={resolveImageUrl(
                  state.turf.images && state.turf.images.length > 0
                    ? state.turf.images[0]
                    : null,
                  state.turf.sport_type,
                  { width: 320, quality: 80, format: "webp" }
                )}
                alt={state.turf.name}
                className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                loading="lazy"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => handleImageError(e, state.turf.sport_type)}
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
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Reserved Match Slots:
                </p>
                <span className="text-[11px] font-black text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {bookingDurationHours * 60} Mins ({state.selectedSlots?.length || 0} Slots)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {state.selectedSlots?.map((slot, idx) => (
                  <span
                    key={slot.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-xs font-bold text-[#059669]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
                    <span className="text-emerald-800/80 font-mono">(₹{Number(slot.price)})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Express Guest Contact Form (If unauthenticated) */}
          {!user && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-pitch-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      Express Guest Contact
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      No sign-in or password needed. Match pass will be delivered to this number.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/login?redirect=/checkout`}
                  state={{ from: location, hasPendingBooking: true }}
                  className="text-xs font-bold text-[#059669] hover:underline hidden sm:inline"
                >
                  Have an account? Sign In
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                {/* Player / Team Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700">
                      Player / Team Name <span className="text-rose-500">*</span>
                    </label>
                    {guestTouched.name && isGuestNameValid && (
                      <span className="text-[11px] font-bold text-[#059669] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Vignesh (Thunder FC)"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      setGuestTouched((prev) => ({ ...prev, name: true }));
                    }}
                    onBlur={() => setGuestTouched((prev) => ({ ...prev, name: true }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none ${
                      guestNameError
                        ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400"
                        : "border-slate-200 focus:ring-2 focus:ring-[#059669]"
                    }`}
                  />
                  {guestNameError && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {guestNameError}
                    </p>
                  )}
                </div>

                {/* Mobile Number with +91 Country Badge and Digit Counter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="text-[11px] font-mono">
                      {isGuestPhoneValid ? (
                        <span className="font-bold text-[#059669] flex items-center gap-1">
                          <Check className="w-3 h-3" /> 10 digits
                        </span>
                      ) : (
                        <span className={cleanGuestPhone.length > 0 ? "text-amber-600 font-semibold" : "text-slate-400"}>
                          {cleanGuestPhone.length}/10 digits
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex rounded-xl border transition-all overflow-hidden ${
                    guestPhoneError
                      ? "border-rose-400 focus-within:ring-2 focus-within:ring-rose-400"
                      : "border-slate-200 focus-within:ring-2 focus-within:ring-[#059669]"
                  }`}>
                    <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-600 select-none">
                      +91
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      placeholder="98422 12345"
                      value={guestPhone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setGuestPhone(digits);
                        setGuestTouched((prev) => ({ ...prev, phone: true }));
                      }}
                      onBlur={() => setGuestTouched((prev) => ({ ...prev, phone: true }))}
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-medium focus:outline-none bg-transparent"
                    />
                  </div>
                  {guestPhoneError && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {guestPhoneError}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-600">
                      Email Address <span className="text-slate-400 font-normal">(Optional, for digital receipt copy)</span>
                    </label>
                    {guestEmail.trim() && isGuestEmailValid && (
                      <span className="text-[11px] font-bold text-[#059669] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid Email
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. vignesh@gmail.com"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      if (e.target.value.trim()) {
                        setGuestTouched((prev) => ({ ...prev, email: true }));
                      }
                    }}
                    onBlur={() => {
                      if (guestEmail.trim()) {
                        setGuestTouched((prev) => ({ ...prev, email: true }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none ${
                      guestEmailError
                        ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-400"
                        : "border-slate-200 focus:ring-2 focus:ring-[#059669]"
                    }`}
                  />
                  {guestEmailError && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {guestEmailError}
                    </p>
                  )}
                </div>
              </div>

              <div className="sm:hidden pt-1">
                <Link
                  to={`/login?redirect=/checkout`}
                  state={{ from: location, hasPendingBooking: true }}
                  className="text-xs font-bold text-[#059669] hover:underline"
                >
                  Have an account? Sign In to use Turf Cash Wallet
                </Link>
              </div>
            </div>
          )}

          {/* Payment Option Switcher (Full vs Advance) */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-pitch-card p-3 sm:p-6 space-y-2.5 sm:space-y-4">
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Choose Payment Option
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("FULL")}
                className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
                  effectivePaymentType === "FULL"
                    ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                    : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#059669]">
                    100% Full Payment
                  </span>
                  <CheckCircle2
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${effectivePaymentType === "FULL" ? "text-[#059669]" : "text-slate-400"}`}
                  />
                </div>
                <p className="text-sm sm:text-base font-black text-slate-900">Pay Full Amount</p>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                  Zero balance due at venue. Instant QR pass activation.
                </p>
              </button>

              {canPartialPay && (
                <div
                  className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                    effectivePaymentType === "PARTIAL"
                      ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                      : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPaymentType("PARTIAL")}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#059669]">
                        Pay Advance (Min ₹{minimumAdvance})
                      </span>
                      <CheckCircle2
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${effectivePaymentType === "PARTIAL" ? "text-[#059669]" : "text-slate-400"}`}
                      />
                    </div>
                    <p className="text-sm sm:text-base font-black text-slate-900">
                      Pay ₹{amountToCharge} Advance
                    </p>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                      {bookingDurationHours}h × ₹{hourlyAdvanceRate}/hr = ₹{minimumAdvance} minimum advance. Settle remaining ₹{Math.max(0, finalPayable - amountToCharge)} balance at venue reception.
                    </p>
                  </button>

                  {/* Customer Option to Pay More Than Minimum Advance */}
                  {effectivePaymentType === "PARTIAL" && (
                    <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-emerald-200/60 space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 text-[11px] sm:text-xs">Want to pay more advance?</span>
                        <span className="text-[10px] text-slate-500">Min: ₹{minimumAdvance} | Max: ₹{finalPayable}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            min={minimumAdvance}
                            max={finalPayable}
                            step={50}
                            placeholder={String(minimumAdvance)}
                            value={customAdvanceInput}
                            onChange={(e) => setCustomAdvanceInput(e.target.value)}
                            className="w-full pl-7 pr-3 py-1 sm:py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#059669]"
                          />
                        </div>
                        {customAdvanceInput && (
                          <button
                            type="button"
                            onClick={() => setCustomAdvanceInput("")}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      {parsedCustomAdvance !== null && parsedCustomAdvance < minimumAdvance && (
                        <p className="text-[10px] text-red-600 font-semibold">
                          Advance cannot be less than minimum ₹{minimumAdvance} (₹{hourlyAdvanceRate}/hr).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Switcher (Razorpay vs Turf Cash Wallet) */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-pitch-card p-3 sm:p-6 space-y-2.5 sm:space-y-4">
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Payment Method</span>
              <span className="flex items-center space-x-1 text-[#059669] text-[10px] sm:text-[11px]">
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>256-Bit SSL Encrypted</span>
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {/* Option 1: Razorpay */}
              <button
                type="button"
                onClick={() => {
                  if (onlinePaymentsEnabled) setPaymentMethod("RAZORPAY");
                }}
                disabled={!onlinePaymentsEnabled}
                className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all min-w-0 overflow-hidden ${
                  !onlinePaymentsEnabled
                    ? "bg-slate-100/60 border-slate-200 opacity-60 cursor-not-allowed"
                    : paymentMethod === "RAZORPAY"
                    ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30 cursor-pointer"
                    : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div className="flex items-center space-x-2 sm:space-x-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-blue-600 text-[11px] sm:text-xs shadow-xs shrink-0">
                      ₹
                    </div>
                    <span className="sm:hidden text-xs font-black text-slate-900">
                      Razorpay Gateway
                    </span>
                  </div>
                  {onlinePaymentsEnabled ? (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        paymentMethod === "RAZORPAY" ? "text-[#059669]" : "text-slate-400"
                      }`}
                    />
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 sm:px-2 rounded-full border border-amber-300">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="hidden sm:block text-sm font-black text-slate-900">Razorpay Gateway</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none sm:whitespace-normal break-words">
                  {onlinePaymentsEnabled
                    ? "UPI (GPay/PhonePe), Cards, NetBanking, & Wallets"
                    : "Online payments temporarily paused by administrator."}
                </p>
              </button>

              {/* Option 2: Turf Cash Wallet (Members Only) */}
              {user ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("WALLET")}
                  className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer min-w-0 overflow-hidden ${
                    paymentMethod === "WALLET"
                      ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-emerald-500/30"
                      : "bg-[#F8FAFC] border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <div className="flex items-center space-x-2 sm:space-x-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-[#059669] text-xs shadow-xs shrink-0">
                        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#059669]" />
                      </div>
                      <span className="sm:hidden text-xs font-black text-slate-900">
                        Turf Cash Wallet
                      </span>
                    </div>
                    <CheckCircle2
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        paymentMethod === "WALLET" ? "text-[#059669]" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <p className="hidden sm:block text-sm font-black text-slate-900">Turf Cash Wallet</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none sm:whitespace-normal break-words">
                    Balance: <strong className="text-[#059669]">₹{walletBal.toLocaleString("en-IN")}</strong>
                    {walletBal < amountToCharge && (
                      <span className="text-red-500 block sm:inline sm:ml-1"> (Insufficient)</span>
                    )}
                  </p>
                </button>
              ) : (
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-left min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <div className="flex items-center space-x-2 sm:space-x-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs shrink-0">
                        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                      </div>
                      <span className="sm:hidden text-xs font-bold text-slate-700">
                        Turf Cash Wallet
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Members Only</span>
                  </div>
                  <p className="hidden sm:block text-sm font-bold text-slate-700">Turf Cash Wallet</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none sm:whitespace-normal break-words">
                    <Link to="/login?redirect=/checkout" className="text-[#059669] font-bold hover:underline">
                      Sign in
                    </Link> to pay with your wallet credits.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Checkout Action */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coupon Box */}
          {couponsEnabled && (
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
          )}

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

                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center space-x-1.5">
                    <span>Statutory GST ({priceBreakdown.tax_rate_percent}%)</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Included
                    </span>
                  </span>
                  <span className="font-semibold text-slate-700">
                    ₹{priceBreakdown.tax_amount}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                  <div>
                    <span>Total Match Price</span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Inclusive of all taxes &amp; GST
                    </span>
                  </div>
                  <span className="text-[#059669]">
                    ₹{priceBreakdown.final_amount}
                  </span>
                </div>

                {effectivePaymentType === "PARTIAL" && (
                  <div className="p-3 bg-[#F0FDF4] border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-emerald-900 text-xs">
                      <span>Advance Payable Now</span>
                      <span>₹{amountToCharge}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Balance Due at Venue Reception</span>
                      <span>₹{Math.max(0, finalPayable - amountToCharge)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Pay Button */}
            <div className="pt-4 space-y-2">
              <button
                onClick={handlePayAndConfirm}
                disabled={
                  processing ||
                  timeLeftSeconds <= 0 ||
                  (paymentMethod === "WALLET" && walletBal < amountToCharge)
                }
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                {processing ? (
                  <span>Processing Secure Checkout...</span>
                ) : paymentMethod === "WALLET" ? (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Pay ₹{amountToCharge} with Turf Cash</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
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

      {/* Interactive & Engaging Turf Cash Processing Animation Modal */}
      {showWalletProcessing && (
        <WalletPaymentProcessingModal
          amount={amountToCharge}
          walletBalance={walletBal}
          turfName={state?.turf?.name || "Friends Turf Arena"}
        />
      )}
    </div>
  );
};
