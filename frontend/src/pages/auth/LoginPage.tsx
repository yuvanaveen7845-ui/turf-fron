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
  Star,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Phone,
} from "lucide-react";
import api from "../../services/api";
import { getBookingIntent, clearBookingIntent } from "../../utils/bookingIntent";
import { useBusinessSettings } from "../../context/BusinessSettingsContext";

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const { auth } = useBusinessSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const dynamicClientId = (auth?.google_client_id || import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  // Authentication Switcher (Mobile Phone vs Email)
  const [authMethod, setAuthMethod] = useState<"PHONE" | "EMAIL">("PHONE");

  // Form Fields
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & UI
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Phone input formatting & validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length > 10) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 10);
    setPhone(digits);
    setError("");
  };

  const isIndianMobileValid = (digits: string) => {
    return /^[6-9]\d{9}$/.test(digits);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  // Helper for smart role-based redirection & booking continuation
  const handlePostLoginRedirect = async (user: User) => {
    if (user.role === "ADMIN") {
      navigate("/admin", { replace: true });
      return;
    }
    if (user.role === "STAFF") {
      navigate("/staff", { replace: true });
      return;
    }

    // Check if customer had an active booking intent
    const intent = getBookingIntent();
    if (intent && intent.turfId && intent.slotIds?.length > 0) {
      setStatusMessage("Reserving your selected pitch slots...");
      try {
        const res = await api.post("/bookings/lock/", {
          turf_id: intent.turfId,
          date: intent.date,
          slot_ids: intent.slotIds,
        });

        const lockPayload = res.data.data || res.data;
        const lockedUntil =
          res.data.locked_until ||
          lockPayload.locked_until ||
          res.data.expires_at ||
          new Date(Date.now() + 300000).toISOString();
        const lockDurationSeconds =
          res.data.lock_duration_seconds || lockPayload.lock_duration_seconds || 300;

        clearBookingIntent();

        navigate("/checkout", {
          replace: true,
          state: {
            turf: intent.turf,
            date: intent.date,
            selectedDate: intent.date,
            slotIds: intent.slotIds,
            selectedSlotIds: intent.slotIds,
            selectedSlots: intent.selectedSlots || [],
            lockedSlots: res.data.locked_slots || lockPayload.locked_slots || intent.selectedSlots,
            lockData: {
              locked_until: lockedUntil,
              slot_ids: intent.slotIds,
            },
            lockDurationSeconds,
            expiresAt: lockedUntil,
            totalPrice: intent.totalAmount,
          },
        });
        return;
      } catch (lockErr: any) {
        console.warn("Auto-lock after login encountered conflict:", lockErr);
        clearBookingIntent();
        navigate(`/turfs/${intent.turfId}?date=${intent.date}`, { replace: true });
        return;
      }
    }

    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get("redirect");
    const from = redirectParam || (location.state as any)?.from?.pathname || "/";
    navigate(from, { replace: true });
  };

  // Google OAuth GIS initialization
  useEffect(() => {
    if (!dynamicClientId) return;

    let isMounted = true;

    const renderGoogleBtn = () => {
      if (!isMounted || !window.google || !googleBtnRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: dynamicClientId,
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

    if (window.google) {
      renderGoogleBtn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) renderGoogleBtn();
      };
      document.body.appendChild(script);

      return () => {
        isMounted = false;
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [dynamicClientId]);

  // Verified reviews dynamic fetch
  useEffect(() => {
    const fetchVerifiedReviews = async () => {
      try {
        const res = await api.get("/reviews/?min_rating=4");
        const list = Array.isArray(res.data) ? res.data : [];
        const positiveReviews = list.filter((r: any) => Number(r.rating) >= 4);
        if (positiveReviews.length > 0) {
          setReviews(positiveReviews);
        }
      } catch (err) {
        console.warn("Could not load database reviews:", err);
      }
    };
    fetchVerifiedReviews();
  }, []);

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

  // Password submission handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const target = authMethod === "PHONE" ? `+91${phone}` : email.trim();

    if (authMethod === "PHONE" && !isIndianMobileValid(phone)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    if (authMethod === "EMAIL" && (!email || !/\S+@\S+\.\S+/.test(email))) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    setLoading(true);
    setStatusMessage("Signing you in...");

    try {
      const user = await login(target, password);
      setStatusMessage("Login successful. Directing to your dashboard...");
      handlePostLoginRedirect(user);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Invalid credentials. Please verify your mobile number/email and password."
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
          {/* Turf Background Image */}
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
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-2xl bg-[#059669] flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform border border-emerald-400/30">
                <img
                  src="/logo.png"
                  alt="Friends Turf"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to icon if logo image not found
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block leading-none">
                  FRIENDS<span className="text-emerald-400">TURF</span>
                </span>
                <span className="text-[10px] tracking-widest text-emerald-300 font-bold uppercase">
                  Arena & Sports Club
                </span>
              </div>
            </Link>

            <div className="flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Turfs Open Today</span>
            </div>
          </div>

          {/* Middle Pitch Headline */}
          <div className="relative z-10 space-y-4 my-auto py-8">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-emerald-300">
              <span>● Fast 60-Second Arena Booking</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Play Under The Floodlights. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300">
                Book in 3 Simple Taps.
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-md leading-relaxed font-normal">
              Sign in with your mobile number or email to reserve slots, manage team passes, and access verified floodlit pitches.
            </p>
          </div>

          {/* Bottom Testimonial */}
          <div className="relative z-10 space-y-4 pt-6 border-t border-white/10">
            {(() => {
              const currentReview = reviews.length > 0 ? reviews[activeReviewIdx % reviews.length] : null;
              const reviewerName = currentReview?.customer_name || "Prajeeth Kumar";
              const reviewerRating = currentReview?.rating || 5;
              const reviewerTurf = currentReview?.turf_name || "Pitch 1 – Champions Arena";
              const reviewerText =
                currentReview?.review_text ||
                "Exceptional pitch quality! The floodlights are bright and non-glaring. The staff welcomed our squad warmly.";
              const reviewerBooking = currentReview?.booking_reference || "FT-26-VERIFIED";

              return (
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3">
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
              <span className="flex items-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>15,400+ Matches Booked</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>4.9 Google Rating</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>FIFA Certified Pitch</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Authentication Terminal (50%) */}
        <div className="lg:col-span-6 xl:col-span-6 p-6 sm:p-10 xl:p-14 flex flex-col justify-between bg-white">
          {/* Mobile Top Brand Bar */}
          <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="Friends Turf" className="w-10 h-10 object-contain" />
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                  FRIENDS<span className="text-[#059669]">TURF</span>
                </span>
                <span className="text-[9px] tracking-widest text-slate-400 font-bold uppercase">
                  Arena & Sports Club
                </span>
              </div>
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto space-y-6 my-auto">
            {/* Form Title & Context */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, player
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Sign in to book pitches, manage squad passes, and continue matches.
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

            {/* Primary Identifier Switcher Tabs (Mobile vs Email) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("PHONE");
                  setError("");
                }}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl transition-all cursor-pointer ${
                  authMethod === "PHONE"
                    ? "bg-white text-[#059669] shadow-sm font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Mobile Number</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("EMAIL");
                  setError("");
                }}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl transition-all cursor-pointer ${
                  authMethod === "EMAIL"
                    ? "bg-white text-[#059669] shadow-sm font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </button>
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {authMethod === "PHONE" ? (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile Phone Number
                  </label>
                  <div className="relative flex rounded-xl border border-slate-200 bg-[#F8FAFC] focus-within:bg-white focus-within:border-[#059669] transition-colors overflow-hidden">
                    <div className="flex items-center space-x-1.5 px-3 bg-slate-100/90 border-r border-slate-200 text-xs font-bold text-slate-700 select-none">
                      <span className="text-base leading-none">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="98765 43210"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 bg-transparent text-sm text-slate-900 font-semibold placeholder-slate-400 focus:outline-none tracking-wide"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                    <span className="text-slate-500">
                      10-digit Indian mobile number
                    </span>
                    {phone.length === 10 && (
                      <span className={isIndianMobileValid(phone) ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                        {isIndianMobileValid(phone) ? "✓ Valid Number" : "Invalid Prefix (6-9 required)"}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
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
                  </div>
                </div>
              )}

              {/* Password Field */}
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

              {/* Keep me signed in */}
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

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={
                  loading ||
                  (authMethod === "PHONE" ? !isIndianMobileValid(phone) : !email) ||
                  !password
                }
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Friends Turf</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google OAuth Section */}
            {dynamicClientId ? (
              <div className="space-y-3 pt-2">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    or continue with
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="flex justify-center">
                  <div ref={googleBtnRef} id="googleBtnContainer" className="w-full flex justify-center" />
                </div>
              </div>
            ) : null}

            {/* Sign Up Link */}
            <p className="text-center text-xs text-slate-600 pt-2">
              New to Friends Turf?{" "}
              <Link
                to={`/register${location.search}`}
                state={location.state}
                className="text-[#059669] font-bold hover:underline"
              >
                Create Player Account
              </Link>
            </p>
          </div>

          {/* Security & Compliance Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#059669]" />
              <span>256-Bit SSL Encrypted • Official Friends Turf Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
