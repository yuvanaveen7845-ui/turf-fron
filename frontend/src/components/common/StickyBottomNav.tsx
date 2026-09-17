import React from "react";
import { NavLink } from "react-router-dom";
import { Compass, CalendarCheck, Shield, User, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const StickyBottomNav: React.FC = () => {
  const { user } = useAuth();
  const walletBalance = user?.customer_profile?.wallet_balance;

  const destinations = [
    {
      label: "Explore",
      to: "/",
      icon: Compass,
    },
    {
      label: "Grounds",
      to: "/turfs",
      icon: Shield,
    },
    {
      label: "Bookings",
      to: "/my-bookings",
      icon: CalendarCheck,
    },
    {
      label: "Wallet",
      to: "/wallet",
      icon: Wallet,
      badge: walletBalance !== undefined ? `₹${Number(walletBalance)}` : undefined,
    },
    {
      label: "Profile",
      to: "/profile",
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
    >
      <div className="h-16 max-w-lg mx-auto px-4 flex items-center justify-between">
        {destinations.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all group ${
                  isActive ? "text-[#059669]" : "text-slate-500 hover:text-slate-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                      }`}
                    />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-3 px-1 py-0.2 bg-emerald-100 text-[#059669] text-[9px] font-black rounded-full border border-emerald-300 scale-90">
                        {item.badge}
                      </span>
                    )}
                    {/* Subtle Emerald Dot Indicator for Active State */}
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#059669] rounded-full shadow-[0_0_6px_#059669]" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-semibold tracking-tight truncate max-w-[56px] text-center ${
                      isActive ? "font-bold text-[#059669]" : "text-slate-500"
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
