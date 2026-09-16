import React, { useState, useEffect } from "react";
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { WalletTransaction } from "../../types";
import { useAuth } from "../../context/AuthContext";

export const WalletPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState<string>("500");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
    setTopUpLoading(true);
    setSuccessMsg("");
    try {
      const res = await api.post("/wallet/top-up/", {
        amount: Number(topUpAmount),
      });
      setBalance(res.data.wallet_balance);
      setShowTopUpModal(false);
      setSuccessMsg(`Successfully added ₹${topUpAmount} to your wallet!`);
      await refreshProfile();
      fetchWallet();
    } catch (err: any) {
      alert(err.response?.data?.error || "Top-up failed.");
    } finally {
      setTopUpLoading(false);
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

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={topUpLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow cursor-pointer"
              >
                {topUpLoading ? "Adding..." : "Add ₹" + topUpAmount}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
