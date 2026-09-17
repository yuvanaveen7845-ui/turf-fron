import React, { useEffect, useState, useRef } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, Radio, Activity, Eye } from "lucide-react";

export type DRSStatus = "idle" | "verifying" | "success" | "error";

interface CricketDRSProps {
  status: DRSStatus;
  otpLength?: number;
  enteredCount?: number;
  attemptsLeft?: number;
  errorMessage?: string;
  onAnimationComplete?: () => void;
}

export const CricketDRSVerificationAnimation: React.FC<CricketDRSProps> = ({
  status,
  otpLength = 6,
  enteredCount = 0,
  attemptsLeft,
  errorMessage,
  onAnimationComplete,
}) => {
  const [frame, setFrame] = useState(0);
  const [bailsFlew, setBailsFlew] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Oscillograph / UltraEdge wave simulation
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;
    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      ctx.lineWidth = 2;
      ctx.strokeStyle =
        status === "success"
          ? "#10B981"
          : status === "error"
          ? "#EF4444"
          : status === "verifying"
          ? "#38BDF8"
          : "#64748B";

      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        let amp = 2;
        let freq = 0.05;

        if (status === "verifying") {
          // Dynamic spike in the middle to simulate ultra-edge snicko spike
          const distFromCenter = Math.abs(x - width / 2);
          const spike = Math.max(0, 1 - distFromCenter / 40);
          amp = 4 + spike * 18 * Math.sin(offset * 0.2 + x * 0.15);
          freq = 0.08;
        } else if (status === "success") {
          amp = 6 * Math.sin((x + offset * 2) * 0.04);
        } else if (status === "error") {
          amp = 8 * Math.sin((x + offset * 3) * 0.1) * (Math.random() > 0.8 ? 1.5 : 1);
        }

        const y = midY + Math.sin(x * freq + offset) * amp;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      offset += 0.12;
      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [status]);

  // Handle bails flying on success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setBailsFlew(true);
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 1200);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setBailsFlew(false);
    }
  }, [status, onAnimationComplete]);

  // Ball progress tracking (0 to 100%)
  const ballProgress =
    status === "verifying"
      ? 85
      : status === "success"
      ? 100
      : status === "error"
      ? 92
      : Math.min(100, Math.round((enteredCount / otpLength) * 75));

  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-4 sm:p-5 text-white font-sans select-none">
      {/* Background Stadium Floodlight Effects */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Top DRS Broadcast Header HUD */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "success"
                  ? "bg-emerald-400"
                  : status === "error"
                  ? "bg-rose-400"
                  : status === "verifying"
                  ? "bg-cyan-400"
                  : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                status === "success"
                  ? "bg-emerald-500"
                  : status === "error"
                  ? "bg-rose-500"
                  : status === "verifying"
                  ? "bg-cyan-500"
                  : "bg-amber-500"
              }`}
            />
          </span>
          <div className="flex items-center space-x-1.5 font-mono">
            <span className="font-black tracking-wider text-white text-[11px] uppercase bg-white/10 px-2 py-0.5 rounded">
              DRS 3.0
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:inline">
              Third Umpire Review
            </span>
          </div>
        </div>

        {/* Telemetry Status Pill */}
        <div
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 border transition-all duration-300 ${
            status === "success"
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : status === "error"
              ? "bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              : status === "verifying"
              ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 animate-pulse"
              : "bg-slate-800/80 text-slate-300 border-slate-700"
          }`}
        >
          {status === "verifying" && <Radio className="w-3 h-3 animate-spin text-cyan-400" />}
          {status === "success" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          {status === "error" && <AlertTriangle className="w-3 h-3 text-rose-400" />}
          <span>
            {status === "idle" && `${enteredCount}/${otpLength} Digits Ready`}
            {status === "verifying" && "Reviewing Ball Track..."}
            {status === "success" && "DECISION: SAFE / VERIFIED"}
            {status === "error" && "DECISION: OUT / INVALID"}
          </span>
        </div>
      </div>

      {/* Main Visual Arena: Pitch & Stumps Interactive Canvas */}
      <div className="relative z-10 py-5 flex flex-col items-center justify-center">
        {/* Pitch Viewport */}
        <div className="w-full max-w-sm h-36 sm:h-40 relative rounded-xl bg-gradient-to-b from-[#14532d]/40 via-[#064e3b]/30 to-slate-900 border border-emerald-500/20 overflow-hidden flex flex-col justify-end items-center shadow-inner">
          {/* Pitch Strip Lines (Perspective) */}
          <div className="absolute inset-x-8 sm:inset-x-12 bottom-0 top-6 bg-gradient-to-b from-[#ca8a04]/10 via-[#ca8a04]/20 to-[#ca8a04]/30 [clip-path:polygon(30%_0%,70%_0%,90%_100%,10%_100%)] border-x border-amber-400/20 pointer-events-none" />

          {/* Popping Crease Line */}
          <div className="absolute bottom-8 w-3/4 h-[2px] bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <div className="absolute bottom-4 w-1/2 h-[1px] bg-white/30" />

          {/* Ball Trajectory SVG Line & Glowing Ball */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              {/* Trajectory gradient */}
              <linearGradient id="ballTrail" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
                <stop
                  offset="100%"
                  stopColor={
                    status === "success"
                      ? "#10B981"
                      : status === "error"
                      ? "#EF4444"
                      : "#F59E0B"
                  }
                  stopOpacity="0.9"
                />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ball Track Arc */}
            <path
              d="M 190 20 Q 190 70 190 100"
              fill="none"
              stroke="url(#ballTrail)"
              strokeWidth="3"
              strokeDasharray="4 3"
              className="opacity-70"
            />
          </svg>

          {/* Glowing Cricket Ball */}
          <div
            className={`absolute z-20 transition-all duration-500 ease-out flex items-center justify-center ${
              status === "verifying"
                ? "animate-bounce"
                : ""
            }`}
            style={{
              bottom: `${14 + (ballProgress / 100) * 82}px`,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div
              className={`w-6 h-6 rounded-full shadow-lg border flex items-center justify-center transition-colors duration-300 ${
                status === "success"
                  ? "bg-gradient-to-tr from-emerald-600 to-emerald-400 border-white shadow-[0_0_16px_#10B981]"
                  : status === "error"
                  ? "bg-gradient-to-tr from-rose-700 to-rose-500 border-white shadow-[0_0_16px_#EF4444]"
                  : "bg-gradient-to-tr from-red-600 to-red-400 border-white/80 shadow-[0_0_12px_#F87171]"
              }`}
            >
              {/* Cricket Ball Seam */}
              <div className="w-full h-[2px] bg-white/70 rotate-45" />
            </div>
          </div>

          {/* LED Stumps & Zing Bails */}
          <div className="relative z-10 bottom-6 flex flex-col items-center">
            {/* Zing Bails */}
            <div className="flex space-x-1.5 mb-[2px]">
              {/* Left Bail */}
              <div
                className={`w-6 h-1.5 rounded-full transition-all duration-500 ${
                  bailsFlew
                    ? "-translate-y-6 -translate-x-4 rotate-45 opacity-0"
                    : status === "error"
                    ? "bg-rose-500 shadow-[0_0_8px_#EF4444]"
                    : status === "success"
                    ? "bg-emerald-400 shadow-[0_0_12px_#10B981]"
                    : "bg-amber-300 shadow-[0_0_6px_#FCD34D]"
                }`}
              />
              {/* Right Bail */}
              <div
                className={`w-6 h-1.5 rounded-full transition-all duration-500 ${
                  bailsFlew
                    ? "-translate-y-8 translate-x-5 -rotate-45 opacity-0"
                    : status === "error"
                    ? "bg-rose-500 shadow-[0_0_8px_#EF4444]"
                    : status === "success"
                    ? "bg-emerald-400 shadow-[0_0_12px_#10B981]"
                    : "bg-amber-300 shadow-[0_0_6px_#FCD34D]"
                }`}
              />
            </div>

            {/* 3 LED Stumps: Off, Middle, Leg */}
            <div className="flex space-x-2.5">
              {[0, 1, 2].map((idx) => {
                const isLit =
                  status === "success" ||
                  status === "error" ||
                  (status === "verifying" && (idx <= frame % 3 || true)) ||
                  enteredCount > idx * 2;

                return (
                  <div
                    key={idx}
                    className="w-2.5 h-16 rounded-t-sm relative bg-slate-800 border border-slate-700 flex flex-col justify-end p-[1px] shadow-md"
                  >
                    {/* Inner LED Strip */}
                    <div
                      className={`w-full h-full rounded-t-sm transition-all duration-300 ${
                        status === "success"
                          ? "bg-emerald-400 shadow-[0_0_12px_#10B981] animate-pulse"
                          : status === "error"
                          ? "bg-rose-500 shadow-[0_0_10px_#EF4444]"
                          : isLit
                          ? "bg-amber-400 shadow-[0_0_8px_#FBBF24]"
                          : "bg-slate-700"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sparks / Confetti on Success */}
          {status === "success" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-xs font-black text-emerald-300 bg-emerald-950/90 px-4 py-1.5 rounded-xl border border-emerald-500/60 shadow-2xl flex items-center space-x-2 animate-bounce">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>CLEAN WICKET! OTP AUTHENTICATED</span>
              </div>
            </div>
          )}

          {/* Out / Error Banner */}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-xs font-black text-rose-200 bg-rose-950/95 px-4 py-1.5 rounded-xl border border-rose-500/80 shadow-2xl flex items-center space-x-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage || "INVALID CODE • REVIEW REJECTED"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UltraEdge Oscillograph Canvas & Telemetry Metrics */}
      <div className="relative z-10 pt-2 border-t border-slate-800 grid grid-cols-12 gap-3 items-center">
        {/* Oscillograph Wave Display */}
        <div className="col-span-8 bg-slate-950/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pb-1">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>ULTRA-EDGE FREQUENCY</span>
            </span>
            <span
              className={`font-bold ${
                status === "verifying"
                  ? "text-cyan-400"
                  : status === "success"
                  ? "text-emerald-400"
                  : status === "error"
                  ? "text-rose-400"
                  : "text-slate-500"
              }`}
            >
              {status === "verifying" ? "SNICKO: ACTIVE" : status === "success" ? "EDGE: CONFIRMED" : "IDLE"}
            </span>
          </div>
          <canvas ref={canvasRef} width={260} height={32} className="w-full h-8" />
        </div>

        {/* Telemetry Tracking Data */}
        <div className="col-span-4 bg-slate-950/90 rounded-lg p-2 border border-slate-800 space-y-1 text-[9px] font-mono">
          <div className="flex justify-between text-slate-400">
            <span>PITCH:</span>
            <span className="text-white font-bold">IN-LINE</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>IMPACT:</span>
            <span className="text-white font-bold">IN-LINE</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>WICKETS:</span>
            <span
              className={`font-bold ${
                status === "success"
                  ? "text-emerald-400"
                  : status === "error"
                  ? "text-rose-400"
                  : "text-amber-400"
              }`}
            >
              {status === "success" ? "HITTING" : status === "error" ? "MISSING" : "TRACKING"}
            </span>
          </div>
        </div>
      </div>

      {/* Attempts Left Warning */}
      {typeof attemptsLeft === "number" && attemptsLeft < 5 && attemptsLeft > 0 && status !== "success" && (
        <div className="mt-2 text-center text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 rounded-lg py-1">
          ⚠️ {attemptsLeft} verification {attemptsLeft === 1 ? "attempt" : "attempts"} remaining before lockout.
        </div>
      )}
    </div>
  );
};
