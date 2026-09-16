import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  Trophy,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password/", { email });
      setSubmitted(true);
      if (res.data?.dev_reset_url) {
        setDevResetUrl(res.data.dev_reset_url);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.email?.[0] ||
          err.response?.data?.detail ||
          "Failed to process password reset request. Please try again."
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
              Account Recovery
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Reset Your Password
            </h1>
          </div>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Enter the email address associated with your Friends Turf account to receive a secure recovery link.
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-200 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#059669] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Reset Link Dispatched
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an account exists for <span className="font-semibold text-[#059669]">{email}</span>, we have sent instructions to reset your password.
                </p>
              </div>

              {devResetUrl && (
                <div className="pt-3 border-t border-emerald-200 text-left">
                  <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider block mb-1">
                    Development Quick-Link:
                  </span>
                  <Link
                    to={devResetUrl}
                    className="text-xs text-[#059669] font-mono hover:underline break-all block p-2 bg-white rounded-lg border border-emerald-200"
                  >
                    Click to simulate email reset link &rarr;
                  </Link>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Didn't receive an email? Check your spam folder or try again in a few minutes.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
                <span>Generating recovery link...</span>
              ) : (
                <>
                  <span>Send Recovery Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-[#059669] transition-colors font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
