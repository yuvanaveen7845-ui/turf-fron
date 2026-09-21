import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  support_email?: string;
  website: string;
  instagram?: string;
  whatsapp?: string;
  timezone?: string;
  currency?: string;
  gstin?: string;
  logo_url?: string;
}

export interface BookingRules {
  advanceBookingDays: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  slotHoldMinutes: number;
  cancellationFullRefundHours: number;
  cancellationPartialRefundHours: number;
  partialRefundPercent: number;
  allowRescheduling: boolean;
  rescheduleCutoffHours: number;
}

export interface OperatingHours {
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  bufferTimeMinutes: number;
  allowMidnightBookings: boolean;
}

export interface PaymentSettings {
  gateway: string;
  mode: string;
  upiId?: string;
  enableSplitDeposit: boolean;
  advanceDepositPercent: number;
  taxPercentage: number;
  isTaxIncluded: boolean;
  minSlotPrice?: number;
  minTopUpAmount?: number;
}

export interface CheckInSettings {
  windowOpenMinutes: number;
  gracePeriodMinutes: number;
  allowManualOverride: boolean;
  requireOverrideReason: boolean;
}

export interface NotificationSettings {
  sendConfirmationImmediately: boolean;
  reminder24h: boolean;
  reminder2h: boolean;
  postMatchFeedbackHours: number;
}

export interface BusinessSettingsState {
  company: CompanySettings;
  booking: BookingRules;
  hours: OperatingHours;
  payments: PaymentSettings;
  checkin: CheckInSettings;
  notifications: NotificationSettings;
  features: Record<string, boolean>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

export const DEFAULT_SETTINGS: Omit<BusinessSettingsState, "loading" | "refreshSettings"> = {
  company: {
    name: "Friends Turf",
    tagline: "PLAY HARD. BOOK DIRECT. OWN THE PITCH.",
    address: "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)",
    phone: "+91 93619 89494",
    email: "contact@friendsturf.com",
    support_email: "support@friendsturf.com",
    website: "https://friendsturf.com",
    instagram: "@friendsturf_tiruppur",
    whatsapp: "+91 93639 89494",
    timezone: "Asia/Kolkata",
    currency: "INR",
    gstin: "33ABCDE1234F1Z5",
    logo_url: "/logo.png",
  },
  booking: {
    advanceBookingDays: 14,
    minDurationMinutes: 60,
    maxDurationMinutes: 180,
    slotHoldMinutes: 5,
    cancellationFullRefundHours: 24,
    cancellationPartialRefundHours: 6,
    partialRefundPercent: 50,
    allowRescheduling: true,
    rescheduleCutoffHours: 6,
  },
  hours: {
    openTime: "06:00",
    closeTime: "23:00",
    slotDurationMinutes: 60,
    bufferTimeMinutes: 0,
    allowMidnightBookings: false,
  },
  payments: {
    gateway: "RAZORPAY",
    mode: "TEST",
    upiId: "friendsturf@okhdfcbank",
    enableSplitDeposit: true,
    advanceDepositPercent: 50,
    taxPercentage: 18,
    isTaxIncluded: true,
    minSlotPrice: 100,
    minTopUpAmount: 10,
  },
  checkin: {
    windowOpenMinutes: 30,
    gracePeriodMinutes: 30,
    allowManualOverride: true,
    requireOverrideReason: true,
  },
  notifications: {
    sendConfirmationImmediately: true,
    reminder24h: true,
    reminder2h: true,
    postMatchFeedbackHours: 2,
  },
  features: {
    RECURRING_BOOKINGS: true,
    PARTIAL_PAYMENTS: true,
    WALK_IN_BOOKINGS: true,
    DYNAMIC_PRICING: true,
    QR_CHECKIN: true,
    ONLINE_PAYMENTS: true,
    OFFLINE_PAYMENTS: true,
    COUPONS: true,
    REVIEWS: true,
    ADVANCED_REPORTING: true,
  },
};

const BusinessSettingsContext = createContext<BusinessSettingsState>({
  ...DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
});

export const BusinessSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/auth/settings/");
      if (res.data) {
        setSettings({
          company: { ...DEFAULT_SETTINGS.company, ...(res.data.company || {}) },
          booking: { ...DEFAULT_SETTINGS.booking, ...(res.data.booking || {}) },
          hours: { ...DEFAULT_SETTINGS.hours, ...(res.data.hours || {}) },
          payments: { ...DEFAULT_SETTINGS.payments, ...(res.data.payments || {}) },
          checkin: { ...DEFAULT_SETTINGS.checkin, ...(res.data.checkin || {}) },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...(res.data.notifications || {}) },
          features: { ...DEFAULT_SETTINGS.features, ...(res.data.features || {}) },
        });
      }
    } catch (err) {
      console.warn("Using fallback business settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <BusinessSettingsContext.Provider
      value={{
        ...settings,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </BusinessSettingsContext.Provider>
  );
};

export const useBusinessSettings = () => useContext(BusinessSettingsContext);
