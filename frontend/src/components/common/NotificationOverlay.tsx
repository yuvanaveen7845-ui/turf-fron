import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
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
  ShieldCheck,
  AlertCircle,
  Trophy,
  ArrowUpRight,
  Flame,
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
        toast.success("Notifications updated");
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

  // Close when clicking outside or pressing Escape
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
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all read:", err);
      toast.error("Failed to mark notifications as read");
    }
  };

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif: Notification) => {
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
        toast.success("Web push alerts enabled for Friends Turf");
      } else if (res.status === "denied") {
        toast.warning("Push notifications were denied in your browser settings");
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
    toast.info(next ? "Notification sound enabled" : "Notification sound muted");
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

  // Smart parser to extract booking codes and clean titles
  const parseNotificationMeta = (title: string, message: string, type: string) => {
    const fullText = `${title} ${message}`;
    const codeMatch = fullText.match(/\b(FT-\d{2}-[A-Z0-9]{4,10})\b/i);
    const bookingCode = codeMatch ? codeMatch[1].toUpperCase() : null;

    // Clean title by removing the raw (FT-...) string so it reads cleanly
    const cleanTitle = title.replace(/\s*\([^)]*FT-[^)]*\)/gi, "").trim();

    // Categorization
    const tUpper = type?.toUpperCase() || "";
    const isBooking = tUpper.includes("BOOKING") || title.toLowerCase().includes("match pass") || title.toLowerCase().includes("pitch");
    const isWallet = tUpper.includes("PAYMENT") || tUpper.includes("WALLET") || tUpper.includes("REFUND") || title.toLowerCase().includes("wallet");
    const isReminder = tUpper.includes("REMINDER") || title.toLowerCase().includes("reminder");

    return {
      bookingCode,
      cleanTitle,
      isBooking,
      isWallet,
      isReminder,
    };
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[3px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Overlay Popover / Mobile Bottom Drawer */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Friends Turf Notification Center"
        className="fixed z-50 transition-all duration-300 ease-out
          inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl
          sm:inset-auto sm:top-20 sm:right-6 sm:bottom-auto sm:max-h-[660px] sm:w-[450px] sm:rounded-3xl
          bg-white/95 backdrop-blur-2xl border border-slate-200/90
          shadow-[0_24px_64px_-12px_rgba(15,23,42,0.22),0_0_0_1px_rgba(15,23,42,0.04)]
          flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 sm:zoom-in-95"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* ─── 1. Header Bar ─── */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/30" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Notifications
                  </h2>
                  {unreadCount > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black uppercase tracking-wider">
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                      Caught up
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Live match passes, slot alerts & wallet updates
                </p>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={isRefreshing || loading}
                title="Refresh notifications"
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#059669]" : ""}`}
                />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="h-8 px-2.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/60 hover:border-emerald-200/80 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px]">Mark read</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close notification shade"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 2. Web Push Notification Status / Permission Strip ─── */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          {pushStatus === "granted" ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 text-slate-700 font-semibold text-[11px]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Real-time Live Sync Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleToggleSound}
                  title={soundActive ? "Mute notification chime" : "Enable notification chime"}
                  className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white text-[11px] font-medium flex items-center space-x-1 border border-transparent hover:border-slate-200/70 transition-all cursor-pointer"
                >
                  {soundActive ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-slate-600">Chime On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">Muted</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : pushStatus === "denied" ? (
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 w-full py-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Browser alerts blocked. Allow in site settings for instant passes.</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2 py-0.5">
              <div className="flex items-center space-x-2 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <p className="text-[11px] font-bold text-slate-800 truncate">
                  Get instant match pass & slot alerts
                </p>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={requestingPush}
                className="px-3 py-1 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-[11px] shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {requestingPush ? "Enabling..." : "Turn On"}
              </button>
            </div>
          )}
        </div>

        {/* ─── 3. Segmented Filter Tabs ─── */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { key: "ALL", label: "All", count: notifications.length },
              { key: "UNREAD", label: "Unread", count: unreadCount },
              { key: "BOOKING", label: "Passes" },
              { key: "WALLET", label: "Turf Cash" },
              { key: "REMINDER", label: "Reminders" },
            ].map((tab) => {
              const isSelected = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#059669] text-white shadow-xs"
                      : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                        isSelected
                          ? "bg-white/25 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 4. Notifications Feed List ─── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 overscroll-contain">
          {loading ? (
            <div className="space-y-3 py-2 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const meta = parseNotificationMeta(
                notif.title,
                notif.message,
                notif.notification_type || ""
              );

              // Distinct badges by category
              const badgeConfig = meta.isBooking
                ? {
                    icon: Ticket,
                    bg: "bg-emerald-50",
                    border: "border-emerald-200/80",
                    text: "text-emerald-700",
                    accent: "border-l-emerald-500",
                    pill: "Match Pass",
                  }
                : meta.isWallet
                ? {
                    icon: Wallet,
                    bg: "bg-blue-50",
                    border: "border-blue-200/80",
                    text: "text-blue-700",
                    accent: "border-l-blue-500",
                    pill: "Turf Cash",
                  }
                : meta.isReminder
                ? {
                    icon: Clock,
                    bg: "bg-amber-50",
                    border: "border-amber-200/80",
                    text: "text-amber-700",
                    accent: "border-l-amber-500",
                    pill: "Reminder",
                  }
                : {
                    icon: Bell,
                    bg: "bg-slate-100",
                    border: "border-slate-200",
                    text: "text-slate-700",
                    accent: "border-l-emerald-500",
                    pill: "Alert",
                  };

              const IconComponent = badgeConfig.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer border ${
                    notif.is_read
                      ? "bg-slate-50/50 hover:bg-white border-slate-200/50 hover:border-slate-300 shadow-2xs"
                      : `bg-white border-slate-200/90 hover:border-emerald-400 shadow-[0_2px_10px_rgba(15,23,42,0.05)] hover:shadow-md border-l-[4px] ${badgeConfig.accent}`
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-2xs ${badgeConfig.bg} ${badgeConfig.border} ${badgeConfig.text}`}
                    >
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Top Row: Category tag + Booking ID + Time */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeConfig.bg} ${badgeConfig.text}`}
                          >
                            {badgeConfig.pill}
                          </span>

                          {meta.bookingCode && (
                            <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                              {meta.bookingCode}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                          )}
                        </div>
                      </div>

                      {/* Notification Clean Title */}
                      <h4
                        className={`text-xs font-bold leading-snug ${
                          notif.is_read ? "text-slate-800" : "text-slate-900"
                        }`}
                      >
                        {meta.cleanTitle || notif.title}
                      </h4>

                      {/* Message Body */}
                      <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Footer Row: Date & Action CTA */}
                      <div className="flex items-center justify-between pt-1.5 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(notif.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </span>

                        <div className="flex items-center space-x-2">
                          {!notif.is_read && (
                            <button
                              type="button"
                              onClick={(e) => handleSingleMarkRead(e, notif.id)}
                              title="Mark as read"
                              className="text-slate-400 hover:text-emerald-700 font-bold flex items-center space-x-1 hover:bg-emerald-50/80 px-2 py-0.5 rounded-md transition-all cursor-pointer text-[10.5px]"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Read</span>
                            </button>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 group-hover:bg-[#059669] text-[#059669] group-hover:text-white font-bold text-[11px] flex items-center space-x-0.5 transition-all shadow-2xs">
                            <span>{meta.isBooking ? "View Pass" : meta.isWallet ? "View Wallet" : "Open"}</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Elegant Empty State */
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 text-[#059669] flex items-center justify-center mx-auto shadow-2xs">
                <Trophy className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {activeFilter === "UNREAD" ? "No unread alerts" : "You're all caught up, Player!"}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Real-time match passes, slot reservations, and wallet notifications will appear here instantly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── 5. Footer Bar ─── */}
        <div className="p-3.5 px-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-700">Official Friends Turf Arena</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/my-bookings");
            }}
            className="text-[11px] font-extrabold text-[#059669] hover:text-[#047857] flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span>My Bookings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationOverlay;
