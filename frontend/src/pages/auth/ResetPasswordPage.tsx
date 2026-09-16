import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing password reset token. Please request a new link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password/", {
        token,
        password,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.confirm_password?.[0] ||
          err.response?.data?.password?.[0] ||
          err.response?.data?.detail ||
          "Failed to reset password. The link may have expired or is invalid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-7 bg-white border border-slate-200 p-8 rounded-3xl shadow-pitch-card">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <img
              src="/logo.png"
              alt="Friends Turf"
              className="w-16 h-16 object-contain drop-shadow-sm hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#059669] tracking-widest uppercase block">
              Security Credentials
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Set New Password
            </h1>
          </div>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Choose a strong password with at least 6 characters to secure your Friends Turf account.
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!token && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
              No reset token detected in URL. Please use the link provided in your recovery email.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        )}

        {token && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Updating password...</span>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {success && (
          <div className="space-y-5 text-center">
            <div className="p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-200 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#059669] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Password Updated!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your credentials have been securely updated. You can now log in to Friends Turf with your new password.
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all cursor-pointer inline-flex"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
