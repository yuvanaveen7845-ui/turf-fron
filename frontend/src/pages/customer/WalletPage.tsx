import React, { useState, useEffect } from "react";
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
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
        setTransactions(res.data.transactions);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Turf Cash
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Wallet
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Instant 1-click match payments and automatic cancellation refunds
          </p>
        </div>

        <button
          onClick={() => setShowTopUpModal(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Money to Wallet</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Balance Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 relative overflow-hidden shadow-2xl">
        <div className="max-w-md space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <Wallet className="w-4 h-4" />
            <span>Available Turf Balance</span>
          </span>
          <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            ₹{balance.toLocaleString()}
          </p>
          <div className="flex items-center space-x-2 text-xs text-slate-300 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Secure & usable on all pitches across Bengaluru</span>
          </div>
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          Transaction Statement
        </h2>

        {loading ? (
          <div className="space-y-3 animate-pulse py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-950 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            No transactions recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.map((t) => {
              const isCredit = t.transaction_type === "CREDIT";
              return (
                <div
                  key={t.id}
                  className="py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isCredit
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {t.description}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(t.created_at).toLocaleDateString()} • Source:{" "}
                        {t.source}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-black ${isCredit ? "text-emerald-400" : "text-slate-200"}`}
                    >
                      {isCredit ? "+" : "-"}₹{t.amount}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Bal: ₹{t.balance_after}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-sm w-full rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>Add Cash to Wallet</span>
            </h3>

            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter Amount (₹)
                </label>
                <input
                  type="number"
                  min="50"
                  max="20000"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-lg font-black text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {["200", "500", "1000", "2000"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:border-emerald-500"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topUpLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {topUpLoading ? "Processing..." : "Confirm Top-Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
