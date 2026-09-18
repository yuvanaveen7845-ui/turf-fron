import React, { useState, useEffect } from "react";
import {
  Wallet,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Activity,
  Flame,
} from "lucide-react";

interface WalletPaymentProcessingModalProps {
  amount: number;
  walletBalance: number;
  turfName: string;
  onComplete?: () => void;
}

const STAGES = [
  {
    id: "vault",
    title: "Unlocking Turf Cash Vault",
    subtitle: "Verifying secure balance & cryptographic authorization...",
    icon: Wallet,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "arena",
    title: "Securing Pitch & Floodlights",
    subtitle: "Activating arena lux lighting & locking pitch reservation...",
    icon: Zap,
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "minting",
    title: "Minting Digital Match Pass QR",
    subtitle: "Generating high-speed turnstile barcode credentials...",
    icon: ShieldCheck,
    color: "from-emerald-600 to-green-500",
  },
  {
    id: "ready",
    title: "Match Pass Activated!",
    subtitle: "Kickoff confirmed. Transferring to your stadium pass...",
    icon: Trophy,
    color: "from-green-500 to-emerald-700",
  },
];

const TRIVIA_TIPS = [
  "⚡ Pro Tip: FIFA Quality Pro grass reduces knee fatigue by 28% compared to regular artificial turf.",
  "👟 Gear Tip: Flat rubber-studded turf boots provide maximum grip and prevent slippage on 50mm grass.",
  "🎟️ Fast Check-in: Your digital match pass QR scans in under 0.5s at the turnstile entrance.",
  "💧 Chilled dugout water stations and warm-up bibs are complimentary for all team bookings.",
  "⚡ Turf Cash payments feature 0% transaction surcharges and instant 1-click slot confirmation.",
];

export const WalletPaymentProcessingModal: React.FC<WalletPaymentProcessingModalProps> = ({
  amount,
  walletBalance,
  turfName,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [boostEnergy, setBoostEnergy] = useState(15);
  const [taps, setTaps] = useState(0);
  const [tapParticles, setTapParticles] = useState<
    { id: number; x: number; y: number; text: string }[]
  >([]);

  // Stage progression timer
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 900);

    return () => clearInterval(stageTimer);
  }, []);

  // Trivia rotation timer
  useEffect(() => {
    const triviaTimer = setInterval(() => {
      setTriviaIdx((prev) => (prev + 1) % TRIVIA_TIPS.length);
    }, 2400);

    return () => clearInterval(triviaTimer);
  }, []);

  // Interactive Tap handler
  const handleInteractiveTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const words = ["⚽ GOAL!", "⚡ BOOST!", "🔥 100%!", "🚀 READY!", "⭐ PRO!"];
    const randomWord = words[Math.floor(Math.random() * words.length)];

    setTapParticles((prev) => [
      ...prev.slice(-8),
      { id: Date.now() + Math.random(), x, y, text: randomWord },
    ]);

    setTaps((prev) => prev + 1);
    setBoostEnergy((prev) => Math.min(100, prev + 14));
  };

  // Passive decay of boost energy
  useEffect(() => {
    const decayInterval = setInterval(() => {
      setBoostEnergy((prev) => Math.max(15, prev - 1));
    }, 400);
    return () => clearInterval(decayInterval);
  }, []);

  const activeStage = STAGES[currentStageIdx];
  const progressPercent = Math.min(
    100,
    Math.round(((currentStageIdx + 1) / STAGES.length) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-emerald-500/30 max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-white relative overflow-hidden animate-in fade-in zoom-in-95">
        {/* Background dynamic ambient glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header & Live Indicator */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
              1-Click Instant Vault Checkout
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>{progressPercent}% Complete</span>
          </div>
        </div>

        {/* 2. Interactive Animated Stadium Pitch Card */}
        <div
          onClick={handleInteractiveTap}
          className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 border border-emerald-500/40 rounded-2xl p-6 overflow-hidden cursor-pointer group active:scale-[0.99] transition-transform"
        >
          {/* Pitch lines & grass simulation */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full border-2 border-dashed border-emerald-400 rounded-xl" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-400" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-emerald-400 rounded-full" />
          </div>

          {/* Floating Tap Particles */}
          {tapParticles.map((p) => (
            <div
              key={p.id}
              style={{ left: p.x, top: p.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xs font-black text-emerald-300 animate-bounce transition-all drop-shadow-md z-20"
            >
              {p.text}
            </div>
          ))}

          {/* Central Animated Coin / Hologram */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative">
              {/* Rotating radar sweep */}
              <div className="absolute -inset-4 rounded-full border border-emerald-400/40 animate-ping" />
              <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/60 animate-spin" />

              {/* Main Badge */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-emerald-glow flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <activeStage.icon className="w-10 h-10 text-emerald-400 animate-pulse transition-all duration-300" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center space-x-2">
                <span>{activeStage.title}</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                {activeStage.subtitle}
              </p>
            </div>

            {/* Interactive cheer hint */}
            <div className="pt-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-extrabold text-emerald-300 group-hover:border-emerald-400 transition-colors shadow-sm">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                <span>Tap pitch to boost stadium power! ({taps} taps)</span>
              </span>
            </div>
          </div>

          {/* Stadium Power Meter */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center space-x-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Stadium Energy:</span>
            </span>
            <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-300 rounded-full transition-all duration-200"
                style={{ width: `${boostEnergy}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Transaction Metadata Live Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Deducted from Wallet
            </span>
            <span className="text-base font-black text-emerald-400 font-mono">
              -₹{Number(amount).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Remaining Balance
            </span>
            <span className="text-base font-black text-slate-200 font-mono">
              ₹{Math.max(0, walletBalance - amount).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* 4. Multi-Stage Progress Bubbles */}
        <div className="flex items-center justify-between px-2 pt-1">
          {STAGES.map((s, idx) => {
            const isDone = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <div key={s.id} className="flex flex-col items-center space-y-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-500 text-slate-950 font-black shadow-emerald-glow"
                      : isCurrent
                      ? "bg-emerald-400/20 text-emerald-300 border-2 border-emerald-400 animate-pulse"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[9px] font-bold tracking-tight text-center max-w-[64px] line-clamp-1 ${
                    isCurrent ? "text-emerald-300" : isDone ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {s.title.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* 5. Curious Match Trivia Box */}
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-spin" />
          <p className="text-xs text-emerald-200/90 italic leading-relaxed transition-all duration-500">
            {TRIVIA_TIPS[triviaIdx]}
          </p>
        </div>
      </div>
    </div>
  );
};
