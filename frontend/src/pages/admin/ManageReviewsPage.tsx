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
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { Review } from "../../types";
import { Button, Input, Modal, EmptyState } from "../../components/ui";

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
      r.review_text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Experience & Reputation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Player Reviews & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit player feedback, moderate reviews, and publish official turf responses
          </p>
        </div>
      </div>

      {/* Analytics KPI Row */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Average Rating
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">
                {analytics.average_rating}
              </span>
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
            </div>
            <span className="text-[11px] text-slate-400 block">
              {analytics.total_reviews} verified reviews
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Turf Quality
            </span>
            <div className="text-2xl font-black text-[#059669]">
              {analytics.facility_rating} / 5.0
            </div>
            <span className="text-[11px] text-slate-400 block">
              Pitch & floodlighting score
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Staff Hospitality
            </span>
            <div className="text-2xl font-black text-blue-600">
              {analytics.staff_rating} / 5.0
            </div>
            <span className="text-[11px] text-slate-400 block">
              Reception & gate service
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Flagged Reviews
            </span>
            <div className="text-2xl font-black text-rose-600">
              {analytics.flagged_count}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Requires attention
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by player, pitch, text..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#059669]"
          />
        </div>
        <div className="text-xs text-slate-500 self-end sm:self-auto font-medium">
          Showing <strong>{filteredReviews.length}</strong> player reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl text-xs animate-pulse">
            Loading customer reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            title="No customer reviews found"
            description="Player reviews and ratings submitted after completed matches will appear here."
          />
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 sm:p-6 rounded-2xl border shadow-sm transition-all ${
                rev.is_hidden
                  ? "bg-slate-50 border-rose-200 opacity-70"
                  : "bg-white border-slate-200 hover:border-emerald-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-black text-sm uppercase">
                    {rev.customer_name?.[0] || "P"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{rev.customer_name}</span>
                      <span className="text-xs font-semibold text-[#059669]">
                        • {rev.turf_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Booking Ref: {rev.booking_reference} • {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-700 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rev.rating} / 5</span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(rev)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      rev.is_flagged
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "text-slate-400 border-slate-200 hover:bg-slate-50"
                    }`}
                    title={rev.is_flagged ? "Unflag Review" : "Flag Review"}
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleHide(rev)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      rev.is_hidden
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "text-slate-400 border-slate-200 hover:bg-slate-50"
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
              <div className="py-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                "{rev.review_text}"
              </div>

              {/* Ratings Breakdown */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3 font-medium">
                <div>
                  Pitch Quality: <strong className="text-slate-900">{rev.facility_rating}/5</strong>
                </div>
                <div>
                  Staff Service: <strong className="text-slate-900">{rev.staff_rating}/5</strong>
                </div>
                {rev.suggestions && (
                  <div className="text-slate-500 italic">
                    Suggestion: "{rev.suggestions}"
                  </div>
                )}
              </div>

              {/* Staff Response */}
              {(rev.admin_response || (rev as any).staff_reply) && (
                <div className="mt-3 p-3.5 bg-[#F0FDF4] border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs">
                  <CornerDownRight className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#059669] mb-0.5">
                      Friends Turf Official Response
                    </div>
                    <p className="text-slate-800 font-medium">
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] hover:underline cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply as Turf Admin</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {replyingReview && (
        <Modal
          isOpen={Boolean(replyingReview)}
          onClose={() => setReplyingReview(null)}
          title="Official Turf Response"
          description={`Responding to ${replyingReview.customer_name}'s review`}
          maxWidth="md"
        >
          <form onSubmit={handleSendReply} className="space-y-4 text-xs">
            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-slate-200 text-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Player Feedback
              </span>
              <p className="italic mt-0.5 text-slate-800">
                "{replyingReview.review_text}"
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Public Response
              </label>
              <textarea
                rows={4}
                required
                placeholder="Thank you for playing at Friends Turf! We've noted your feedback regarding..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReplyingReview(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={sendingReply}
              >
                Publish Response
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
