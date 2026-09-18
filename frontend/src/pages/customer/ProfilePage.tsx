import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
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
  Share2,
} from "lucide-react";
import api from "../../services/api";

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
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
      toast.success("Profile updated successfully!");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
          Account Center
        </span>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
          Player Profile & Settings
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Manage your personal details, booking preferences, and player wallet.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Matches Played
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {user.customer_profile?.total_bookings || 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Wallet Balance
          </span>
          <p className="text-2xl font-black text-[#059669] mt-1">
            ₹{Number(user.customer_profile?.wallet_balance || 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Membership Tier
          </span>
          <p className="text-xl font-black text-amber-600 mt-1 uppercase">
            {user.customer_profile?.membership_tier || "STANDARD"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Account Status
          </span>
          <p className="text-2xl font-black text-[#059669] mt-1">
            ACTIVE
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-6">
        <h3 className="text-base font-bold text-slate-900">
          Personal Information
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-[#059669] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-[#059669] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email Address (Account ID)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phone Number (For Match SMS)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-[#059669] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center space-x-2 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>

            {success && (
              <span className="text-xs font-bold text-[#059669] flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Profile updated successfully</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
