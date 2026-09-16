import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { User } from "../../types";
import {
  Trophy,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Helper for smart role-based redirection
  const handlePostLoginRedirect = (user: User) => {
    if (user.role === "ADMIN") {
      navigate("/admin", { replace: true });
    } else if (user.role === "STAFF") {
      navigate("/staff", { replace: true });
    } else {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  };

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogleSignIn();
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (!window.google || !googleBtnRef.current) return;

    try {
      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        "987654321000-friendsturfgoogleclientid.apps.googleusercontent.com";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 340,
      });
    } catch (e) {
      console.warn("Google GIS initialization notice:", e);
    }
  };

  const handleGoogleCallback = async (response: any) => {
    setError("");
    setLoading(true);
    setStatusMessage("Connecting to Google Identity Services...");

    try {
      setStatusMessage("Verifying Friends Turf authentication...");
      const user = await googleLogin(response.credential);
      setStatusMessage("Authentication confirmed. Directing to your dashboard...");
      handlePostLoginRedirect(user);
    } catch (err: any) {
      const code = err.response?.data?.code;
      const detail =
        err.response?.data?.detail || "Authentication with Google failed.";

      if (code === "ACCOUNT_SUSPENDED") {
        navigate("/access-denied", {
          state: { reason: "ACCOUNT_SUSPENDED" },
        });
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStatusMessage("Signing you in...");

    try {
      const user = await login(email, password);
      setStatusMessage("Login successful. Directing to your dashboard...");
      handlePostLoginRedirect(user);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="max-w-md w-full space-y-6 bg-white border border-slate-200 p-7 sm:p-9 rounded-3xl shadow-pitch-card">
        {/* Header & Brand */}
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
              Friends Turf Arena
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Sign In to Your Account
            </h1>
          </div>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Book turf pitches, view upcoming sessions, or access your staff management portal.
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && statusMessage && (
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 flex items-center space-x-3 text-xs text-emerald-800 animate-pulse">
            <div className="w-4 h-4 border-2 border-[#059669] border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Google OAuth Section */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <div ref={googleBtnRef} id="googleBtnContainer" className="w-full flex justify-center" />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              or continue with email
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
        </div>

        {/* Email + Password Form */}
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#059669] hover:text-[#047857] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security and Footer Links */}
        <div className="space-y-3 pt-2 text-center">
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#059669]" />
            <span>Secure 256-bit encrypted authentication</span>
          </div>

          <p className="text-xs text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#059669] font-bold hover:underline"
            >
              Create Player Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
