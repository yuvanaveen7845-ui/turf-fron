import React from "react";
import { QrCode, Maximize2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { RapidScannerEmbed } from "../staff/RapidScannerEmbed";
import { useNavigate } from "react-router-dom";

interface QuickScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickScannerModal: React.FC<QuickScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#059669]">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Quick QR Check-In Scanner
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live optical camera admission &amp; pass validator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/admin/scanner");
            }}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition cursor-pointer"
            title="Open dedicated full-screen scanner page"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      }
    >
      <div className="pt-1">
        <RapidScannerEmbed />
      </div>
    </Modal>
  );
};
