import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api";
import { Button, StatusBadge } from "../ui";

interface RapidScannerEmbedProps {
  initialCode?: string;
  onCheckInSuccess?: (result: any) => void;
}

export const RapidScannerEmbed: React.FC<RapidScannerEmbedProps> = ({
  initialCode = "",
  onCheckInSuccess,
}) => {
  const [inputCode, setInputCode] = useState(initialCode);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("ft_scanner_sound") !== "false";
  });
  const [collectingBalance, setCollectingBalance] = useState(false);

  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const cooldownRef = useRef(false);

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
        reference_note: `Collected ${paymentMethod} at rapid scanner turnstile`,
      });
      setValidationResult(res.data);
      playFeedbackSound(true);
      if (onCheckInSuccess) onCheckInSuccess(res.data);
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          "Failed to record balance collection."
      );
    } finally {
      setCollectingBalance(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
      handleValidate(initialCode);
    }
  }, [initialCode]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("ft_scanner_sound", String(next));
  };

  const playFeedbackSound = useCallback((isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
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
      // Audio not permitted or unavailable
    }
  }, [soundEnabled]);

  const handleValidate = async (rawCode?: string) => {
    const code = (rawCode !== undefined ? rawCode : inputCode).trim();
    if (!code) return;

    setLoading(true);
    setValidationResult(null);

    try {
      const res = await api.post("/qr/scan/", {
        ticket_code: code,
        gate_id: "MAIN_GATE",
      });

      const payload = res.data;
      setValidationResult({
        ...payload,
        status: payload.status || "VALID",
      });

      playFeedbackSound(true);
      if (onCheckInSuccess) onCheckInSuccess(payload);
    } catch (err: any) {
      playFeedbackSound(false);
      const errData = err.response?.data;
      setValidationResult({
        status: "INVALID",
        message: errData?.error || errData?.message || "Invalid or unrecognized ticket code.",
        details: errData?.details || {},
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError("");
    setCameraLoading(true);
    setScannerActive(true);

    try {
      if (scannerInstanceRef.current && isScanningRef.current) {
        await scannerInstanceRef.current.stop();
        isScanningRef.current = false;
      }

      // Small delay to ensure container is rendered and unhidden in DOM
      setTimeout(async () => {
        try {
          const container = document.getElementById("embed-qr-reader-container");
          if (!container) {
            setCameraLoading(false);
            return;
          }

          const html5QrCode = new Html5Qrcode("embed-qr-reader-container");
          scannerInstanceRef.current = html5QrCode;

          const scanConfig = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          const onScanSuccess = (decodedText: string) => {
            if (cooldownRef.current) return;
            cooldownRef.current = true;
            setInputCode(decodedText);
            handleValidate(decodedText);
            setTimeout(() => {
              cooldownRef.current = false;
            }, 2500);
          };

          const onScanError = () => {};

          // Try 1: Environment facing (back)
          let started = false;
          try {
            await html5QrCode.start(
              { facingMode: "environment" },
              scanConfig,
              onScanSuccess,
              onScanError
            );
            started = true;
          } catch (envErr) {
            console.warn("Rapid scanner: environment camera not available, checking devices...", envErr);
          }

          // Try 2: Enumerate devices
          if (!started) {
            try {
              const cameras = await Html5Qrcode.getCameras();
              if (cameras && cameras.length > 0) {
                const backCam = cameras.find((c) => /back|rear|environment/i.test(c.label));
                const targetId = backCam ? backCam.id : cameras[0].id;
                await html5QrCode.start(targetId, scanConfig, onScanSuccess, onScanError);
                started = true;
              }
            } catch (camErr) {
              console.warn("Rapid scanner: camera listing failed, trying user camera...", camErr);
            }
          }

          // Try 3: User facing camera (laptop / desktop webcam)
          if (!started) {
            await html5QrCode.start(
              { facingMode: "user" },
              scanConfig,
              onScanSuccess,
              onScanError
            );
          }

          isScanningRef.current = true;
          setCameraLoading(false);
        } catch (err: any) {
          console.error("Camera start error in RapidScanner:", err);
          const msg =
            err?.name === "NotAllowedError" || String(err).includes("Permission")
              ? "Camera permission denied. Please allow camera access in browser settings."
              : err?.name === "NotFoundError" || String(err).includes("NotFound")
              ? "No camera found on this device."
              : "Failed to start camera. Please check browser permissions.";
          setCameraError(msg);
          setScannerActive(false);
          setCameraLoading(false);
        }
      }, 100);
    } catch (err: any) {
      setCameraError(err.message || "Failed to start camera. Please check browser permissions.");
      setScannerActive(false);
      setCameraLoading(false);
    }
  };

  const stopCamera = async () => {
    if (scannerInstanceRef.current && isScanningRef.current) {
      try {
        await scannerInstanceRef.current.stop();
        scannerInstanceRef.current.clear();
      } catch (e) {
        console.error("Error stopping camera", e);
      } finally {
        scannerInstanceRef.current = null;
        isScanningRef.current = false;
      }
    }
    setScannerActive(false);
    setCameraLoading(false);
  };

  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current && isScanningRef.current) {
        scannerInstanceRef.current.stop().catch(() => {});
        isScanningRef.current = false;
      }
    };
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#059669]">
              <QrCode className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Rapid Gate Check-In & Scanner
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan player QR code or enter booking reference / 4-digit PIN
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              soundEnabled
                ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>

          {!scannerActive ? (
            <Button
              size="sm"
              onClick={startCamera}
              isLoading={cameraLoading}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Open Camera
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={stopCamera}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Stop Camera
            </Button>
          )}
        </div>
      </div>

      {/* Camera Video Viewport */}
      <div className={scannerActive ? "block" : "hidden"}>
        <div className="relative max-w-md mx-auto aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-[#059669] shadow-inner flex items-center justify-center">
          {cameraLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 text-emerald-400 text-xs z-10 p-4">
              <p className="flex items-center space-x-2 animate-pulse font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Opening optical camera...</span>
              </p>
            </div>
          )}
          <div id="embed-qr-reader-container" className="w-full h-full" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-dashed border-emerald-400/80 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>

      {cameraError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Manual Code Entry */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleValidate();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter 4-digit PIN, Booking ID (e.g. FT-1042) or scan QR..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
          />
        </div>
        <Button type="submit" isLoading={loading} leftIcon={<Check className="w-4 h-4" />}>
          Verify & Admit
        </Button>
      </form>

      {/* Result Card */}
      {validationResult && (
        <div
          className={`p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
            validationResult.status === "VALID" || validationResult.status === "SUCCESS" || validationResult.decision === "ALLOW"
              ? "bg-emerald-50 border-emerald-300 text-slate-900"
              : validationResult.reason_code === "BALANCE_DUE" || validationResult.can_collect_balance
              ? "bg-amber-50 border-amber-300 text-slate-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              {validationResult.status === "VALID" || validationResult.status === "SUCCESS" || validationResult.decision === "ALLOW" ? (
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : validationResult.reason_code === "BALANCE_DUE" || validationResult.can_collect_balance ? (
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CreditCard className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="font-black text-lg leading-tight">
                  {validationResult.status === "VALID" || validationResult.status === "SUCCESS" || validationResult.decision === "ALLOW"
                    ? "VALID PASS — ENTRY APPROVED"
                    : validationResult.reason_code === "BALANCE_DUE" || validationResult.can_collect_balance
                    ? `PENDING BALANCE (₹${validationResult.balance_due || validationResult.booking?.balance_due || 0})`
                    : "CHECK-IN REJECTED"}
                </h4>
                <p className="text-xs font-semibold opacity-90 mt-0.5">
                  {validationResult.message || "Match pass processed."}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setValidationResult(null);
                setInputCode("");
              }}
              className="text-xs font-bold opacity-60 hover:opacity-100 underline cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Details Row */}
          {(validationResult.booking_details || validationResult.booking) && (
            <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Player</p>
                <p className="font-extrabold text-slate-900">
                  {validationResult.booking_details?.customer_name || validationResult.booking?.customer_name || "Squad Captain"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Pitch Arena</p>
                <p className="font-extrabold text-slate-900">
                  {validationResult.booking_details?.turf_name || validationResult.booking?.turf_name}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Match Slot</p>
                <p className="font-extrabold text-slate-900">
                  {validationResult.booking_details?.start_time || validationResult.booking?.start_time} - {validationResult.booking_details?.end_time || validationResult.booking?.end_time}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Balance Due</p>
                <p className="font-extrabold text-amber-700">
                  ₹{Number(validationResult.balance_due || validationResult.booking_details?.balance_due || validationResult.booking?.balance_due || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}

          {/* Balance Collection Quick Actions */}
          {(validationResult.reason_code === "BALANCE_DUE" || validationResult.can_collect_balance) && (
            <div className="mt-4 pt-4 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-900">
                Collect balance to complete admission:
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={collectingBalance}
                  isLoading={collectingBalance}
                  onClick={() =>
                    handleCollectBalanceAndAdmit(
                      validationResult.booking?.booking_id || validationResult.booking_details?.booking_id || inputCode,
                      "CASH"
                    )
                  }
                  className="bg-[#059669] hover:bg-[#047857]"
                >
                  💵 Cash & Admit
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={collectingBalance}
                  isLoading={collectingBalance}
                  onClick={() =>
                    handleCollectBalanceAndAdmit(
                      validationResult.booking?.booking_id || validationResult.booking_details?.booking_id || inputCode,
                      "UPI"
                    )
                  }
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  📱 UPI & Admit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
