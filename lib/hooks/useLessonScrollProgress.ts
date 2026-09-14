import { useEffect, useRef, useState } from "react";
import { useToolProgress } from "@/lib/hooks/useToolProgress";

interface SavedProgress {
  pct: number;
  updatedAt: number;
}

/**
 * Tracks how far through a lesson's reading area a student has scrolled,
 * and persists it via tool_progress so:
 *   • the student's own progress survives across devices
 *   • the teacher's Engagement panel can see who's stuck
 *
 * The math targets the *reading area* (the lesson-content element), not the
 * whole page — the video is above it and shouldn't count toward "read %".
 * Progress is sampled on a throttled scroll listener (one write per 5s of
 * movement at most) so a slow scroll doesn't hammer Supabase.
 *
 * Returns:
 *   pct      — the current (live) percentage, for the progress bar
 *   resumed  — true when the student has just resumed from a saved point
 *   dismiss  — hide the "resume" affordance
 */
export function useLessonScrollProgress(
  lessonId: string,
  contentEl: HTMLElement | null
) {
  const [saved, setSaved] = useToolProgress<SavedProgress>(
    `lesson-scroll:${lessonId}`,
    `darasaone.lessonScroll.${lessonId}`,
    { pct: 0, updatedAt: 0 }
  );
  const [pct, setPct] = useState(saved.pct);
  const [resumed, setResumed] = useState(false);
  const lastWriteRef = useRef(0);
  const hasPromptedRef = useRef(false);

  // On mount: if there's a saved position between 5% and 95%, offer to
  // resume. Once the student dismisses or scrolls past 5%, don't ask again
  // this session.
  useEffect(() => {
    if (hasPromptedRef.current) return;
    if (saved.pct >= 5 && saved.pct <= 95 && Date.now() - saved.updatedAt < 30 * 24 * 60 * 60 * 1000) {
      setResumed(true);
    }
    hasPromptedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // Scroll listener
  useEffect(() => {
    if (!contentEl) return;

    const computePct = () => {
      const rect = contentEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const top = rect.top;
      const height = rect.height;
      if (height < 200) return 100; // short lesson → immediately done

      // Compute % of the content that has scrolled past the middle of
      // the viewport. Reading is a "I'm currently looking at line X"
      // metric — the viewport center is the right anchor for that.
      const midpoint = vh / 2;
      const consumed = Math.min(Math.max(midpoint - top, 0), height);
      return Math.round((consumed / height) * 100);
    };

    const onScroll = () => {
      const next = computePct();
      setPct(prev => (next !== prev ? next : prev));

      // Throttle persistence to once every 5s
      const now = Date.now();
      if (now - lastWriteRef.current < 5000) return;
      lastWriteRef.current = now;

      // Only persist if it moved forward meaningfully (avoid writing on
      // tiny jitter). Resume prefers the highest point reached, so we
      // never lower the saved % even if the student scrolls back up.
      if (next > saved.pct + 2) {
        setSaved({ pct: next, updatedAt: now });
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentEl, lessonId]);

  const jumpToSaved = () => {
    if (!contentEl || saved.pct < 5) return;
    const rect = contentEl.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const target = absoluteTop + (rect.height * saved.pct) / 100 - window.innerHeight / 2;
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    setResumed(false);
  };

  return {
    pct,
    savedPct: saved.pct,
    resumed,
    jumpToSaved,
    dismissResume: () => setResumed(false),
  };
}
