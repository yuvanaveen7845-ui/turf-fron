import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Navigation,
  Trophy,
  AlertCircle,
  Sparkles,
  Lock,
  CreditCard,
  ArrowUpRight,
  Loader2,
  Info,
  X,
  Receipt,
  Mail,
  Send,
} from "lucide-react";
import { Button, StatusBadge, LoadingSpinner } from "../ui";
import api from "../../services/api";
import { initiateRazorpayCheckout } from "../../services/razorpay";
import { useAuth } from "../../context/AuthContext";
import { useOperationsRealtime, useGateRealtime } from "../../hooks/useRealtime";

export interface MatchPassProps {
  passData: {
    booking_id: string;
    ticket_code?: string;
    credential_version?: number;
    status?: string; // ACTIVE, USED, EXPIRED, REVOKED, DEPOSIT_CONFIRMED
    booking_status?: string; // CONFIRMED, CHECKED_IN, CANCELLED, etc.
    qr_locked?: boolean;
    lock_reason?: string | null;
    payment_status?: string;
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
  onBalancePaid?: () => void;
}

export const FriendsTurfMatchPass: React.FC<MatchPassProps> = ({
  passData: initialPassData,
  onClose,
  showActions = true,
  onBalancePaid,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [passData, setPassData] = useState(initialPassData);
  const [loadingPass, setLoadingPass] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);
  const [justActivated, setJustActivated] = useState(false);

  // Email Match Pass Dialog States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [emailSending, setEmailSending] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSendEmailPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setEmailSending(true);
    setEmailFeedback(null);
    try {
      const res = await api.post("/notifications/send-match-pass/", {
        booking_id: passData.booking_id,
        email: emailInput.trim(),
      });
      setEmailFeedback({
        type: "success",
        message: res.data?.message || `Match Pass successfully sent to ${emailInput.trim()}!`,
      });
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailFeedback(null);
      }, 2500);
    } catch (err: any) {
      setEmailFeedback({
        type: "error",
        message: err.response?.data?.error || "Failed to deliver email. Please check the address or SMTP config.",
      });
    } finally {
      setEmailSending(false);
    }
  };


  // Sync state if prop changes
  React.useEffect(() => {
    setPassData(initialPassData);
  }, [initialPassData]);

  // Initial and reactive fetch of authoritative pass payload
  const fetchPassData = React.useCallback(async (showLoader = false) => {
    if (!initialPassData?.booking_id) return;
    if (showLoader) setLoadingPass(true);
    try {
      const res = await api.get(`/qr/pass/${initialPassData.booking_id}/`);
      if (res.data) {
        setPassData((prev) => {
          if (prev.qr_locked && !res.data.qr_locked) {
            setJustActivated(true);
          }
          return {
            ...prev,
            ...res.data,
          };
        });
      }
    } catch (e) {
      console.error("Failed to load pass payload:", e);
    } finally {
      if (showLoader) setLoadingPass(false);
    }
  }, [initialPassData?.booking_id]);

  // Load pass payload on mount
  React.useEffect(() => {
    fetchPassData(!initialPassData.qr_base64 && !initialPassData.qr_locked);
  }, [fetchPassData, initialPassData.qr_base64, initialPassData.qr_locked]);

  // Function to refresh pass data from server
  const refreshPass = React.useCallback(async () => {
    fetchPassData(false);
  }, [fetchPassData]);

  // Real-time listener: if balance is paid online or offline at desk, immediately activate QR!
  useOperationsRealtime(
    React.useCallback(
      (event) => {
        if (
          event.payload?.booking_id === passData?.booking_id ||
          event.payload?.type === "BALANCE_PAID"
        ) {
          refreshPass();
        }
      },
      [passData?.booking_id, refreshPass]
    )
  );

  // Real-time listener: when gate scanner checks the pass in
  useGateRealtime(
    React.useCallback(
      (event) => {
        if (event.payload?.booking_id === passData?.booking_id) {
          refreshPass();
        }
      },
      [passData?.booking_id, refreshPass]
    )
  );

  const isCheckedIn =
    passData.is_used ||
    passData.booking_status === "CHECKED_IN" ||
    passData.status === "USED";
  const isCancelled =
    passData.booking_status === "CANCELLED" ||
    passData.status === "CANCELLED";
  const isRevoked = passData.status === "REVOKED";
  const balanceDue = Number(passData.balance_due || 0);
  const isQRLocked = Boolean(passData.qr_locked || balanceDue > 0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(passData.booking_id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    if (passData.booking_id) {
      navigate(`/print/pass/${passData.booking_id}?autoprint=true`);
    } else {
      window.print();
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Friends Turf Match Pass - ${passData.booking_id}`,
      text: `Match Pass for ${passData.turf_name} on ${new Date(
        passData.date
      ).toLocaleDateString("en-IN", { dateStyle: "medium" })} at ${
        passData.start_time
      } - ${passData.end_time}.`,
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

  const handleWhatsAppSquadInvite = () => {
    const formattedDate = new Date(passData.date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const message = `⚽ *Match Alert - Friends Turf Squad!* \n\n📍 *Arena:* ${passData.turf_name}\n📅 *Date:* ${formattedDate}\n⏰ *Time:* ${passData.start_time} - ${passData.end_time}\n📌 *Location:* ${passData.turf_location}\n\n🎟️ *View Match Pass & Directions:* ${window.location.href}\n\n_Be on the pitch 15 mins before kick-off!_`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePayBalanceOnline = async () => {
    if (balanceDue <= 0) return;
    setPayLoading(true);
    setPayError("");

    try {
      // 1. Create Balance Razorpay Order
      const orderRes = await api.post("/payments/razorpay/pay-balance/", {
        booking_id: passData.booking_id,
      });

      const orderData = orderRes.data;

      // 2. Launch Universal Razorpay Checkout Dialog
      await initiateRazorpayCheckout({
        orderData: {
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          key_id: orderData.key_id,
          booking_id: passData.booking_id,
          title: `Settle Balance - ${passData.turf_name}`,
          description: `Booking #${passData.booking_id} Balance Due Settlement`,
        },
        user: {
          full_name: user?.full_name || passData.customer_name,
          email: user?.email,
          phone: user?.phone || passData.customer_phone,
        },
        onSuccess: async (verifyPayload) => {
          try {
            await api.post("/payments/razorpay/verify-balance/", {
              booking_id: passData.booking_id,
              razorpay_order_id: verifyPayload.razorpay_order_id,
              razorpay_payment_id: verifyPayload.razorpay_payment_id,
              razorpay_signature: verifyPayload.razorpay_signature,
            });

            setPaySuccess(true);
            if (onBalancePaid) onBalancePaid();
          } catch (verr: any) {
            setPayError(
              verr.response?.data?.error ||
                "Payment was successful, but balance verification timed out. Please refresh the pass."
            );
          }
        },
        onError: (errMsg) => {
          setPayError(errMsg || "Payment was cancelled or failed.");
        },
      });
    } catch (err: any) {
      setPayError(
        err.response?.data?.error ||
          "Failed to initiate balance payment. Please try again or pay at reception counter."
      );
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* ── Stadium Match Pass Ticket (Strict 1-Page A4 Containment) ── */}
      <div className="printable-match-pass bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-pitch-card relative print:border-2 print:border-slate-900 print:shadow-none print:rounded-2xl print:m-0">
        
        {/* 1. Ticket Header Hero Banner with Official Logo */}
        <div
          className={`p-5 sm:p-6 relative overflow-hidden text-white ${
            isQRLocked
              ? "bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900"
              : "bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981]"
          }`}
        >
          {/* Subtle athletic dot mesh overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <img
                src="/logo.png"
                alt="Friends Turf Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-2xl bg-white p-1 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
                    FRIENDS TURF
                  </h2>
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-md shadow-xs">
                    FIFA PRO
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-100 uppercase tracking-widest block mt-1">
                  Official Match Pass • Arena Admission
                </span>
              </div>
            </div>

            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
              <div className="flex items-center space-x-2">
                {isCheckedIn ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-white text-[#059669] text-xs font-black uppercase tracking-wider shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Admitted</span>
                  </span>
                ) : isCancelled ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Cancelled</span>
                  </span>
                ) : isQRLocked ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-sm">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Balance Due</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-black uppercase tracking-wider backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Active Gate Pass</span>
                  </span>
                )}

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer print:hidden"
                    title="Close Pass"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs font-mono font-bold text-emerald-100 mt-0.5">
                #{passData.booking_id}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Ticket Body (2 Columns) */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white">
          
          {/* Left Column: Match Details & Pitch Specs */}
          <div className="md:col-span-7 space-y-3.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#059669] block">
                Reserved Ground & Pitch
              </span>
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                {passData.turf_name}
              </h3>
              <p className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>{passData.turf_location || "Tiruppur Sports Corridor, Tamil Nadu"}</span>
              </p>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[#059669]" />
                  <span>Match Date</span>
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                  {new Date(passData.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-[#059669]" />
                  <span>Kickoff Timing</span>
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 font-mono">
                  {passData.start_time?.slice(0, 5)} - {passData.end_time?.slice(0, 5)}
                </p>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-[#ECFDF5] border border-emerald-200 text-[#059669] text-[10px] font-extrabold rounded-lg flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#059669]" />
                <span>500 Lux Anti-Glare Lighting</span>
              </span>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold rounded-lg flex items-center space-x-1">
                <Trophy className="w-3 h-3 text-[#059669]" />
                <span>50mm Mono-Filament Grass</span>
              </span>
            </div>

            {/* Captain / Settlement Row */}
            <div className="border-t border-slate-200 pt-2.5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Captain / Lead</span>
                <p className="font-black text-slate-900 mt-0.5 truncate">
                  {passData.customer_name || "Squad Lead"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Status</span>
                {balanceDue > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 mt-0.5">
                    ₹{balanceDue.toFixed(0)} Due at Desk
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-50 text-[#059669] border border-emerald-200 mt-0.5">
                    <Check className="w-3 h-3" />
                    <span>100% Fully Settled</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: High-Res Turnstile QR Code */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-center space-y-2.5">
            {isQRLocked ? (
              <div className="w-full flex flex-col items-center p-3 bg-amber-50 border border-dashed border-amber-300 rounded-xl space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-amber-950 uppercase block">QR Pass Locked</span>
                  <p className="text-[10px] text-amber-800">Settle ₹{balanceDue} to activate turnstile scanner</p>
                </div>
                <button
                  type="button"
                  disabled={payLoading}
                  onClick={handlePayBalanceOnline}
                  className="w-full py-2 px-3 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer print:hidden"
                >
                  {payLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay ₹{balanceDue} Online</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm inline-block">
                {passData.qr_base64 ? (
                  <img
                    src={passData.qr_base64}
                    alt={`Turnstile QR ${passData.booking_id}`}
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-50 rounded-lg flex items-center justify-center">
                    <LoadingSpinner size="sm" label="Generating QR..." />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block">
                Turnstile Gate Pass
              </span>
              <p className="text-[10px] text-slate-500">
                Hold 4-6 inches from optical gate scanner
              </p>
            </div>
          </div>
        </div>

        {/* 3. Stadium Ticket Perforated Cutout Divider */}
        <div className="relative flex items-center justify-between my-0 bg-white">
          <div className="w-5 h-5 bg-slate-900 rounded-r-full -ml-2.5 border-r border-slate-900" />
          <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2" />
          <div className="w-5 h-5 bg-slate-900 rounded-l-full -mr-2.5 border-l border-slate-900" />
        </div>

        {/* 4. Ticket Stub: Arena Rules & Verification Seal */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 font-extrabold text-slate-900 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Gate Rules & Venue Conduct</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              • Turf boots / rubber studs only (metal studs prohibited) • Arrive 15 mins prior to kickoff • Water only on pitch
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-[9px] font-mono text-slate-400 block">SECURE GATE VERIFIED</span>
            <span className="text-[10px] font-mono font-bold text-slate-700">ISO-9001 • FIFA CERTIFIED</span>
          </div>
        </div>
      </div>

      {/* 5. Interactive Action Buttons Toolbar (Hidden when printing/saving PDF) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 print:hidden">
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print / Save as PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEmailInput(user?.email || "");
              setEmailFeedback(null);
              setIsEmailModalOpen(true);
            }}
            leftIcon={<Mail className="w-4 h-4 text-[#059669]" />}
          >
            Email Pass
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/print/receipt/${passData.booking_id}?autoprint=true`)}
            leftIcon={<Receipt className="w-4 h-4 text-[#059669]" />}
          >
            GST Tax Invoice
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppSquadInvite}
            leftIcon={<Share2 className="w-4 h-4 text-[#059669]" />}
          >
            Invite Squad
          </Button>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              "Friends Turf " + (passData.turf_location || "Tiruppur")
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-bold text-xs px-3.5 py-2 rounded-xl gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all"
          >
            <Navigation className="w-3.5 h-3.5 text-[#059669]" />
            <span>Directions</span>
          </a>
        </div>
      )}

      {/* Email Match Pass Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEmailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center border border-emerald-200">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Email Match Pass</h3>
                <p className="text-xs text-slate-500">
                  Pass #{passData.booking_id} with turnstile QR & specs
                </p>
              </div>
            </div>

            <form onSubmit={handleSendEmailPass} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="player@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:bg-white transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  We'll send the official FIFA-branded digital pass directly to this inbox.
                </p>
              </div>

              {emailFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-start space-x-2 ${
                    emailFeedback.type === "success"
                      ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {emailFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{emailFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEmailModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={emailSending}
                  leftIcon={
                    emailSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )
                  }
                >
                  {emailSending ? "Sending Email..." : "Send Match Pass"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


