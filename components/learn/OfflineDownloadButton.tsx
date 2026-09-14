import { useEffect, useState } from "react";
import { Check, CloudDownload, Loader2, Trash2 } from "lucide-react";
import type { Lesson, LessonAttachment } from "@/lib/db/types";

interface OfflineDownloadButtonProps {
  lesson: Lesson;
}

const CACHE_NAME = "darasaone-lesson-content-v1";

// A lesson's "offline bundle" is: the video URL (if any) + each attachment
// URL. We use the browser Cache API (same mechanism the service worker
// uses) rather than a custom IndexedDB store, so the service worker can
// transparently serve these on a network miss with zero extra wiring.
async function urlsForLesson(lesson: Lesson): Promise<string[]> {
  const urls: string[] = [];
  if (lesson.video_url) urls.push(lesson.video_url);
  const attachments = (lesson.attachments ?? []) as LessonAttachment[];
  for (const a of attachments) {
    if (a.url && !a.url.startsWith("http") === false) urls.push(a.url);
  }
  return urls;
}

async function isLessonCached(lesson: Lesson): Promise<boolean> {
  if (!("caches" in window)) return false;
  try {
    const urls = await urlsForLesson(lesson);
    if (urls.length === 0) return false;
    const cache = await caches.open(CACHE_NAME);
    for (const url of urls) {
      const hit = await cache.match(url, { ignoreSearch: false });
      if (!hit) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default function OfflineDownloadButton({ lesson }: OfflineDownloadButtonProps) {
  const [cached, setCached] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    isLessonCached(lesson).then(ok => !cancelled && setCached(ok));
    return () => {
      cancelled = true;
    };
  }, [lesson.id]);

  const supported = typeof window !== "undefined" && "caches" in window;

  const download = async () => {
    if (!supported) {
      setError("Your browser doesn't support offline storage.");
      return;
    }
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const urls = await urlsForLesson(lesson);
      if (urls.length === 0) {
        setError("This lesson has nothing to download yet.");
        return;
      }
      const cache = await caches.open(CACHE_NAME);
      let done = 0;
      for (const url of urls) {
        try {
          const res = await fetch(url, { mode: "cors" });
          if (res.ok) await cache.put(url, res.clone());
        } catch {
          // CORS-blocked or unavailable resource — skip it and keep
          // going. Partial offline coverage is still better than none.
        }
        done += 1;
        setProgress(Math.round((done / urls.length) * 100));
      }
      setCached(await isLessonCached(lesson));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!supported) return;
    const cache = await caches.open(CACHE_NAME);
    const urls = await urlsForLesson(lesson);
    await Promise.all(urls.map(u => cache.delete(u)));
    setCached(false);
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {cached ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-success/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-success">
            <Check size={11} aria-hidden="true" />
            Offline
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label="Remove offline copy"
            title="Remove offline copy"
            className="rounded-control p-1.5 text-slate transition-colors duration-base hover:text-danger"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={download}
          disabled={busy}
          title="Download for offline study"
          className="inline-flex items-center gap-1.5 rounded-control border border-line px-2.5 py-1 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              <span>{progress}%</span>
            </>
          ) : (
            <>
              <CloudDownload size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Save offline</span>
            </>
          )}
        </button>
      )}
      {error ? <span className="text-[10px] text-danger">{error}</span> : null}
    </div>
  );
}
