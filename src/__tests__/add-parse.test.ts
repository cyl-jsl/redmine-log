import { describe, it, expect } from 'vitest';
import { parseAddArgs } from '../commands/add.js';

describe('parseAddArgs', () => {
  it('parses "4h FN #1234 開發"', () => {
    expect(parseAddArgs(['4h', 'FN', '#1234', '開發'])).toEqual({
      hours: 4, project: 'FN', issue: 1234, activity: '開發',
    });
  });
  it('parses without issue: "2h FN 開發"', () => {
    const r = parseAddArgs(['2h', 'FN', '開發']);
    expect(r.issue).toBeUndefined();
    expect(r.project).toBe('FN');
  });
  it('#issue can be anywhere', () => {
    expect(parseAddArgs(['4h', '#567', 'FN', '開發']).issue).toBe(567);
  });
  it('throws on insufficient args', () => {
    expect(() => parseAddArgs(['4h'])).toThrow();
  });
});
