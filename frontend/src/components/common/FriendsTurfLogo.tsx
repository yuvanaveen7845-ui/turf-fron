import React from "react";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";

interface FriendsTurfLogoProps {
  variant?: "full" | "compact" | "white" | "print" | "monochrome";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
}

export const FriendsTurfLogo: React.FC<FriendsTurfLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  showSubtitle = true,
}) => {
  const { company } = useBusinessSettings();
  // Dimensions
  const emblemSizes = {
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const isWhite = variant === "white";
  const isPrint = variant === "print";
  const isMono = variant === "monochrome";

  const firstName = company.name.split(" ")[0] || "FRIENDS";
  const restName = company.name.split(" ").slice(1).join(" ") || "TURF";

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {/* Brand Emblem Icon / Shield */}
      <div
        className={`${emblemSizes[size]} rounded-2xl flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${
          isWhite
            ? "bg-white text-[#059669]"
            : isMono
            ? "bg-slate-900 text-white"
            : isPrint
            ? "bg-[#059669] text-white border-2 border-slate-900"
            : "bg-gradient-to-tr from-[#047857] via-[#059669] to-[#10B981] text-white shadow-emerald-glow"
        }`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[62%] h-[62%]"
        >
          {/* Turf Shield Outline */}
          <path
            d="M24 4L8 10V22C8 32.5 14.8 42.2 24 44C33.2 42.2 40 32.5 40 22V10L24 4Z"
            fill={isWhite ? "#ECFDF5" : isMono ? "#1E293B" : "rgba(255, 255, 255, 0.15)"}
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Central Pitch & Monogram FT */}
          <path
            d="M16 16H32M24 16V36M16 26H28"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Star Accent */}
          <circle cx="34" cy="14" r="2.5" fill="#FBBF24" />
        </svg>
      </div>

      {/* Brand Typography */}
      {variant !== "compact" && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-black tracking-tight leading-none ${titleSizes[size]} ${
                isWhite ? "text-white" : isPrint || isMono ? "text-slate-950" : "text-slate-900"
              }`}
            >
              {firstName} <span className={isWhite ? "text-emerald-200" : "text-[#059669]"}>{restName}</span>
            </span>
          </div>

          {showSubtitle && (
            <span
              className={`text-[9px] font-extrabold uppercase tracking-[0.2em] mt-0.5 ${
                isWhite
                  ? "text-emerald-100"
                  : isPrint || isMono
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              Sports Complex • {company.address.split(",")[0] || "Tiruppur"}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
