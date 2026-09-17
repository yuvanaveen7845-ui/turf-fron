import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Search,
  Clock,
  MapPin,
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
  Upload,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api";
import { Button, Modal, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useGateRealtime } from "../../hooks/useRealtime";

export const StaffQRScannerPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdminView = location.pathname.startsWith("/admin") || user?.role === "ADMIN";

  const [searchParams, setSearchParams] = useSearchParams();
  const prefillCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(prefillCode);

  const [collectingBalance, setCollectingBalance] = useState(false);

  // 1-Click Collect Balance & Admit at Gate
  const handleCollectBalanceAndAdmit = async (
    bookingId: string,
    paymentMethod: "CASH" | "UPI" | "OFFLINE" = "CASH"
  ) => {
    if (!bookingId) return;
    setCollectingBalance(true);
    try {
      const res = await api.post("/qr/collect-balance-and-admit/", {
        booking_id: bookingId,
        payment_method: paymentMethod,
        reference_note: `Collected ${paymentMethod} by gate turnstile staff`,
      });
      setValidationResult(res.data);
      playFeedbackSound(true);
      triggerHaptic(true);
      fetchTelemetry();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          "Failed to record balance collection. Please try manual override."
      );
    } finally {
      setCollectingBalance(false);
    }
  };

  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("ft_scanner_sound") !== "false";
  });

  // Telemetry KPIs & Recent Activity
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Manual Override Dialog
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideBookingId, setOverrideBookingId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState("");

  // File upload scanning
  const [fileScanLoading, setFileScanLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // References to handle scanner lifecycle safely
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const cooldownRef = useRef(false);

  // Toggle sound & save preference
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("ft_scanner_sound", String(next));
  };

  // Safe Audio Feedback
  const playFeedbackSound = useCallback((isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio autoplay policy or device without audio
    }
  }, [soundEnabled]);

  const triggerHaptic = useCallback((isSuccess: boolean) => {
    if ("vibrate" in navigator) {
      try {
        if (isSuccess) {
          navigator.vibrate(80);
        } else {
          navigator.vibrate([100, 50, 100]);
        }
      } catch {}
    }
  }, []);

  const fetchTelemetry = useCallback(() => {
    api
      .get("/qr/analytics/")
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error("Failed to load gate analytics:", err));

    api
      .get("/qr/logs/")
      .then((res) => {
        setRecentLogs(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
      })
      .catch((err) => console.error("Failed to load logs:", err))
      .finally(() => setLogsLoading(false));
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Real-time listener for check-ins across the venue
  useGateRealtime(() => {
    fetchTelemetry();
  });

  // Core validation runner
  const executeValidation = async (codeToVerify: string, method = "QR_SCAN") => {
    const trimmed = (codeToVerify || "").trim();
    if (!trimmed) return;

    setLoading(true);
    setValidationResult(null);

    try {
      const res = await api.post("/qr/scan/", {
        qr_data: trimmed,
        method,
      });

      const data = res.data;
      setValidationResult(data);
      const isSuccess = data.valid && data.decision === "ALLOW";
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

  // Safe Camera Stop
  const stopCamera = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current.clear();
      } catch (e) {
        console.warn("Camera cleanup notice:", e);
      } finally {
        scannerInstanceRef.current = null;
        isScanningRef.current = false;
      }
    }
    setScannerActive(false);
    setCameraLoading(false);
  };

  // Safe Camera Start
  const startCamera = async () => {
    setCameraError("");
    setCameraLoading(true);

    try {
      // First ensure previous session is cleaned up
      await stopCamera();

      setScannerActive(true);

      // Brief delay to ensure DOM element #friends-turf-qr-reader is mounted
      setTimeout(async () => {
        try {
          const readerEl = document.getElementById("friends-turf-qr-reader");
          if (!readerEl) {
            setCameraLoading(false);
            return;
          }

          const html5Qr = new Html5Qrcode("friends-turf-qr-reader");
          scannerInstanceRef.current = html5Qr;

          await html5Qr.start(
            { facingMode: "environment" },
            {
              fps: 12,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText: string) => {
              if (cooldownRef.current) return;
              cooldownRef.current = true;

              // Immediately pause/stop camera on successful scan
              stopCamera();
              setInputCode(decodedText);
              executeValidation(decodedText, "CAMERA_SCAN");

              // Cooldown timer
              setTimeout(() => {
                cooldownRef.current = false;
              }, 1500);
            },
            () => {
              // Frame parse ignore
            }
          );

          isScanningRef.current = true;
          setCameraLoading(false);
        } catch (err: any) {
          console.error("Camera start error:", err);
          const msg =
            err?.name === "NotAllowedError" || String(err).includes("Permission")
              ? "Camera permission denied by browser. Please allow camera access in your browser settings, or enter the booking code manually."
              : err?.name === "NotFoundError" || String(err).includes("NotFound")
              ? "No camera device detected. Enter the booking code manually or upload a QR image."
              : "Unable to start optical scanner. Please check device permissions.";
          setCameraError(msg);
          await stopCamera();
        }
      }, 150);
    } catch (e: any) {
      setCameraError(e?.message || "Failed to initialize optical device.");
      setScannerActive(false);
      setCameraLoading(false);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (scannerActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        try {
          if (isScanningRef.current) {
            scannerInstanceRef.current.stop().catch(() => {});
          }
          scannerInstanceRef.current.clear();
        } catch {}
      }
    };
  }, []);

  // Handle image file scan
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanLoading(true);
    setCameraError("");

    try {
      // Create temporary scanner instance for file
      const tempScanner = new Html5Qrcode("friends-turf-qr-reader-file-temp");
      const decodedText = await tempScanner.scanFile(file, false);
      tempScanner.clear();

      setInputCode(decodedText);
      executeValidation(decodedText, "IMAGE_UPLOAD");
    } catch (err: any) {
      setCameraError(
        "Could not detect a valid QR code in the selected image. Please ensure the QR is clearly visible, or enter the code manually."
      );
    } finally {
      setFileScanLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Manual Form Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    executeValidation(inputCode, "MANUAL_ENTRY");
  };

  // Manual Override Action
  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideBookingId.trim() || !overrideReason.trim()) {
      setOverrideError("Both booking reference and explicit justification are required.");
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
        err.response?.data?.error || "Failed to execute gate override."
      );
    } finally {
      setOverrideLoading(false);
    }
  };

  // Handle prefilled code in URL
  useEffect(() => {
    if (prefillCode) {
      executeValidation(prefillCode, "DEEP_LINK");
      setSearchParams({}, { replace: true });
    }
  }, [prefillCode, setSearchParams]);

  // Reset Scanner for next player
  const resetScanner = () => {
    setValidationResult(null);
    setInputCode("");
    setCameraError("");
    startCamera();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Hidden container for temp file scan */}
      <div id="friends-turf-qr-reader-file-temp" className="hidden" />

      {/* Top Header & Context Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isAdminView ? "Admin Access & Gate Terminal" : "Ground Operations Gate Terminal"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Gate Optical Scanner & Admission</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Scan Match Passes via device camera, upload pass images, or enter booking reference for instant turnstile verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            leftIcon={
              soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#059669]" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )
            }
          >
            {soundEnabled ? "Audio Cues On" : "Muted"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setOverrideBookingId(inputCode || "");
              setOverrideError("");
              setShowOverrideModal(true);
            }}
            leftIcon={<ShieldAlert className="w-4 h-4 text-amber-600" />}
          >
            Manual Override
          </Button>

          {isAdminView && (
            <Link
              to="/admin/qr-management"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-xs transition"
            >
              <QrCode className="w-3.5 h-3.5 text-[#059669]" />
              <span>Gate Logs & Passes</span>
            </Link>
          )}
        </div>
      </div>

      {/* Live Telemetry KPIs */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
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

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Pending Arrivals
            </span>
            <p className="text-2xl font-black text-amber-600">
              {analytics.pending_checkins || 0}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">
              Expected at gate today
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Total Scans
            </span>
            <p className="text-2xl font-black text-slate-900">
              {analytics.total_scans_today || 0}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">
              Admissions + Denials
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Duplicate Blocked
            </span>
            <p className="text-2xl font-black text-rose-600">
              {analytics.denied_scans_today || 0}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">
              Fraud & re-entry blocked
            </span>
          </div>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-pitch-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Optical Pass Detection
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Scan customer match pass QR code using device camera, or upload a pass screenshot
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={fileScanLoading}
              isLoading={fileScanLoading}
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4 text-slate-600" />}
            >
              Upload QR Image
            </Button>

            <Button
              type="button"
              variant={scannerActive ? "danger" : "primary"}
              size="md"
              disabled={cameraLoading}
              isLoading={cameraLoading}
              onClick={toggleCamera}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              {scannerActive ? "Stop Camera" : "Launch Camera Scanner"}
            </Button>
          </div>
        </div>

        {/* Camera Permission / Device Error Banner */}
        {cameraError && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Camera Scanner Notice</p>
              <p className="text-amber-800 mt-0.5">{cameraError}</p>
            </div>
            <button
              onClick={() => setCameraError("")}
              className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Live Camera Scanner Box */}
        {scannerActive && (
          <div className="p-5 bg-slate-950 rounded-3xl border border-slate-800 space-y-3 text-center animate-in fade-in">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Camera active — Align match pass QR inside target frame</span>
            </div>

            <div
              id="friends-turf-qr-reader"
              className="mx-auto rounded-2xl overflow-hidden max-w-sm border-2 border-emerald-500/50 shadow-2xl bg-black min-h-[260px] flex items-center justify-center text-slate-500 text-xs"
            >
              {cameraLoading && <p className="animate-pulse">Initializing camera stream...</p>}
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                Hold phone or printed ticket steady in front of lens
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
              >
                Close Camera
              </button>
            </div>
          </div>
        )}

        {/* Manual Lookup Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Or Enter Booking Reference Code Manually
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. FT-20260915-ABCD1 or paste QR link"
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
                Validate & Admit
              </Button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Accepts Booking Reference (with or without #), Pass Tokens, or Confirmation URLs
            </span>
          </div>
        </form>

        {/* Validation Result Decision Banner */}
        {validationResult && (
          <div className="pt-2 animate-in fade-in zoom-in-95">
            {/* SUCCESS APPROVED STATE */}
            {validationResult.valid && validationResult.decision === "ALLOW" && (
              <div className="p-6 sm:p-7 rounded-3xl bg-[#ECFDF5] border-2 border-emerald-300 shadow-pitch-card space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center shadow-md shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#059669] block">
                        ADMISSION APPROVED • {validationResult.reason_code === "MANUAL_OVERRIDE" ? "OVERRIDE" : "VERIFIED"}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        {validationResult.booking?.customer_name || validationResult.customer_name}
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-white text-[#059669] border border-emerald-200 text-xs font-black uppercase self-start">
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
                      {validationResult.booking?.turf_name || validationResult.turf_name}
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
                      #{validationResult.booking?.booking_id || validationResult.booking_id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Payment Status
                    </span>
                    <span
                      className={`font-bold ${
                        validationResult.booking?.payment_status === "PAID"
                          ? "text-[#059669]"
                          : "text-amber-600"
                      }`}
                    >
                      {validationResult.booking?.payment_status || "PAID"}
                      {validationResult.booking?.balance_due > 0 &&
                        ` (₹${validationResult.booking.balance_due} due)`}
                    </span>
                  </div>
                </div>

                {/* Balance Due Warning Banner */}
                {validationResult.payment_warning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{validationResult.payment_warning}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-emerald-800 font-semibold">
                    Turnstile gate unlatched. Player admitted to pitch area.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={resetScanner}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Scan Next Player
                  </Button>
                </div>
              </div>
            )}

            {/* DUPLICATE ALREADY SCANNED */}
            {!validationResult.valid && validationResult.reason_code === "ALREADY_CHECKED_IN" && (
              <div className="p-6 sm:p-7 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-pitch-card space-y-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
                      DUPLICATE ENTRY DETECTED
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      Already Checked In
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {validationResult.message}
                </p>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOverrideBookingId(validationResult.booking?.booking_id || inputCode);
                      setShowOverrideModal(true);
                    }}
                  >
                    Force Re-Admission
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetScanner}
                  >
                    Scan Next
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
                      Early Arrival Session
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {validationResult.message}
                </p>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOverrideBookingId(validationResult.booking?.booking_id || inputCode);
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

            {/* PENDING BALANCE DUE / ADVANCE DEPOSIT PAID */}
            {!validationResult.valid &&
              (validationResult.reason_code === "BALANCE_DUE" ||
                validationResult.can_collect_balance) && (
                <div className="p-6 sm:p-7 rounded-3xl bg-amber-50/90 border-2 border-amber-400 shadow-pitch-card space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 block">
                          PENDING BALANCE • QR LOCKED UNTIL SETTLED
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                          ₹{Number(validationResult.balance_due || validationResult.booking?.balance_due || 0).toLocaleString("en-IN")} Remaining Due
                        </h3>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300 text-xs font-black uppercase self-start">
                      Advance Deposit Confirmed
                    </span>
                  </div>

                  {/* Booking & Financial Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/90 rounded-2xl border border-amber-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Customer
                      </span>
                      <span className="font-bold text-slate-900">
                        {validationResult.booking?.customer_name || validationResult.customer_name || "Player"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Arena Pitch
                      </span>
                      <span className="font-bold text-slate-900">
                        {validationResult.booking?.turf_name || validationResult.turf_name}
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
                        Total / Balance
                      </span>
                      <span className="font-black text-amber-700">
                        ₹{Number(validationResult.balance_due || 0).toLocaleString("en-IN")} due
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    {validationResult.message ||
                      "Player paid the advance deposit to confirm slot. Collect the remaining balance at desk/turnstile to complete admission."}
                  </p>

                  {/* 1-Click Settlement & Admission Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200">
                    <span className="text-xs text-amber-950 font-bold">
                      Select collection method to unlock match pass & admit:
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={collectingBalance}
                        isLoading={collectingBalance}
                        onClick={() =>
                          handleCollectBalanceAndAdmit(
                            validationResult.booking?.booking_id || inputCode,
                            "CASH"
                          )
                        }
                        className="bg-[#059669] hover:bg-[#047857]"
                      >
                        💵 Collect ₹{Number(validationResult.balance_due || 0).toLocaleString("en-IN")} Cash & Admit
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={collectingBalance}
                        isLoading={collectingBalance}
                        onClick={() =>
                          handleCollectBalanceAndAdmit(
                            validationResult.booking?.booking_id || inputCode,
                            "UPI"
                          )
                        }
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        📱 Collect ₹{Number(validationResult.balance_due || 0).toLocaleString("en-IN")} UPI & Admit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOverrideBookingId(validationResult.booking?.booking_id || inputCode);
                          setShowOverrideModal(true);
                        }}
                      >
                        Waive / Override
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetScanner}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            {/* GENERIC REJECTION / CANCELLED / EXPIRED */}
            {!validationResult.valid &&
              !["ALREADY_CHECKED_IN", "OUTSIDE_CHECKIN_WINDOW", "BALANCE_DUE"].includes(
                validationResult.reason_code
              ) && !validationResult.can_collect_balance && (
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

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
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
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900">
              Recent Gate Admissions Feed
            </h3>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          {isAdminView ? (
            <Link
              to="/admin/qr-management"
              className="text-xs text-[#059669] hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/staff/logs"
              className="text-xs text-[#059669] hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Shift Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {logsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No gate admissions recorded yet today.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      log.decision === "ALLOW"
                        ? "bg-emerald-100 text-[#059669]"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {log.decision === "ALLOW" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{log.customer_name || "Player"}</p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      #{log.booking_id} • {log.turf_name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    {log.check_in_time}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      log.decision === "ALLOW" ? "text-[#059669]" : "text-red-600"
                    }`}
                  >
                    {log.reason_code ? log.reason_code.replace(/_/g, " ") : log.decision}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      <Modal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title="Execute Manual Gate Override"
      >
        <form onSubmit={handleExecuteOverride} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Manual overrides bypass time, facility, and duplicate admission checks under authorized discretion. Every override is permanently recorded in the immutable audit log with your operator ID and reason.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Booking Reference Code
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
              placeholder="e.g. Early arrival approved by Operations Manager for tournament warmup..."
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
