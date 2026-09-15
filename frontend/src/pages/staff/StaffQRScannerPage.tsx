import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  QrCode,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Search,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Camera,
} from "lucide-react";
import api from "../../services/api";
import { Html5QrcodeScanner } from "html5-qrcode";

export const StaffQRScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const prefillCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(prefillCode);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [gateNotes, setGateNotes] = useState("Gate 1 Main Entry");

  const executeValidation = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/qr/scan/", {
        qr_data: codeToVerify.trim(),
        notes: gateNotes,
      });
      setValidationResult(res.data);
    } catch (err: any) {
      setValidationResult({
        status: "INVALID",
        title: "Validation Error",
        message: err.response?.data?.error || "Unable to verify code.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prefillCode) {
      executeValidation(prefillCode);
    }
  }, [prefillCode]);

  // Setup camera scanner
  useEffect(() => {
    let scanner: any = null;
    if (scannerActive) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false,
      );

      scanner.render(
        (decodedText: string) => {
          scanner.clear();
          setScannerActive(false);
          setInputCode(decodedText);
          executeValidation(decodedText);
        },
        (error: any) => {
          // ignore frame scan errors
        },
      );
    }

    return () => {
      if (scanner) {
        try {
          scanner.clear();
        } catch (e) {}
      }
    };
  }, [scannerActive]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeValidation(inputCode);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-1 border border-emerald-500/40">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Gate Access & QR Scanner
        </h1>
        <p className="text-xs text-slate-400">
          Scan customer match pass or enter Booking ID to verify entry and
          prevent duplicate entries
        </p>
      </div>

      {/* Camera vs Manual Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        {/* Toggle Camera button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Scanner Controls
          </span>
          <button
            onClick={() => setScannerActive(!scannerActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              scannerActive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>
              {scannerActive ? "Turn Off Camera" : "Start Camera Scanner"}
            </span>
          </button>
        </div>

        {/* Live Camera Scanner Element */}
        {scannerActive && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/40 space-y-3 text-center">
            <p className="text-xs font-bold text-emerald-400">
              Position the QR Code in the frame below
            </p>
            <div
              id="qr-reader"
              className="mx-auto rounded-xl overflow-hidden max-w-sm"
            />
          </div>
        )}

        {/* Manual Input Form */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Booking ID or QR Token Manually
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. FT-20260915-XXXXX or TKT-XXXXXX"
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-sm text-white uppercase placeholder-slate-500 focus:border-emerald-500 outline-none"
              />
              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs disabled:opacity-50 transition-colors"
              >
                {loading ? "Checking..." : "Validate Pass"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Validation Result Screen */}
      {validationResult && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border animate-in fade-in zoom-in-95 space-y-6 ${
            validationResult.status === "VALID"
              ? "bg-emerald-950/70 border-emerald-500/80 shadow-2xl shadow-emerald-500/20"
              : validationResult.status === "ALREADY_USED"
                ? "bg-amber-950/70 border-amber-500/80 shadow-2xl shadow-amber-500/20"
                : "bg-red-950/70 border-red-500/80 shadow-2xl shadow-red-500/20"
          }`}
        >
          {/* Status Header */}
          <div className="flex items-center space-x-3">
            {validationResult.status === "VALID" && (
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950">
                <CheckCircle className="w-7 h-7" />
              </div>
            )}
            {validationResult.status === "ALREADY_USED" && (
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950">
                <AlertTriangle className="w-7 h-7" />
              </div>
            )}
            {(validationResult.status === "INVALID" ||
              validationResult.status === "EXPIRED") && (
              <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white">
                <XCircle className="w-7 h-7" />
              </div>
            )}

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {validationResult.title}
              </h2>
              <p
                className={`text-xs font-semibold ${
                  validationResult.status === "VALID"
                    ? "text-emerald-300"
                    : validationResult.status === "ALREADY_USED"
                      ? "text-amber-300"
                      : "text-red-300"
                }`}
              >
                {validationResult.message}
              </p>
            </div>
          </div>

          {/* Booking Info if provided */}
          {validationResult.booking && (
            <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Booking Reference
                  </span>
                  <p className="text-sm font-black font-mono text-white mt-0.5">
                    {validationResult.booking.booking_id}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Player Name
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {validationResult.booking.customer_name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Pitch
                  </span>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5">
                    {validationResult.booking.turf_name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Match Time
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {validationResult.booking.start_time ||
                      validationResult.booking.time}
                  </p>
                </div>
              </div>

              {validationResult.payment_warning && (
                <div className="p-3 bg-amber-950 border border-amber-800 rounded-xl text-amber-300 font-bold">
                  {validationResult.payment_warning}
                </div>
              )}
            </div>
          )}

          {/* Reset / Next scan button */}
          <button
            onClick={() => {
              setValidationResult(null);
              setInputCode("");
            }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
          >
            Ready for Next Player / Scan Again
          </button>
        </div>
      )}
    </div>
  );
};
