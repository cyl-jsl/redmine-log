import { describe, it, expect } from 'vitest';
import { getDateRange } from '../commands/view.js';
import { localDateStr } from '../lib/parse-utils.js';

describe('getDateRange', () => {
  it('"today" → same from/to using local date', () => {
    const { from, to } = getDateRange('today');
    expect(from).toBe(to);
    expect(from).toBe(localDateStr(new Date()));
  });
  it('"week" → starts on Monday', () => {
    const { from } = getDateRange('week');
    expect(new Date(from).getDay()).toBe(1); // Monday
  });
  it('range format', () => {
    const { from, to } = getDateRange('2026-03-01:2026-03-04');
    expect(from).toBe('2026-03-01');
    expect(to).toBe('2026-03-04');
  });
});
