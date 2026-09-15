import React, { useState, useEffect } from "react";
import {
  Gift,
  Copy,
  Check,
  Tag,
  Users,
  ArrowRight,
  Sparkles,
  Percent,
} from "lucide-react";
import api from "../../services/api";
import { Coupon } from "../../types";
import { useAuth } from "../../context/AuthContext";

export const OffersPage: React.FC = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [referralData, setReferralData] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/promotions/coupons/"),
      user
        ? api.get("/promotions/referrals/")
        : Promise.resolve({ data: null }),
    ])
      .then(([couponsRes, refRes]) => {
        setCoupons(couponsRes.data);
        if (refRes.data) setReferralData(refRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Match Deals
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Active Offers & Promo Codes
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Apply these codes at checkout to save on your match bookings
        </p>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Percent className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                  {coupon.coupon_type}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {coupon.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {coupon.description}
                </p>
              </div>

              <div className="pt-2 text-xs text-slate-400 space-y-1">
                <p>
                  • Min. Booking: <strong>₹{coupon.min_booking_amount}</strong>
                </p>
                {coupon.max_discount_amount && (
                  <p>
                    • Max. Discount:{" "}
                    <strong>₹{coupon.max_discount_amount}</strong>
                  </p>
                )}
                <p>
                  • Valid till:{" "}
                  <strong>
                    {new Date(coupon.end_date).toLocaleDateString()}
                  </strong>
                </p>
              </div>
            </div>

            {/* Code Box */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 font-mono font-black text-sm text-emerald-400">
                {coupon.code}
              </span>

              <button
                onClick={() => copyToClipboard(coupon.code, coupon.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition-colors"
              >
                {copiedCode === coupon.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Program Section */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-8 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <Users className="w-4 h-4" />
            <span>Refer Squad & Earn Wallet Cash</span>
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Invite Teammates. Get ₹100 Every Time.
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            When a player joins using your referral code and completes their
            first booking, we credit ₹100 to your Turf Wallet and give them an
            instant first-game discount!
          </p>
        </div>

        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Your Unique Code
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black font-mono text-amber-400">
                  {user.referral_code}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(user.referral_code, "ref-code")
                  }
                  className="text-xs text-slate-300 hover:text-white"
                >
                  {copiedCode === "ref-code" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Total Players Referred
              </span>
              <p className="text-lg font-black text-white">
                {referralData?.total_referrals || 0} Players
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Total Cash Earned
              </span>
              <p className="text-lg font-black text-emerald-400">
                ₹{referralData?.total_reward_earned || 0}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Sign in to view and share your unique referral code.
          </p>
        )}
      </div>
    </div>
  );
};
