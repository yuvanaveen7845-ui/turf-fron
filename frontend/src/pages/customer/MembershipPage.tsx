import React, { useState, useEffect } from "react";
import { Award, Check, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import api from "../../services/api";
import { MembershipPlan } from "../../types";
import { useAuth } from "../../context/AuthContext";

export const MembershipPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">(
    "MONTHLY",
  );
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPlans = () => {
    setLoading(true);
    Promise.all([
      api.get("/memberships/plans/"),
      api.get("/memberships/my-membership/"),
    ])
      .then(([plansRes, mySubRes]) => {
        setPlans(plansRes.data);
        setActiveSub(mySubRes.data.membership);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribingId(planId);
    setSuccessMsg("");
    try {
      const res = await api.post("/memberships/my-membership/", {
        plan_id: planId,
        billing_cycle: billingCycle,
      });
      setActiveSub(res.data);
      setSuccessMsg(
        "Membership activated! Discounts will now apply automatically at checkout.",
      );
      await refreshProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || "Subscription failed.");
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center space-x-1.5">
          <Award className="w-4 h-4" />
          <span>Friends Turf Club Memberships</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Unlock Guaranteed Match Discounts
        </h1>
        <p className="text-sm text-slate-400">
          Exclusive member rates, advance VIP priority slot booking, and boosted
          loyalty points on every game.
        </p>

        {/* Billing cycle toggle */}
        <div className="pt-2 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center space-x-2">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                billingCycle === "ANNUAL"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-black">
                2 MONTHS FREE
              </span>
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs text-emerald-300 text-center max-w-xl mx-auto">
          {successMsg}
        </div>
      )}

      {/* Active Membership Banner if exists */}
      {activeSub && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
              ★
            </div>
            <div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Active Plan
              </p>
              <h3 className="text-base font-bold text-white">
                {activeSub.plan_details?.name} Membership Club
              </h3>
              <p className="text-xs text-slate-400">
                Valid until {new Date(activeSub.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            {activeSub.plan_details?.discount_percentage}% Auto-Discount Active
          </span>
        </div>
      )}

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isPopular = plan.tier_level === 2;
          const isCurrent = activeSub?.plan === plan.id;
          const price =
            billingCycle === "ANNUAL" ? plan.annual_price : plan.monthly_price;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                isPopular
                  ? "bg-slate-900 border-2 border-amber-500 shadow-2xl shadow-amber-500/10 scale-105"
                  : "bg-slate-900/80 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md">
                  MOST POPULAR SQUAD PASS
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>{plan.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-emerald-400">
                      {plan.discount_percentage}% OFF
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="border-y border-slate-800 py-4">
                  <span className="text-3xl font-black text-white font-mono">
                    ₹{price}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">
                    / {billingCycle === "ANNUAL" ? "year" : "month"}
                  </span>
                </div>

                {/* Feature checklist */}
                <ul className="space-y-3 text-xs">
                  <li className="flex items-center space-x-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>{plan.discount_percentage}% discount</strong> on
                      every match
                    </span>
                  </li>
                  <li className="flex items-center space-x-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>{plan.priority_booking_days} days</strong>{" "}
                      priority advance slot booking
                    </span>
                  </li>
                  <li className="flex items-center space-x-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>
                        {plan.loyalty_point_multiplier}x multiplier
                      </strong>{" "}
                      on loyalty points
                    </span>
                  </li>
                  {plan.features?.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center space-x-2.5 text-slate-300"
                    >
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="pt-8">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribingId === plan.id}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                      isPopular
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20"
                        : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                    }`}
                  >
                    {subscribingId === plan.id ? (
                      <span>Activating...</span>
                    ) : (
                      <>
                        <span>
                          {activeSub
                            ? "Upgrade to " + plan.name
                            : "Join " + plan.name + " Plan"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
