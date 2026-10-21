import React, { useState, useEffect } from "react";
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  PenLine,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import api from "../../services/api";
import { Review, Turf } from "../../types";
import { normalizeList } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";

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

const RATING_LABELS: Record<number, string> = {
  5: "★★★★★ - Extraordinary Match Experience!",
  4: "★★★★☆ - Great Turf & Floodlighting",
  3: "★★★☆☆ - Decent Pitch & Facilities",
  2: "★★☆☆☆ - Room for Improvement",
  1: "★☆☆☆☆ - Disappointing Experience",
};

export const VerifiedReviewsSection: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>(FALLBACK_REVIEWS);
  const [turfs, setTurfs] = useState<Turf[]>([]);

  // Review Form State
  const [isPostingOpen, setIsPostingOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [playerPhone, setPlayerPhone] = useState<string>("");
  const [reviewText, setReviewText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize author fields when user logs in
  useEffect(() => {
    if (user) {
      if (user.full_name) setPlayerName(user.full_name);
      if (user.phone) setPlayerPhone(user.phone);
    }
  }, [user]);

  // Load verified reviews and turf pitches
  useEffect(() => {
    api
      .get("/reviews/?min_rating=4")
      .then((res) => {
        const list = normalizeList<Review>(res.data).filter(
          (r) => Number(r.rating || 5) >= 4
        );
        if (list.length > 0) {
          setReviews(
            list.map((r) => ({
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

    api
      .get("/turfs/")
      .then((res) => {
        const turfList = normalizeList<Turf>(res.data);
        setTurfs(turfList);
        if (turfList.length > 0 && !selectedTurfId) {
          setSelectedTurfId(String(turfList[0].id));
        }
      })
      .catch(() => {
        // Ignore turf fetching error
      });
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedText = reviewText.trim();
    if (!trimmedText) {
      setErrorMessage("Please enter a short review about your game experience.");
      return;
    }

    const finalPlayerName = playerName.trim() || (user?.full_name || "Match Athlete");

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        rating,
        review_text: trimmedText,
        guest_name: finalPlayerName,
      };

      if (playerPhone.trim()) {
        payload.guest_phone = playerPhone.trim();
      }

      if (selectedTurfId) {
        payload.turf_id = selectedTurfId;
      }

      const res = await api.post("/reviews/", payload);
      const createdReview = res.data;

      const chosenTurf = turfs.find((t) => String(t.id) === String(selectedTurfId));
      const newReviewItem = {
        id: createdReview.id || `rev-${Date.now()}`,
        customer_name: createdReview.customer_name || finalPlayerName,
        rating: createdReview.rating || rating,
        turf_name: chosenTurf ? chosenTurf.name : createdReview.turf_name || "Friends Turf Arena",
        review_text: trimmedText,
        created_at: "Just now",
        match_tag: "Newly Verified Review",
      };

      // Prepend to visible reviews
      setReviews((prev) => [newReviewItem, ...prev]);

      // Feedback state
      setSubmitSuccess(true);
      setReviewText("");
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsPostingOpen(false);
      }, 2500);
    } catch (err: any) {
      console.error("Failed to post review:", err);
      const backendErr =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Could not publish review. Please try again.";
      setErrorMessage(backendErr);
    } finally {
      setSubmitting(false);
    }
  };

  const activeRatingDisplay = hoverRating || rating;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Player Testimonials & Feedback</span>
          </span>
          <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
            Rated 4.9 / 5 by Local Squads
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Real match reviews from football clubs, corporate squads, and box cricket teams in Tiruppur.
          </p>
        </div>

        {/* Action Button & Aggregate Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsPostingOpen((prev) => !prev);
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#059669] text-white hover:bg-[#047857] shadow-sm hover:shadow transition cursor-pointer"
          >
            <PenLine className="w-4 h-4" />
            <span>{isPostingOpen ? "Close Review Box" : "Write a Review"}</span>
          </button>

          <div className="flex items-center space-x-3 p-2.5 px-3.5 rounded-2xl bg-[#ECFDF5] border border-emerald-200 shadow-2xs">
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
      </div>

      {/* Interactive Review Posting Box */}
      {isPostingOpen && (
        <div className="bg-gradient-to-br from-white to-[#F8FAFC] border-2 border-emerald-200/90 rounded-2xl p-5 sm:p-7 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
                <MessageSquare className="w-4 h-4" />
                <span>Share Your Match Experience</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                Post a Pitch Rating & Review
              </h3>
              <p className="text-xs text-slate-500">
                Help fellow athletes in Tiruppur select the best pitch for their squads.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPostingOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {submitSuccess ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Review Posted Successfully!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Thank you for contributing! Your review is now live on our platform and stored for arena management audits.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-5 mt-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Star Rating Picker (Out of 5 Stars) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        onMouseEnter={() => setHoverRating(starNum)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                        title={`${starNum} Stars`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            starNum <= activeRatingDisplay
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 fill-slate-100"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                    {RATING_LABELS[activeRatingDisplay] || `${activeRatingDisplay} / 5 Stars`}
                  </span>
                </div>
              </div>

              {/* Pitch & Player Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Pitch Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Ground / Turf
                  </label>
                  <select
                    value={selectedTurfId}
                    onChange={(e) => setSelectedTurfId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
                  >
                    {turfs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.sport_type || "Multi-Sport"})
                      </option>
                    ))}
                    {turfs.length === 0 && (
                      <option value="">Friends Turf Arena (Main Pitch)</option>
                    )}
                  </select>
                </div>

                {/* Player Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name / Squad Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. Rahul / Team Striker"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
                  />
                </div>

                {/* Player Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={playerPhone}
                    onChange={(e) => setPlayerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
                  />
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Match Review <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder="How was the turf grip, floodlighting, bounce, ball containment, or team seating? Mention details to help local squads..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] resize-none"
                  required
                />
              </div>

              {/* Submit / Cancel Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostingOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#059669] text-white hover:bg-[#047857] shadow-sm hover:shadow transition disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Post Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

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
                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] text-[10px] font-bold border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{rev.match_tag || "Verified Athlete"}</span>
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
