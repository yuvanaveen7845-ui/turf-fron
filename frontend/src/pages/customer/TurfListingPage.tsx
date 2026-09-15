import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Filter,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";
import { Turf } from "../../types";

export const TurfListingPage: React.FC = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "rating">(
    "rating",
  );

  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => setTurfs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredTurfs = turfs
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase());
      const matchesSport =
        sportFilter === "ALL" || t.sport_type === sportFilter;
      return matchesSearch && matchesSport;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")
        return Number(a.base_price) - Number(b.base_price);
      if (sortBy === "price_desc")
        return Number(b.base_price) - Number(a.base_price);
      return Number(b.rating) - Number(a.rating);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Available Venues
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Explore Turfs & Book Slots
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          FIFA-certified turf grounds equipped with stadium floodlights and
          amenities
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue name, area or city..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Sport Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="ALL">All Sports</option>
            <option value="FOOTBALL">Football 7v7</option>
            <option value="CRICKET">Box Cricket</option>
            <option value="MULTI_SPORT">Multi-Sport Dome</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="rating">Top Rated (★)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-slate-900 rounded-3xl border border-slate-800"
            />
          ))}
        </div>
      ) : filteredTurfs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <p className="text-lg font-bold text-slate-300">
            No turfs match your filter.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSportFilter("ALL");
            }}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTurfs.map((turf) => (
            <div
              key={turf.id}
              className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
            >
              <div className="relative h-52 overflow-hidden bg-slate-800">
                <img
                  src={turf.images[0]}
                  alt={turf.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                    {turf.sport_type}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{turf.rating}</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {turf.name}
                  </h3>
                  <p className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{turf.location}</span>
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {turf.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {turf.facilities_data?.map((f) => (
                    <span
                      key={f.id}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium"
                    >
                      {f.name}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Base Price
                    </span>
                    <p className="text-xl font-black text-white">
                      ₹{turf.base_price}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / hr
                      </span>
                    </p>
                  </div>

                  <Link
                    to={`/turfs/${turf.id}`}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <span>View Slots</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
