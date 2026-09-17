import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  label,
  className = "",
  fullHeight = false,
}) => {
  const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  const logoSizeMap = {
    sm: "w-2.5 h-2.5",
    md: "w-4 h-4",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-4 select-none ${
        fullHeight ? "min-h-[280px] w-full" : ""
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse */}
        <div
          className={`${
            size === "sm" ? "w-6 h-6" : size === "md" ? "w-10 h-10" : "w-16 h-16"
          } rounded-full bg-emerald-500/15 animate-ping absolute`}
        />

        {/* Rotating athletic border ring */}
        <div
          className={`${sizeMap[size]} rounded-full border-slate-200 border-t-[#059669] border-r-[#10B981] animate-spin`}
        />

        {/* Center icon / brand dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Loading"
            className={`${logoSizeMap[size]} object-contain animate-pulse`}
          />
        </div>
      </div>

      {label && (
        <p className="text-xs font-bold text-slate-600 tracking-wide animate-pulse text-center">
          {label}
        </p>
      )}
    </div>
  );
};
