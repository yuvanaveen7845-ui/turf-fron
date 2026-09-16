import React, { useState, useEffect } from "react";
import {
  Sliders,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

interface QuickPriceChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTurfId?: number | string;
  defaultDate?: string;
  onPriceUpdated?: () => void;
}

export const QuickPriceChangeModal: React.FC<QuickPriceChangeModalProps> = ({
  isOpen,
  onClose,
  defaultTurfId,
  defaultDate,
  onPriceUpdated,
}) => {
  const [turfs, setTurfs] = useState<any[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [date, setDate] = useState<string>(
    defaultDate || new Date().toISOString().split("T")[0]
  );
  const [newPrice, setNewPrice] = useState<string>("");
  const [currentBasePrice, setCurrentBasePrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      api.get("/turfs/").then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setTurfs(list);
        if (defaultTurfId) {
          setSelectedTurfId(String(defaultTurfId));
          const t = list.find((item: any) => String(item.id) === String(defaultTurfId));
          if (t) {
            setCurrentBasePrice(String(t.base_price));
            setNewPrice(String(t.base_price));
          }
        } else if (list.length > 0) {
          setSelectedTurfId(String(list[0].id));
          setCurrentBasePrice(String(list[0].base_price));
          setNewPrice(String(list[0].base_price));
        }
      }).catch(console.error);
    }
  }, [isOpen, defaultTurfId]);

  const handleTurfChange = (turfId: string) => {
    setSelectedTurfId(turfId);
    const t = turfs.find((item) => String(item.id) === turfId);
    if (t) {
      setCurrentBasePrice(String(t.base_price));
      setNewPrice(String(t.base_price));
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurfId || !newPrice || parseFloat(newPrice) <= 0) {
      setErrorMsg("Please enter a valid price amount.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      // Create a quick custom day override rule
      await api.post("/pricing/rules/", {
        name: `Special Rate (${date})`,
        rule_type: "WEEKDAY",
        turf: selectedTurfId,
        adjustment_type: "FIXED",
        adjustment_value: String(parseFloat(newPrice) - parseFloat(currentBasePrice || "0")),
        applicable_days: [new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1],
        start_time: "06:00:00",
        end_time: "23:00:00",
        priority: 50,
        is_active: true,
      });

      setSuccessMsg(`Price updated to ₹${newPrice}/hr for ${date}!`);
      if (onPriceUpdated) onPriceUpdated();
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to update slot rate."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Price Change"
      description="Instantly update the hourly match rate for today or any specific date"
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#059669] rounded-xl flex items-center space-x-2 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSavePrice} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Pitch</label>
            <select
              value={selectedTurfId}
              onChange={(e) => handleTurfChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              {turfs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Current: ₹{t.base_price}/hr)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Applies On Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500">Current Base Rate</span>
              <div className="font-mono font-black text-slate-800 text-sm mt-0.5">
                ₹{currentBasePrice || "0"}/hr
              </div>
            </div>
            <div>
              <Input
                label="New Rate (₹/hr)"
                isRequired
                type="number"
                step="any"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
          </div>

          {/* Progressive Disclosure Link */}
          <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="text-[11px] text-slate-600">
              Need recurring weekend surges, peak floodlit, or holiday rules?
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/admin/pricing");
              }}
              className="text-[11px] font-bold text-[#059669] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Rules Engine</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              leftIcon={<DollarSign className="w-4 h-4" />}
            >
              Save New Price
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
