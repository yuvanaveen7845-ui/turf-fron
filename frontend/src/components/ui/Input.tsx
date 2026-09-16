import React, { InputHTMLAttributes, forwardRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      isRequired = false,
      disabled,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-700 tracking-tight"
          >
            {label}
            {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-slate-400 shrink-0">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full text-xs sm:text-sm font-medium text-slate-900 bg-[#F8FAFC] border rounded-xl placeholder:text-slate-400 transition-all duration-150 outline-none
              ${leftIcon ? "pl-10" : "pl-3.5"}
              ${rightIcon || error || success ? "pr-10" : "pr-3.5"}
              py-2.5 sm:py-3
              ${
                error
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : success
                  ? "border-emerald-300 bg-emerald-50/30 focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20"
                  : "border-slate-200 focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20"
              }
              disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none shrink-0">
            {error ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : success ? (
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            ) : (
              rightIcon && <span className="text-slate-400">{rightIcon}</span>
            )}
          </div>
        </div>

        {error ? (
          <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
