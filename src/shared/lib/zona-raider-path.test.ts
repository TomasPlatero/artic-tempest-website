import { describe, it, expect } from 'vitest';
import {
  isZonaRaiderPath,
  normalizeZonaRaiderPath,
  toZonaRaiderPath,
} from './zona-raider-path';

describe('zona-raider path helpers', () => {
  it('normalizes slashes and strips query/hash fragments', () => {
    expect(normalizeZonaRaiderPath('zona-raider//configuracion?tab=general#top')).toBe(
      '/zona-raider/configuracion',
    );
    expect(toZonaRaiderPath('  /zona-raider//roster  ')).toBe('/zona-raider/roster');
  });

  it('detects canonical zona-raider routes', () => {
    expect(isZonaRaiderPath('/zona-raider')).toBe(true);
    expect(isZonaRaiderPath('/zona-raider/configuracion')).toBe(true);
    expect(isZonaRaiderPath('/not-zona-raider')).toBe(false);
  });
});
