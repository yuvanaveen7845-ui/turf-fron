/**
 * Centralized API Endpoints Directory for Friends Turf.
 * Maps every backend Django REST Framework endpoint with consistent path structure.
 */

export const ENDPOINTS = {
  // Authentication & User Management
  auth: {
    login: "/auth/login/",
    register: "/auth/register/",
    me: "/auth/me/",
    refresh: "/auth/refresh/",
    google: "/auth/google/",
    forgotPassword: "/auth/forgot-password/",
    resetPassword: "/auth/reset-password/",
    features: "/auth/features/",
    settings: "/auth/settings/",
    customers: "/auth/customers/",
    customerDetail: (id: string | number) => `/auth/customers/${id}/`,
    customerCrm: (id: string | number) => `/auth/customers/${id}/crm/`,
    customerNotes: (id: string | number) => `/auth/customers/${id}/notes/`,
    customerNoteDelete: (customerId: string | number, noteId: number) =>
      `/auth/customers/${customerId}/notes/${noteId}/`,
    staffList: "/auth/b2b-users/",
    staffDetail: (id: string | number) => `/auth/b2b-users/${id}/`,
  },

  // Turfs & Facilities
  turfs: {
    list: "/turfs/",
    detail: (id: string | number) => `/turfs/${id}/`,
    availability: (id: string | number, date?: string) =>
      date ? `/turfs/${id}/availability/?date=${date}` : `/turfs/${id}/availability/`,
    schedule: (date?: string) => (date ? `/turfs/schedule/?date=${date}` : "/turfs/schedule/"),
    facilities: "/turfs/facilities/",
    uploadImage: "/turfs/upload-image/",
  },

  // Match Bookings
  bookings: {
    list: (tab?: string) => (tab ? `/bookings/?tab=${tab}` : "/bookings/"),
    detail: (idOrReference: string | number) => `/bookings/${idOrReference}/`,
    lock: "/bookings/lock/",
    previewPrice: "/bookings/preview-price/",
    cancel: (id: string | number) => `/bookings/${id}/cancel/`,
    reschedule: (id: string | number) => `/bookings/${id}/reschedule/`,
    offlinePayment: (id: string | number) => `/bookings/${id}/offline-payment/`,
    walkIn: "/bookings/staff/walk-in/",
    staffToday: "/bookings/staff/today/",
  },

  // Payments & Cash Drawer
  payments: {
    list: "/payments/",
    stats: "/payments/stats/",
    manualCollect: "/payments/manual-collect/",
    razorpayCreateOrder: "/payments/razorpay/create-order/",
    razorpayVerify: "/payments/razorpay/verify/",
    refunds: "/payments/refunds/",
    processRefund: (paymentId: string | number) => `/payments/${paymentId}/refund/`,
    receipt: (bookingIdOrPaymentId: string | number) =>
      `/payments/${bookingIdOrPaymentId}/receipt/`,
    dailyCash: "/payments/daily-cash/",
    reconciliation: "/payments/reconciliation/",
    reconciliationResolve: "/payments/reconciliation/resolve/",
    cancellationQuote: (bookingId: string | number) =>
      `/payments/cancellation-quote/${bookingId}/`,
    exportCsv: "/payments/export/",
  },

  // Dynamic Pricing Engine
  pricing: {
    rules: "/pricing/rules/",
    ruleDetail: (id: string | number) => `/pricing/rules/${id}/`,
    simulate: "/pricing/rules/simulate/",
    conflicts: "/pricing/rules/conflicts/",
    holidays: "/pricing/holidays/",
    events: "/pricing/events/",
  },

  // Coupons & Promotions
  promotions: {
    coupons: "/promotions/coupons/",
    couponDetail: (id: string | number) => `/promotions/coupons/${id}/`,
    validateCoupon: "/promotions/coupons/validate/",
    referrals: "/promotions/referrals/",
  },

  // Wallet & Loyalty
  wallet: {
    balance: "/wallet/balance/",
    topUp: "/wallet/top-up/",
    loyalty: "/wallet/loyalty/",
    loyaltyRedeem: "/wallet/loyalty/redeem/",
    adminAdjust: "/wallet/admin/adjust/",
  },

  // QR System & Access Control
  qr: {
    scan: "/qr/scan/",
    override: "/qr/override/",
    pass: (bookingId: string | number) => `/qr/pass/${bookingId}/`,
    logs: "/qr/logs/",
    analytics: "/qr/analytics/",
    adminRevoke: "/qr/admin/revoke/",
    adminRegenerate: "/qr/admin/regenerate/",
  },

  // Reviews & Feedback
  reviews: {
    list: "/reviews/",
    analytics: "/reviews/analytics/",
    detail: (id: string | number) => `/reviews/${id}/`,
  },

  // Notifications
  notifications: {
    list: "/notifications/",
    markRead: (id: string | number) => `/notifications/${id}/read/`,
  },

  // Maintenance Management
  maintenance: {
    list: "/maintenance/",
    detail: (id: string | number) => `/maintenance/${id}/`,
    checkConflicts: "/maintenance/check-conflicts/",
  },

  // Business Intelligence & Reports
  reports: {
    dashboard: "/reports/dashboard/",
    dailySummary: (date?: string) =>
      date ? `/reports/daily-summary/?date=${date}` : "/reports/daily-summary/",
    exportCsv: (type: "bookings" | "revenue" | "utilization") =>
      `/reports/export-csv/?type=${type}`,
    globalSearch: (query: string) => `/reports/global-search/?q=${encodeURIComponent(query)}`,
    reconciliation: "/reports/reconciliation/",
    dailyOperations: (date?: string) =>
      date ? `/reports/daily-operations/?date=${date}` : "/reports/daily-operations/",
    dailyClose: "/reports/daily-close/",
    systemHealth: "/reports/system-health/",
  },

  // Squad Memberships
  memberships: {
    plans: "/memberships/plans/",
    myMembership: "/memberships/my-membership/",
  },

  // Audit Logs
  audit: {
    list: (resourceType?: string) =>
      resourceType ? `/audit/?resource_type=${resourceType}` : "/audit/",
  },

  // Server-Sent Events (SSE) & Realtime
  realtime: {
    stream: "/realtime/stream/",
    poll: "/realtime/poll/",
    publish: "/realtime/publish/",
  },
} as const;

export default ENDPOINTS;
