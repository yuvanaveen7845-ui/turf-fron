import React, { useState, useEffect } from "react";
import {
  QrCode,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Sun,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

interface AdminPaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPaymentQRModal: React.FC<AdminPaymentQRModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isBrightMode, setIsBrightMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep screen awake while displaying QR to customer
  useEffect(() => {
    let wakeLockSentinel: any = null;
    if (isOpen && "wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          wakeLockSentinel = lock;
        })
        .catch(() => {});
    }
    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isOpen]);

  // Hard security boundary: This modal is strictly for administrators
  if (!isAdmin && isOpen) {
    return null;
  }

  const upiId = "mehala.m@superyes";
  const payeeName = "M MEHALA";

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = "/admin_upi_qr_focused.jpg";
    link.download = `FriendsTurf_UPI_QR_${payeeName.replace(/\s+/g, "_")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloading high-res UPI QR Image...");
  };

  // Fullscreen Floodlight Mode (Edge-to-edge max brightness on mobile)
  if (isFullscreen && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-150 select-none">
        {/* Fullscreen Header */}
        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-emerald-50 text-[#059669]">
              <QrCode className="w-5 h-5" />
            </span>
            <div className="text-left">
              <span className="text-xs font-black text-slate-900 block">Offline Counter UPI</span>
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">
                Full-Screen Max Brightness Mode
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Giant Centered QR Image */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md py-2">
          <div className="p-3 sm:p-5 rounded-3xl bg-white shadow-[0_0_60px_rgba(5,150,105,0.18)] border-2 border-emerald-400/40 w-full">
            <img
              src="/admin_upi_qr_focused.jpg"
              alt="Friends Turf Offline Counter UPI QR"
              className="w-full h-auto object-contain mx-auto rounded-2xl"
            />
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs font-black text-slate-900">
              Payee: <strong className="text-[#059669]">{payeeName}</strong> • {upiId}
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="w-full max-w-sm flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyUPI}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied UPI ID" : "Copy UPI ID"}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="py-2 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className={`space-y-3 sm:space-y-4 text-center transition-all ${isBrightMode ? "bg-white" : ""}`}>
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#059669]">
              <QrCode className="w-5 h-5" />
            </span>
            <div className="text-left">
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Offline Counter UPI Payment
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Admin Offline Payment Gateway • Scan &amp; Pay
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Brightness Booster Toggle */}
            <button
              type="button"
              onClick={() => setIsBrightMode(!isBrightMode)}
              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                isBrightMode
                  ? "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
              title={isBrightMode ? "High Brightness active" : "Enable High Brightness"}
            >
              <Sun className={`w-3.5 h-3.5 ${isBrightMode ? "text-amber-500 fill-amber-500" : ""}`} />
              <span className="text-[10px] hidden sm:inline">Bright</span>
            </button>

            {/* Fullscreen Expand */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Expand QR to Full-Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* High-Contrast Focused Super-Size QR Code Card */}
        <div
          className={`relative mx-auto w-full max-w-[340px] sm:max-w-[380px] p-3 sm:p-4 rounded-3xl border-2 transition-all duration-200 ${
            isBrightMode
              ? "bg-white border-emerald-400 shadow-[0_0_50px_rgba(255,255,255,1),0_8px_30px_rgba(5,150,105,0.18)]"
              : "bg-white border-slate-200 shadow-md"
          }`}
        >
          <div className="overflow-hidden rounded-2xl bg-white">
            <img
              src="/admin_upi_qr_focused.jpg"
              alt="Friends Turf Offline Counter UPI QR"
              className="w-full h-auto object-contain mx-auto filter contrast-[1.03]"
            />
          </div>

          {/* Payee Info Details */}
          <div className="pt-2 space-y-1.5">
            <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              Payee: <span className="text-[#059669] font-black">{payeeName}</span>
            </div>

            {/* UPI ID Copy Pill */}
            <button
              type="button"
              onClick={handleCopyUPI}
              className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-xs font-mono font-bold text-slate-800 transition cursor-pointer"
              title="Click to copy UPI ID"
            >
              <span className="truncate">{upiId}</span>
              {copied ? (
                <span className="inline-flex items-center gap-1 text-[#059669] text-[10px] shrink-0 font-sans font-bold">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Copied
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400 hover:text-[#059669] text-[10px] shrink-0 font-sans font-bold">
                  <Copy className="w-3 h-3" />
                  Copy
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Accepted UPI Apps Banner */}
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-0.5">
          <span className="font-bold text-slate-700 block text-[11px]">
            Scan and pay using any UPI application:
          </span>
          <p className="text-[10px] text-slate-500 font-medium">
            Google Pay • PhonePe • Paytm • BHIM • super.money • Cred
          </p>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center space-x-1.5 text-xs font-bold text-[#059669] hover:underline cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full-Screen Max</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadQR}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Save JPG
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
