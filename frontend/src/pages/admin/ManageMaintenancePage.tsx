import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { MaintenanceRecord, Turf } from "../../types";
import { Button, Input, Select, Modal, ConfirmDialog, DataTable, StatusBadge, EmptyState } from "../../components/ui";

export const ManageMaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    turf: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "06:00",
    end_time: "10:00",
    reason: "Grass grooming and floodlight maintenance",
    notes: "Ground crew scheduled with grooming equipment",
  });

  const [conflictWarning, setConflictWarning] = useState<any | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/maintenance/"), api.get("/turfs/")])
      .then(([mRes, tRes]) => {
        const rawRecords = mRes.data;
        const recordList = Array.isArray(rawRecords)
          ? rawRecords
          : Array.isArray(rawRecords?.results)
          ? rawRecords.results
          : [];
        setRecords(recordList);

        const rawTurfs = tRes.data;
        const turfList = Array.isArray(rawTurfs)
          ? rawTurfs
          : Array.isArray(rawTurfs?.results)
          ? rawTurfs.results
          : [];
        setTurfs(turfList);

        if (turfList.length > 0 && !formData.turf) {
          setFormData((prev) => ({ ...prev, turf: turfList[0].id }));
        }
      })
      .catch((err) => {
        console.error("Failed to load maintenance records:", err);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckConflict = async () => {
    if (!formData.turf || !formData.date || !formData.start_time || !formData.end_time) return;
    setCheckingConflict(true);
    try {
      const res = await api.post("/maintenance/check-conflicts/", {
        turf_id: formData.turf,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
      setConflictWarning(res.data);
    } catch (err) {
      console.error("Conflict check failed:", err);
    } finally {
      setCheckingConflict(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/maintenance/${deletingId}/`);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent, forceOverride = false) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      await api.post("/maintenance/", {
        turf: formData.turf,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        reason: formData.reason,
        notes: formData.notes,
        status: "SCHEDULED",
        force: forceOverride,
      });
      setShowModal(false);
      setConflictWarning(null);
      fetchData();
    } catch (err: any) {
      if (err.response?.data?.affected_bookings) {
        setConflictWarning({
          has_conflicts: true,
          conflict_count: err.response.data.affected_bookings.length,
          affected_bookings: err.response.data.affected_bookings,
        });
      }
      setErrorMsg(
        err.response?.data?.error || "Failed to schedule maintenance."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "turf",
      header: "Turf Facility",
      render: (item: MaintenanceRecord) => (
        <div className="font-bold text-slate-900 text-sm">
          {item.turf_name}
        </div>
      ),
    },
    {
      key: "datetime",
      header: "Schedule Date & Time",
      render: (item: MaintenanceRecord) => (
        <div className="text-slate-700 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <Calendar className="w-3.5 h-3.5 text-[#059669]" />
            <span>{item.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{item.start_time} - {item.end_time}</span>
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason & Notes",
      render: (item: MaintenanceRecord) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{item.reason}</div>
          {item.notes && (
            <div className="text-[11px] text-slate-500 mt-0.5">
              {item.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: MaintenanceRecord) => (
        <StatusBadge status={item.status} size="sm" />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (item: MaintenanceRecord) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeletingId(item.id)}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 p-1.5"
          title="Delete & Unlock Slots"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facility Operations & Upkeep</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pitch Maintenance & Downtime
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Schedule turf brushing, floodlight repairs, and private event lockouts
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setErrorMsg("");
            setShowModal(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Schedule Maintenance Block
        </Button>
      </div>

      {/* Info Alert */}
      <div className="bg-[#F0FDF4] border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 shadow-sm">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[#059669]" />
        <div>
          <strong>Automatic Slot Locking:</strong> Scheduling a maintenance block automatically marks matching turf slots as <span className="bg-emerald-100 text-[#059669] px-1.5 py-0.5 rounded font-mono font-bold">MAINTENANCE</span>, preventing double bookings during repair or grooming windows.
        </div>
      </div>

      {/* Maintenance DataTable */}
      <DataTable
        columns={columns}
        data={records}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search turf, reason, date..."
        searchableKey={(r) => `${r.turf_name} ${r.reason} ${r.date}`}
        emptyTitle="No pitch maintenance scheduled"
        emptyDescription="All turf venues and court slots are currently fully operational and available for booking."
        emptyActionText="Schedule Maintenance"
        onEmptyAction={() => setShowModal(true)}
      />

      {/* Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setConflictWarning(null);
        }}
        title="Schedule Maintenance Block"
        description="Temporarily lock matching time slots from customer booking discovery"
        maxWidth="md"
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {conflictWarning?.has_conflicts && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Conflict Detected: {conflictWarning.conflict_count} Confirmed Booking(s) Affected</span>
              </div>
              <p className="text-[11px] text-amber-800">
                The following confirmed customer matches overlap with this maintenance window:
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {conflictWarning.affected_bookings?.map((b: any) => (
                  <div key={b.id} className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">#{b.booking_number || b.id}</strong> • {b.customer_name} ({b.customer_phone || "No phone"})
                      <div className="text-slate-500">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)} • ₹{b.total_amount}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-amber-200">
                <span className="text-[11px] text-amber-800 font-semibold">Override will force maintenance lock:</span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={(e) => handleSubmit(e, true)}
                  isLoading={submitting}
                >
                  Force Schedule & Lock
                </Button>
              </div>
            </div>
          )}

          <Select
            label="Target Turf Pitch"
            isRequired
            value={formData.turf}
            onChange={(e) => {
              setFormData({ ...formData, turf: e.target.value });
              setConflictWarning(null);
            }}
            options={turfs.map((t) => ({ value: t.id, label: `${t.name} (${t.sport_type})` }))}
          />

          <Input
            label="Maintenance Date"
            isRequired
            type="date"
            value={formData.date}
            onChange={(e) => {
              setFormData({ ...formData, date: e.target.value });
              setConflictWarning(null);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Time"
              isRequired
              type="time"
              value={formData.start_time}
              onChange={(e) => {
                setFormData({ ...formData, start_time: e.target.value });
                setConflictWarning(null);
              }}
            />
            <Input
              label="End Time"
              isRequired
              type="time"
              value={formData.end_time}
              onChange={(e) => {
                setFormData({ ...formData, end_time: e.target.value });
                setConflictWarning(null);
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckConflict}
              isLoading={checkingConflict}
            >
              Check Booking Conflicts
            </Button>
          </div>

          <Input
            label="Maintenance Reason"
            isRequired
            placeholder="e.g. Synthetic turf brushing & floodlight repair"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ground Crew Notes
            </label>
            <textarea
              rows={2}
              placeholder="Instructions for staff and gate operators..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setConflictWarning(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              Confirm & Lock Slots
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Cancel Maintenance Block?"
        message="Cancelling this maintenance window will unlock all reserved slots and return them to the public booking calendar."
        confirmText="Unlock Slots"
        isDestructive
      />
    </div>
  );
};
