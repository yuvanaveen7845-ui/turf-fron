import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { BusinessSettingsProvider } from "./context/BusinessSettingsContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Layouts (small — kept eager)
import { CustomerLayout } from "./components/layouts/CustomerLayout";
import { StaffLayout } from "./components/layouts/StaffLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";

import { lazyWithRetry } from "./utils/lazyWithRetry";
import { ChunkErrorBoundary } from "./components/common/ChunkErrorBoundary";

// Auth Pages (Lazy loaded on demand with auto-reload recovery)
const LoginPage = lazyWithRetry(() =>
  import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazyWithRetry(() =>
  import("./pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazyWithRetry(() =>
  import("./pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazyWithRetry(() =>
  import("./pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const AccessDeniedPage = lazyWithRetry(() =>
  import("./pages/auth/AccessDeniedPage").then((m) => ({ default: m.AccessDeniedPage }))
);
const UnauthorizedPage = lazyWithRetry(() =>
  import("./pages/auth/UnauthorizedPage").then((m) => ({ default: m.UnauthorizedPage }))
);

// ─── Customer Facing Pages ───
// Eagerly bundled for instant 0ms initial landing
import { HomePage } from "./pages/customer/HomePage";

// Route-level code-split with automatic deployment reload recovery
const TurfListingPage = lazyWithRetry(() =>
  import("./pages/customer/TurfListingPage").then((m) => ({ default: m.TurfListingPage }))
);
const TurfDetailPage = lazyWithRetry(() =>
  import("./pages/customer/TurfDetailPage").then((m) => ({ default: m.TurfDetailPage }))
);
const BookingCheckoutPage = lazyWithRetry(() =>
  import("./pages/customer/BookingCheckoutPage").then((m) => ({ default: m.BookingCheckoutPage }))
);
const BookingConfirmationPage = lazyWithRetry(() =>
  import("./pages/customer/BookingConfirmationPage").then((m) => ({ default: m.BookingConfirmationPage }))
);
const MyBookingsPage = lazyWithRetry(() =>
  import("./pages/customer/MyBookingsPage").then((m) => ({ default: m.MyBookingsPage }))
);
const WalletPage = lazyWithRetry(() =>
  import("./pages/customer/WalletPage").then((m) => ({ default: m.WalletPage }))
);
const OffersPage = lazyWithRetry(() =>
  import("./pages/customer/OffersPage").then((m) => ({ default: m.OffersPage }))
);
const ProfilePage = lazyWithRetry(() =>
  import("./pages/customer/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const NotificationsPage = lazyWithRetry(() =>
  import("./pages/customer/NotificationsPage").then((m) => ({ default: m.NotificationsPage }))
);
const PaymentCallbackPage = lazyWithRetry(() =>
  import("./pages/customer/PaymentCallbackPage").then((m) => ({ default: m.PaymentCallbackPage }))
);
const TermsOfServicePage = lazyWithRetry(() =>
  import("./pages/customer/TermsOfServicePage").then((m) => ({ default: m.TermsOfServicePage }))
);
const PrivacyPolicyPage = lazyWithRetry(() =>
  import("./pages/customer/PrivacyPolicyPage").then((m) => ({ default: m.PrivacyPolicyPage }))
);

// ─── Lazy-loaded Print Document Templates ──────────────────────────────────
const PrintMatchPassPage = lazyWithRetry(() =>
  import("./pages/print/PrintMatchPassPage").then((m) => ({ default: m.PrintMatchPassPage }))
);
const PrintReceiptPage = lazyWithRetry(() =>
  import("./pages/print/PrintReceiptPage").then((m) => ({ default: m.PrintReceiptPage }))
);
const PrintReportPage = lazyWithRetry(() =>
  import("./pages/print/PrintReportPage").then((m) => ({ default: m.PrintReportPage }))
);

// ─── Lazy-loaded Staff Pages ────────────────────────────────────────────────
const StaffDashboardPage = lazyWithRetry(() =>
  import("./pages/staff/StaffDashboardPage").then((m) => ({ default: m.StaffDashboardPage }))
);
const StaffQRScannerPage = lazyWithRetry(() =>
  import("./pages/staff/StaffQRScannerPage").then((m) => ({ default: m.StaffQRScannerPage }))
);
const StaffWalkInPage = lazyWithRetry(() =>
  import("./pages/staff/StaffWalkInPage").then((m) => ({ default: m.StaffWalkInPage }))
);
const StaffBookingSearchPage = lazyWithRetry(() =>
  import("./pages/staff/StaffBookingSearchPage").then((m) => ({ default: m.StaffBookingSearchPage }))
);
const StaffCheckinLogsPage = lazyWithRetry(() =>
  import("./pages/staff/StaffCheckinLogsPage").then((m) => ({ default: m.StaffCheckinLogsPage }))
);

// ─── Lazy-loaded Admin Pages ────────────────────────────────────────────────
const AdminDashboardPage = lazyWithRetry(() =>
  import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminSchedulePage = lazyWithRetry(() =>
  import("./pages/admin/AdminSchedulePage").then((m) => ({ default: m.AdminSchedulePage }))
);
const ManageBookingsPage = lazyWithRetry(() =>
  import("./pages/admin/ManageBookingsPage").then((m) => ({ default: m.ManageBookingsPage }))
);
const ManageTurfsPage = lazyWithRetry(() =>
  import("./pages/admin/ManageTurfsPage").then((m) => ({ default: m.ManageTurfsPage }))
);
const ManagePricingPage = lazyWithRetry(() =>
  import("./pages/admin/ManagePricingPage").then((m) => ({ default: m.ManagePricingPage }))
);
const ManageCouponsPage = lazyWithRetry(() =>
  import("./pages/admin/ManageCouponsPage").then((m) => ({ default: m.ManageCouponsPage }))
);
const ManageCustomersPage = lazyWithRetry(() =>
  import("./pages/admin/ManageCustomersPage").then((m) => ({ default: m.ManageCustomersPage }))
);
const ManageStaffPage = lazyWithRetry(() =>
  import("./pages/admin/ManageStaffPage").then((m) => ({ default: m.ManageStaffPage }))
);
const ManageMaintenancePage = lazyWithRetry(() =>
  import("./pages/admin/ManageMaintenancePage").then((m) => ({ default: m.ManageMaintenancePage }))
);
const ManageReviewsPage = lazyWithRetry(() =>
  import("./pages/admin/ManageReviewsPage").then((m) => ({ default: m.ManageReviewsPage }))
);
const ManageQRPage = lazyWithRetry(() =>
  import("./pages/admin/ManageQRPage").then((m) => ({ default: m.ManageQRPage }))
);
const ManagePaymentsPage = lazyWithRetry(() =>
  import("./pages/admin/ManagePaymentsPage").then((m) => ({ default: m.ManagePaymentsPage }))
);
const ManageRefundsPage = lazyWithRetry(() =>
  import("./pages/admin/ManageRefundsPage").then((m) => ({ default: m.ManageRefundsPage }))
);
const DailyOperationsPage = lazyWithRetry(() =>
  import("./pages/admin/DailyOperationsPage").then((m) => ({ default: m.DailyOperationsPage }))
);
const SystemHealthPage = lazyWithRetry(() =>
  import("./pages/admin/SystemHealthPage").then((m) => ({ default: m.SystemHealthPage }))
);
const AdminReportsPage = lazyWithRetry(() =>
  import("./pages/admin/AdminReportsPage").then((m) => ({ default: m.AdminReportsPage }))
);
const AuditLogsPage = lazyWithRetry(() =>
  import("./pages/admin/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage }))
);
const AdminSettingsPage = lazyWithRetry(() =>
  import("./pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage }))
);

import { FriendsTurfLoadingScreen } from "./components/common/FriendsTurfLoadingScreen";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { QuickActionAnywhere } from "./components/common/QuickActionAnywhere";

/** Premium Athletic Stadium Loading Screen while lazy chunks load */
const PageSuspenseFallback = () => <FriendsTurfLoadingScreen />;

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <BusinessSettingsProvider>
        <AuthProvider>
          <PermissionProvider>
            <RealtimeProvider>
              <ChunkErrorBoundary>
                <Routes>
                {/* Auth & Access Routes */}
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <LoginPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <RegisterPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <ForgotPasswordPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <ResetPasswordPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/access-denied"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <AccessDeniedPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/unauthorized"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <UnauthorizedPage />
                    </Suspense>
                  }
                />

                {/* Customer Facing Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/turfs" element={<TurfListingPage />} />
                  <Route path="/turfs/:id" element={<TurfDetailPage />} />
                  <Route path="/checkout" element={<BookingCheckoutPage />} />
                  <Route path="/confirmation/:bookingId" element={<BookingConfirmationPage />} />
                  <Route path="/bookings/confirmation/:bookingId" element={<BookingConfirmationPage />} />
                  <Route path="/my-bookings" element={<MyBookingsPage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/loyalty" element={<Navigate to="/wallet" replace />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/payment-callback" element={<PaymentCallbackPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                </Route>

                {/* Standalone Print-Optimized Document Routes (No Navbars/Sidebars) */}
                <Route
                  path="/print/pass/:bookingId"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <PrintMatchPassPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/print/receipt/:identifier"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <PrintReceiptPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/print/report"
                  element={
                    <Suspense fallback={<PageSuspenseFallback />}>
                      <PrintReportPage />
                    </Suspense>
                  }
                />

                {/* Staff Portal Protected Routes */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                      <StaffLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<StaffDashboardPage />} />
                  <Route
                    path="scanner"
                    element={
                      <ProtectedRoute requiredFeature="QR_CHECKIN">
                        <StaffQRScannerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="check-in"
                    element={
                      <ProtectedRoute requiredFeature="QR_CHECKIN">
                        <StaffQRScannerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="walk-in"
                    element={
                      <ProtectedRoute requiredFeature="WALK_IN_BOOKINGS">
                        <StaffWalkInPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="search" element={<StaffBookingSearchPage />} />
                  <Route path="logs" element={<StaffCheckinLogsPage />} />
                </Route>

                {/* Admin Control Center Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="schedule" element={<AdminSchedulePage />} />
                  <Route path="operations" element={<DailyOperationsPage />} />
                  <Route
                    path="scanner"
                    element={
                      <ProtectedRoute requiredFeature="QR_CHECKIN">
                        <StaffQRScannerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="check-in"
                    element={
                      <ProtectedRoute requiredFeature="QR_CHECKIN">
                        <StaffQRScannerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="qr-management"
                    element={
                      <ProtectedRoute requiredFeature="QR_CHECKIN">
                        <ManageQRPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="bookings" element={<ManageBookingsPage />} />
                  <Route path="payments" element={<ManagePaymentsPage />} />
                  <Route
                    path="refunds"
                    element={
                      <ProtectedRoute requiredPermission="PAYMENT_REFUND">
                        <ManageRefundsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="turfs" element={<ManageTurfsPage />} />
                  <Route
                    path="pricing"
                    element={
                      <ProtectedRoute requiredPermission="PRICING_VIEW" requiredFeature="DYNAMIC_PRICING">
                        <ManagePricingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="maintenance"
                    element={
                      <ProtectedRoute requiredPermission="FACILITY_EDIT">
                        <ManageMaintenancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="coupons"
                    element={
                      <ProtectedRoute
                        requiredPermission="COUPONS_MANAGE"
                        requiredFeature="COUPONS"
                      >
                        <ManageCouponsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reviews"
                    element={
                      <ProtectedRoute requiredFeature="REVIEWS">
                        <ManageReviewsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="customers"
                    element={
                      <ProtectedRoute requiredPermission="CUSTOMER_VIEW">
                        <ManageCustomersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="staff"
                    element={
                      <ProtectedRoute requiredPermission="STAFF_VIEW">
                        <ManageStaffPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <ProtectedRoute requiredPermission="REPORT_VIEW" requiredFeature="ADVANCED_REPORTING">
                        <AdminReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="audit"
                    element={
                      <ProtectedRoute requiredPermission="AUDIT_VIEW">
                        <AuditLogsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="health" element={<SystemHealthPage />} />
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute requiredPermission="SETTINGS_VIEW">
                        <AdminSettingsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ChunkErrorBoundary>
            {/* Global Quick Action & Scanner FAB (Active for Staff & Admin throughout website) */}
            <QuickActionAnywhere />
          </RealtimeProvider>
        </PermissionProvider>
      </AuthProvider>
      </BusinessSettingsProvider>
    </BrowserRouter>
  );
};

export default App;
