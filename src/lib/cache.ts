import fs from 'node:fs';
import path from 'node:path';
import { getConfigDir, CACHE_FILE } from './config.js';
import type { CacheData } from '../types.js';

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function isCacheExpired(cache: CacheData | null): boolean {
  if (!cache) return true;
  return Date.now() - new Date(cache.updatedAt).getTime() > CACHE_TTL_MS;
}

export function loadCache(): CacheData | null {
  const p = path.join(getConfigDir(), CACHE_FILE);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as CacheData;
}

export function saveCache(data: Omit<CacheData, 'updatedAt'>): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const full: CacheData = { ...data, updatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, CACHE_FILE), JSON.stringify(full, null, 2), 'utf-8');
}
