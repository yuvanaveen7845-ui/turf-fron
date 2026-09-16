import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Trophy,
  Mail,
  Lock,
  User,
  Phone,
  Tag,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    referral_code: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(formData);
      navigate("/");
    } catch (err: any) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white border border-slate-200 p-8 rounded-3xl shadow-pitch-card">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <img
              src="/logo.png"
              alt="Friends Turf"
              className="w-20 h-20 object-contain drop-shadow-sm hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#059669] tracking-widest uppercase block">
              Player Membership
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Join Friends Turf
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Unlock instant pitch bookings, match passes, and loyalty rewards
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Alex"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#059669] outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Hunter"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#059669] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@example.com"
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#059669] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 00000"
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#059669] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#059669] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referral Code{" "}
              <span className="text-slate-400 font-normal">
                (Optional - get bonus ₹100 credit)
              </span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-[#059669] absolute left-3 top-3" />
              <input
                type="text"
                name="referral_code"
                value={formData.referral_code}
                onChange={handleChange}
                placeholder="e.g. FT12ABCD"
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#059669] outline-none uppercase font-mono transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#059669] font-bold hover:underline"
          >
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};
