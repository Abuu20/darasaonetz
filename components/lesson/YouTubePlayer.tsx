import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

// Loads the YouTube IFrame API script exactly once, however many
// YouTubePlayer instances exist on the page (e.g. teacher preview + a
// second one in a full-page preview modal at the same time).
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise(resolve => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiLoadPromise;
}

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function YouTubePlayer({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0, // hides YouTube's own control bar, title link and watermark
          modestbranding: 1,
          rel: 0,
          disablekb: 1,
          playsinline: 1,
          iv_load_policy: 3, // no annotations/end-screen video suggestions
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (cancelled) return;
            setReady(true);
            setDuration(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            if (cancelled) return;
            const playing = event.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (playing) {
              intervalRef.current = setInterval(() => {
                try {
                  setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
                } catch {
                  /* player torn down mid-tick */
                }
              }, 500);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      try {
        playerRef.current?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const togglePlay = () => {
    if (!ready) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const toggleMute = () => {
    if (!ready) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    setCurrentTime(time);
    playerRef.current?.seekTo(time, true);
  };

  const handleFullscreen = () => {
    containerRef.current?.parentElement?.requestFullscreen?.();
  };

  const wake = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  return (
    <div
      className="group relative h-full w-full bg-black"
      onMouseMove={wake}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div ref={containerRef} className="pointer-events-none h-full w-full" />

      {/* Transparent tap target over the whole video — since the YouTube
          player itself has controls:0, nothing underneath is clickable
          (and nothing under it can navigate away to youtube.com). */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="absolute inset-0 h-full w-full cursor-pointer"
      />

      <div
        className={`pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-200 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-tight px-stack pb-stack">
          <button type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="text-white">
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span className="w-9 shrink-0 text-right text-xs text-white/80">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 flex-1 cursor-pointer accent-white"
            aria-label="Seek"
          />
          <span className="w-9 shrink-0 text-xs text-white/80">{formatTime(duration)}</span>
          <button type="button" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"} className="text-white">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button type="button" onClick={handleFullscreen} aria-label="Fullscreen" className="text-white">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      ) : null}
    </div>
  );
}
