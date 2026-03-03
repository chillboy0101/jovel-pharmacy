"use client";

import { useState, useEffect } from "react";
import { Star, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null };
};

export default function ProductReviews({ productId }: { productId: string }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRating) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: selectedRating,
        comment,
      }),
    });

    if (res.ok) {
      const newReview = await res.json();
      setReviews((prev) => {
        const filtered = prev.filter((r) => r.id !== newReview.id);
        return [newReview, ...filtered];
      });
      setSuccess("Review submitted!");
      setComment("");
      setSelectedRating(0);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to submit review");
    }
    setSubmitting(false);
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mt-12">
      <h2 className="mb-6 text-xl font-bold text-foreground">
        Customer Reviews ({reviews.length})
      </h2>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-border bg-muted-light p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(avgRating) ? "fill-accent text-accent" : "fill-muted-light text-muted-light"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
          </div>
          {/* Rating bars */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right text-muted">{star}</span>
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-muted">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-foreground">Write a Review</h3>

          {/* Star selector */}
          <div className="mb-3 flex items-center gap-1">
            <span className="mr-2 text-xs text-muted">Your rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoveredStar(s)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setSelectedRating(s)}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    s <= (hoveredStar || selectedRating)
                      ? "fill-accent text-accent"
                      : "fill-muted-light text-muted-light hover:fill-accent/40 hover:text-accent/40"
                  }`}
                />
              </button>
            ))}
            {selectedRating > 0 && (
              <span className="ml-2 text-xs font-medium text-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][selectedRating]}
              </span>
            )}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product…"
            required
            rows={3}
            className="mb-3 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
          />

          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
          {success && <p className="mb-2 text-xs text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      ) : (
        <div className="mb-8 rounded-xl border border-border bg-muted-light px-5 py-4 text-center text-sm text-muted">
          <a href="/account" className="font-semibold text-primary hover:underline">Sign in</a> to leave a review.
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-muted">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {(r.user.name ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.user.name ?? "Anonymous"}</p>
                    <p className="text-[10px] text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= r.rating ? "fill-accent text-accent" : "fill-muted-light text-muted-light"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
