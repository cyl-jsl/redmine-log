import { describe, it, expect } from 'vitest';
import { resolveProject, resolveActivity, resolveDept, createDefaultAliases } from '../lib/alias-resolver.js';
import type { AliasMap, CacheData } from '../types.js';

const aliases: AliasMap = {
  projects: { 'FN': 'FinanceNet', 'HR': 'HRSystem' },
  activities: { '開發': 'Development', 'QA': 'Testing' },
  depts: { '研發': '研發部' },
  issues: { 'login-bug': 1234 },
};

const cache: CacheData = {
  projects: [
    { id: 1, name: 'FinanceNet', identifier: 'financenet', status: 1 },
    { id: 2, name: 'HRSystem', identifier: 'hrsystem', status: 1 },
  ],
  activities: [
    { id: 10, name: 'Development' },
    { id: 11, name: 'Testing' },
  ],
  deptValues: ['研發部', '行銷部', '人事部'],
  updatedAt: new Date().toISOString(),
};

describe('resolveProject', () => {
  it('exact alias match', () => {
    expect(resolveProject('FN', aliases, cache)?.name).toBe('FinanceNet');
  });
  it('fuzzy cache name match', () => {
    expect(resolveProject('FinaceNet', aliases, cache)?.name).toBe('FinanceNet');
  });
  it('returns null for unknown', () => {
    expect(resolveProject('zzzzz', aliases, cache)).toBeNull();
  });
});

describe('resolveActivity', () => {
  it('exact alias match', () => {
    expect(resolveActivity('開發', aliases, cache)?.id).toBe(10);
  });
  it('fuzzy match', () => {
    expect(resolveActivity('Developmnt', aliases, cache)?.name).toBe('Development');
  });
});

describe('resolveDept', () => {
  it('exact alias match', () => {
    expect(resolveDept('研發', aliases, cache)).toBe('研發部');
  });
  it('fuzzy match on cache values', () => {
    expect(resolveDept('行銷', aliases, cache)).toBe('行銷部');
  });
});

describe('createDefaultAliases', () => {
  it('returns empty structure', () => {
    const a = createDefaultAliases();
    expect(a.projects).toEqual({});
    expect(a.activities).toEqual({});
  });
});
