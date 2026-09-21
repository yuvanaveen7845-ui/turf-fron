import React from "react";
import { NavLink } from "react-router-dom";
import { Compass, CalendarCheck, Shield, User, Wallet, LayoutDashboard, QrCode } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const StickyBottomNav: React.FC = () => {
  const { user } = useAuth();
  const rawBalance = user?.customer_profile?.wallet_balance;

  // Format wallet balance cleanly for mobile badge
  const walletBadge = React.useMemo(() => {
    if (rawBalance === undefined || rawBalance === null) return undefined;
    const val = Number(rawBalance);
    if (val <= 0) return undefined;
    if (val >= 10000) {
      return `₹${(val / 1000).toFixed(0)}k`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    }
    return `₹${Math.round(val)}`;
  }, [rawBalance]);

  const destinations = React.useMemo(() => {
    if (user?.role === "ADMIN" || user?.is_superuser) {
      return [
        { label: "Explore", to: "/", icon: Compass },
        { label: "Grounds", to: "/turfs", icon: Shield },
        { label: "Operations", to: "/admin", icon: LayoutDashboard },
        { label: "Bookings", to: "/admin/bookings", icon: CalendarCheck },
        { label: "Profile", to: "/profile", icon: User },
      ];
    }
    if (user?.role === "STAFF") {
      return [
        { label: "Explore", to: "/", icon: Compass },
        { label: "Grounds", to: "/turfs", icon: Shield },
        { label: "Shift", to: "/staff", icon: LayoutDashboard },
        { label: "Scanner", to: "/staff/scanner", icon: QrCode },
        { label: "Profile", to: "/profile", icon: User },
      ];
    }
    return [
      { label: "Explore", to: "/", icon: Compass },
      { label: "Grounds", to: "/turfs", icon: Shield },
      { label: "Bookings", to: "/my-bookings", icon: CalendarCheck },
      {
        label: "Wallet",
        to: "/wallet",
        icon: Wallet,
        badge: walletBadge,
      },
      { label: "Profile", to: user ? "/profile" : "/login", icon: User },
    ];
  }, [user, walletBadge]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 rounded-t-3xl shadow-[0_-8px_32px_rgba(15,23,42,0.08)] md:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))] ring-1 ring-slate-900/[0.03]"
    >
      {/* Subtle Island Top Accent Line */}
      <div className="absolute top-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-[#10B981]/50 to-transparent rounded-full pointer-events-none" />

      <div className="max-w-md mx-auto px-2 pt-2 pb-0.5 flex items-center justify-around">
        {destinations.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-transform duration-150 group active:scale-95 select-none ${
                  isActive ? "text-[#059669]" : "text-slate-500 hover:text-slate-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative flex items-center justify-center w-12 h-7.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-100/90 text-[#059669] shadow-2xs scale-105"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? "stroke-[2.5] text-[#059669]" : "stroke-[1.8]"
                      }`}
                    />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[#059669] text-white text-[9px] font-black rounded-full shadow-2xs ring-1 ring-white tracking-tight">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[62px] text-center transition-colors ${
                      isActive ? "font-black text-[#059669]" : "font-bold text-slate-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
