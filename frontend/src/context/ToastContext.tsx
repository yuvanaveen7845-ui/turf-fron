import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

const TOAST_CONFIG: Record<
  ToastType,
  {
    icon: React.FC<{ className?: string }>;
    containerClass: string;
    iconClass: string;
    titleClass: string;
    progressClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    containerClass:
      "bg-white border border-emerald-200 shadow-lg shadow-emerald-950/5",
    iconClass: "text-[#059669]",
    titleClass: "text-slate-900",
    progressClass: "bg-[#059669]",
  },
  error: {
    icon: XCircle,
    containerClass: "bg-white border border-rose-200 shadow-lg shadow-rose-950/5",
    iconClass: "text-rose-600",
    titleClass: "text-slate-900",
    progressClass: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      "bg-white border border-amber-200 shadow-lg shadow-amber-950/5",
    iconClass: "text-amber-600",
    titleClass: "text-slate-900",
    progressClass: "bg-amber-500",
  },
  info: {
    icon: Info,
    containerClass:
      "bg-white border border-slate-200 shadow-lg shadow-slate-950/5",
    iconClass: "text-slate-600",
    titleClass: "text-slate-900",
    progressClass: "bg-slate-500",
  },
};

const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const cfg = TOAST_CONFIG[toast.type];
  const Icon = cfg.icon;
  const duration = toast.duration ?? 4000;

  return (
    <div
      className={`relative w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-right-4 fade-in duration-300 ${cfg.containerClass}`}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <span className={`shrink-0 mt-0.5 ${cfg.iconClass}`}>
        <Icon className="w-4.5 h-4.5" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-sm font-bold leading-snug ${cfg.titleClass}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-0.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl ${cfg.progressClass} origin-left`}
        style={{
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = `toast-${++toastIdCounter}-${Date.now()}`;
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // max 5 visible

      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, message?: string, duration?: number) =>
      addToast("success", title, message, duration),
    error: (title: string, message?: string, duration?: number) =>
      addToast("error", title, message, duration),
    warning: (title: string, message?: string, duration?: number) =>
      addToast("warning", title, message, duration),
    info: (title: string, message?: string, duration?: number) =>
      addToast("info", title, message, duration),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Stack — fixed bottom-right */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-20 md:bottom-6 right-4 z-[9999] flex flex-col gap-2.5 items-end"
          aria-label="Notifications"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType["toast"] => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx.toast;
};
