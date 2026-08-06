/**
 * Global test setup for Vitest.
 *
 * Provides browser API mocks needed across jsdom tests:
 * - IntersectionObserver, ResizeObserver, matchMedia, scrollTo
 * - fetch (globalThis.fetch) — individual tests override as needed
 * - URL.createObjectURL / revokeObjectURL
 */

import { vi } from "vitest";

// ── IntersectionObserver ──────────────────────
globalThis.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];
  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// ── ResizeObserver ────────────────────────────
globalThis.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// ── matchMedia ────────────────────────────────
globalThis.matchMedia =
  globalThis.matchMedia ??
  ((query: string): MediaQueryList => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    } as MediaQueryList;
  });

// ── scrollTo ──────────────────────────────────
globalThis.scrollTo = vi.fn() as unknown as typeof globalThis.scrollTo;

// ── URL.createObjectURL / revokeObjectURL ─────
globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
globalThis.URL.revokeObjectURL = vi.fn();

// ── fetch — default passthrough (tests override via mockFetchSuccess etc) ─
if (!("fetch" in globalThis)) {
  globalThis.fetch = vi.fn();
}

// ── Supabase client global mock ─────────────────
// Prevents real network calls. Individual tests can override
// specific methods via vi.mocked(supabaseAdmin).
import "./vitest-mocks/supabase";
