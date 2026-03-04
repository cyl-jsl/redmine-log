import { closest, distance } from 'fastest-levenshtein';
import fs from 'node:fs';
import path from 'node:path';
import { getConfigDir, ALIASES_FILE } from './config.js';
import type { AliasMap, CacheData, RedmineProject, RedmineActivity } from '../types.js';

const MAX_FUZZY_DISTANCE = 3;

function fuzzyThreshold(input: string): number {
  // For short strings (esp. CJK), use tighter threshold
  return Math.min(MAX_FUZZY_DISTANCE, Math.max(1, Math.floor(input.length * 0.5)));
}

function bestMatch(input: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  const threshold = fuzzyThreshold(input);
  const c = closest(input, candidates);
  return distance(input, c) <= threshold ? c : null;
}

export function createDefaultAliases(): AliasMap {
  return { projects: {}, activities: {}, depts: {}, issues: {} };
}

export function loadAliases(): AliasMap {
  const p = path.join(getConfigDir(), ALIASES_FILE);
  if (!fs.existsSync(p)) return createDefaultAliases();
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as AliasMap;
}

export function saveAliases(aliases: AliasMap): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, ALIASES_FILE), JSON.stringify(aliases, null, 2), 'utf-8');
}

export function resolveProject(input: string, aliases: AliasMap, cache: CacheData): RedmineProject | null {
  // 1. Exact alias
  const aliasTarget = aliases.projects[input];
  if (aliasTarget) {
    const found = cache.projects.find(p => p.name === aliasTarget || p.identifier === aliasTarget);
    if (found) return found;
  }
  // 2. Collect candidates: alias keys + cache names, pick best overall
  const candidates: Array<{ name: string; dist: number; source: 'alias' | 'cache' }> = [];
  const threshold = fuzzyThreshold(input);
  for (const key of Object.keys(aliases.projects)) {
    const d = distance(input, key);
    if (d <= threshold) candidates.push({ name: key, dist: d, source: 'alias' });
  }
  for (const p of cache.projects) {
    const d = distance(input, p.name);
    if (d <= threshold) candidates.push({ name: p.name, dist: d, source: 'cache' });
  }
  candidates.sort((a, b) => a.dist - b.dist);
  for (const c of candidates) {
    if (c.source === 'alias') {
      const target = aliases.projects[c.name];
      const found = cache.projects.find(p => p.name === target || p.identifier === target);
      if (found) return found;
    } else {
      const found = cache.projects.find(p => p.name === c.name);
      if (found) return found;
    }
  }
  return null;
}

export function resolveActivity(input: string, aliases: AliasMap, cache: CacheData): RedmineActivity | null {
  const aliasTarget = aliases.activities[input];
  if (aliasTarget) {
    const found = cache.activities.find(a => a.name === aliasTarget);
    if (found) return found;
  }
  const candidates: Array<{ name: string; dist: number; source: 'alias' | 'cache' }> = [];
  const threshold = fuzzyThreshold(input);
  for (const key of Object.keys(aliases.activities)) {
    const d = distance(input, key);
    if (d <= threshold) candidates.push({ name: key, dist: d, source: 'alias' });
  }
  for (const a of cache.activities) {
    const d = distance(input, a.name);
    if (d <= threshold) candidates.push({ name: a.name, dist: d, source: 'cache' });
  }
  candidates.sort((a, b) => a.dist - b.dist);
  for (const c of candidates) {
    if (c.source === 'alias') {
      const target = aliases.activities[c.name];
      const found = cache.activities.find(a => a.name === target);
      if (found) return found;
    } else {
      return cache.activities.find(a => a.name === c.name) ?? null;
    }
  }
  return null;
}

export function resolveDept(input: string, aliases: AliasMap, cache: CacheData): string | null {
  const aliasTarget = aliases.depts[input];
  if (aliasTarget && cache.deptValues?.includes(aliasTarget)) return aliasTarget;
  if (!cache.deptValues || cache.deptValues.length === 0) return null;
  const candidates: Array<{ value: string; dist: number; source: 'alias' | 'cache' }> = [];
  const threshold = fuzzyThreshold(input);
  for (const key of Object.keys(aliases.depts)) {
    const d = distance(input, key);
    if (d <= threshold) candidates.push({ value: aliases.depts[key], dist: d, source: 'alias' });
  }
  for (const v of cache.deptValues) {
    const d = distance(input, v);
    if (d <= threshold) candidates.push({ value: v, dist: d, source: 'cache' });
  }
  candidates.sort((a, b) => a.dist - b.dist);
  for (const c of candidates) {
    if (cache.deptValues.includes(c.value)) return c.value;
  }
  return null;
}
