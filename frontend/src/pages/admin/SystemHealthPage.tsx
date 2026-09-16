import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Server,
  Database,
  CreditCard,
  QrCode,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  Layers,
  Activity,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import api from "../../services/api";

export const SystemHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/system-health/");
      setHealthData(res.data);
    } catch (err) {
      console.error("Failed to fetch system health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Server className="w-3.5 h-3.5" />
            <span>Infrastructure & Background Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            System Health & Operational Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Monitor API latencies, database connectivity, Razorpay signature verification, and background slot cleanup.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          leftIcon={<RefreshCw className={`w-4 h-4 text-[#059669] ${loading ? "animate-spin" : ""}`} />}
        >
          Run Diagnostic Check
        </Button>
      </div>

      {healthData && (
        <>
          {/* Main Status Banner */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-[#059669]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black text-slate-900">
                    All Core Systems Operating Normally
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-[#059669] border border-emerald-200">
                    {healthData.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Server Time: {healthData.server_time} ({healthData.timezone})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Users</span>
                <span className="font-bold text-slate-900 text-sm">{healthData.metrics.total_users}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Bookings</span>
                <span className="font-bold text-slate-900 text-sm">{healthData.metrics.total_bookings}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Pitches</span>
                <span className="font-bold text-[#059669] text-sm">{healthData.metrics.active_turfs}</span>
              </div>
            </div>
          </div>

          {/* Subsystems List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Subsystem Health Telemetry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(healthData?.services) && healthData.services.map((srv: any, idx: number) => {
                const isHealthy = srv.status === "HEALTHY" || srv.status === "CONFIGURED";
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        {isHealthy ? (
                          <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
                        <h4 className="font-extrabold text-xs text-slate-900">
                          {srv.name}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        {srv.latency_ms !== undefined && (
                          <span className="text-[11px] font-mono text-slate-500 font-semibold">
                            {srv.latency_ms} ms
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isHealthy
                              ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {srv.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {srv.details}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
