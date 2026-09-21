/**
 * Lightweight Haptic Feedback utility for native mobile feel on touch devices.
 * Uses navigator.vibrate when supported, with silent fallback on desktop / unsupported browsers.
 */

export const triggerHaptic = (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
) => {
  if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'success':
        navigator.vibrate([15, 40, 20]);
        break;
      case 'warning':
        navigator.vibrate([20, 30, 20]);
        break;
      case 'error':
        navigator.vibrate([40, 40, 40, 40]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Ignore any browser security restrictions for vibration
  }
};
