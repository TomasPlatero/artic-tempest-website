/**
 * YouTube URL normalization and safe embed detection.
 */

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(host)) return null;

    const shortMatch = url.match(/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    const embedMatch = parsed.pathname.match(/^\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    const videoId = parsed.searchParams.get("v");
    if (videoId && VIDEO_ID_RE.test(videoId)) return videoId;

    return null;
  } catch {
    return null;
  }
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

export function toSafeYouTubeEmbed(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function isSafeYouTubeEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (![
      "youtube.com",
      "www.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ].includes(host)) {
      return false;
    }

    return /^\/embed\/[a-zA-Z0-9_-]{11}$/.test(parsed.pathname);
  } catch {
    return false;
  }
}
