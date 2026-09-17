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
  KeyRound,
  Sparkles,
  ArrowLeft,
  Check,
} from "lucide-react";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password validation checks
  const hasMinLength = password.length >= 6;
  const hasNumberOrSpecial = /[0-9!@#$%^&*]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing password reset token. Please request a new recovery link.");
      return;
    }

    if (!hasMinLength) {
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 lg:p-6 sm:p-4 font-sans">
      <div className="w-full max-w-6xl min-h-screen lg:min-h-[720px] bg-white lg:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Hero Showcase Panel (Desktop only / 50%) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 relative overflow-hidden bg-slate-950 flex-col justify-between p-10 xl:p-12 text-white">
          {/* Turf Background Image with Gradient Overlays */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1529900248461-8314e32922dd?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-transparent" />

          {/* Top Header: Brand Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3.5 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-1.5 flex items-center justify-center group-hover:scale-105 transition-all shadow-lg">
                <img src="/logo.png" alt="Friends Turf" className="w-full h-full object-contain filter drop-shadow-md" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-white block">
                  FRIENDS TURF
                </span>
                <span className="text-[11px] uppercase font-extrabold tracking-widest text-emerald-400">
                  Credential Security
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-md text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Argon2 Hash Guard</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Account Credentials</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Create Your New Security Password.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Choose a strong, unique password to safeguard your turf reservation history, wallet balance, and team rosters.
            </p>

            {/* Password Tips Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Password Guidelines
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMinLength ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className={hasMinLength ? "text-emerald-300 font-medium" : "text-slate-300"}>
                    Minimum 6 characters
                  </span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasNumberOrSpecial ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className={hasNumberOrSpecial ? "text-emerald-300 font-medium" : "text-slate-300"}>
                    Includes a number or special character
                  </span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordsMatch ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className={passwordsMatch ? "text-emerald-300 font-medium" : "text-slate-300"}>
                    Both passwords match
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Remembered your password?</span>
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">
              Sign In Instead
            </Link>
          </div>
        </div>

        {/* Right Form Terminal Panel (50%) */}
        <div className="lg:col-span-6 xl:col-span-6 p-6 sm:p-10 xl:p-14 flex flex-col justify-between bg-white overflow-y-auto">
          {/* Top Mobile Brand Bar */}
          <div className="lg:hidden flex items-center justify-between pb-6 mb-4 border-b border-slate-100">
            <Link to="/" className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="Friends Turf" className="w-9 h-9 object-contain" />
              <span className="text-base font-extrabold text-slate-900">FRIENDS TURF</span>
            </Link>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Set Password
            </span>
          </div>

          <div className="w-full max-w-md mx-auto space-y-6 my-auto">
            {/* Header */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#059669] tracking-widest uppercase">
                Security Update
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Set new password
              </h2>
              <p className="text-sm text-slate-600">
                Create a strong password with at least 6 characters for your Friends Turf account.
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {!token && (
              <div className="space-y-4 text-center p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-xs font-medium text-amber-900 leading-relaxed">
                  No reset token detected in this link. Please request a new recovery link from the forgot password page.
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Request New Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {token && !success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating password...</span>
                    </div>
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
              <div className="space-y-6 text-center">
                <div className="p-6 rounded-2xl bg-[#ECFDF5] border border-emerald-200 space-y-4 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-[#059669] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Password Updated!
                      </h3>
                      <p className="text-xs text-slate-600">Your account credentials have been updated</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
                    You can now use your newly configured password to sign in and book pitches across all Friends Turf arenas.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <span>Sign In With New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Bottom Security / Compliance Badge */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <div className="inline-flex items-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span>Protected by 256-Bit SSL Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
