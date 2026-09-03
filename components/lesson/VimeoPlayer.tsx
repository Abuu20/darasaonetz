interface VimeoPlayerProps {
  embedUrl: string;
  title: string;
}

// Vimeo's own iframe player already ships a full control bar (play, seek,
// volume, fullscreen) that's solid out of the box, so — unlike YouTube,
// where the default iframe embed forces the visitor through a YouTube-brand
// UI and related-video suggestions — there's no need to reimplement the
// controls here. `allow="fullscreen"` + `allowFullScreen` is what enables
// the native fullscreen button inside Vimeo's controls.
export default function VimeoPlayer({ embedUrl, title }: VimeoPlayerProps) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-panel bg-black">
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
