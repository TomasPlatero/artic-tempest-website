/**
 * XSS sanitizer edge-case tests.
 *
 * Tests sanitizeRichHtml() and stripRichHtmlToText() against 12+ XSS vectors.
 * Forces server-side regex path by setting global.window = undefined.
 *
 * @ci
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { sanitizeRichHtml, stripRichHtmlToText } from './sanitize-html';

// Force server-side regex path: unset window so sanitizeRichHtml
// uses sanitizeHtmlServerSide instead of DOMPurify.
const originalWindow = globalThis.window;

beforeEach(() => {
  // @ts-expect-error — force server-side regex path for sanitizer
  globalThis.window = undefined;
});

afterAll(() => {
  globalThis.window = originalWindow;
});

describe('sanitizeRichHtml — XSS vector defense', () => {
  // Vector 1: Plain script tag
  it('removes <script>alert("xss")</script>', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeRichHtml(input);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
  });

  // Vector 2: img onerror
  it('strips onerror from <img src=x onerror=alert(1)>', () => {
    const input = '<img src=x onerror=alert(1)>';
    const result = sanitizeRichHtml(input);
    expect(result).not.toMatch(/\bonerror\b/i);
  });

  // Vector 3: javascript: href
  it('neutralizes <a href="javascript:alert(1)"> to #', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeRichHtml(input);
    // Server-side regex replaces javascript: with #
    expect(result).not.toContain('javascript:');
    expect(result).toContain('href="#');
  });

  // Vector 4: Nested script tags
  it('documents gap: nested <scr<script>ipt> not caught by server-side regex', () => {
    const input = '<scr<script>ipt>alert(1)</scr<script>ipt>';
    const result = sanitizeRichHtml(input);
    // GAP: The server-side regex /<script\b.../gi requires a full <script opening tag.
    // Nested variants like <scr<script>ipt> are not matched. The resulting string
    // still contains the literal substring "<script>" (from the inner nesting).
    // This is a known limitation of regex-based sanitization — DOMPurify (browser)
    // catches this, but the server-side path does not.
    // Decision: track as separate fix per design open question 3.
    expect(result).toContain('<script>');
    expect(result).toBeDefined();
  });

  // Vector 5: Encoded entities via stripRichHtmlToText
  it('documents gap: encoded &lt;script&gt; decoded after tag stripping in stripRichHtmlToText', () => {
    const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
    const result = stripRichHtmlToText(input);
    // GAP: stripRichHtmlToText calls sanitizeRichHtml (which passes encoded
    // entities through unchanged since they aren't real < > chars), then strips
    // HTML tags via /<[^>]+>/g, THEN decodes entities. This means &lt;script&gt;
    // survives tag stripping and becomes literal "<script>" text via entity
    // decoding — a false negative.
    // The alert(1) text IS present in the output.
    // Decision: track as separate fix per design open question 3.
    expect(result).toContain('<script');
    expect(result).not.toContain('&lt;');
    expect(result).toContain('alert(1)');
  });

  // Vector 6: Null byte
  it('handles null byte \\x00<script> without bypass', () => {
    const input = '\x00<script>alert(1)</script>';
    const result = sanitizeRichHtml(input);
    // Null byte doesn't bypass — script is still removed
    expect(result).not.toContain('<script');
  });

  // Vector 7: div onclick
  it('strips onclick from <div onclick="alert(1)">', () => {
    const input = '<div onclick="alert(1)">text</div>';
    const result = sanitizeRichHtml(input);
    expect(result).not.toMatch(/\bonclick\b/i);
    expect(result).toContain('<div');
    expect(result).toContain('text');
  });

  // Vector 8: body onload
  it('strips onload from <body onload="evil()">', () => {
    const input = '<body onload="evil()">content</body>';
    const result = sanitizeRichHtml(input);
    expect(result).not.toMatch(/\bonload\b/i);
  });

  // Vector 9: svg onload
  it('strips onload from <svg onload="alert(1)">', () => {
    const input = '<svg onload="alert(1)">';
    const result = sanitizeRichHtml(input);
    expect(result).not.toMatch(/\bonload\b/i);
  });

  // Vector 10: javascript: in src
  it('neutralizes javascript: in src attribute', () => {
    const input = '<img src="javascript:alert(1)">';
    const result = sanitizeRichHtml(input);
    expect(result).not.toContain('javascript:');
  });

  // Vector 11: data URI in href
  it('handles data: URI in href (no crash)', () => {
    const input = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">link</a>';
    const result = sanitizeRichHtml(input);
    // Should not throw; data URI may be stripped depending on regex coverage
    expect(result).toBeDefined();
  });

  // Vector 12: empty/null/undefined inputs
  it('does not throw on empty string', () => {
    expect(() => sanitizeRichHtml('')).not.toThrow();
    expect(sanitizeRichHtml('')).toBe('');
  });

  it('does not throw on null', () => {
    expect(() => sanitizeRichHtml(null)).not.toThrow();
  });

  it('does not throw on undefined', () => {
    expect(() => sanitizeRichHtml(undefined)).not.toThrow();
  });

  it('stripRichHtmlToText handles null/undefined', () => {
    expect(() => stripRichHtmlToText(null)).not.toThrow();
    expect(() => stripRichHtmlToText(undefined)).not.toThrow();
    expect(stripRichHtmlToText(null)).toBe('');
  });
});

describe('sanitizeRichHtml — safe content preservation', () => {
  it('preserves safe HTML tags like <b>, <i>, <p>', () => {
    const input = '<p>Hello <b>world</b></p>';
    const result = sanitizeRichHtml(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<b>');
    expect(result).toContain('world');
  });

  it('preserves safe links', () => {
    const input = '<a href="https://example.com">link</a>';
    const result = sanitizeRichHtml(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('link');
  });
});

describe('stripRichHtmlToText', () => {
  it('converts <br> to newlines', () => {
    const input = 'Line 1<br>Line 2';
    const result = stripRichHtmlToText(input);
    expect(result).toContain('\n');
    expect(result).not.toContain('<br');
  });

  it('strips all HTML tags', () => {
    const input = '<div><p>Hello <b>world</b></p></div>';
    const result = stripRichHtmlToText(input);
    expect(result).not.toContain('<');
    expect(result).toContain('Hello');
    expect(result).toContain('world');
  });

  it('trims whitespace from output', () => {
    const input = '  <p>text</p>  ';
    const result = stripRichHtmlToText(input);
    expect(result).toBe('text');
  });
});
