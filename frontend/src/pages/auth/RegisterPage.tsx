import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Shield,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  X,
  LogIn,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import { useUserAvailability } from "../../hooks/useUserAvailability";
import { getBookingIntent, clearBookingIntent } from "../../utils/bookingIntent";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Real-time existence checks
  const emailAvailability = useUserAvailability("email");
  const phoneAvailability = useUserAvailability("phone");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, email: val }));
    emailAvailability.check(val);
  };

  // Indian phone number sanitizer & formatter
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Strip non-digit characters
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length > 10) {
      digits = digits.slice(2);
    }
    // Limit to 10 digits
    digits = digits.slice(0, 10);

    let formatted = "";
    if (digits.length > 0) {
      formatted = "+91 " + digits.slice(0, 5) + (digits.length > 5 ? " " + digits.slice(5) : "");
    }

    setFormData((prev) => ({ ...prev, phone: formatted }));
    phoneAvailability.check(formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password requirements checklist
  const pass = formData.password;
  const passwordChecks = {
    length: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass),
  };

  const isPasswordValid =
    passwordChecks.length &&
    passwordChecks.hasUpper &&
    passwordChecks.hasLower &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSpecial;

  const phoneDigits = formData.phone.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length === 12 || phoneDigits.length === 10; // +91XXXXXXXXXX or 10 digits

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy.");
      return;
    }

    if (emailAvailability.exists) {
      setError("An account with this email already exists. Please Sign In instead.");
      return;
    }

    if (phoneAvailability.exists) {
      setError("An account with this phone number already exists. Please Sign In instead.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please satisfy all password security requirements.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      // Check if customer had an active booking intent
      const intent = getBookingIntent();
      if (intent && intent.turfId && intent.slotIds?.length > 0) {
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
        } catch (lockErr) {
          clearBookingIntent();
          navigate(`/turfs/${intent.turfId}?date=${intent.date}`, { replace: true });
          return;
        }
      }

      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get("redirect");
      const from = redirectParam || (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.phone?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        "Registration failed. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 lg:p-6 sm:p-4 font-sans">
      <div className="w-full max-w-6xl min-h-screen lg:min-h-[760px] bg-white lg:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Hero Showcase Panel (Desktop only / 50%) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 relative overflow-hidden bg-slate-950 flex-col justify-between p-10 xl:p-12 text-white">
          {/* Turf Background Image with High-Contrast Gradient Layers */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-transparent" />

          {/* Top Header */}
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
                  Player Membership
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 backdrop-blur-md text-xs font-bold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>FIFA-Certified Arena</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Player Pass & Member Privileges</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Join Tiruppur's #1 Premier Athletic Arena.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Register in 30 seconds to lock weekend pitch slots, manage your squad passes, and activate instant QR optical gate check-ins.
            </p>

            {/* Privileges Card */}
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3 max-w-md">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Player Membership Perks</span>
              </h3>
              <div className="space-y-2 text-xs text-white/90">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Instant Digital Match Pass</strong> with optical gate QR code.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>5-Minute Slot Lock</strong> prevents double-booking at checkout.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Instant 1-Click Wallet</strong> with zero-fee top-ups & refunds.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust & Compliance */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-semibold pt-6 border-t border-white/10">
            <span className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>FIFA-Certified Surfaces</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero-Latency Booking</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Privacy Protected</span>
            </span>
          </div>
        </div>

        {/* Right Registration Terminal (50%) */}
        <div className="lg:col-span-6 xl:col-span-6 p-6 sm:p-10 xl:p-14 flex flex-col justify-between bg-white overflow-y-auto">
          {/* Mobile Top Brand Bar */}
          <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="Friends Turf" className="w-10 h-10 object-contain" />
              <div>
                <span className="font-black text-slate-900 text-sm tracking-tight block">FRIENDS TURF</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Player Sign Up</span>
              </div>
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto space-y-5">
            {/* Header */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider block">
                Create Free Account
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Player Registration
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Unlock locked pitch bookings, digital match passes, and member perks.
              </p>
            </div>

            {/* Pending Booking Continuation Banner */}
            {(() => {
              const pendingIntent = getBookingIntent();
              const stateData = location.state as any;
              if (!pendingIntent && !stateData?.hasPendingBooking) return null;
              const turfName = pendingIntent?.turfName || stateData?.turfName || "Selected Turf";
              const slotCount = pendingIntent?.slotIds?.length || stateData?.slotCount || 1;
              const totalAmt = pendingIntent?.totalAmount || stateData?.totalAmount;

              return (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start space-x-3 text-xs text-emerald-900 shadow-sm animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Zap className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{turfName}</p>
                      {totalAmt && (
                        <span className="font-black text-[#059669] font-mono">₹{Number(totalAmt).toLocaleString("en-IN")}</span>
                      )}
                    </div>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Register to instantly lock {slotCount} selected match slot{slotCount > 1 ? "s" : ""} and continue directly to checkout.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Existing User Warning Alert */}
            {(emailAvailability.exists || phoneAvailability.exists) && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    {emailAvailability.exists ? "Email already registered." : "Phone number already registered."}
                  </span>
                </div>
                <Link
                  to={`/login${location.search}`}
                  state={location.state}
                  className="font-bold text-amber-800 hover:text-amber-950 underline inline-flex items-center space-x-1 shrink-0 ml-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In &rarr;</span>
                </Link>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Names row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Alex"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Hunter"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-colors"
                  />
                </div>
              </div>

              {/* Email with real-time check */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder="alex@example.com"
                    className={`w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-colors ${
                      emailAvailability.exists
                        ? "border-amber-400 focus:border-amber-500"
                        : "border-slate-200 focus:border-[#059669]"
                    }`}
                  />
                  {emailAvailability.checking && (
                    <div className="absolute right-3.5 top-3.5">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!emailAvailability.checking && emailAvailability.exists === false && (
                    <div className="absolute right-3.5 top-3 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Phone with Indian Format & Real-time check */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Indian Mobile Number
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">10-Digit Mobile</span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border rounded-xl text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:bg-white transition-colors ${
                      phoneAvailability.exists
                        ? "border-amber-400 focus:border-amber-500"
                        : "border-slate-200 focus:border-[#059669]"
                    }`}
                  />
                  {phoneAvailability.checking && (
                    <div className="absolute right-3.5 top-3.5">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!phoneAvailability.checking && phoneAvailability.exists === false && (
                    <div className="absolute right-3.5 top-3 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password with live requirements */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create secure password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Criteria */}
                {formData.password && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] mt-1.5">
                    <div className="grid grid-cols-2 gap-1">
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.length ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.length ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.hasUpper ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.hasUpper ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.hasLower ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.hasLower ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.hasNumber ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.hasNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                        <span>Number (0-9)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#059669] focus:ring-[#059669]"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 leading-snug">
                  I agree to the <Link to="/terms" className="text-[#059669] font-bold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#059669] font-bold hover:underline">Privacy Policy</Link>.
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || !agreedToTerms || emailAvailability.exists === true || phoneAvailability.exists === true}
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Complete Player Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-xs text-slate-600 pt-1">
              Already have an account?{" "}
              <Link to={`/login${location.search}`} state={location.state} className="text-[#059669] font-bold hover:underline">
                Sign In here
              </Link>
            </p>
          </div>

          {/* Security & Compliance Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#059669]" />
              <span>256-Bit SSL Encrypted • Instant Phone Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
