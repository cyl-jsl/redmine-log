import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedmineClient } from '../lib/redmine-client.js';

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe('RedmineClient', () => {
  let client: RedmineClient;
  beforeEach(() => { client = new RedmineClient('https://redmine.test', 'test-key'); });

  it('listProjects fetches with API key header', async () => {
    const f = mockFetch({ projects: [{ id: 1, name: 'P1', identifier: 'p1', status: 1 }], total_count: 1 });
    vi.stubGlobal('fetch', f);
    const projects = await client.listProjects();
    expect(projects).toHaveLength(1);
    expect(f).toHaveBeenCalledWith(
      expect.stringContaining('/projects.json'),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Redmine-API-Key': 'test-key' }) })
    );
  });

  it('listActivities returns activities', async () => {
    vi.stubGlobal('fetch', mockFetch({
      time_entry_activities: [{ id: 10, name: 'Dev' }, { id: 11, name: 'QA' }],
    }));
    expect(await client.listActivities()).toHaveLength(2);
  });

  it('listCustomFields returns null on 403', async () => {
    vi.stubGlobal('fetch', mockFetch({}, 403));
    expect(await client.listCustomFields()).toBeNull();
  });

  it('listCustomFields throws on 500', async () => {
    vi.stubGlobal('fetch', mockFetch({}, 500));
    await expect(client.listCustomFields()).rejects.toThrow();
  });

  it('createTimeEntry sends correct POST body', async () => {
    const f = mockFetch({ time_entry: { id: 99 } }, 201);
    vi.stubGlobal('fetch', f);
    await client.createTimeEntry({
      issue_id: 1234, spent_on: '2026-03-04', hours: 4,
      activity_id: 10, comments: 'test',
      custom_fields: [{ id: 5, value: '研發部' }],
    });
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.time_entry.hours).toBe(4);
    expect(body.time_entry.custom_fields).toEqual([{ id: 5, value: '研發部' }]);
  });

  it('listTimeEntries applies filters', async () => {
    const f = mockFetch({ time_entries: [], total_count: 0 });
    vi.stubGlobal('fetch', f);
    await client.listTimeEntries({ user_id: 'me', from: '2026-03-01', to: '2026-03-04' });
    const url = f.mock.calls[0][0] as string;
    expect(url).toContain('user_id=me');
    expect(url).toContain('from=2026-03-01');
  });
});
