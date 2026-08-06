const JSON_HTML_ESCAPE_MAP: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const JSON_HTML_ESCAPE_RE = /[<>&\u2028\u2029]/g;

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(
    JSON_HTML_ESCAPE_RE,
    (character) => JSON_HTML_ESCAPE_MAP[character],
  );
}
