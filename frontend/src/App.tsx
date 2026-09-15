import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts
import { CustomerLayout } from "./components/layouts/CustomerLayout";
import { StaffLayout } from "./components/layouts/StaffLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// Customer Pages
import { HomePage } from "./pages/customer/HomePage";
import { TurfListingPage } from "./pages/customer/TurfListingPage";
import { TurfDetailPage } from "./pages/customer/TurfDetailPage";
import { BookingCheckoutPage } from "./pages/customer/BookingCheckoutPage";
import { BookingConfirmationPage } from "./pages/customer/BookingConfirmationPage";
import { MyBookingsPage } from "./pages/customer/MyBookingsPage";
import { WalletPage } from "./pages/customer/WalletPage";
import { LoyaltyPage } from "./pages/customer/LoyaltyPage";
import { MembershipPage } from "./pages/customer/MembershipPage";
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
import { ManageBookingsPage } from "./pages/admin/ManageBookingsPage";
import { ManageTurfsPage } from "./pages/admin/ManageTurfsPage";
import { ManagePricingPage } from "./pages/admin/ManagePricingPage";
import { ManageCouponsPage } from "./pages/admin/ManageCouponsPage";
import { ManageCustomersPage } from "./pages/admin/ManageCustomersPage";
import { ManageStaffPage } from "./pages/admin/ManageStaffPage";
import { ManageMaintenancePage } from "./pages/admin/ManageMaintenancePage";
import { ManageReviewsPage } from "./pages/admin/ManageReviewsPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/memberships" element={<MembershipPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Staff Portal Routes */}
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboardPage />} />
            <Route path="scanner" element={<StaffQRScannerPage />} />
            <Route path="walk-in" element={<StaffWalkInPage />} />
            <Route path="search" element={<StaffBookingSearchPage />} />
            <Route path="logs" element={<StaffCheckinLogsPage />} />
          </Route>

          {/* Admin Control Center Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="bookings" element={<ManageBookingsPage />} />
            <Route path="turfs" element={<ManageTurfsPage />} />
            <Route path="pricing" element={<ManagePricingPage />} />
            <Route path="coupons" element={<ManageCouponsPage />} />
            <Route path="customers" element={<ManageCustomersPage />} />
            <Route path="staff" element={<ManageStaffPage />} />
            <Route path="maintenance" element={<ManageMaintenancePage />} />
            <Route path="reviews" element={<ManageReviewsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
