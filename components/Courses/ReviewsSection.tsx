import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { StarRatingDisplay, StarRatingInput } from "@/components/ui/StarRating";
import Avatar from "@/components/ui/Avatar";
import { reviewQueries, summarizeReviews } from "@/lib/db/reviews";
import { notificationQueries } from "@/lib/db/notifications";
import type { CourseReview } from "@/lib/db/types";
import { useLanguage } from "@/context/LanguageContext";

const COLLAPSE_AFTER = 4;

function timeAgo(iso: string, locale: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.round(months / 12), "year");
}

export default function ReviewsSection({
  courseId,
  courseTitle,
  teacherId,
  userId,
  canReview,
  restrictedReason,
}: {
  courseId: string;
  courseTitle: string;
  /** The course owner — notified once when a student leaves their first review (not on edits). */
  teacherId: string;
  userId: string | null;
  /** True only for a signed-in, enrolled student who isn't the course's own teacher. */
  canReview: boolean;
  /** Shown instead of the write-a-review form when `canReview` is false (or null to hide entirely, e.g. signed out). */
  restrictedReason: string | null;
}) {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reviewQueries
      .getByCourse(courseId)
      .then(data => {
        if (cancelled) return;
        setReviews(data);
      })
      .catch(() => !cancelled && setReviews([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const myReview = useMemo(() => reviews.find(r => r.student_id === userId) ?? null, [reviews, userId]);
  const otherReviews = useMemo(() => reviews.filter(r => r.student_id !== userId), [reviews, userId]);
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);
  const visible = showAll ? otherReviews : otherReviews.slice(0, COLLAPSE_AFTER);

  const openEditor = () => {
    setFormRating(myReview?.rating ?? 0);
    setFormComment(myReview?.comment ?? "");
    setEditing(true);
    setError(false);
  };

  const submit = async () => {
    if (!userId || formRating < 1) return;
    const isFirstReview = !myReview;
    setSubmitting(true);
    setError(false);
    try {
      const saved = await reviewQueries.upsert(courseId, userId, formRating, formComment);
      setReviews(prev => {
        const withoutMine = prev.filter(r => r.student_id !== userId);
        return [saved, ...withoutMine];
      });
      setEditing(false);
      // Only on a genuinely new review, not an edit — a teacher doesn't
      // need re-notifying every time a student tweaks their wording.
      if (isFirstReview && teacherId && teacherId !== userId) {
        notificationQueries
          .create(
            teacherId,
            "new_review",
            t("components.Courses.ReviewsSection.notifyTitle"),
            `${saved.profiles?.full_name || t("components.Courses.ReviewsSection.anonymousStudent")} — ${courseTitle} (${formRating}★)`,
            { course_id: courseId }
          )
          .catch(() => {});
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!myReview) return;
    if (!window.confirm(t("components.Courses.ReviewsSection.deleteConfirm"))) return;
    try {
      await reviewQueries.delete(myReview.id);
      setReviews(prev => prev.filter(r => r.id !== myReview.id));
    } catch {
      setError(true);
    }
  };

  return (
    <section id="reviews" className="px-gutter md:px-gutter-lg">
      <div className="mx-auto flex max-w-shell flex-col gap-block">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl text-ink">
            <span data-text-id="components.Courses.ReviewsSection.heading">
              {t("components.Courses.ReviewsSection.heading")}
            </span>
          </h2>
          <p data-text-id="components.Courses.ReviewsSection.subheading" className="text-sm text-slate">
            {t("components.Courses.ReviewsSection.subheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-block lg:grid-cols-[300px_1fr]">
          {/* Summary: big average + histogram, Udemy/Coursera-style social proof. */}
          <div className="flex h-fit flex-col gap-stack rounded-card border border-line bg-mist p-block lg:sticky lg:top-24">
            {summary.count === 0 ? (
              <div className="flex flex-col items-center gap-1 py-tight text-center">
                <MessageSquareText size={28} className="text-slate" aria-hidden="true" />
                <p data-text-id="components.Courses.ReviewsSection.noRatingsYet" className="text-sm text-slate">
                  {t("components.Courses.ReviewsSection.noRatingsYet")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-tight">
                  <span className="font-heading text-4xl text-ink">{summary.average.toFixed(1)}</span>
                  <div className="flex flex-col gap-0.5">
                    <StarRatingDisplay value={summary.average} size="sm" />
                    <span className="text-xs text-slate">
                      {summary.count} <span data-text-id="components.Courses.ReviewsSection.ratings">{t("components.Courses.ReviewsSection.ratings")}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {([5, 4, 3, 2, 1] as const).map(star => {
                    const n = summary.counts[star];
                    const pct = summary.count > 0 ? Math.round((n / summary.count) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-tight text-xs text-slate">
                        <span className="w-3 shrink-0 text-right">{star}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line">
                          <div className="h-full rounded-pill bg-ember" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 shrink-0 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-stack">
            {/* Write / edit review */}
            {canReview ? (
              <div className="flex flex-col gap-stack rounded-card border border-line p-block">
                {myReview && !editing ? (
                  <div className="flex flex-col gap-tight">
                    <div className="flex items-center justify-between gap-stack">
                      <span className="text-sm font-medium text-ink" data-text-id="components.Courses.ReviewsSection.yourReview">
                        {t("components.Courses.ReviewsSection.yourReview")}
                      </span>
                      <div className="flex items-center gap-tight">
                        <button
                          type="button"
                          onClick={openEditor}
                          className="inline-flex items-center gap-1 text-xs text-slate transition-colors duration-base hover:text-accent"
                        >
                          <Pencil size={12} aria-hidden="true" />
                          <span data-text-id="components.Courses.ReviewsSection.edit">{t("components.Courses.ReviewsSection.edit")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={remove}
                          className="inline-flex items-center gap-1 text-xs text-slate transition-colors duration-base hover:text-danger"
                        >
                          <Trash2 size={12} aria-hidden="true" />
                          <span data-text-id="components.Courses.ReviewsSection.delete">{t("components.Courses.ReviewsSection.delete")}</span>
                        </button>
                      </div>
                    </div>
                    <StarRatingDisplay value={myReview.rating} size="sm" />
                    {myReview.comment ? <p className="text-sm text-slate">{myReview.comment}</p> : null}
                  </div>
                ) : (
                  <div className="flex flex-col gap-stack">
                    <span className="text-sm font-medium text-ink" data-text-id="components.Courses.ReviewsSection.writePrompt">
                      {t("components.Courses.ReviewsSection.writePrompt")}
                    </span>
                    <StarRatingInput value={formRating} onChange={setFormRating} size="lg" disabled={submitting} />
                    {formRating > 0 ? (
                      <motion.div
                        initial={{ opacity: 0.001, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-stack overflow-hidden"
                      >
                        <textarea
                          value={formComment}
                          onChange={event => setFormComment(event.target.value)}
                          placeholder={t("components.Courses.ReviewsSection.placeholder")}
                          rows={3}
                          disabled={submitting}
                          className="w-full resize-none rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none placeholder:text-slate focus:border-accent"
                        />
                        <div className="flex items-center gap-tight">
                          <button
                            type="button"
                            onClick={submit}
                            disabled={submitting}
                            className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:cursor-default disabled:opacity-70"
                          >
                            <span data-text-id={submitting ? "components.Courses.ReviewsSection.submitting" : myReview ? "components.Courses.ReviewsSection.update" : "components.Courses.ReviewsSection.submit"}>
                              {submitting
                                ? t("components.Courses.ReviewsSection.submitting")
                                : myReview
                                  ? t("components.Courses.ReviewsSection.update")
                                  : t("components.Courses.ReviewsSection.submit")}
                            </span>
                          </button>
                          {editing ? (
                            <button
                              type="button"
                              onClick={() => setEditing(false)}
                              disabled={submitting}
                              className="rounded-control border border-line px-block py-tight text-sm text-slate transition-colors duration-base hover:border-accent hover:text-ink"
                            >
                              <span data-text-id="components.Courses.ReviewsSection.cancel">{t("components.Courses.ReviewsSection.cancel")}</span>
                            </button>
                          ) : null}
                        </div>
                        {error ? (
                          <p className="text-xs text-danger" data-text-id="components.Courses.ReviewsSection.error">
                            {t("components.Courses.ReviewsSection.error")}
                          </p>
                        ) : null}
                      </motion.div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : restrictedReason ? (
              <div className="rounded-card border border-dashed border-line px-block py-stack text-center text-sm text-slate">
                {restrictedReason}
              </div>
            ) : null}

            {/* Review list */}
            {loading ? (
              <div className="flex flex-col gap-stack">
                {[0, 1].map(i => (
                  <div key={i} className="h-24 animate-pulse rounded-card bg-mist" />
                ))}
              </div>
            ) : otherReviews.length === 0 && !myReview ? (
              <p data-text-id="components.Courses.ReviewsSection.noReviews" className="rounded-card bg-mist px-block py-block text-center text-sm text-slate">
                {t("components.Courses.ReviewsSection.noReviews")}
              </p>
            ) : (
              <div className="flex flex-col gap-stack">
                {visible.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0.001, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: (index % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-tight rounded-card border border-line p-block"
                  >
                    <div className="flex items-center gap-tight">
                      <Avatar
                        name={review.profiles?.full_name || t("components.Courses.ReviewsSection.anonymousStudent")}
                        src={review.profiles?.avatar_url}
                        size="sm"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-ink">
                          {review.profiles?.full_name || t("components.Courses.ReviewsSection.anonymousStudent")}
                        </span>
                        <span className="text-xs text-slate">{timeAgo(review.created_at, language)}</span>
                      </div>
                      <StarRatingDisplay value={review.rating} size="sm" />
                    </div>
                    {review.comment ? <p className="text-sm text-slate">{review.comment}</p> : null}
                  </motion.div>
                ))}

                {otherReviews.length > COLLAPSE_AFTER ? (
                  <button
                    type="button"
                    onClick={() => setShowAll(v => !v)}
                    className="mt-tight w-fit self-center rounded-pill border border-line px-stack py-tight text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
                  >
                    {showAll
                      ? t("components.Courses.ReviewsSection.showLess")
                      : `${t("components.Courses.ReviewsSection.showAll")} (${otherReviews.length - COLLAPSE_AFTER} ${t("components.Courses.ReviewsSection.more")})`}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
