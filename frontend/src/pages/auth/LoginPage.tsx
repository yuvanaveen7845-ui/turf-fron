import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Trophy,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Shield,
  AlertCircle,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Invalid credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: "CUSTOMER" | "STAFF" | "ADMIN") => {
    setError("");
    setLoading(true);
    try {
      await quickLogin(role);
      if (role === "ADMIN") navigate("/admin");
      else if (role === "STAFF") navigate("/staff");
      else navigate("/");
    } catch (err) {
      setError("Demo login failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-xl shadow-emerald-500/20 mb-2">
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Welcome to Friends Turf
          </h2>
          <p className="text-sm text-slate-400">
            Sign in to book pitches, manage matches, or verify QR passes
          </p>
        </div>

        {/* 1-Click Demo Account Switcher */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant 1-Click Demo Logins</span>
            </span>
            <span className="text-[10px] text-slate-500">Ready to test</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick("CUSTOMER")}
              className="px-2.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-800 hover:border-emerald-500 text-emerald-300 text-xs font-bold transition-all text-center hover:scale-[1.02]"
            >
              ⚽ Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick("STAFF")}
              className="px-2.5 py-2 rounded-xl bg-amber-950/70 border border-amber-800 hover:border-amber-500 text-amber-300 text-xs font-bold transition-all text-center hover:scale-[1.02]"
            >
              🛡️ Staff Pass
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick("ADMIN")}
              className="px-2.5 py-2 rounded-xl bg-purple-950/70 border border-purple-800 hover:border-purple-500 text-purple-300 text-xs font-bold transition-all text-center hover:scale-[1.02]"
            >
              👑 Admin Hub
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-emerald-400 font-semibold hover:underline"
          >
            Create Customer Account
          </Link>
        </p>
      </div>
    </div>
  );
};
