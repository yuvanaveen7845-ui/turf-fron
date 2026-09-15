import React, { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  ShieldAlert,
  EyeOff,
  Eye,
  CornerDownRight,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
import api from "../../services/api";
import { Review } from "../../types";

export const ManageReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Reply modal
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/reviews/"), api.get("/reviews/analytics/")])
      .then(([rRes, aRes]) => {
        setReviews(rRes.data);
        setAnalytics(aRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleHide = async (review: Review) => {
    try {
      await api.patch(`/reviews/${review.id}/`, {
        is_hidden: !review.is_hidden,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFlag = async (review: Review) => {
    try {
      await api.patch(`/reviews/${review.id}/`, {
        is_flagged: !review.is_flagged,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    setSendingReply(true);
    try {
      await api.patch(`/reviews/${replyingReview.id}/`, {
        staff_reply: replyText.trim(),
      });
      setReplyingReview(null);
      setReplyText("");
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredReviews = reviews.filter(
    (r) =>
      r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.turf_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.review_text?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Reputation Management
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Customer Reviews & Ratings
          </h1>
        </div>

        <button
          onClick={fetchData}
          className="text-xs font-bold text-amber-400 hover:underline"
        >
          ↻ Refresh Feedback
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Overall Rating
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">
                {analytics.average_rating}
              </span>
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Based on {analytics.total_reviews} reviews
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pitch & Turf Quality
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {analytics.facility_rating} / 5.0
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Ground & lighting ratings
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Staff & Hospitality
            </div>
            <div className="text-2xl font-black text-blue-400">
              {analytics.staff_rating} / 5.0
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Customer service scores
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Flagged for Review
            </div>
            <div className="text-2xl font-black text-rose-400">
              {analytics.flagged_count}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Requires admin attention
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by player, turf, text..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Reviews Filtered:{" "}
          <strong className="text-white">{filteredReviews.length}</strong>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
            Loading customer reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
            No customer reviews found.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl border transition ${
                rev.is_hidden
                  ? "bg-slate-950/60 border-rose-900/30 opacity-70"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
                    {rev.customer_name?.[0] || "U"}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {rev.customer_name}
                      <span className="text-[11px] font-normal text-slate-500">
                        on {rev.turf_name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Booking Ref: {rev.booking_reference} •{" "}
                      {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{rev.rating} / 5</span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(rev)}
                    className={`p-1.5 rounded-lg border transition ${
                      rev.is_flagged
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                        : "text-slate-500 border-slate-800 hover:text-slate-300"
                    }`}
                    title={rev.is_flagged ? "Unflag Review" : "Flag Review"}
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleHide(rev)}
                    className={`p-1.5 rounded-lg border transition ${
                      rev.is_hidden
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                        : "text-slate-500 border-slate-800 hover:text-slate-300"
                    }`}
                    title={rev.is_hidden ? "Make Visible" : "Hide from Public"}
                  >
                    {rev.is_hidden ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Review Text */}
              <div className="py-3 text-xs text-slate-300 leading-relaxed">
                "{rev.review_text}"
              </div>

              {/* Ratings Breakdown */}
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 border-t border-slate-800/60 pt-3">
                <div>
                  Pitch Quality:{" "}
                  <strong className="text-white">
                    {rev.facility_rating}/5
                  </strong>
                </div>
                <div>
                  Staff Hospitality:{" "}
                  <strong className="text-white">{rev.staff_rating}/5</strong>
                </div>
                {rev.suggestions && (
                  <div className="text-slate-400 italic">
                    Suggestion: "{rev.suggestions}"
                  </div>
                )}
              </div>

              {/* Staff Response */}
              {(rev.admin_response || (rev as any).staff_reply) && (
                <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs">
                  <CornerDownRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                      Turf Manager Response
                    </div>
                    <p className="text-slate-300">
                      {rev.admin_response || (rev as any).staff_reply}
                    </p>
                  </div>
                </div>
              )}

              {/* Reply Button */}
              {!(rev.admin_response || (rev as any).staff_reply) && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setReplyingReview(rev);
                      setReplyText("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Reply as Turf Manager
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Reply to Customer Review
              </h2>
              <button
                onClick={() => setReplyingReview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="text-slate-400">
                Player:{" "}
                <strong className="text-white">
                  {replyingReview.customer_name}
                </strong>
              </div>
              <p className="text-slate-300 italic mt-1">
                "{replyingReview.review_text}"
              </p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Your Public Response *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you for playing at Friends Turf! We've noted your feedback regarding..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {sendingReply ? "Publishing..." : "Publish Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
