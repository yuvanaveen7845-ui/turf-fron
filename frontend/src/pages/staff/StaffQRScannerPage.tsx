import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Search,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Camera,
  RefreshCw,
  User,
  ShieldAlert,
  CreditCard,
  Check,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import api from "../../services/api";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button, Input, Modal, StatusBadge } from "../../components/ui";

export const StaffQRScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const prefillCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(prefillCode);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gate Analytics & Recent Logs
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Manual Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideBookingId, setOverrideBookingId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState("");

  const scannerRef = useRef<any>(null);

  // Audio cues
  const playFeedbackSound = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        // Success high chime
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Denial low double-beep
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio context not allowed or unsupported
    }
  };

  const triggerHaptic = (isSuccess: boolean) => {
    if ("vibrate" in navigator) {
      try {
        if (isSuccess) {
          navigator.vibrate(80);
        } else {
          navigator.vibrate([100, 50, 100]);
        }
      } catch (e) {}
    }
  };

  const fetchTelemetry = () => {
    api
      .get("/qr/analytics/")
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error("Failed to load gate analytics:", err));

    api
      .get("/qr/logs/")
      .then((res) => {
        setRecentLogs(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
      })
      .catch((err) => console.error("Failed to load logs:", err))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const executeValidation = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    setValidationResult(null);

    try {
      const res = await api.post("/qr/scan/", {
        qr_data: codeToVerify.trim(),
        method: "QR_SCAN",
      });

      setValidationResult(res.data);
      const isSuccess = res.data.valid && res.data.decision === "ALLOW";
      playFeedbackSound(isSuccess);
      triggerHaptic(isSuccess);
      fetchTelemetry();
    } catch (err: any) {
      const errData = err.response?.data;
      setValidationResult({
        valid: false,
        decision: "DENY",
        reason_code: "NETWORK_ERROR",
        title: "Validation Error",
        message: errData?.error || "Unable to reach server to verify pass.",
      });
      playFeedbackSound(false);
      triggerHaptic(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideBookingId.trim() || !overrideReason.trim()) {
      setOverrideError("Both booking reference and explicit reason are required.");
      return;
    }

    setOverrideLoading(true);
    setOverrideError("");

    try {
      const res = await api.post("/qr/override/", {
        booking_id: overrideBookingId.trim(),
        override_reason: overrideReason.trim(),
      });

      setValidationResult(res.data);
      setShowOverrideModal(false);
      setOverrideBookingId("");
      setOverrideReason("");
      playFeedbackSound(res.data.valid);
      triggerHaptic(res.data.valid);
      fetchTelemetry();
    } catch (err: any) {
      setOverrideError(
        err.response?.data?.error || "Failed to execute manual gate override."
      );
    } finally {
      setOverrideLoading(false);
    }
  };

  useEffect(() => {
    if (prefillCode) {
      executeValidation(prefillCode);
    }
  }, [prefillCode]);

  // Setup camera scanner
  useEffect(() => {
    if (scannerActive) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          // Debounce and stop active scanning
          scannerRef.current?.clear();
          setScannerActive(false);
          setInputCode(decodedText);
          executeValidation(decodedText);
        },
        () => {}
      );
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, [scannerActive]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeValidation(inputCode);
  };

  const resetScanner = () => {
    setValidationResult(null);
    setInputCode("");
    setScannerActive(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header & Sound Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Turnstile & Gate Control Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gate Optical Scanner & Admission
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Scan player Match Passes, verify slot validity, and record instant gate admissions.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            leftIcon={soundEnabled ? <Volume2 className="w-4 h-4 text-[#059669]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          >
            {soundEnabled ? "Audio On" : "Muted"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOverrideModal(true)}
            leftIcon={<ShieldAlert className="w-4 h-4 text-amber-600" />}
          >
            Manual Override
          </Button>
        </div>
      </div>

      {/* Live Gate Telemetry KPIs */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Today's Admitted
            </span>
            <p className="text-2xl font-black text-[#059669]">
              {analytics.checked_in_bookings || analytics.today_approved || 0}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">
              Verified players on turf
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Pending Arrivals
            </span>
            <p className="text-2xl font-black text-amber-600">
              {analytics.pending_checkins || 0}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">
              Expected at gate
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Total Scans
            </span>
            <p className="text-2xl font-black text-slate-900">
              {analytics.today_scans || 0}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">
              {analytics.approval_rate}% Approval Rate
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Duplicate Blocks
            </span>
            <p className={`text-2xl font-black ${analytics.duplicate_attempts > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {analytics.duplicate_attempts || 0}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">
              Replay attempts stopped
            </span>
          </div>
        </div>
      )}

      {/* Main Scanner Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-pitch-card">
        {/* Optical Camera Viewport Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Optical Camera Scanner
            </h3>
            <p className="text-xs text-slate-600">
              Use your device camera to scan player QR match passes instantaneously
            </p>
          </div>

          <Button
            type="button"
            variant={scannerActive ? "danger" : "primary"}
            size="md"
            onClick={() => setScannerActive(!scannerActive)}
            leftIcon={<Camera className="w-4 h-4" />}
          >
            {scannerActive ? "Stop Camera" : "Launch Camera Scanner"}
          </Button>
        </div>

        {/* Live Camera Scanner Box */}
        {scannerActive && (
          <div className="p-5 bg-slate-950 rounded-3xl border border-slate-800 space-y-3 text-center animate-in fade-in">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Camera active — Align match pass QR inside frame</span>
            </div>
            <div
              id="qr-reader"
              className="mx-auto rounded-2xl overflow-hidden max-w-sm border-2 border-emerald-500/50 shadow-2xl"
            />
          </div>
        )}

        {/* Manual Lookup Form */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Or Enter Booking Reference / Credential Code Manually
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. FT-20260915-ABCD1 or FT-PASS-..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#059669] transition-colors uppercase"
                />
              </div>

              <Button
                type="submit"
                disabled={!inputCode.trim() || loading}
                isLoading={loading}
                variant="primary"
                size="md"
                leftIcon={<Search className="w-4 h-4" />}
              >
                Validate & Check In
              </Button>
            </div>
          </div>
        </form>

        {/* Structured Validation Decision Banner */}
        {validationResult && (
          <div className="pt-2 animate-in fade-in zoom-in-95">
            {/* SUCCESS APPROVED STATE */}
            {validationResult.valid && validationResult.decision === "ALLOW" && (
              <div className="p-6 sm:p-7 rounded-3xl bg-[#ECFDF5] border-2 border-emerald-300 shadow-pitch-card space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center shadow-md shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#059669] block">
                        ADMISSION APPROVED
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        {validationResult.booking?.customer_name}
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-white text-[#059669] border border-emerald-200 text-xs font-black uppercase">
                    Admitted at {validationResult.booking?.checked_in_at || "Now"}
                  </span>
                </div>

                {/* Booking Spec Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-emerald-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Arena Pitch
                    </span>
                    <span className="font-bold text-slate-900">
                      {validationResult.booking?.turf_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Slot Timing
                    </span>
                    <span className="font-bold text-slate-900">
                      {validationResult.booking?.start_time} - {validationResult.booking?.end_time}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Booking Reference
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {validationResult.booking?.booking_id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Payment Status
                    </span>
                    <span className="font-bold text-[#059669]">
                      {validationResult.booking?.payment_status === "PAID" ? "100% Paid" : `Due: ₹${validationResult.booking?.balance_due}`}
                    </span>
                  </div>
                </div>

                {validationResult.payment_warning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{validationResult.payment_warning}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={resetScanner}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Scan Next Player
                  </Button>
                </div>
              </div>
            )}

            {/* ALREADY CHECKED IN DUPLICATE REJECTION */}
            {!validationResult.valid && validationResult.reason_code === "ALREADY_CHECKED_IN" && (
              <div className="p-6 sm:p-7 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-pitch-card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
                        DUPLICATE SCAN BLOCKED
                      </span>
                      <h3 className="text-xl font-black text-slate-900">
                        Already Admitted Earlier
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-white text-amber-800 border border-amber-200 text-xs font-black uppercase">
                    Duplicate Attempt
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {validationResult.message}
                </p>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetScanner}
                  >
                    Dismiss & Scan Next
                  </Button>
                </div>
              </div>
            )}

            {/* OUTSIDE TIME WINDOW */}
            {!validationResult.valid && validationResult.reason_code === "OUTSIDE_CHECKIN_WINDOW" && (
              <div className="p-6 sm:p-7 rounded-3xl bg-blue-50 border-2 border-blue-300 shadow-pitch-card space-y-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 block">
                      CHECK-IN NOT YET OPEN
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      Scheduled Match Session
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {validationResult.message}
                </p>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOverrideBookingId(validationResult.booking?.booking_id || "");
                      setShowOverrideModal(true);
                    }}
                  >
                    Early Entry Override
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={resetScanner}
                  >
                    Scan Next
                  </Button>
                </div>
              </div>
            )}

            {/* GENERIC REJECTION / CANCELLED / EXPIRED */}
            {!validationResult.valid &&
              !["ALREADY_CHECKED_IN", "OUTSIDE_CHECKIN_WINDOW"].includes(
                validationResult.reason_code
              ) && (
                <div className="p-6 sm:p-7 rounded-3xl bg-red-50 border-2 border-red-300 shadow-pitch-card space-y-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-800 block">
                        ADMISSION DENIED
                      </span>
                      <h3 className="text-xl font-black text-slate-900">
                        {validationResult.title || "Invalid Credential"}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {validationResult.message}
                  </p>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOverrideBookingId(inputCode);
                        setShowOverrideModal(true);
                      }}
                    >
                      Admin Override
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={resetScanner}
                    >
                      Scan Next
                    </Button>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Recent Admissions Activity Stream */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-pitch-card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Recent Gate Check-In Feed
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Live Gate Telemetry
          </span>
        </div>

        {logsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No gate admissions logged yet today.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    log.decision === "ALLOW" ? "bg-emerald-100 text-[#059669]" : "bg-red-100 text-red-600"
                  }`}>
                    {log.decision === "ALLOW" ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{log.customer_name}</p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      {log.booking_id} • {log.turf_name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    {log.check_in_time}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${
                    log.decision === "ALLOW" ? "text-[#059669]" : "text-red-600"
                  }`}>
                    {log.reason_code.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Override Dialog */}
      <Modal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title="Execute Manual Gate Override"
      >
        <form onSubmit={handleExecuteOverride} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Manual overrides bypass time and credential checks under administrative discretion. Every override is permanently logged with your staff ID and timestamp.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Booking Reference
            </label>
            <input
              type="text"
              required
              value={overrideBookingId}
              onChange={(e) => setOverrideBookingId(e.target.value)}
              placeholder="e.g. FT-20260915-XXXXX"
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-[#059669] outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Override Justification Reason
            </label>
            <textarea
              required
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Approved 15 minutes early entry by Turf Admin for corporate warmup..."
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#059669] outline-none"
            />
          </div>

          {overrideError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {overrideError}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowOverrideModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={overrideLoading}
            >
              Authorize Gate Admission
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
