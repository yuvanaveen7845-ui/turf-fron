import React from "react";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={!isLoading}>
      <div className="text-center space-y-4 pt-1">
        <div
          className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDestructive
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-emerald-50 text-[#059669] border border-emerald-100"
          }`}
        >
          {isDestructive ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <HelpCircle className="w-6 h-6" />
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDestructive ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
