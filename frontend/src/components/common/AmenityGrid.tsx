import React from "react";
import { ShieldCheck, Sun, Users, Car, Droplets, Sparkles, Target, Home } from "lucide-react";

export interface AmenityItem {
  id: string;
  title: string;
  subtext: string;
  icon: string;
}

interface AmenityGridProps {
  items?: AmenityItem[];
}

export const AmenityGrid: React.FC<AmenityGridProps> = ({ items }) => {
  const defaultAmenities: AmenityItem[] = [
    {
      id: "fifa",
      title: "FIFA-Grade Monofilament Turf",
      subtext: "50mm shock-padded artificial grass for max joint protection and true ball roll.",
      icon: "shield-check",
    },
    {
      id: "floodlights",
      title: "400W Anti-Glare Floodlights",
      subtext: "Evenly distributed stadium-grade sports LED lighting for crystal clear night games.",
      icon: "sun",
    },
    {
      id: "changing_rooms",
      title: "Lockers & Shower Dugouts",
      subtext: "Private changing rooms, clean shower cubicles, and shaded tactical benches.",
      icon: "home",
    },
    {
      id: "parking",
      title: "Secure Parking & Chilled Water",
      subtext: "Designated 2-wheeler and 4-wheeler parking with 24/7 security and RO stations.",
      icon: "car",
    },
  ];

  const amenityList = items && items.length >= 4 ? items.slice(0, 4) : defaultAmenities;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "sun":
        return <Sun className="w-5 h-5 text-[#059669]" />;
      case "home":
        return <Home className="w-5 h-5 text-[#059669]" />;
      case "car":
        return <Car className="w-5 h-5 text-[#059669]" />;
      case "droplets":
        return <Droplets className="w-5 h-5 text-[#059669]" />;
      case "target":
        return <Target className="w-5 h-5 text-[#059669]" />;
      case "sparkles":
        return <Sparkles className="w-5 h-5 text-[#059669]" />;
      case "users":
        return <Users className="w-5 h-5 text-[#059669]" />;
      case "shield-check":
      default:
        return <ShieldCheck className="w-5 h-5 text-[#059669]" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {amenityList.map((item) => (
        <div
          key={item.id}
          className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-all duration-200 flex items-start space-x-4 group"
        >
          {/* Circular Emerald Icon Badge */}
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            {renderIcon(item.icon)}
          </div>

          {/* Title & Subtext */}
          <div className="space-y-1">
            <h4 className="text-[15px] sm:text-[16px] font-bold text-slate-900 group-hover:text-[#059669] transition-colors">
              {item.title}
            </h4>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              {item.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
