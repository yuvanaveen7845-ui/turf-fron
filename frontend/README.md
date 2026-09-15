# ⚽ Friends Turf - Frontend Client Application

A modern, responsive, sports-themed Turf Booking & Ground Operations web application built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**.

---

## 🌟 Features & Portals

### 1. 🏃 Customer Portal
- **Hero & Discovery**: Filter turfs by sport (Football, Cricket, Multi-sport) and location.
- **Dynamic Slot Booking**: 10-day calendar slot matrix with dynamic pricing badges (Weekend surge, morning deals).
- **5-Minute Slot Lock**: Temporary reservation timer to prevent double booking during checkout.
- **Payment Flow**: Full payment, 50% partial advance deposit, and simulated payment outcomes (Success, Failure, Network Timeout).
- **Match Pass Tickets**: Printable match ticket with base64 JWT QR Code.
- **Self-Service Dashboard**: Reschedule or cancel bookings with automated wallet refund.
- **Wallet & Loyalty**: Add funds to wallet, earn loyalty points on bookings, and convert points to wallet cash.
- **Memberships & Offers**: Silver, Gold, Platinum plans and promotional coupons (`WELCOME100`, `TURF20`).
- **Reviews & Feedback**: Submit star ratings with facility and staff breakdown.

### 2. 🛡️ Staff Operations Portal (`/staff`)
- **Today's Schedule**: Real-time match schedule and current pitch status.
- **Live QR Scanner (`/staff/scanner`)**: Camera and manual code scanner (`html5-qrcode`) with tamper-proof token validation and duplicate entry prevention.
- **Walk-in Booking Desk (`/staff/walk-in`)**: Fast on-site cash booking for players walking into the facility.
- **Booking Search (`/staff/search`)**: Real-time lookup by Booking Reference or phone number.
- **Gate Check-In Logs (`/staff/logs`)**: Timestamped entry logs.

### 3. ⚙️ Admin Control Center (`/admin`)
- **Overview KPIs**: Bookings, revenue, occupancy rate, 7-day revenue trend area chart, and peak hours distribution.
- **Turf & Facility Inventory (`/admin/turfs`)**: Add or edit turfs, amenities, and slot configs.
- **Master Bookings (`/admin/bookings`)**: All system reservations with filter and status management.
- **Dynamic Pricing Rules (`/admin/pricing`)**: Weekend surges, night lighting, and morning discounts.
- **Coupons & Deals (`/admin/coupons`)**: Promotional code creation and usage caps.
- **Customer CRM (`/admin/customers`)**: Player profiles and direct wallet balance credit/debit adjuster.
- **Staff Roster (`/admin/staff`)**: Ground crew accounts and role permissions.
- **Maintenance Scheduler (`/admin/maintenance`)**: Pitch grooming and repair blocks that automatically lock customer slots.
- **Review Moderation (`/admin/reviews`)**: Public review management, flagging, and turf manager replies.
- **Financial Reports & Audit (`/admin/reports` & `/admin/audit`)**: Revenue reconciliation and security audit trail.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend Proxy
The development server is pre-configured in `vite.config.ts` to proxy `/api` requests to `http://127.0.0.1:8000`.

### 3. Run Development Server
```bash
npm run dev
```

Visit the app at: `http://127.0.0.1:5173/`

### 4. Build for Production
```bash
npm run build
```

---

## 🔑 Demo Access & Instant Role Switcher

You can switch roles instantly at any time using the **Role Switcher** dropdown in the top navigation bar, or log in on `/login` with:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@friendsturf.com` | `admin123` |
| **Staff** | `staff@friendsturf.com` | `staff123` |
| **Customer** | `customer@friendsturf.com` | `customer123` |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── assets/              # Icons and logos
│   ├── components/
│   │   ├── common/          # Navbar, Footer
│   │   └── layouts/         # CustomerLayout, StaffLayout, AdminLayout
│   ├── context/             # AuthContext (state + 1-click role switcher)
│   ├── pages/
│   │   ├── admin/           # 11 Admin Control pages
│   │   ├── auth/            # Login & Register
│   │   ├── customer/        # 12 Customer facing pages
│   │   └── staff/           # 5 Staff Ground Operations pages
│   ├── services/            # Axios API client with JWT interceptors
│   ├── types/               # TypeScript interfaces
│   ├── App.tsx              # Router definitions
│   ├── index.css            # Dark emerald theme & glassmorphism
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```
