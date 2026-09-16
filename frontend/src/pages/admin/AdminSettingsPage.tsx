import React, { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  CreditCard,
  Bell,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Smartphone,
  Mail,
  Sliders,
  Loader2,
} from "lucide-react";
import api from "../../services/api";

export const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "features" | "company" | "booking" | "hours" | "payments" | "notifications"
  >("features");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Business Feature Flags
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
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
  });

  // Settings State
  const [companySettings, setCompanySettings] = useState({
    name: "Friends Turf",
    tagline: "PLAY HARD. BOOK DIRECT. OWN THE PITCH.",
    address: "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)",
    phone: "+91 93619 89494",
    email: "contact@friendsturf.com",
    website: "https://friendsturf.com",
    instagram: "@friendsturf_tiruppur",
    whatsapp: "+91 93639 89494",
  });

  const [bookingRules, setBookingRules] = useState({
    advanceBookingDays: 14,
    minDurationMinutes: 60,
    maxDurationMinutes: 180,
    slotHoldMinutes: 5,
    cancellationFullRefundHours: 24,
    cancellationPartialRefundHours: 12,
    partialRefundPercent: 50,
    allowRescheduling: true,
    rescheduleCutoffHours: 6,
  });

  const [operatingHours, setOperatingHours] = useState({
    openTime: "06:00",
    closeTime: "23:00",
    slotDurationMinutes: 60,
    bufferTimeMinutes: 0,
    allowMidnightBookings: false,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    gateway: "RAZORPAY",
    mode: "TEST",
    keyId: "rzp_test_FriendsTurf2026",
    keySecret: "••••••••••••••••••••",
    upiId: "friendsturf@okhdfcbank",
    enableSplitDeposit: true,
    advanceDepositPercent: 50,
    taxPercentage: 18,
    isTaxIncluded: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    whatsappEnabled: true,
    smsEnabled: true,
    emailEnabled: true,
    sendConfirmationImmediately: true,
    reminder24h: true,
    reminder2h: true,
    postMatchFeedbackHours: 2,
  });

  // Load backend settings
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/auth/settings/"),
      api.get("/auth/features/"),
    ])
      .then(([settingsRes, featuresRes]) => {
        if (settingsRes.data.company) setCompanySettings(settingsRes.data.company);
        if (settingsRes.data.booking) setBookingRules(settingsRes.data.booking);
        if (settingsRes.data.hours) setOperatingHours(settingsRes.data.hours);
        if (settingsRes.data.payments) setPaymentSettings(settingsRes.data.payments);
        if (settingsRes.data.notifications) setNotificationSettings(settingsRes.data.notifications);
        if (featuresRes.data) setFeatureFlags((prev) => ({ ...prev, ...featuresRes.data }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        api.post("/auth/settings/", {
          company: companySettings,
          booking: bookingRules,
          hours: operatingHours,
          payments: paymentSettings,
          notifications: notificationSettings,
        }),
        api.put("/auth/features/", featureFlags),
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      alert("Failed to save settings to server.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
            System Configuration
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform & Business Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure company branding, booking engine rules, payment gateway keys, and automated reminder triggers
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#ECFDF5] border border-emerald-200 text-[#059669] rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "features", label: "Business Features", icon: Sliders },
          { id: "company", label: "Company & Branding", icon: Building2 },
          { id: "booking", label: "Booking & Policy Rules", icon: Calendar },
          { id: "hours", label: "Operating Hours", icon: Clock },
          { id: "payments", label: "Payments & Tax", icon: CreditCard },
          { id: "notifications", label: "Notifications & Reminders", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                active
                  ? "bg-[#059669] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Forms */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-6">
        {/* Tab 0: Business Feature Flags */}
        {activeTab === "features" && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Business Capability & Feature Toggles
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Turn key platform capabilities on or off for Friends Turf. Changes take effect across client views immediately upon save.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  key: "DYNAMIC_PRICING",
                  title: "Dynamic Surge Pricing",
                  desc: "Automatically apply peak hour, weekend, and weather surge multipliers to turf hourly rates.",
                },
                {
                  key: "PARTIAL_PAYMENTS",
                  title: "Split Deposit / Partial Payments",
                  desc: "Allow customers to book with a 50% advance deposit and settle balance at ground check-in.",
                },
                {
                  key: "RECURRING_BOOKINGS",
                  title: "Recurring League & Squad Slots",
                  desc: "Enable recurring weekly slots for corporate teams and competitive squads.",
                },
                {
                  key: "WALK_IN_BOOKINGS",
                  title: "Ground Walk-In Registrations",
                  desc: "Enable on-the-spot physical customer booking directly from staff operations desk.",
                },
                {
                  key: "QR_CHECKIN",
                  title: "Live QR Turnstile Scanner",
                  desc: "Enable fast-pass QR camera scanning for automated contactless ground check-in.",
                },
                {
                  key: "ONLINE_PAYMENTS",
                  title: "Razorpay Gateway Online Checkout",
                  desc: "Accept UPI, credit/debit cards, and netbanking through secure Razorpay integration.",
                },
                {
                  key: "OFFLINE_PAYMENTS",
                  title: "Cash Drawer & Register Accounting",
                  desc: "Permit physical cash collection and manual daily drawer reconciliation by staff.",
                },
                {
                  key: "COUPONS",
                  title: "Promotional Coupons & Vouchers",
                  desc: "Permit checkout discount codes and coupon campaigns for marketing promotions.",
                },
                {
                  key: "REVIEWS",
                  title: "Customer Reviews & Star Ratings",
                  desc: "Allow verified turf players to submit pitch quality ratings and feedback.",
                },
                {
                  key: "ADVANCED_REPORTING",
                  title: "Advanced Financial Analytics",
                  desc: "Enable occupancy telemetry, revenue breakdown, and exportable reconciliation reports.",
                },
              ].map((flag) => {
                const isEnabled = !!featureFlags[flag.key];
                return (
                  <label
                    key={flag.key}
                    className={`flex items-start justify-between p-4 rounded-2xl border transition cursor-pointer ${
                      isEnabled
                        ? "bg-[#ECFDF5]/50 border-emerald-200"
                        : "bg-[#F8FAFC] border-slate-200"
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {flag.title}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            isEnabled
                              ? "bg-[#059669] text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isEnabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {flag.desc}
                      </p>
                      <code className="text-[10px] font-mono text-slate-400 block pt-0.5">
                        {flag.key}
                      </code>
                    </div>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) =>
                        setFeatureFlags({
                          ...featureFlags,
                          [flag.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 mt-1 accent-[#059669] rounded cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Company Info */}
        {activeTab === "company" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Company Identity & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Company / Venue Name
                </label>
                <input
                  type="text"
                  value={companySettings.name}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, name: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={companySettings.tagline}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, tagline: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Official Ground Address
                </label>
                <input
                  type="text"
                  value={companySettings.address}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, address: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Primary Contact Phone
                </label>
                <input
                  type="text"
                  value={companySettings.phone}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, phone: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={companySettings.email}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, email: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Booking Rules */}
        {activeTab === "booking" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Booking Engine & Refund Policy Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Advance Booking Window (Days)
                </label>
                <input
                  type="number"
                  value={bookingRules.advanceBookingDays}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      advanceBookingDays: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  Customers can book up to {bookingRules.advanceBookingDays} days in advance
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Checkout Slot Hold Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={bookingRules.slotHoldMinutes}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      slotHoldMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  Temporary lock expires automatically after {bookingRules.slotHoldMinutes} mins
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Refund Threshold (Hours before match)
                </label>
                <input
                  type="number"
                  value={bookingRules.cancellationFullRefundHours}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      cancellationFullRefundHours: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  100% wallet credit if cancelled &gt; {bookingRules.cancellationFullRefundHours} hours before match
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Partial Refund Threshold (Hours before match)
                </label>
                <input
                  type="number"
                  value={bookingRules.cancellationPartialRefundHours}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      cancellationPartialRefundHours: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  {bookingRules.partialRefundPercent}% refund between {bookingRules.cancellationPartialRefundHours} and {bookingRules.cancellationFullRefundHours} hours
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Operating Hours */}
        {activeTab === "hours" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Facility Operating Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Daily Opening Time
                </label>
                <input
                  type="time"
                  value={operatingHours.openTime}
                  onChange={(e) =>
                    setOperatingHours({ ...operatingHours, openTime: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Daily Closing Time
                </label>
                <input
                  type="time"
                  value={operatingHours.closeTime}
                  onChange={(e) =>
                    setOperatingHours({ ...operatingHours, closeTime: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Default Match Slot Duration
                </label>
                <select
                  value={operatingHours.slotDurationMinutes}
                  onChange={(e) =>
                    setOperatingHours({
                      ...operatingHours,
                      slotDurationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                >
                  <option value={60}>60 Minutes (Standard 1 Hour)</option>
                  <option value={90}>90 Minutes (1.5 Hours)</option>
                  <option value={120}>120 Minutes (2 Hours)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payments & Taxes */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Payment Gateway & Tax Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Primary Payment Gateway
                </label>
                <select
                  value={paymentSettings.gateway}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, gateway: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                >
                  <option value="RAZORPAY">Razorpay (Cards, UPI, Netbanking)</option>
                  <option value="CASHFREE">Cashfree Payments</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Gateway Environment
                </label>
                <select
                  value={paymentSettings.mode}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, mode: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                >
                  <option value="TEST">Test / Sandbox (Simulation)</option>
                  <option value="LIVE">Live Production Mode</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Venue UPI ID (For on-spot QR payments)
                </label>
                <input
                  type="text"
                  value={paymentSettings.upiId}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, upiId: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Advance Deposit Ratio (%)
                </label>
                <input
                  type="number"
                  value={paymentSettings.advanceDepositPercent}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      advanceDepositPercent: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  Allow customers to pay {paymentSettings.advanceDepositPercent}% now and rest at ground
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Automated Reminders */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Automated Reminders & Dispatch Channels
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.sendConfirmationImmediately}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      sendConfirmationImmediately: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#059669] rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Instant Booking Confirmation Pass
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Send QR pass & digital receipt immediately upon payment capture
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.reminder24h}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      reminder24h: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#059669] rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    24-Hour Match Eve Reminder
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Alert team captain 24 hours prior to match kick-off
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.reminder2h}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      reminder2h: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#059669] rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    2-Hour Match Day Readiness Alert
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Send directions, parking instructions, and QR quick-pass link
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Submit Save Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
