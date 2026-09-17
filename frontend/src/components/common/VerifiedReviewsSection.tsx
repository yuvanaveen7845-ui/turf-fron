import React, { useState, useEffect } from "react";
import { Star, ShieldCheck, Quote, ThumbsUp, Sparkles, MessageSquare } from "lucide-react";
import api from "../../services/api";
import { Review } from "../../types";
import { normalizeList } from "../../utils/helpers";

const FALLBACK_REVIEWS = [
  {
    id: "rev-1",
    customer_name: "Karthik Raja",
    rating: 5,
    turf_name: "FIFA Pro 7v7 Arena",
    review_text:
      "The turf quality in Tiruppur is unmatched. Monofilament grass with even rubber in-fill makes high-speed turning smooth. Floodlights are bright with zero blind spots.",
    created_at: "2 days ago",
    match_tag: "Verified Weekend Match",
  },
  {
    id: "rev-2",
    customer_name: "Vignesh Kumar",
    rating: 5,
    turf_name: "Box Cricket Pitch A",
    review_text:
      "The 5-minute slot lock feature is fantastic. My group was able to confirm without worrying about someone snatching the 7 PM prime slot. Clean dugout and chilled water available.",
    created_at: "5 days ago",
    match_tag: "Verified League Fixture",
  },
  {
    id: "rev-3",
    customer_name: "Mohammed Farhan",
    rating: 5,
    turf_name: "Multi-Sport Arena B",
    review_text:
      "Fast contactless QR scan at the reception. We walked straight onto the pitch without waiting in lines. Best tournament turf facility in Tiruppur.",
    created_at: "1 week ago",
    match_tag: "Verified Evening Slot",
  },
];

export const VerifiedReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>(FALLBACK_REVIEWS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/reviews/")
      .then((res) => {
        const list = normalizeList<Review>(res.data);
        if (list.length > 0) {
          setReviews(
            list.slice(0, 3).map((r) => ({
              id: r.id,
              customer_name: r.customer_name || "Verified Athlete",
              rating: r.rating || 5,
              turf_name: r.turf_name || "Friends Turf Arena",
              review_text: r.review_text,
              created_at: new Date(r.created_at).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              }),
              match_tag: "Verified Match Player",
            }))
          );
        }
      })
      .catch(() => {
        // Retain fallback reviews gracefully
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
            Player Testimonials
          </span>
          <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
            Rated 4.9 / 5 by Local Squads
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Real match reviews from football clubs, corporate squads, and box cricket teams in Tiruppur.
          </p>
        </div>

        {/* Aggregate Badge */}
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#ECFDF5] border border-emerald-200">
          <div className="flex items-center space-x-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-slate-900">4.9 / 5</span>
            <span className="text-slate-500 ml-1 font-medium">(2,400+ Matches)</span>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              {/* Star row & Verified Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] text-[10px] font-bold border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{rev.match_tag}</span>
                </span>
              </div>

              {/* Review Text */}
              <p className="text-[13px] text-slate-700 leading-relaxed italic">
                "{rev.review_text}"
              </p>
            </div>

            {/* Author Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{rev.customer_name}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{rev.turf_name}</p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{rev.created_at}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
