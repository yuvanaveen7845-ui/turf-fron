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
import { Link } from "react-router-dom";

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
        const raw = couponsRes.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
        setCoupons(list);
        if (refRes.data) setReferralData(refRes.data);
      })
      .catch((err) => {
        console.error("Failed to load offers:", err);
        setCoupons([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* 1. Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
          Match Deals & Discounts
        </span>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
          Active Offers & Promo Codes
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Apply these verified promotional codes at checkout for instant booking savings.
        </p>
      </div>

      {/* 2. Coupons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 bg-white rounded-3xl border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-pitch-card flex flex-col justify-between space-y-5 relative overflow-hidden"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                    {coupon.discount_type === "PERCENTAGE"
                      ? `${Number(coupon.discount_value)}% OFF`
                      : `FLAT ₹${Number(coupon.discount_value)} OFF`}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Tag className="w-4 h-4 text-[#059669]" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {coupon.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {coupon.description}
                </p>
              </div>

              {/* Code Box & Copy */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                  <span className="font-mono font-black text-sm text-[#059669] tracking-wider">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(coupon.code, coupon.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    {copiedCode === coupon.id ? (
                      <Check className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400">
                  Min spend: ₹{Number(coupon.min_booking_amount)} • Valid across all venues
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Referral Program Banner */}
      {user && referralData && (
        <div className="bg-[#059669] text-white rounded-3xl p-6 sm:p-8 shadow-emerald-glow grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Invite Squad & Friends</span>
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              Give ₹100, Get ₹100 Match Cash
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Share your referral code with your sports crew. When they book their first turf slot, both of you receive ₹100 instant wallet cash.
            </p>
          </div>

          <div className="md:col-span-4 bg-white rounded-2xl p-4 text-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Your Referral Code
            </span>
            <p className="font-mono font-black text-xl text-slate-900 tracking-wider">
              {referralData.referral_code || user.referral_code}
            </p>
            <button
              onClick={() =>
                copyToClipboard(
                  referralData.referral_code || user.referral_code,
                  "ref"
                )
              }
              className="w-full py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              {copiedCode === "ref" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
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
      )}
    </div>
  );
};
