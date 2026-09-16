import React, { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      isRequired = false,
      options,
      children,
      disabled,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-slate-700 tracking-tight"
          >
            {label}
            {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full appearance-none text-xs sm:text-sm font-medium text-slate-900 bg-[#F8FAFC] border rounded-xl pl-3.5 pr-10 py-2.5 sm:py-3 transition-all duration-150 outline-none cursor-pointer
              ${
                error
                  ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20"
              }
              disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3.5 pointer-events-none text-slate-400">
            {error ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
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

Select.displayName = "Select";
