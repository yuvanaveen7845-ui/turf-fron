import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, CheckCircle2, Clock } from "lucide-react";
import api from "../../services/api";
import { Notification } from "../../types";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] flex items-center space-x-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Activity</span>
          </span>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Match confirmations, slot reservations, automated refunds, and promotional alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-[#059669]" />}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-slate-400" />}
          title="Your inbox is clear"
          description="You don't have any notifications right now. New booking updates, payment receipts, and slot reminders will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markSingleRead(n.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                n.is_read
                  ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  : "bg-[#F0FDF4] border-emerald-300 text-slate-900 shadow-sm hover:border-emerald-400"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${n.is_read ? "text-slate-800" : "text-slate-900"}`}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#059669] text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
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
