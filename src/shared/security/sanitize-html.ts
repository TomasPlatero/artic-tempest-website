import DOMPurify from 'dompurify';

function sanitizeHtmlServerSide(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, ' $1="#"')
    .replace(/\s(href|src)\s*=\s*'\s*javascript:[^']*'/gi, " $1='#'")
    .replace(/\s(href|src)\s*=\s*\s*javascript:[^\s>]+/gi, '');
}

export function sanitizeRichHtml(html: string | null | undefined) {
  const unsafeHtml = html ?? '';

  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(unsafeHtml, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy'],
    });
  }

  return sanitizeHtmlServerSide(unsafeHtml);
}

const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
};

export function stripRichHtmlToText(html: string | null | undefined) {
  return sanitizeRichHtml(html)
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|#x27);/gi, (match) => HTML_ENTITY_MAP[match.toLowerCase()] ?? match)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
