import React, { useState, useEffect } from "react";
import {
  Activity,
  Clock,
  Users,
  Layers,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet,
  Lock,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import api from "../../services/api";

export const DailyOperationsPage: React.FC = () => {
  const [opsData, setOpsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Day Close Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [submittingClose, setSubmittingClose] = useState(false);
  const [closeSummary, setCloseSummary] = useState<any>(null);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/daily-operations/");
      setOpsData(res.data);
    } catch (err) {
      console.error("Failed to load daily operations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    const interval = setInterval(fetchOperations, 20000); // 20s live polling
    return () => clearInterval(interval);
  }, []);

  const handleDayClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClose(true);
    try {
      const res = await api.post("/reports/daily-close/", {
        counted_cash: countedCash ? Number(countedCash) : undefined,
        notes: closeNotes,
      });
      setCloseSummary(res.data.summary);
      setIsCloseModalOpen(false);
      fetchOperations();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to execute day close.");
    } finally {
      setSubmittingClose(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Activity className="w-3.5 h-3.5" />
            <span>Daily Facility Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Today's Live Operations & Day Close
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time turnstile check-ins, pitch occupancy matrix, walk-in drawer reconciliation, and controlled closing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOperations}
            leftIcon={<RefreshCw className={`w-4 h-4 text-[#059669] ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCloseModalOpen(true)}
            leftIcon={<Lock className="w-4 h-4" />}
          >
            Execute Day Close
          </Button>
        </div>
      </div>

      {closeSummary && (
        <div className="p-5 rounded-3xl bg-[#ECFDF5] border border-emerald-200 space-y-3 animate-in fade-in">
          <div className="flex items-center space-x-2 text-[#059669] font-black text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>End-of-Day Close Summary Generated & Audited</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Total Completed Games:</span>
              <p className="font-bold text-slate-900 text-base">{closeSummary.completed_games}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Cash Collected:</span>
              <p className="font-bold text-amber-700 text-base">₹{closeSummary.cash_collected}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Online Revenue:</span>
              <p className="font-bold text-blue-700 text-base">₹{closeSummary.online_collected}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Cash Discrepancy:</span>
              <p className={`font-bold text-base ${closeSummary.cash_discrepancy === 0 ? "text-[#059669]" : "text-rose-600"}`}>
                ₹{closeSummary.cash_discrepancy}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Operations Bar */}
      {opsData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Active Pitches Right Now
              </span>
              <p className="text-3xl font-black text-[#059669]">
                {opsData.occupancy_stats.active_pitches_now} / {opsData.occupancy_stats.total_pitches}
              </p>
              <span className="text-xs text-slate-500 font-semibold">
                {opsData.occupancy_stats.occupancy_rate}% Day Occupancy
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Admitted Players on Ground
              </span>
              <p className="text-3xl font-black text-slate-900">
                {opsData.gate_stats.admitted_players}
              </p>
              <span className="text-xs text-slate-500 font-semibold">
                {opsData.gate_stats.pending_arrivals} Pending Arrival
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Cash in Drawer (Walk-ins)
              </span>
              <p className="text-3xl font-black text-amber-600">
                ₹{opsData.financial_drawer.cash_collected}
              </p>
              <span className="text-xs text-slate-500 font-semibold">
                {opsData.gate_stats.walk_in_count} Walk-in games today
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Total Daily Revenue
              </span>
              <p className="text-3xl font-black text-blue-600">
                ₹{opsData.financial_drawer.total_revenue_today}
              </p>
              <span className="text-xs text-slate-500 font-semibold">
                ₹{opsData.financial_drawer.online_collected} Online + Cash
              </span>
            </div>
          </div>

          {/* Live Pitch Occupancy Cards */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Layers className="w-4 h-4 text-[#059669]" />
              <span>Real-Time Arena Pitch Statuses</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(opsData?.turfs) && opsData.turfs.map((t: any) => (
                <div
                  key={t.turf_id}
                  className={`p-5 rounded-3xl bg-white border transition-all ${
                    t.is_occupied
                      ? "border-emerald-300 ring-2 ring-emerald-100 shadow-md"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{t.name}</h3>
                      <p className="text-[11px] text-slate-500 font-semibold">{t.sport}</p>
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        t.is_occupied
                          ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${t.is_occupied ? "bg-[#10B981] animate-pulse" : "bg-slate-400"}`} />
                      <span>{t.is_occupied ? "In Match" : "Available"}</span>
                    </span>
                  </div>

                  {t.is_occupied && t.current_match ? (
                    <div className="space-y-1.5 p-3 rounded-2xl bg-[#F8FAFC] text-xs">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Active Game</span>
                      <p className="font-bold text-slate-900">{t.current_match.customer}</p>
                      <p className="text-[11px] font-mono text-[#059669]">{t.current_match.booking_id} ({t.current_match.time})</p>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400 font-semibold">
                      No active match ongoing on this pitch
                    </div>
                  )}

                  {t.next_match && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                      <span>Next Match:</span>
                      <span className="font-bold text-slate-800">{t.next_match.time} ({t.next_match.customer})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Day Close Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Execute End-of-Day Close"
      >
        <form onSubmit={handleDayClose} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Performing Day Close creates an immutable operational snapshot of today's completed matches, audits cash in the register drawer, and logs closing notes.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Physical Cash Counted in Drawer (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="e.g. 4800 (Leave empty to match system total)"
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#059669]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Shift / Admin Closing Notes
            </label>
            <textarea
              rows={3}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="e.g. All pitches inspected, floodlights secured, net repairs needed on Turf B..."
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#059669]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCloseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submittingClose}
            >
              Confirm & Lock Day Close
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
