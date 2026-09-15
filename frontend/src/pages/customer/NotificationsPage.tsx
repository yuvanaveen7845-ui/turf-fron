import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, Clock, Calendar, CheckCircle } from "lucide-react";
import api from "../../services/api";
import { Notification } from "../../types";

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    api
      .get("/notifications/")
      .then((res) => setNotifications(res.data.notifications || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/", {});
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read/`, {});
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Activity</span>
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Notification Center
          </h1>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-300 flex items-center space-x-1.5 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mark All Read</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-400">
            No notifications in your inbox.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markSingleRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                n.is_read
                  ? "bg-slate-900/50 border-slate-800/80 text-slate-400"
                  : "bg-slate-900 border-emerald-500/40 text-white shadow-lg"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-500 block mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>

                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                  {n.notification_type.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
