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
} from "lucide-react";
import api from "../../services/api";
import { MaintenanceRecord, Turf } from "../../types";

export const ManageMaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    turf: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "06:00",
    end_time: "10:00",
    reason: "Grass grooming and floodlight maintenance",
    notes: "Ground crew scheduled with heavy equipment",
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/maintenance/"), api.get("/turfs/")])
      .then(([mRes, tRes]) => {
        setRecords(mRes.data);
        setTurfs(tRes.data);
        if (tRes.data.length > 0 && !formData.turf) {
          setFormData((prev) => ({ ...prev, turf: tRes.data[0].id }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Cancelling this maintenance will automatically free locked slots back to AVAILABLE. Proceed?",
      )
    )
      return;
    try {
      await api.delete(`/maintenance/${id}/`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error || "Failed to schedule maintenance.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Ground Operations
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Turf Maintenance & Downtime
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Schedule Maintenance
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400" />
        <div>
          <strong>Automatic Slot Locking:</strong> Scheduling a maintenance
          block automatically marks matching turf slots as{" "}
          <span className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
            MAINTENANCE
          </span>
          , preventing double booking during repair or grooming windows.
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Turf Facility</th>
                <th className="py-3.5 px-4">Schedule Date & Time</th>
                <th className="py-3.5 px-4">Reason & Notes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading maintenance schedules...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No turf maintenance scheduled. All pitches are open!
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">
                        {item.turf_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-bold">{item.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {item.start_time} - {item.end_time}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{item.reason}</div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {item.status === "COMPLETED" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete & Unlock Slots"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Schedule Maintenance Block
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Target Turf *
                </label>
                <select
                  value={formData.turf}
                  onChange={(e) =>
                    setFormData({ ...formData, turf: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                >
                  {turfs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.sport_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Maintenance Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Astro-turf brushing, sprinkler system replacement"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Crew Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ground staff instructions..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submitting ? "Locking Slots..." : "Confirm Maintenance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
