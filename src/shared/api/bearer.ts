export function extractBearerToken(
  authorizationHeader?: string | null,
): string | null {
  if (!authorizationHeader) return null;

  const [scheme, ...rest] = authorizationHeader.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;

  const token = rest.join(' ').trim();
  return token.length > 0 ? token : null;
}
