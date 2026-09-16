import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We couldn't load the requested data. Your previous settings and bookings were not affected.",
  onRetry,
  retryText = "Try Again",
}) => {
  return (
    <div className="py-12 sm:py-16 px-4 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            size="md"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
};
