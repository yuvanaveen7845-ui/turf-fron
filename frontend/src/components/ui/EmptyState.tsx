import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="py-14 sm:py-20 px-4 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-3xl bg-emerald-50 border border-emerald-100 text-[#059669] flex items-center justify-center mx-auto shadow-sm">
        {icon || <FolderOpen className="w-7 h-7 text-[#059669]" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {actionText && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionText}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              variant="outline"
              size="md"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
