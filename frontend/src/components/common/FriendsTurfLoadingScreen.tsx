import React, { useState, useEffect } from "react";
import { Sparkles, Shield, Zap } from "lucide-react";

interface FriendsTurfLoadingScreenProps {
  message?: string;
  subMessage?: string;
  compact?: boolean;
}

const LOADING_TIPS = [
  "Preparing pristine FIFA-grade turf pitches...",
  "Syncing real-time slot matrices & fast-fill engine...",
  "Powering 500 Lux anti-glare arena floodlights...",
  "Securing cryptographic Match Pass turnstiles...",
  "Connecting to Friends Turf Live Venue...",
];

export const FriendsTurfLoadingScreen: React.FC<FriendsTurfLoadingScreenProps> = ({
  message,
  subMessage,
  compact = false,
}) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          {/* Glowing Aura Ring */}
          <div className="absolute w-16 h-16 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-white p-2 border border-emerald-200 shadow-md flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Friends Turf"
              className="w-10 h-10 object-contain animate-pulse"
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-900">
            {message || "Loading Turf Session..."}
          </p>
          <div className="w-32 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#059669] to-[#10B981] rounded-full animate-[shimmer_1.2s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 min-h-screen w-screen bg-[#0F172A] flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/60 via-[#0F172A] to-[#020617] pointer-events-none" />
      
      {/* Stadium Pitch Grid Line Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Floating Ambient Emerald Glow Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />

      {/* Center Stadium Card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full mx-auto space-y-6">
        
        {/* Animated Brand Emblem with Orbiting Halo */}
        <div className="relative flex items-center justify-center">
          {/* Outer Orbiting Dashed Ring */}
          <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-emerald-400/30 animate-[spin_8s_linear_infinite]" />
          
          {/* Pulsing Outer Glow */}
          <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-500/20 blur-md animate-pulse" />

          {/* Logo Container Container */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/95 backdrop-blur-md p-3.5 shadow-2xl border-2 border-emerald-400/50 flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
            <img
              src="/logo.png"
              alt="Friends Turf"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>

          {/* Sparkle Accent */}
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 border-2 border-[#0F172A] animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Brand Title & Tagline */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span>Live Arena Access</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
            FRIENDS TURF
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            FIFA Pro Standard Sports Complex
          </p>
        </div>

        {/* Athletic Progress Bar with Moving Shimmer */}
        <div className="w-56 sm:w-64 space-y-2 pt-1">
          <div className="relative h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
            {/* Animated progress bar gradient with continuous sweep */}
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 rounded-full shadow-emerald-glow animate-[progress-bar_2s_ease-in-out_infinite]"
              style={{
                width: "100%",
                animation: "shimmerSweep 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
              }}
            />
          </div>

          {/* Dynamic Cycling Sports Tips */}
          <div className="h-5 flex items-center justify-center">
            <p
              key={tipIndex}
              className="text-[11px] font-semibold text-emerald-300/90 animate-in fade-in slide-in-from-bottom-1 duration-300 truncate"
            >
              {message || LOADING_TIPS[tipIndex]}
            </p>
          </div>
        </div>

        {/* Subtle Bottom Trust Badges */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            100% Encrypted Pass
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Instant Gate Sync
          </span>
        </div>
      </div>

      {/* Global Inline Keyframe Style for Progress Sweep */}
      <style>{`
        @keyframes shimmerSweep {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};
