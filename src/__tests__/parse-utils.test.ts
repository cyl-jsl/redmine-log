import { describe, it, expect } from 'vitest';
import { parseHours, parseDate } from '../lib/parse-utils.js';

describe('parseHours', () => {
  it('parses "4h" as 4', () => expect(parseHours('4h')).toBe(4));
  it('parses "1.5h" as 1.5', () => expect(parseHours('1.5h')).toBe(1.5));
  it('parses "0.5" as 0.5', () => expect(parseHours('0.5')).toBe(0.5));
  it('parses "30m" as 0.5', () => expect(parseHours('30m')).toBe(0.5));
  it('parses "90m" as 1.5', () => expect(parseHours('90m')).toBe(1.5));
  it('throws on invalid', () => expect(() => parseHours('abc')).toThrow());
  it('throws on zero', () => expect(() => parseHours('0h')).toThrow());
});

describe('parseDate', () => {
  it('undefined → today', () => {
    expect(parseDate(undefined)).toBe(new Date().toISOString().slice(0, 10));
  });
  it('"today" → today', () => {
    expect(parseDate('today')).toBe(new Date().toISOString().slice(0, 10));
  });
  it('"yesterday" → yesterday', () => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    expect(parseDate('yesterday')).toBe(d.toISOString().slice(0, 10));
  });
  it('YYYY-MM-DD passthrough', () => {
    expect(parseDate('2026-03-04')).toBe('2026-03-04');
  });
  it('MM/DD → current year YYYY-MM-DD', () => {
    expect(parseDate('03/01')).toMatch(/^\d{4}-03-01$/);
  });
  it('throws on invalid', () => {
    expect(() => parseDate('not-a-date')).toThrow();
  });
});
