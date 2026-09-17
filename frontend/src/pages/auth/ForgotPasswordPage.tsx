import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  Sparkles,
  Check,
  X,
  UserCheck,
  UserX,
  Clock,
  ExternalLink,
} from "lucide-react";
import { CricketDRSVerificationAnimation, DRSStatus } from "../../components/auth/CricketDRSVerificationAnimation";
import { useUserAvailability } from "../../hooks/useUserAvailability";

type ResetStep = "EMAIL_INPUT" | "OTP_VERIFY" | "SET_NEW_PASSWORD" | "COMPLETED";

// Helper to extract clean, user-friendly error messages from API responses
const extractErrorMessage = (err: any): string => {
  if (!err) return "An unexpected error occurred. Please try again.";
  const data = err.response?.data;
  if (!data) return err.message || "Unable to reach the server. Please check your internet connection.";
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (Array.isArray(data.email) && data.email[0]) return data.email[0];
  if (Array.isArray(data.otp) && data.otp[0]) return data.otp[0];
  if (Array.isArray(data.new_password) && data.new_password[0]) return data.new_password[0];
  if (Array.isArray(data.password) && data.password[0]) return data.password[0];
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0];
  return "Could not complete request. Please verify your details.";
};

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step State
  const [step, setStep] = useState<ResetStep>("EMAIL_INPUT");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>(undefined);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // DRS Animation State
  const [drsStatus, setDrsStatus] = useState<DRSStatus>("idle");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Real-time email check hook
  const emailAvailability = useUserAvailability("email");

  // Handle email input change with real-time check
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setError(null);
    emailAvailability.check(val);
  };

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/password-reset/request-otp/", { email });
      setSuccessMessage(res.data?.message || "6-digit verification OTP sent to your email!");
      if (res.data?.masked_phone) {
        setMaskedPhone(res.data.masked_phone);
      }
      if (res.data?.masked_email) {
        setMaskedEmail(res.data.masked_email);
      }
      if (res.data?.dev_otp) {
        setDevOtp(res.data.dev_otp);
      }
      setResendCooldown(res.data?.cooldown_seconds || 60);
      setStep("OTP_VERIFY");
      setDrsStatus("idle");
    } catch (err: any) {
      const errMsg = extractErrorMessage(err);
      setError(errMsg);
      if (err.response?.data?.cooldown_seconds) {
        setResendCooldown(err.response.data.cooldown_seconds);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (idx: number, val: string) => {
    const sanitized = val.replace(/\D/g, "");
    if (!sanitized) {
      const updated = [...otpDigits];
      updated[idx] = "";
      setOtpDigits(updated);
      setDrsStatus("idle");
      return;
    }

    const lastChar = sanitized.slice(-1);
    const updated = [...otpDigits];
    updated[idx] = lastChar;
    setOtpDigits(updated);
    setError(null);

    // Auto-focus next input
    if (idx < 5 && lastChar) {
      otpInputRefs.current[idx + 1]?.focus();
    }

    // If all 6 digits entered, auto-trigger DRS check
    const fullOtp = updated.join("");
    if (fullOtp.length === 6) {
      triggerOtpVerification(fullOtp);
    } else {
      setDrsStatus("idle");
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);

    if (pasted.length === 6) {
      triggerOtpVerification(pasted);
    } else {
      otpInputRefs.current[pasted.length]?.focus();
    }
  };

  // Step 2: Verify OTP with Cricket DRS review
  const triggerOtpVerification = async (otpString?: string) => {
    const code = otpString || otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError(null);
    setLoading(true);
    setDrsStatus("verifying");

    try {
      const res = await api.post("/auth/password-reset/verify-otp/", {
        email,
        otp: code,
      });

      setResetToken(res.data?.reset_token);
      setDrsStatus("success");

      // Smooth delay so the user can enjoy the LED Stumps flashing green & bails flying!
      setTimeout(() => {
        setStep("SET_NEW_PASSWORD");
        setDrsStatus("idle");
      }, 1500);
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      setDrsStatus("error");
      if (typeof data?.attempts_left === "number") {
        setAttemptsLeft(data.attempts_left);
      } else if (typeof data?.remaining_attempts === "number") {
        setAttemptsLeft(data.remaining_attempts);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Password validation metrics
  const passwordChecks = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    matches: newPassword === confirmPassword && newPassword.length > 0,
  };

  const isPasswordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isPasswordMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const isPasswordValid =
    passwordChecks.length &&
    passwordChecks.hasUpper &&
    passwordChecks.hasLower &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSpecial &&
    passwordChecks.matches;

  // Step 3: Confirm new password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasswordMismatch) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }
    if (!isPasswordValid) {
      setError("Please satisfy all password security criteria before continuing.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/password-reset/confirm/", {
        email,
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep("COMPLETED");
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const enteredOtpCount = otpDigits.filter((d) => d !== "").length;

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
                  Account Recovery
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-md text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DRS Security Gate</span>
            </div>
          </div>

          {/* Center Content: Interactive Recovery Guidance */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cryptographic OTP Password Reset</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Instant Account Recovery with Cricket DRS Verification.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Secure your account in seconds. Enter your registered email to receive a 6-digit numeric OTP with live third-umpire verification.
            </p>

            {/* Protocol Steps Indicator */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Recovery Progression</span>
                <span className="font-mono text-emerald-400">
                  {step === "EMAIL_INPUT" && "Step 1 of 3"}
                  {step === "OTP_VERIFY" && "Step 2 of 3"}
                  {step === "SET_NEW_PASSWORD" && "Step 3 of 3"}
                  {step === "COMPLETED" && "Done"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    step === "EMAIL_INPUT" || step === "OTP_VERIFY" || step === "SET_NEW_PASSWORD" || step === "COMPLETED"
                      ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                      : "bg-slate-700"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    step === "OTP_VERIFY" || step === "SET_NEW_PASSWORD" || step === "COMPLETED"
                      ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                      : "bg-slate-700"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    step === "SET_NEW_PASSWORD" || step === "COMPLETED"
                      ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                      : "bg-slate-700"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Need immediate field assistance?</span>
            <Link to="/contact" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">
              Contact Arena Desk
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
              Reset Password
            </span>
          </div>

          <div className="w-full max-w-md mx-auto space-y-6 my-auto">
            {/* ----------------- STEP 1: EMAIL INPUT ----------------- */}
            {step === "EMAIL_INPUT" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#059669] tracking-widest uppercase">
                    Step 1 • Identity Verification
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Find your account
                  </h2>
                  <p className="text-sm text-slate-600">
                    Enter your registered email address to receive a secure 6-digit OTP.
                  </p>
                </div>

                {/* Highly Informative User-Friendly Error Alert */}
                {error && (
                  <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2 animate-in fade-in">
                    <div className="flex items-start space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-rose-950">Notice</p>
                        <p className="leading-relaxed text-rose-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="player@example.com"
                        className={`w-full pl-11 pr-10 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium ${
                          emailAvailability.exists === true
                            ? "border-emerald-500 focus:border-emerald-600 ring-2 ring-emerald-500/10"
                            : emailAvailability.exists === false
                            ? "border-amber-400 focus:border-amber-500 ring-2 ring-amber-500/10"
                            : "border-slate-200 focus:border-[#059669]"
                        }`}
                      />
                      {emailAvailability.checking && (
                        <div className="absolute right-3.5 top-3.5">
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!emailAvailability.checking && emailAvailability.exists === true && (
                        <div className="absolute right-3.5 top-3.5 text-emerald-600" title="Account verified">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Rich User-Friendly Email Status Cards */}
                    {emailAvailability.exists === true && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[11px] shrink-0">
                            {email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-emerald-950 flex items-center space-x-1">
                              <span>Verified Player Account</span>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </p>
                            <p className="text-[11px] text-emerald-700">
                              {emailAvailability.maskedPhone ? `Linked to ${emailAvailability.maskedPhone}` : "Ready to receive reset OTP"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                          Active
                        </span>
                      </div>
                    )}

                    {emailAvailability.exists === false && email.includes("@") && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
                        <div className="flex items-center space-x-2">
                          <UserX className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <p className="font-bold text-amber-950">No account found</p>
                            <p className="text-[11px] text-amber-800">No registered player is using this email address.</p>
                          </div>
                        </div>
                        <Link
                          to="/register"
                          className="font-bold text-amber-900 hover:text-emerald-700 underline text-xs shrink-0 ml-2"
                        >
                          Sign Up &rarr;
                        </Link>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (emailAvailability.exists === false)}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Dispatching OTP via Secure SMTP...</span>
                      </div>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 border-t border-slate-100">
                    <Link
                      to="/login"
                      className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-[#059669] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------- STEP 2: OTP VERIFICATION + CRICKET DRS ----------------- */}
            {step === "OTP_VERIFY" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#059669] tracking-widest uppercase">
                      Step 2 • Third Umpire Verification
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("EMAIL_INPUT");
                        setError(null);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    Enter Verification Code
                  </h2>
                  <p className="text-xs text-slate-600">
                    Enter the 6-digit code sent to <strong className="text-slate-900">{maskedEmail || email}</strong>
                    {maskedPhone && <span> (Linked to {maskedPhone})</span>}.
                  </p>
                </div>

                {/* CRICKET DRS & LED STUMPS ANIMATION COMPONENT */}
                <CricketDRSVerificationAnimation
                  status={drsStatus}
                  otpLength={6}
                  enteredCount={enteredOtpCount}
                  attemptsLeft={attemptsLeft}
                  errorMessage={error || undefined}
                />

                {/* User friendly error alert if OTP is invalid */}
                {error && drsStatus === "error" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Developer Quick-Fill OTP for Local Testing */}
                {devOtp && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                      Local Testing Development OTP:
                    </span>
                    <span className="font-mono text-base font-black text-emerald-800 tracking-widest">
                      {devOtp}
                    </span>
                  </div>
                )}

                {/* 6-Digit Segmented OTP Input Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                    6-Digit One-Time Password
                  </label>
                  <div className="flex justify-between gap-2 sm:gap-2.5 max-w-sm mx-auto" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoFocus={idx === 0}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-black rounded-xl border-2 transition-all ${
                          digit
                            ? "border-[#059669] bg-emerald-50/50 text-slate-900 shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-900 focus:border-[#059669] focus:bg-white"
                        } focus:outline-none`}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Verify & Resend */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => triggerOtpVerification()}
                    disabled={loading || enteredOtpCount !== 6 || drsStatus === "verifying"}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading || drsStatus === "verifying" ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Running DRS Ball-Tracking...</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Verify OTP & Unlock Password Reset</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span>Didn't receive code?</span>
                    {resendCooldown > 0 ? (
                      <span className="font-mono font-bold text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Resend in {resendCooldown}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={loading}
                        className="text-[#059669] font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- STEP 3: SET NEW PASSWORD ----------------- */}
            {step === "SET_NEW_PASSWORD" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#059669] tracking-widest uppercase">
                    Step 3 • Security Update
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Create New Password
                  </h2>
                  <p className="text-sm text-slate-600">
                    Choose a strong, complex password to secure your player account.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-relaxed font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmReset} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError(null);
                        }}
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-11 py-3 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                          isPasswordMismatch
                            ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 ring-2 ring-rose-500/10"
                            : isPasswordMatch
                            ? "border-emerald-500 bg-emerald-50/30 focus:border-emerald-600 ring-2 ring-emerald-500/10"
                            : "bg-slate-50 border-slate-200 focus:bg-white focus:border-[#059669]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Real-time Mismatch / Match Trigger Alert */}
                    {isPasswordMismatch && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center space-x-1.5 pt-1 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Passwords do not match yet. Please ensure both fields are identical.</span>
                      </p>
                    )}
                    {isPasswordMatch && (
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1.5 pt-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Passwords match!</span>
                      </p>
                    )}
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Password Requirements Checklist
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.length ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.length ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.hasUpper ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>Uppercase letter (A-Z)</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.hasLower ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>Lowercase letter (a-z)</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.hasNumber ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>At least 1 number (0-9)</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${passwordChecks.hasSpecial ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                        {passwordChecks.hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span>Special character (!@#$)</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${
                        isPasswordMatch
                          ? "text-emerald-600 font-bold"
                          : isPasswordMismatch
                          ? "text-rose-600 font-bold"
                          : "text-slate-500"
                      }`}>
                        {isPasswordMatch ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <X className={`w-3.5 h-3.5 shrink-0 ${isPasswordMismatch ? "text-rose-500" : "text-slate-400"}`} />
                        )}
                        <span>
                          {isPasswordMismatch ? "Passwords do not match" : "Passwords match"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isPasswordValid}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </div>
                    ) : (
                      <>
                        <span>Confirm & Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ----------------- STEP 4: COMPLETED SUCCESS ----------------- */}
            {step === "COMPLETED" && (
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#059669] shadow-lg shadow-emerald-100">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Password Reset Complete!
                  </h2>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Your password has been successfully updated. You can now log into your Friends Turf player account with your new credentials.
                  </p>
                </div>

                <div className="pt-4">
                  <Link
                    to="/login"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security / Compliance Badge */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <div className="inline-flex items-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span>Protected by 256-Bit SSL Encryption • Real-Time DRS Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
