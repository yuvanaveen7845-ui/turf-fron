import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const toast = useToast();

  const [status, setStatus] = useState<"VERIFYING" | "SUCCESS" | "FAILED">("VERIFYING");
  const [message, setMessage] = useState("Securing cryptographic payment verification...");
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      // 1. Extract params from URL or hash
      const razorpayPaymentId =
        searchParams.get("razorpay_payment_id") ||
        new URLSearchParams(window.location.search).get("razorpay_payment_id");
      const razorpayOrderId =
        searchParams.get("razorpay_order_id") ||
        new URLSearchParams(window.location.search).get("razorpay_order_id");
      const razorpaySignature =
        searchParams.get("razorpay_signature") ||
        new URLSearchParams(window.location.search).get("razorpay_signature");

      // Check if this was a failure redirect from Razorpay
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      if (errorCode || errorDescription) {
        setStatus("FAILED");
        setErrorDetails(errorDescription || "Payment was declined or cancelled by bank.");
        return;
      }

      // 2. Retrieve saved order context from storage
      let orderData: any = null;
      try {
        const raw =
          sessionStorage.getItem("ft_active_razorpay_order") ||
          localStorage.getItem("ft_active_razorpay_order");
        if (raw) {
          orderData = JSON.parse(raw);
        }
      } catch (_) {}

      const effectiveOrderId = razorpayOrderId || orderData?.order_id;
      const effectivePaymentId = razorpayPaymentId || orderData?.payment_id;

      if (!effectivePaymentId || !effectiveOrderId) {
        setStatus("FAILED");
        setErrorDetails(
          "Missing transaction verification credentials. If money was debited, it will be automatically reconciled."
        );
        return;
      }

      try {
        setMessage("Confirming booking with Friends Turf servers...");

        const isWallet =
          orderData?.is_wallet ||
          orderData?.title?.toLowerCase().includes("wallet") ||
          orderData?.description?.toLowerCase().includes("wallet");

        const isBalance =
          orderData?.is_balance ||
          orderData?.description?.toLowerCase().includes("balance");

        if (isWallet) {
          // Verify Wallet Top-Up
          const res = await api.post("/wallet/razorpay/verify/", {
            razorpay_order_id: effectiveOrderId,
            razorpay_payment_id: effectivePaymentId,
            razorpay_signature: razorpaySignature || "",
          });

          await refreshProfile();
          setStatus("SUCCESS");
          setMessage("Wallet top-up confirmed! Redirecting to wallet...");
          toast.success("Turf Cash wallet topped up successfully!");

          setTimeout(() => {
            navigate("/wallet", {
              replace: true,
              state: {
                topUpSuccess: true,
                amount: orderData?.amount ? orderData.amount / 100 : undefined,
                paymentId: effectivePaymentId,
              },
            });
          }, 1200);
        } else if (isBalance) {
          // Verify Balance Payment
          await api.post("/payments/razorpay/verify-balance/", {
            razorpay_order_id: effectiveOrderId,
            razorpay_payment_id: effectivePaymentId,
            razorpay_signature: razorpaySignature || "",
            booking_id: orderData?.booking_id,
          });

          await refreshProfile();
          setStatus("SUCCESS");
          setMessage("Remaining balance paid! Opening your match pass...");
          toast.success("Balance paid successfully! QR Pass active.");

          setTimeout(() => {
            navigate("/my-bookings", {
              replace: true,
              state: { balancePaid: true, booking_id: orderData?.booking_id },
            });
          }, 1200);
        } else {
          // Standard Match Pitch Booking
          const verifyRes = await api.post("/payments/razorpay/verify/", {
            razorpay_order_id: effectiveOrderId,
            razorpay_payment_id: effectivePaymentId,
            razorpay_signature: razorpaySignature || "",
            booking_id: orderData?.booking_id,
          });

          await refreshProfile();
          setStatus("SUCCESS");
          setMessage("Match pass confirmed! Opening official match pass...");

          const targetBookingId =
            orderData?.booking_id || verifyRes.data?.booking?.booking_id;

          setTimeout(() => {
            if (targetBookingId) {
              navigate(`/confirmation/${targetBookingId}`, {
                replace: true,
                state: {
                  booking: verifyRes.data.booking,
                  payment: verifyRes.data.payment,
                },
              });
            } else {
              navigate("/my-bookings", { replace: true });
            }
          }, 1200);
        }
      } catch (err: any) {
        setStatus("FAILED");
        setErrorDetails(
          err.response?.data?.error ||
            err.response?.data?.detail ||
            err.message ||
            "Unable to verify signature with payment gateway."
        );
      }
    };

    verifyPayment();
  }, [searchParams, navigate, refreshProfile, toast]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-8 space-y-6 shadow-2xl text-center relative overflow-hidden">
        {status === "VERIFYING" && (
          <div className="space-y-5">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-[#059669] border-t-transparent animate-spin" />
              <ShieldCheck className="w-9 h-9 text-[#059669]" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-emerald-200">
                Payment Received
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Finalizing Your Match Pass
              </h2>
              <p className="text-xs text-slate-500">{message}</p>
            </div>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="mx-auto w-20 h-20 rounded-full bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center shadow-emerald-glow">
              <CheckCircle2 className="w-10 h-10 text-[#059669]" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-emerald-200">
                Verified & Confirmed
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Booking Confirmed!
              </h2>
              <p className="text-xs text-slate-500">{message}</p>
            </div>
          </div>
        )}

        {status === "FAILED" && (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                Verification Issue
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Payment Verification Notice
              </h2>
              <p className="text-xs text-red-600 font-medium bg-red-50/50 p-3 rounded-xl border border-red-100">
                {errorDetails}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                to="/my-bookings"
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Check My Bookings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/turfs"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                Return to Pitches
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
