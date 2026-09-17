import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Check,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { WalletTransaction } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

import { initiateRazorpayCheckout } from "../../services/razorpay";

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState<string>("500");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpStatus, setTopUpStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [topUpSuccessPayload, setTopUpSuccessPayload] = useState<{
    amount: number;
    newBalance: number;
    paymentId: string;
  } | null>(null);

  const fetchWallet = () => {
    setLoading(true);
    api
      .get("/wallet/balance/")
      .then((res) => {
        setBalance(res.data.wallet_balance);
        setTransactions(res.data.transactions || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(topUpAmount);
    if (!amountVal || amountVal < 10) {
      toast.warning("Please enter a valid top-up amount of at least ₹10.");
      return;
    }

    setTopUpLoading(true);
    setTopUpStatus("Creating secure payment order...");
    setSuccessMsg("");

    try {
      // 1. Create Razorpay order for wallet top-up
      const orderRes = await api.post("/wallet/razorpay/create-order/", {
        amount: amountVal,
      });
      const orderData = orderRes.data;

      // 2. Open universal Razorpay checkout
      await initiateRazorpayCheckout({
        orderData: {
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          key_id: orderData.key_id,
          title: "Friends Turf Wallet Top-Up",
          description: `Add ₹${amountVal} to Turf Cash Wallet`,
        },
        user: {
          full_name: user?.full_name || user?.first_name || "Player",
          email: user?.email || "customer@friendsturf.com",
          phone: user?.phone || "9999999999",
        },
        onStatusChange: (statusText) => setTopUpStatus(statusText),
        onSuccess: async (verifyPayload) => {
          setTopUpStatus("Crediting your wallet balance...");
          try {
            const verifyRes = await api.post("/wallet/razorpay/verify/", {
              razorpay_order_id: verifyPayload.razorpay_order_id,
              razorpay_payment_id: verifyPayload.razorpay_payment_id,
              razorpay_signature: verifyPayload.razorpay_signature,
            });

            const newBal = Number(verifyRes.data.wallet_balance ?? (balance + amountVal));
            setBalance(newBal);
            setShowTopUpModal(false);
            setTopUpSuccessPayload({
              amount: amountVal,
              newBalance: newBal,
              paymentId: verifyPayload.razorpay_payment_id,
            });
            const msg = `Successfully added ₹${amountVal} to your Turf Cash Wallet!`;
            setSuccessMsg(msg);
            toast.success(msg);
            await refreshProfile();
            fetchWallet();
          } catch (verr: any) {
            toast.error(verr.response?.data?.error || "Payment verification failed.");
          }
        },
        onError: (errMsg) => {
          toast.error(errMsg || "Payment was not completed.");
        },
        onDismiss: () => {
          setTopUpLoading(false);
          setTopUpStatus("");
        },
      });
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to initialize wallet payment."
      );
    } finally {
      setTopUpLoading(false);
      setTopUpStatus("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* 1. Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
          Instant Cash & Refunds
        </span>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
          Turf Cash Wallet
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Use wallet cash for instant 1-click slot checkout, match rewards, and automated cancellation credits.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#ECFDF5] border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-[#059669]">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Wallet Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-[#059669] text-white rounded-3xl p-6 sm:p-8 shadow-emerald-glow space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Available Wallet Balance
              </span>
            </div>
            <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-white">
              Instant Spend
            </span>
          </div>

          <div>
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              ₹{Number(balance).toLocaleString("en-IN")}
            </span>
            <p className="text-xs text-emerald-100 mt-2">
              Valid across all Friends Turf arenas in Tiruppur with zero expiry.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-5 py-3 rounded-xl bg-white text-[#059669] hover:bg-emerald-50 font-bold text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Cash to Wallet</span>
            </button>
          </div>
        </div>

        {/* Benefits Card */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Why Use Turf Cash?
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <span>
                <strong>1-Click Instant Checkout:</strong> Never lose a 5-min locked slot to slow bank OTPs.
              </span>
            </div>
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <span>
                <strong>Instant Auto-Refunds:</strong> Cancelled bookings reflect instantly back in your wallet with zero bank delay.
              </span>
            </div>
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <span>
                <strong>Loyalty Points Conversion:</strong> Convert earned loyalty reward points directly into spendable wallet cash.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transaction History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-6">
        <h3 className="text-base font-bold text-slate-900">
          Recent Wallet Transactions
        </h3>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isCredit = tx.transaction_type === "CREDIT";
              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {tx.description || (isCredit ? "Wallet Top-Up" : "Slot Booking Payment")}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-extrabold ${
                        isCredit ? "text-[#059669]" : "text-slate-900"
                      }`}
                    >
                      {isCredit ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Bal: ₹{Number(tx.balance_after).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            No transactions found yet. Top up your wallet to start playing!
          </p>
        )}
      </div>

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleTopUp}
            className="bg-white border border-slate-200 max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-[#059669]" />
              <span>Add Cash to Wallet</span>
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Enter Amount (₹):
              </label>
              <input
                type="number"
                min="100"
                step="50"
                required
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-lg font-bold text-slate-900 outline-none focus:border-[#059669]"
              />

              <div className="flex gap-2 pt-1">
                {["500", "1000", "2000", "5000"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {topUpStatus && (
              <p className="text-xs font-semibold text-[#059669] animate-pulse text-center">
                {topUpStatus}
              </p>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={topUpLoading}
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={topUpLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow cursor-pointer disabled:opacity-50"
              >
                {topUpLoading ? "Processing..." : `Pay ₹${topUpAmount} via Razorpay`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top-Up Confirmed Celebration Modal */}
      {topUpSuccessPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 text-center relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

            {/* Glowing Success Badge */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center shadow-emerald-glow">
              <Sparkles className="w-8 h-8 text-[#059669] animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-emerald-200">
                Payment Authorized & Verified
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Wallet Top-Up Confirmed!
              </h3>
              <p className="text-xs text-slate-500">
                Your payment was received and instantly credited to your Turf Cash account.
              </p>
            </div>

            {/* Credited Amount & Balance Summary Box */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500">Credited Amount</span>
                <span className="text-lg font-black text-[#059669]">
                  +₹{Number(topUpSuccessPayload.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Updated Wallet Balance</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{Number(topUpSuccessPayload.newBalance).toLocaleString("en-IN")}
                </span>
              </div>
              {topUpSuccessPayload.paymentId && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Payment Ref ID:</span>
                  <span className="font-mono font-medium text-slate-600">
                    {topUpSuccessPayload.paymentId}
                  </span>
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setTopUpSuccessPayload(null);
                  navigate("/turfs");
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>⚽ Book a Pitch Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTopUpSuccessPayload(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                View Wallet & Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
