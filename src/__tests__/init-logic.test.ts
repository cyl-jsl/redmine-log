import { describe, it, expect } from 'vitest';
import { findDeptCustomField } from '../commands/init.js';
import type { RedmineCustomField } from '../types.js';

describe('findDeptCustomField', () => {
  it('finds 歸屬部門 by name and type', () => {
    const fields: RedmineCustomField[] = [
      { id: 3, name: '優先權', customized_type: 'issue' },
      { id: 5, name: '歸屬部門', customized_type: 'time_entry',
        possible_values: [{ value: '研發部' }, { value: '行銷部' }] },
    ];
    expect(findDeptCustomField(fields)).toEqual({
      id: 5, name: '歸屬部門', values: ['研發部', '行銷部'],
    });
  });

  it('returns null when not found', () => {
    expect(findDeptCustomField([])).toBeNull();
  });
});
