// Detects a YouTube URL in any of its common shapes (watch, youtu.be short
// link, /embed/, /shorts/, and unlisted links — unlisted videos use the same
// URL formats as public ones, "unlisted" only affects who can find them via
// search) and turns it into a privacy-enhanced embeddable URL. Returns null
// for anything that isn't a YouTube link, so callers can fall back to a
// plain <video> tag for direct file uploads.
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /[?&]v=([^&#]+)/,
    /embed\/([^?&#]+)/,
    /shorts\/([^?&#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return extractYouTubeId(url) !== null;
}

// youtube-nocookie.com avoids setting cookies until the viewer presses play,
// and works identically for unlisted videos (anyone with the link/ID can
// still embed and play them — "unlisted" just keeps them off search and
// channel listings).
export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}
