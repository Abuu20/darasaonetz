// Vimeo detection — the old app's own upload guidance explicitly recommended
// Vimeo alongside YouTube, so lessons already out there may well use it.
// Matches vimeo.com/123456789, vimeo.com/channels/x/123456789,
// vimeo.com/groups/x/videos/123456789, and player.vimeo.com/video/123456789
// (already-embed-form links, in case a teacher pastes one of those instead).
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  return match ? match[1] : null;
}

export function isVimeoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return extractVimeoId(url) !== null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  const id = extractVimeoId(url);
  if (!id) return null;
  return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`;
}
