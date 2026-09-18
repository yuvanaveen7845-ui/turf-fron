/**
 * Web Push & Browser Native Notification Service
 * Manages browser push permissions, sound alerts, and native OS notifications
 * for Friends Turf Match Passes, Booking Confirmations, and Slot Reminders.
 */

export type PushPermissionStatus = "granted" | "denied" | "default" | "unsupported";

const PUSH_STORAGE_KEY = "friends_turf_web_push_enabled";
const PUSH_SOUND_KEY = "friends_turf_push_sound_enabled";

/**
 * Check if the current browser environment supports the Web Notification API
 */
export const isPushSupported = (): boolean => {
  return typeof window !== "undefined" && "Notification" in window;
};

/**
 * Get the current browser notification permission status
 */
export const getPushPermissionStatus = (): PushPermissionStatus => {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission as PushPermissionStatus;
};

/**
 * Check if the user has explicitly opted into web push notifications in the app
 */
export const isPushNotificationsEnabled = (): boolean => {
  if (!isPushSupported()) return false;
  const storedPref = localStorage.getItem(PUSH_STORAGE_KEY);
  return Notification.permission === "granted" && storedPref !== "false";
};

/**
 * Check if push audio sound effect is enabled
 */
export const isPushSoundEnabled = (): boolean => {
  return localStorage.getItem(PUSH_SOUND_KEY) !== "false";
};

/**
 * Toggle push audio sound setting
 */
export const setPushSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(PUSH_SOUND_KEY, enabled ? "true" : "false");
};

/**
 * Play an athletic notification chime (synthetic Web Audio API, zero external asset dependency)
 */
export const playNotificationChime = (): void => {
  if (!isPushSoundEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Pleasant high-pitch dual chime
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.15); // D5
    playTone(880.0, now + 0.08, 0.25); // A5
  } catch (err) {
    // Audio context may be restricted by autoplay policy
  }
};

/**
 * Request Web Push notification permission from the user
 */
export const requestPushPermission = async (): Promise<{
  status: PushPermissionStatus;
  granted: boolean;
}> => {
  if (!isPushSupported()) {
    return { status: "unsupported", granted: false };
  }

  try {
    const result = await Notification.requestPermission();
    const granted = result === "granted";

    if (granted) {
      localStorage.setItem(PUSH_STORAGE_KEY, "true");
      // Play chime and dispatch a welcome notification
      playNotificationChime();
      sendBrowserPushNotification({
        title: "Friends Turf Alerts Active ⚽",
        body: "Real-time match passes, slot confirmations & refund updates are now enabled!",
        tag: "welcome-alert",
      });
    } else {
      localStorage.setItem(PUSH_STORAGE_KEY, "false");
    }

    return { status: result as PushPermissionStatus, granted };
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return { status: getPushPermissionStatus(), granted: false };
  }
};

/**
 * Dispatch a native browser push notification
 */
export interface BrowserPushOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
  onClickUrl?: string;
  silent?: boolean;
}

export const sendBrowserPushNotification = (options: BrowserPushOptions): boolean => {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const iconUrl = options.icon || "/favicon.png";
    const notification = new Notification(options.title, {
      body: options.body,
      icon: iconUrl,
      badge: "/favicon.png",
      tag: options.tag || "friends-turf-notification",
      silent: options.silent || false,
    });

    if (!options.silent) {
      playNotificationChime();
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClickUrl) {
        window.location.href = options.onClickUrl;
      }
    };

    return true;
  } catch (err) {
    console.error("Failed to send browser notification:", err);
    return false;
  }
};

/**
 * Send a sample/test match notification
 */
export const sendTestPushNotification = (): boolean => {
  return sendBrowserPushNotification({
    title: "Match Pass Verified! ⚽ (Test Alert)",
    body: "Pitch 3 — Strikers Multi-Sport Dome is reserved. Tap to view your match pass.",
    tag: `test-alert-${Date.now()}`,
    onClickUrl: "/my-bookings",
  });
};
