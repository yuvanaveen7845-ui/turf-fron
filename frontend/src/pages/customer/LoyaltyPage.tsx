import React, { useState, useEffect } from "react";
import {
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  History,
} from "lucide-react";
import api from "../../services/api";
import { LoyaltyTransaction } from "../../types";
import { useAuth } from "../../context/AuthContext";

export const LoyaltyPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemPoints, setRedeemPoints] = useState<number>(100);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchLoyalty = () => {
    setLoading(true);
    api
      .get("/wallet/loyalty/")
      .then((res) => {
        setPoints(res.data.loyalty_points);
        setTransactions(res.data.transactions);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoyalty();
  }, []);

  const handleRedeem = async () => {
    if (points < 100) {
      alert("You need at least 100 loyalty points to redeem.");
      return;
    }
    setRedeemLoading(true);
    setSuccessMsg("");
    try {
      const res = await api.post("/wallet/loyalty/redeem/", {
        points: redeemPoints,
      });
      setPoints(res.data.loyalty_points);
      setSuccessMsg(res.data.message);
      await refreshProfile();
      fetchLoyalty();
    } catch (err: any) {
      alert(err.response?.data?.error || "Redemption failed.");
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Squad Rewards
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Loyalty Points & Cashbacks
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Earn 5% points on every game. Convert points directly to wallet cash
          (1 Point = ₹1).
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Points Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-amber-950/80 via-slate-900 to-emerald-950/60 border border-amber-500/40 relative overflow-hidden shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <Award className="w-4 h-4" />
            <span>Accumulated Points</span>
          </span>
          <p className="text-5xl font-black text-white tracking-tight font-mono">
            {points}{" "}
            <span className="text-xl font-normal text-amber-400">pts</span>
          </p>
          <p className="text-xs text-slate-400">
            Current Cash Value:{" "}
            <span className="font-bold text-emerald-400">
              ₹{points} Turf Cash
            </span>
          </p>
        </div>

        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 min-w-[240px]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Instant Cash Out
          </span>
          <div className="flex items-center space-x-2">
            <select
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(Number(e.target.value))}
              disabled={points < 100}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none"
            >
              {[100, 200, 300, 500, 1000].map((num) => (
                <option key={num} value={num} disabled={points < num}>
                  {num} Points (₹{num})
                </option>
              ))}
            </select>

            <button
              onClick={handleRedeem}
              disabled={redeemLoading || points < 100}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs disabled:opacity-40 transition-colors"
            >
              {redeemLoading ? "Converting..." : "Redeem Now"}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Min. 100 points required to redeem.
          </p>
        </div>
      </div>

      {/* Points History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <History className="w-4 h-4 text-amber-400" />
          <span>Points Ledger</span>
        </h2>

        {loading ? (
          <div className="space-y-3 animate-pulse py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-950 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            No points transactions recorded yet. Complete a match to earn
            points!
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.map((t) => {
              const isEarn =
                t.transaction_type === "EARN" || t.transaction_type === "BONUS";
              return (
                <div
                  key={t.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-white">
                      {t.description}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()} • {t.source}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${isEarn ? "text-amber-400" : "text-slate-400"}`}
                    >
                      {isEarn ? "+" : "-"}
                      {t.points} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
