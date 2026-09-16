import React, { useState, useEffect } from "react";
import {
  Lock,
  Calendar,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import api from "../../services/api";

interface QuickBlockSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTurfId?: number | string;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSlotBlocked?: () => void;
}

export const QuickBlockSlotModal: React.FC<QuickBlockSlotModalProps> = ({
  isOpen,
  onClose,
  defaultTurfId,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onSlotBlocked,
}) => {
  const [turfs, setTurfs] = useState<any[]>([]);
  const [turfId, setTurfId] = useState<string>("");
  const [date, setDate] = useState<string>(
    defaultDate || new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState(defaultStartTime || "18:00");
  const [endTime, setEndTime] = useState(defaultEndTime || "19:00");
  const [reason, setReason] = useState("Private Event / Tournament");
  const [notes, setNotes] = useState("");

  const [conflictWarning, setConflictWarning] = useState<any | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      setConflictWarning(null);
      api.get("/turfs/").then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setTurfs(list);
        if (defaultTurfId) {
          setTurfId(String(defaultTurfId));
        } else if (list.length > 0) {
          setTurfId(String(list[0].id));
        }
      }).catch(console.error);
    }
  }, [isOpen, defaultTurfId]);

  const handleCheckConflict = async () => {
    if (!turfId || !date || !startTime || !endTime) return;
    setCheckingConflict(true);
    try {
      const res = await api.post("/maintenance/check-conflicts/", {
        turf_id: turfId,
        date: date,
        start_time: startTime,
        end_time: endTime,
      });
      setConflictWarning(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleBlockSlot = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!turfId || !date || !startTime || !endTime) {
      setErrorMsg("Please fill in all required slot fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      await api.post("/maintenance/", {
        turf: turfId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        reason: reason,
        notes: notes,
        status: "SCHEDULED",
        force: force,
      });

      setSuccessMsg(`Slot successfully blocked (${startTime} - ${endTime})!`);
      if (onSlotBlocked) onSlotBlocked();
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    } catch (err: any) {
      if (err.response?.data?.affected_bookings) {
        setConflictWarning({
          has_conflicts: true,
          conflict_count: err.response.data.affected_bookings.length,
          affected_bookings: err.response.data.affected_bookings,
        });
      }
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to block slot."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Block Turf Slot"
      description="Immediately lock time slots for private matches, club events, or turf upkeep"
      maxWidth="md"
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

        {conflictWarning?.has_conflicts && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{conflictWarning.conflict_count} Confirmed Booking(s) in this Window!</span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto text-[11px]">
              {conflictWarning.affected_bookings?.map((b: any) => (
                <div key={b.id} className="p-1.5 bg-white rounded border border-amber-200 flex justify-between">
                  <span>#{b.booking_number || b.id} - {b.customer_name}</span>
                  <strong>{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</strong>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={(e) => handleBlockSlot(e, true)}
                isLoading={submitting}
              >
                Force Block & Notify
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleBlockSlot(e, false)} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Pitch</label>
            <select
              value={turfId}
              onChange={(e) => setTurfId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              {turfs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sport_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Block Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              isRequired
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End Time"
              isRequired
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCheckConflict}
              disabled={checkingConflict}
              className="text-[11px] font-bold text-[#059669] hover:underline"
            >
              {checkingConflict ? "Checking..." : "Check Booking Conflicts"}
            </button>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Lockout</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              <option value="Private Event / Tournament">Private Event / Tournament</option>
              <option value="Turf Maintenance & Grooming">Turf Maintenance & Grooming</option>
              <option value="Staff / Academy Training">Staff / Academy Training</option>
              <option value="Weather / Rain Delay">Weather / Rain Delay</option>
              <option value="Emergency Pitch Repair">Emergency Pitch Repair</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Internal Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Booked by Bangalore Football Club tournament"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Lock Slot
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
