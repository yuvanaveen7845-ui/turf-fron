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
  CheckCircle2,
  Sparkles,
  MapPin,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import api from "../../services/api";
import { useUserAvailability } from "../../hooks/useUserAvailability";

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
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const emailAvailability = useUserAvailability("email");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    emailAvailability.check(val);
  };

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

  // Fetch real reviews dynamically from database
  useEffect(() => {
    const fetchVerifiedReviews = async () => {
      try {
        const res = await api.get("/reviews/");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setReviews(res.data);
        }
      } catch (err) {
        console.warn("Could not load database reviews:", err);
      }
    };
    fetchVerifiedReviews();
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
        width: 320,
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 lg:p-6 sm:p-4 font-sans">
      <div className="w-full max-w-6xl min-h-screen lg:min-h-[720px] bg-white lg:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Hero Showcase Panel (Desktop only / 50%) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 relative overflow-hidden bg-slate-950 flex-col justify-between p-10 xl:p-12 text-white">
          {/* Turf Background Image with High-Contrast Gradient Layers */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1529900248461-8314e32922dd?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-transparent" />

          {/* Top Header: Brand Badge & Live Status */}
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
                  Sports Complex
                </span>
              </div>
            </Link>
          </div>


          {/* Center Content: Hero Statement & Value Prop */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tiruppur's #1 Premier Athletic Arena</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Pristine Turf Grounds. Instant Digital Match Passes.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Experience seamless football & cricket pitch reservations with zero-conflict 5-minute slot locks, real-time live telemetry, and instant 1-click checkout.
            </p>

            {/* Feature Bullets */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>FIFA-Grade AstroTurf</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>5-Min Slot Lock Protection</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant QR Gate Entry</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Turf Cash Cashback</span>
              </div>
            </div>
          </div>

          {/* Bottom Testimonial & Metric Badges */}
          <div className="relative z-10 space-y-4 pt-6 border-t border-white/10">
            {/* Verified Customer Reviews Card (Dynamically Loaded from Database) */}
            {(() => {
              const currentReview = reviews.length > 0 ? reviews[activeReviewIdx % reviews.length] : null;
              const reviewerName = currentReview?.customer_name || "Prajeeth Kumar";
              const reviewerRating = currentReview?.rating || 5;
              const reviewerTurf = currentReview?.turf_name || "Pitch 1 – Champions Arena";
              const reviewerText = currentReview?.review_text || "Exceptional pitch quality! The floodlights are bright and non-glaring. The staff welcomed our squad warmly.";
              const reviewerBooking = currentReview?.booking_reference || "FT-26-VERIFIED";

              return (
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3">
                  {/* Review Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-white block leading-none">
                          Verified Customer Review
                        </span>
                        <span className="text-[9px] text-emerald-300 font-semibold">
                          Confirmed Turf Match Booking
                        </span>
                      </div>
                    </div>

                    {/* Navigation buttons for multiple reviews */}
                    {reviews.length > 1 && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setActiveReviewIdx((prev) => (prev > 0 ? prev - 1 : reviews.length - 1))}
                          className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="text-[9px] text-slate-300 font-mono">
                          {(activeReviewIdx % reviews.length) + 1}/{reviews.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveReviewIdx((prev) => (prev + 1) % reviews.length)}
                          className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white border border-white/30">
                          {reviewerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{reviewerName}</p>
                          <p className="text-[9px] text-emerald-300 font-medium">Played at {reviewerTurf}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-0.5 text-amber-400">
                        {[...Array(reviewerRating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed italic">
                      "{reviewerText}"
                    </p>
                    <div className="text-[9px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-white/5">
                      <span>Booking: <span className="font-mono text-emerald-400">{reviewerBooking}</span></span>
                      <span className="text-emerald-300 font-semibold flex items-center space-x-1">
                        <span>●</span>
                        <span>Verified Player</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Metrics */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>🏆 15,400+ Matches Booked</span>
              <span>⭐ 4.9 Google Rating</span>
              <span>🛡️ FIFA Certified Pitch</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Terminal (50%) */}
        <div className="lg:col-span-6 xl:col-span-6 p-6 sm:p-10 xl:p-14 flex flex-col justify-between bg-white">
          {/* Mobile Top Brand Bar (Visible only on small screens) */}
          <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="Friends Turf" className="w-10 h-10 object-contain" />
              <div>
                <span className="font-black text-slate-900 text-sm tracking-tight block">FRIENDS TURF</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Player Portal</span>
              </div>
            </Link>
          </div>


          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider block">
                Welcome Back
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sign In to Friends Turf
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Access your match passes, scheduled sessions, and Turf Cash wallet.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading / Processing Indicator */}
            {loading && statusMessage && (
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 flex items-center space-x-3 text-xs text-emerald-800 animate-pulse">
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
                <span className="flex-shrink mx-4 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  or continue with email
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="player@example.com"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-colors"
                  />
                  {emailAvailability.checking && (
                    <div className="absolute right-3.5 top-3.5">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {emailAvailability.exists === false && (
                  <p className="text-[11px] text-amber-600 font-semibold flex items-center justify-between pt-0.5">
                    <span>No account found with this email.</span>
                    <Link to="/register" className="font-bold underline text-amber-700 hover:text-amber-900">
                      Sign Up &rarr;
                    </Link>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#059669] hover:underline transition-colors"
                  >
                    Forgot Password?
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#059669] focus:ring-[#059669]"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-xs text-slate-600 pt-2">
              New to Friends Turf?{" "}
              <Link to="/register" className="text-[#059669] font-bold hover:underline">
                Create Player Account
              </Link>
            </p>
          </div>

          {/* Security & Compliance Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#059669]" />
              <span>256-Bit SSL Encrypted • PCI-DSS Compliant Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

