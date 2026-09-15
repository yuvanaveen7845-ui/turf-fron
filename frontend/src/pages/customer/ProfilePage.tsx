import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Trophy,
  Wallet,
  Award,
  Save,
  Check,
} from "lucide-react";
import api from "../../services/api";

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    birthday: user?.customer_profile?.birthday || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await api.put("/auth/me/", formData);
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Account Center
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Player Profile & Settings
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Total Bookings
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {user.customer_profile?.total_bookings || 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Total Spending
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            ₹
            {Number(
              user.customer_profile?.total_spending || 0,
            ).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Club Membership
          </span>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {user.customer_profile?.membership_tier || "REGULAR"}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Loyalty Points
          </span>
          <p className="text-2xl font-black text-teal-400 mt-1">
            {user.customer_profile?.loyalty_points || 0}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl">
            {user.first_name
              ? user.first_name[0].toUpperCase()
              : user.email[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {user.full_name || user.email}
            </h2>
            <p className="text-xs text-emerald-400 font-semibold">
              {user.role} Account • Ref Code: {user.referral_code}
            </p>
          </div>
        </div>

        {success && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date of Birth{" "}
                <span className="text-slate-500 font-normal">
                  (for birthday coupons)
                </span>
              </label>
              <input
                type="date"
                value={formData.birthday || ""}
                onChange={(e) =>
                  setFormData({ ...formData, birthday: e.target.value })
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Email (Primary ID)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full p-2.5 bg-slate-950/40 border border-slate-800 text-slate-500 rounded-xl text-xs cursor-not-allowed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving..." : "Save Profile Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
