import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "link";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "inline-flex items-center justify-center font-bold transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

    // Variant styles following design.md
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-[#059669] hover:bg-[#047857] text-white shadow-sm hover:shadow-emerald-glow focus:ring-emerald-500",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400",
      outline:
        "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-emerald-500 shadow-sm",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500",
      success:
        "bg-[#10B981] hover:bg-[#059669] text-white shadow-sm focus:ring-emerald-500",
      link: "bg-transparent text-[#059669] hover:underline p-0 h-auto shadow-none focus:ring-0 active:scale-100",
    };

    // Size styles with rounded-xl for standard buttons
    const sizeStyles: Record<ButtonSize, string> = {
      sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
      md: "text-xs sm:text-sm px-4 py-2.5 rounded-xl gap-2",
      lg: "text-sm sm:text-base px-5 py-3.5 rounded-xl gap-2.5",
      icon: "p-2 sm:p-2.5 rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
