import React from "react";
import { NavLink } from "react-router-dom";
import { Compass, CalendarCheck, Shield, User } from "lucide-react";

export const StickyBottomNav: React.FC = () => {
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
      label: "Profile",
      to: "/profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="h-16 max-w-lg mx-auto px-6 flex items-center justify-between">
        {destinations.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
                    {/* Subtle Emerald Dot Indicator for Active State */}
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#059669] rounded-full shadow-[0_0_6px_#059669]" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] mt-1 font-semibold tracking-tight ${
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
