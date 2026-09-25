import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  Zap,
  Ticket,
  Wallet,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { Notification } from "../../types";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import {
  isPushSupported,
  getPushPermissionStatus,
  requestPushPermission,
  isPushSoundEnabled,
  setPushSoundEnabled,
  PushPermissionStatus,
} from "../../services/webPush";

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UNREAD" | "BOOKING" | "WALLET">("ALL");

  // Web Push State
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>("default");
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [requestingPush, setRequestingPush] = useState(false);

  useEffect(() => {
    if (isPushSupported()) {
      setPushStatus(getPushPermissionStatus());
      setSoundActive(isPushSoundEnabled());
    }
  }, []);

  const fetchNotifs = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setLoading(true);

      const res = await api.get("/notifications/");
      setNotifications(res.data.notifications || []);
      if (showToast) toast.success("Notification center updated!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read.");
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read/`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markSingleRead(notif.id);
    }

    const type = notif.notification_type?.toUpperCase() || "";
    const title = notif.title?.toLowerCase() || "";
    const msg = notif.message?.toLowerCase() || "";

    if (
      type.includes("BOOKING") ||
      title.includes("match pass") ||
      title.includes("booking") ||
      msg.includes("pass")
    ) {
      navigate("/my-bookings");
    } else if (
      type.includes("PAYMENT") ||
      type.includes("REFUND") ||
      title.includes("wallet") ||
      title.includes("cash") ||
      msg.includes("wallet")
    ) {
      navigate("/wallet");
    } else if (type.includes("COUPON") || title.includes("offer")) {
      navigate("/offers");
    } else {
      navigate("/my-bookings");
    }
  };

  const handleEnablePush = async () => {
    setRequestingPush(true);
    try {
      const res = await requestPushPermission();
      setPushStatus(res.status);
      if (res.granted) {
        toast.success("Browser push notifications enabled! You'll receive real-time alerts.");
      } else if (res.status === "denied") {
        toast.warning("Push notifications were denied. You can enable them in browser settings.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingPush(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setPushSoundEnabled(next);
    toast.info(next ? "Notification chime enabled" : "Notification chime muted");
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === "UNREAD") return !n.is_read;
      if (activeFilter === "BOOKING") {
        return (
          n.notification_type?.toUpperCase().includes("BOOKING") ||
          n.title.toLowerCase().includes("booking") ||
          n.title.toLowerCase().includes("match pass")
        );
      }
      if (activeFilter === "WALLET") {
        return (
          n.notification_type?.toUpperCase().includes("PAYMENT") ||
          n.notification_type?.toUpperCase().includes("REFUND") ||
          n.title.toLowerCase().includes("wallet") ||
          n.title.toLowerCase().includes("refund")
        );
      }
      return true;
    });
  }, [notifications, activeFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span>Alerts & Activity</span>
          </span>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Notification Center
            {unreadCount > 0 && (
              <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full ring-2 ring-amber-100">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Match confirmations, slot reservations, automated refunds, and promotional alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={() => fetchNotifs(true)}
            disabled={isRefreshing || loading}
            title="Refresh notifications"
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold text-xs flex items-center space-x-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#059669]" : ""}`}
            />
          </button>

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
      </div>

      {/* 2. Web Push Notification Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-50 via-[#ECFDF5] to-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-pitch-card">
        {pushStatus === "granted" ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Browser Web Push Notifications Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleSound}
                title={soundActive ? "Mute notification chime" : "Enable notification chime"}
                className="p-1.5 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
              >
                {soundActive ? (
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        ) : pushStatus === "denied" ? (
          <div className="flex items-center space-x-2.5 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Push notifications are blocked in your browser. Enable them in site settings to receive live match pass notifications.
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-emerald-glow">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  Enable Instant Web Push Notifications
                </p>
                <p className="text-[11px] text-slate-500">
                  Receive real-time match passes, slot confirmations, and cancellation credits even when this tab is closed.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              disabled={requestingPush}
              className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-emerald-glow transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              {requestingPush ? "Enabling..." : "🔔 Enable Web Push"}
            </button>
          </div>
        )}
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: "ALL", label: "All Activity" },
          { key: "UNREAD", label: `Unread (${unreadCount})` },
          { key: "BOOKING", label: "Match Passes" },
          { key: "WALLET", label: "Turf Cash" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === tab.key
                ? "bg-[#059669] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Notification List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-slate-400" />}
          title={activeFilter === "UNREAD" ? "No unread alerts" : "Your inbox is clear"}
          description={
            activeFilter === "UNREAD"
              ? "All your notifications have been marked as read."
              : "You don't have any notifications right now. New booking updates, payment receipts, and slot reminders will appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isBooking =
              n.notification_type?.toUpperCase().includes("BOOKING") ||
              n.title.toLowerCase().includes("match pass");
            const isWallet =
              n.notification_type?.toUpperCase().includes("PAYMENT") ||
              n.notification_type?.toUpperCase().includes("REFUND") ||
              n.title.toLowerCase().includes("wallet");

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer group ${
                  n.is_read
                    ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-2xs"
                    : "bg-[#F0FDF4] border-emerald-300 text-slate-900 shadow-sm hover:border-emerald-400 ring-1 ring-emerald-400/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                        isBooking
                          ? "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                          : isWallet
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {isBooking ? (
                        <Ticket className="w-5 h-5" />
                      ) : isWallet ? (
                        <Wallet className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-extrabold ${
                            n.is_read ? "text-slate-800" : "text-slate-900"
                          }`}
                        >
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[#059669] text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(n.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {n.notification_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover:text-[#059669] flex items-center space-x-0.5 font-bold transition-colors">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
