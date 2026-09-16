import React, { useState, useEffect } from "react";
import {
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  History,
  ShieldCheck,
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
        setPoints(res.data.loyalty_points || 0);
        setTransactions(res.data.transactions || []);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
          Match Rewards
        </span>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
          Loyalty Rewards & Cash Conversion
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Earn points on every match booking (1 Point per ₹10 spent). Convert points directly into Turf Cash (1 Point = ₹1).
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

      {/* Main Points & Converter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Points Display */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] flex items-center justify-center text-[#059669]">
              <Award className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              {user?.customer_profile?.membership_tier || "REGULAR"} TIER
            </span>
          </div>

          <div>
            <span className="text-4xl sm:text-5xl font-black text-slate-900">
              {points.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-500 ml-2">
              Reward Points
            </span>
            <p className="text-xs text-[#059669] font-bold mt-1">
              Equivalent to ₹{points.toLocaleString("en-IN")} in wallet cash
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">Points Earning Rules:</p>
            <p>• 1 Point earned for every ₹10 spent on turf bookings</p>
            <p>• Gold & Platinum members earn up to 2x bonus points</p>
            <p>• Minimum redemption threshold: 100 points (₹100)</p>
          </div>
        </div>

        {/* Converter / Redeem Card */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Convert Points to Turf Cash
            </h3>
            <p className="text-xs text-slate-600">
              Slide or choose the amount of points you wish to convert into instant wallet credit.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Points to Convert:</span>
                <span className="text-[#059669] font-mono text-sm">
                  {redeemPoints} Points = ₹{redeemPoints} Cash
                </span>
              </div>
              <input
                type="range"
                min="100"
                max={Math.max(100, points)}
                step="50"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Number(e.target.value))}
                disabled={points < 100}
                className="w-full accent-[#059669] disabled:opacity-50"
              />
            </div>
          </div>

          <button
            onClick={handleRedeem}
            disabled={points < 100 || redeemLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs shadow-emerald-glow flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            {redeemLoading ? (
              <span>Converting...</span>
            ) : points < 100 ? (
              <span>Need Min 100 Points to Redeem</span>
            ) : (
              <>
                <span>Redeem {redeemPoints} Points for ₹{redeemPoints} Cash</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Points Activity History
        </h3>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {tx.description || (tx.transaction_type === "EARN" ? "Match Booking Points" : "Redemption to Cash")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`font-black text-sm ${
                    tx.transaction_type === "EARN"
                      ? "text-[#059669]"
                      : "text-slate-800"
                  }`}
                >
                  {tx.transaction_type === "EARN" ? "+" : "-"}
                  {tx.points} pts
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-6">
            No points activity yet. Book your first match to start accumulating points!
          </p>
        )}
      </div>
    </div>
  );
};
