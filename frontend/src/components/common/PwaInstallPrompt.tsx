import React, { useState, useEffect } from "react";
import {
  Download,
  X,
  Share,
  PlusSquare,
  Smartphone,
  CheckCircle,
  Sparkles,
  MapPin,
  Navigation,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { LocationModal } from "./LocationModal";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PwaInstallPrompt: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isPwaDismissed, setIsPwaDismissed] = useState(false);
  const [isLocationDismissed, setIsLocationDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Detect standalone / already installed
    const isStandaloneMode =
      (typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (window.navigator as any)?.standalone === true;
    setIsStandalone(Boolean(isStandaloneMode));

    // Detect iOS
    const userAgent = (window.navigator?.userAgent || "").toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check localStorage dismissals (3 days suppression)
    try {
      const pwaDismissedAt = localStorage.getItem("ft_pwa_dismissed");
      if (pwaDismissedAt) {
        const parsed = parseInt(pwaDismissedAt, 10);
        if (!isNaN(parsed) && Date.now() - parsed < 3 * 24 * 60 * 60 * 1000) {
          setIsPwaDismissed(true);
        }
      }

      const locDismissedAt = localStorage.getItem("ft_location_prompt_dismissed");
      if (locDismissedAt) {
        const parsed = parseInt(locDismissedAt, 10);
        if (!isNaN(parsed) && Date.now() - parsed < 3 * 24 * 60 * 60 * 1000) {
          setIsLocationDismissed(true);
        }
      }
    } catch {
      // LocalStorage unavailable
    }

    // Native install prompt listener
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Custom event listeners
    const handleTriggerCustomPwa = () => {
      setShowInstructions(true);
    };
    const handleTriggerCustomLoc = () => {
      setIsLocationModalOpen(true);
    };

    window.addEventListener("ft-trigger-pwa-install", handleTriggerCustomPwa);
    window.addEventListener("ft-open-location-modal", handleTriggerCustomLoc);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("ft-trigger-pwa-install", handleTriggerCustomPwa);
      window.removeEventListener("ft-open-location-modal", handleTriggerCustomLoc);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsPwaDismissed(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handlePwaDismiss = () => {
    setIsPwaDismissed(true);
    try {
      localStorage.setItem("ft_pwa_dismissed", String(Date.now()));
    } catch {}
  };

  const handleLocationDismiss = () => {
    setIsLocationDismissed(true);
    try {
      localStorage.setItem("ft_location_prompt_dismissed", String(Date.now()));
    } catch {}
  };

  // Visibility flags
  // Suppress completely on auth, administrative/staff, and payment routes
  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/verify-otp" ||
    location.pathname === "/b2b-login" ||
    location.pathname === "/admin-login" ||
    location.pathname.startsWith("/auth");

  const isAdminOrStaffRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/staff") ||
    location.pathname.startsWith("/scanner") ||
    location.pathname.startsWith("/reports");

  const isCheckoutOrPaymentRoute =
    location.pathname.includes("/checkout") ||
    location.pathname.includes("/payment");

  const isStaffOrAdmin = user?.role === "ADMIN" || user?.role === "STAFF";

  if (isAuthRoute || isAdminOrStaffRoute || isStaffOrAdmin || isCheckoutOrPaymentRoute) {
    return null;
  }

  // Visibility flags for customers
  const showPwaBanner = !isStandalone && !isPwaDismissed && (deferredPrompt !== null || isIos);
  const showLocationBanner = !isLocationDismissed;

  return (
    <>
      {/* Floating Top-Right Quick Action Pill (Compact, Clean, Human-Designed) */}
      <div className="fixed top-[76px] sm:top-[88px] right-3 sm:right-6 z-40 flex items-center pointer-events-none">
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.08)] rounded-full px-2.5 py-1.5 transition-all hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer group"
            title="Expand quick actions"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#059669] transition-colors" />
            <MapPin className="w-3.5 h-3.5 text-[#059669]" />
            <Smartphone className="w-3.5 h-3.5 text-[#059669]" />
          </button>
        ) : (
          <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.08)] rounded-full px-3 py-1.5 gap-2 transition-all hover:shadow-lg group">
            {/* Location Action */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#059669] transition cursor-pointer px-1 py-0.5 rounded-full hover:bg-slate-50"
              title="View ground location & directions"
            >
              <MapPin className="w-3.5 h-3.5 text-[#059669]" />
              <span>Directions</span>
            </button>

            {/* Divider */}
            <span className="w-px h-3.5 bg-slate-200" />

            {/* PWA Install Action */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#059669] transition cursor-pointer px-1 py-0.5 rounded-full hover:bg-slate-50"
              title="Install Friends Turf app on your phone"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#059669]" />
              <span>Install App</span>
            </button>

            {/* Minimize / Collapse Button */}
            <span className="w-px h-3.5 bg-slate-200" />
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-slate-400 hover:text-slate-700 transition rounded-full hover:bg-slate-100 cursor-pointer"
              title="Minimize quick actions"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Global Interactive Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Instructional Modal for iOS or manual install */}
      <Modal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Install Friends Turf on Your Phone
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Add to your home screen for lightning-fast 1-tap bookings
              </p>
            </div>
          </div>
        }
        maxWidth="md"
      >
        <div className="space-y-4 pt-1 text-xs">
          {deferredPrompt ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#059669] mx-auto" />
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Ready for 1-Tap Installation
                </div>
                <p className="text-slate-600 text-xs mt-1">
                  Click the button below to add Friends Turf directly to your home screen.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setShowInstructions(false);
                  handleInstallClick();
                }}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Install Friends Turf App
              </Button>
            </div>
          ) : isIos ? (
            <div className="space-y-3">
              <p className="text-slate-600 font-medium">
                To install this web app on your <strong>iPhone / iPad</strong>:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> Share button
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Located at the bottom of Safari on your phone.
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700" /> &quot;Add to Home Screen&quot;
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      This saves the app icon alongside your other games and apps.
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Tap &quot;Add&quot; in the top right corner</div>
                    <div className="text-slate-500 text-[11px]">
                      You can now launch Friends Turf instantly in full-screen mode!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-[#059669] mx-auto" />
              <div className="text-sm font-bold text-slate-900">
                Installation in Browser Menu
              </div>
              <p className="text-slate-600 text-xs">
                Open your browser menu (the 3 dots in Chrome/Edge) and select <strong>&quot;Install Friends Turf&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowInstructions(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
