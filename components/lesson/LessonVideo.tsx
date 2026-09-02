import { PlayCircle } from "lucide-react";
import { extractYouTubeId, isYouTubeUrl } from "@/lib/youtube";
import { getVimeoEmbedUrl, isVimeoUrl } from "@/lib/vimeo";
import YouTubePlayer from "@/components/lesson/YouTubePlayer";
import VimeoPlayer from "@/components/lesson/VimeoPlayer";

interface LessonVideoProps {
  url: string | null | undefined;
  emptyLabel?: string;
  title?: string;
}

// A plain HTML <video> tag can only play a direct media file (mp4, webm,
// the .mov/.m3u8 links our own storage upload produces) — it cannot play a
// YouTube or Vimeo page URL, that just fails silently. This component picks
// the right player for whichever kind of link a lesson has.
export default function LessonVideo({ url, emptyLabel, title }: LessonVideoProps) {
  if (!url) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-tight rounded-panel border border-dashed border-hairline text-lavender">
        <PlayCircle size={32} aria-hidden="true" />
        {emptyLabel ? <span className="text-xs">{emptyLabel}</span> : null}
      </div>
    );
  }

  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeId(url);
    if (!videoId) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-panel bg-black">
        <YouTubePlayer key={videoId} videoId={videoId} />
      </div>
    );
  }

  if (isVimeoUrl(url)) {
    const embedUrl = getVimeoEmbedUrl(url);
    if (!embedUrl) return null;
    return <VimeoPlayer key={embedUrl} embedUrl={embedUrl} title={title ?? "Lesson video"} />;
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-panel bg-black">
      <video key={url} src={url} controls playsInline className="h-full w-full" />
    </div>
  );
}

