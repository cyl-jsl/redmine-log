import { describe, it, expect, vi } from 'vitest';
import { isCacheExpired, loadCache, saveCache, CACHE_TTL_MS } from '../lib/cache.js';
import fs from 'node:fs';

vi.mock('node:fs');

describe('cache', () => {
  it('isCacheExpired returns true for null', () => {
    expect(isCacheExpired(null)).toBe(true);
  });

  it('isCacheExpired returns true when older than 24h', () => {
    const old = new Date(Date.now() - CACHE_TTL_MS - 1000).toISOString();
    expect(isCacheExpired({ projects: [], activities: [], updatedAt: old })).toBe(true);
  });

  it('isCacheExpired returns false when recent', () => {
    expect(isCacheExpired({ projects: [], activities: [], updatedAt: new Date().toISOString() })).toBe(false);
  });

  it('loadCache returns null when file missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(loadCache()).toBeNull();
  });

  it('saveCache writes JSON with timestamp', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
    saveCache({ projects: [], activities: [] });
    const written = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1] as string);
    expect(written.updatedAt).toBeDefined();
  });
});
