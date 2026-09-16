import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Layouts
import { CustomerLayout } from "./components/layouts/CustomerLayout";
import { StaffLayout } from "./components/layouts/StaffLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { AccessDeniedPage } from "./pages/auth/AccessDeniedPage";
import { UnauthorizedPage } from "./pages/auth/UnauthorizedPage";

// Customer Pages
import { HomePage } from "./pages/customer/HomePage";
import { TurfListingPage } from "./pages/customer/TurfListingPage";
import { TurfDetailPage } from "./pages/customer/TurfDetailPage";
import { BookingCheckoutPage } from "./pages/customer/BookingCheckoutPage";
import { BookingConfirmationPage } from "./pages/customer/BookingConfirmationPage";
import { MyBookingsPage } from "./pages/customer/MyBookingsPage";
import { WalletPage } from "./pages/customer/WalletPage";
import { LoyaltyPage } from "./pages/customer/LoyaltyPage";
import { OffersPage } from "./pages/customer/OffersPage";
import { ProfilePage } from "./pages/customer/ProfilePage";
import { NotificationsPage } from "./pages/customer/NotificationsPage";

// Staff Pages
import { StaffDashboardPage } from "./pages/staff/StaffDashboardPage";
import { StaffQRScannerPage } from "./pages/staff/StaffQRScannerPage";
import { StaffWalkInPage } from "./pages/staff/StaffWalkInPage";
import { StaffBookingSearchPage } from "./pages/staff/StaffBookingSearchPage";
import { StaffCheckinLogsPage } from "./pages/staff/StaffCheckinLogsPage";

// Admin Pages
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminSchedulePage } from "./pages/admin/AdminSchedulePage";
import { ManageBookingsPage } from "./pages/admin/ManageBookingsPage";
import { ManageTurfsPage } from "./pages/admin/ManageTurfsPage";
import { ManagePricingPage } from "./pages/admin/ManagePricingPage";
import { ManageCouponsPage } from "./pages/admin/ManageCouponsPage";
import { ManageCustomersPage } from "./pages/admin/ManageCustomersPage";
import { ManageStaffPage } from "./pages/admin/ManageStaffPage";
import { ManageMaintenancePage } from "./pages/admin/ManageMaintenancePage";
import { ManageReviewsPage } from "./pages/admin/ManageReviewsPage";
import { ManageQRPage } from "./pages/admin/ManageQRPage";
import { ManagePaymentsPage } from "./pages/admin/ManagePaymentsPage";
import { ManageRefundsPage } from "./pages/admin/ManageRefundsPage";
import { DailyOperationsPage } from "./pages/admin/DailyOperationsPage";
import { SystemHealthPage } from "./pages/admin/SystemHealthPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <RealtimeProvider>
            <Routes>
              {/* Auth & Access Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Customer Facing Routes (Public / Customer) */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/turfs" element={<TurfListingPage />} />
                <Route path="/turfs/:id" element={<TurfDetailPage />} />
                <Route path="/checkout" element={<BookingCheckoutPage />} />
                <Route
                  path="/confirmation/:bookingId"
                  element={<BookingConfirmationPage />}
                />
                <Route
                  path="/bookings/confirmation/:bookingId"
                  element={<BookingConfirmationPage />}
                />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/loyalty" element={<LoyaltyPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

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
                <Route path="scanner" element={<StaffQRScannerPage />} />
                <Route path="check-in" element={<StaffQRScannerPage />} />
                <Route path="walk-in" element={<StaffWalkInPage />} />
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
                <Route path="qr-management" element={<ManageQRPage />} />
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
                    <ProtectedRoute requiredPermission="PRICING_VIEW">
                      <ManagePricingPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="coupons" element={<ManageCouponsPage />} />
                <Route path="customers" element={<ManageCustomersPage />} />
                <Route
                  path="staff"
                  element={
                    <ProtectedRoute requiredPermission="STAFF_VIEW">
                      <ManageStaffPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="maintenance" element={<ManageMaintenancePage />} />
                <Route path="reviews" element={<ManageReviewsPage />} />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute requiredPermission="REPORT_VIEW">
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

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RealtimeProvider>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

