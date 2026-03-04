import { describe, it, expect } from 'vitest';
import { parseBatchLine, parseBatchLines } from '../commands/batch.js';

describe('parseBatchLine', () => {
  it('parses full line', () => {
    const r = parseBatchLine('03/01, FN, #1234, 4h, 開發, 研發, 後端 CRUD');
    expect(r).toEqual({
      date: '03/01', project: 'FN', issue: '#1234',
      hours: '4h', activity: '開發', dept: '研發', comment: '後端 CRUD',
    });
  });
  it('handles missing optional fields', () => {
    const r = parseBatchLine('03/02, FN, , 2h, 會議, , Sprint planning');
    expect(r.issue).toBe('');
    expect(r.dept).toBe('');
  });
});

describe('parseBatchLines', () => {
  it('skips empty lines and comments', () => {
    const lines = ['# header', '03/01, FN, #1, 4h, 開發, 研發, test', '', '03/02, HR, , 2h, QA, , fix'];
    expect(parseBatchLines(lines)).toHaveLength(2);
  });
});
