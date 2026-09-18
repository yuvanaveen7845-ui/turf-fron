import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  Zap,
  ShieldCheck,
  Ticket,
  Wallet,
  Sparkles,
  Calendar,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { Notification } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  isPushSupported,
  getPushPermissionStatus,
  requestPushPermission,
  isPushSoundEnabled,
  setPushSoundEnabled,
  PushPermissionStatus,
} from "../../services/webPush";

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationOverlay: React.FC<NotificationOverlayProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UNREAD" | "BOOKING" | "WALLET" | "REMINDER">("ALL");

  // Push notification state
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>("default");
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [requestingPush, setRequestingPush] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync push status & sound preference
  useEffect(() => {
    if (isPushSupported()) {
      setPushStatus(getPushPermissionStatus());
      setSoundActive(isPushSoundEnabled());
    }
  }, [isOpen]);

  // Fetch notifications
  const fetchNotifications = async (showToast = false) => {
    if (!user) return;
    try {
      if (showToast) setIsRefreshing(true);
      else setLoading(true);

      const res = await api.get("/notifications/");
      const notifs: Notification[] = res.data.notifications || [];
      const unreadCount = res.data.unread_count ?? notifs.filter((n) => !n.is_read).length;

      setNotifications(notifs);
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }

      if (showToast) {
        toast.success("Notifications updated!");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close when clicking outside on desktop
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (onUnreadCountChange) onUnreadCountChange(0);
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Error marking all read:", err);
      toast.error("Failed to mark notifications as read.");
    }
  };

  // Mark single notification as read & optionally navigate
  const handleNotificationClick = async (notif: Notification) => {
    // 1. Mark as read on server if unread
    if (!notif.is_read) {
      try {
        await api.put(`/notifications/${notif.id}/read/`, {});
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        const newUnread = notifications.filter((n) => n.id !== notif.id && !n.is_read).length;
        if (onUnreadCountChange) onUnreadCountChange(newUnread);
      } catch (err) {
        console.error("Error marking read:", err);
      }
    }

    // 2. Intelligent Context Routing based on notification payload or type
    onClose();
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
    } else if (type.includes("COUPON") || title.includes("offer") || title.includes("discount")) {
      navigate("/offers");
    } else {
      navigate("/my-bookings");
    }
  };

  // Handle single mark read without opening
  const handleSingleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read/`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      const newUnread = notifications.filter((n) => n.id !== id && !n.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(newUnread);
    } catch (err) {
      console.error("Error marking single read:", err);
    }
  };

  // Request Web Push Permission
  const handleEnablePush = async () => {
    setRequestingPush(true);
    try {
      const res = await requestPushPermission();
      setPushStatus(res.status);
      if (res.granted) {
        toast.success("Web push notifications enabled! You'll receive real-time alerts.");
      } else if (res.status === "denied") {
        toast.warning("Push notifications were denied. You can enable them in browser settings.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingPush(false);
    }
  };

  // Toggle Sound Effect
  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setPushSoundEnabled(next);
    toast.info(next ? "Notification sounds enabled" : "Notification sounds muted");
  };

  // Filtered list
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
      if (activeFilter === "REMINDER") {
        return (
          n.notification_type?.toUpperCase().includes("REMINDER") ||
          n.title.toLowerCase().includes("reminder")
        );
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (visible on all screens to click-away close) */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Overlay Popover / Drawer Container */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notification Center"
        className="fixed z-50 transition-all duration-200 ease-out
          inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl
          sm:inset-auto sm:top-18 sm:right-6 sm:bottom-auto sm:max-h-[640px] sm:w-[440px] sm:rounded-3xl
          bg-white border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
      >
        {/* Mobile Swipe / Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* ─── 1. Header ─── */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-[#059669] flex items-center justify-center shrink-0">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full ring-2 ring-amber-100 animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Live match passes, slot confirmations & refunds
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={isRefreshing || loading}
              title="Refresh notifications"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#059669]" : ""}`}
              />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#059669] font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* ─── 2. Web Push Notification Status & Action Banner ─── */}
        <div className="p-3 px-4 bg-gradient-to-r from-slate-50 via-[#F0FDF4] to-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          {pushStatus === "granted" ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Web Push Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleSound}
                  title={soundActive ? "Mute notification chime" : "Enable notification chime"}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
                >
                  {soundActive ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          ) : pushStatus === "denied" ? (
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 w-full">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Push alerts blocked in browser. Allow in site settings for instant pass delivery.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-900 leading-tight">Enable Push Alerts</p>
                  <p className="text-[10px] text-slate-500 leading-tight truncate">
                    Instant match passes & slot reminders
                  </p>
                </div>
              </div>
              <button
                onClick={handleEnablePush}
                disabled={requestingPush}
                className="px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-[11px] shadow-emerald-glow transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {requestingPush ? "Enabling..." : "Turn On"}
              </button>
            </div>
          )}
        </div>

        {/* ─── 3. Filter Tabs ─── */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white">
          {[
            { key: "ALL", label: "All" },
            { key: "UNREAD", label: `Unread (${unreadCount})` },
            { key: "BOOKING", label: "Passes ⚽" },
            { key: "WALLET", label: "Turf Cash 💳" },
            { key: "REMINDER", label: "Reminders ⏰" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.key
                  ? "bg-[#059669] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── 4. Notifications Scrollable Feed ─── */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1 overscroll-contain">
          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const type = notif.notification_type?.toUpperCase() || "";
              const isBooking =
                type.includes("BOOKING") || notif.title.toLowerCase().includes("match pass");
              const isWallet =
                type.includes("PAYMENT") ||
                type.includes("REFUND") ||
                notif.title.toLowerCase().includes("wallet");
              const isReminder =
                type.includes("REMINDER") || notif.title.toLowerCase().includes("reminder");

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl transition-all flex items-start space-x-3 cursor-pointer group relative ${
                    notif.is_read
                      ? "hover:bg-slate-50/80 bg-white"
                      : "bg-[#F0FDF4]/80 hover:bg-[#F0FDF4] border border-emerald-200/70 shadow-2xs"
                  }`}
                >
                  {/* Dynamic Category Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                      isBooking
                        ? "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                        : isWallet
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : isReminder
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {isBooking ? (
                      <Ticket className="w-4.5 h-4.5" />
                    ) : isWallet ? (
                      <Wallet className="w-4.5 h-4.5" />
                    ) : isReminder ? (
                      <Clock className="w-4.5 h-4.5" />
                    ) : (
                      <Bell className="w-4.5 h-4.5" />
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <p
                          className={`text-xs font-extrabold truncate ${
                            notif.is_read ? "text-slate-800" : "text-slate-900"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping shrink-0" />
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="capitalize font-medium">
                        {new Date(notif.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      <div className="flex items-center space-x-2">
                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={(e) => handleSingleMarkRead(e, notif.id)}
                            title="Mark as read"
                            className="text-[#059669] hover:text-[#047857] font-bold flex items-center space-x-0.5 cursor-pointer opacity-80 hover:opacity-100"
                          >
                            <Check className="w-3 h-3" />
                            <span>Read</span>
                          </button>
                        )}
                        <span className="text-slate-400 group-hover:text-[#059669] flex items-center space-x-0.5 transition-colors font-bold">
                          <span>Open</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-[#059669] flex items-center justify-center mx-auto shadow-2xs">
                <Bell className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-900">
                  {activeFilter === "UNREAD" ? "No unread alerts" : "You're all caught up!"}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  New match passes, real-time slot confirmations, and cancellation credits will appear here instantly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── 5. Footer Quick Bar ─── */}
        <div className="p-3 px-4 border-t border-slate-100 bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-700">Friends Turf Live Sync</span>
          </div>

          <button
            onClick={() => {
              onClose();
              navigate("/my-bookings");
            }}
            className="text-[11px] font-extrabold text-[#059669] hover:text-[#047857] flex items-center space-x-1 cursor-pointer"
          >
            <span>My Bookings</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </>
  );
};
