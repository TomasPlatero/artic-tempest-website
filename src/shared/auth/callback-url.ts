const UNSAFE_PATHS = new Set(['/login']);

export function sanitizeInternalCallbackUrl(
  value?: string | string[] | null,
): string {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  if (raw.includes('%')) return '/';
  if (UNSAFE_PATHS.has(raw)) return '/';

  return raw;
}
