import type {
  RedmineProject, RedmineActivity, RedmineCustomField,
  RedmineTimeEntry, RedmineIssue,
  CreateTimeEntryParams, TimeEntryFilters,
} from '../types.js';

export class RedmineClient {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  private headers(): Record<string, string> {
    return { 'X-Redmine-API-Key': this.apiKey, 'Content-Type': 'application/json' };
  }

  private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: this.headers() });
    if (!res.ok) throw new Error(`Redmine API error: ${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  async listProjects(): Promise<RedmineProject[]> {
    const all: RedmineProject[] = [];
    let offset = 0;
    while (true) {
      const data = await this.get<{ projects: RedmineProject[]; total_count: number }>(
        '/projects.json', { offset: String(offset), limit: '100', status: '1' }
      );
      all.push(...data.projects);
      if (all.length >= data.total_count) break;
      offset += 100;
    }
    return all;
  }

  async listActivities(): Promise<RedmineActivity[]> {
    const data = await this.get<{ time_entry_activities: RedmineActivity[] }>(
      '/enumerations/time_entry_activities.json'
    );
    return data.time_entry_activities;
  }

  async listCustomFields(): Promise<RedmineCustomField[] | null> {
    const url = new URL('/custom_fields.json', this.baseUrl);
    const res = await fetch(url.toString(), { headers: this.headers() });
    if (!res.ok) {
      if (res.status === 403) return null;
      throw new Error(`Redmine API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json() as { custom_fields: RedmineCustomField[] };
    return data.custom_fields;
  }

  async listIssues(projectId: string | number, query?: string): Promise<RedmineIssue[]> {
    const params: Record<string, string> = { project_id: String(projectId), limit: '25', status_id: 'open' };
    if (query) params.subject = `~${query}`;
    return (await this.get<{ issues: RedmineIssue[] }>('/issues.json', params)).issues;
  }

  async createTimeEntry(params: CreateTimeEntryParams): Promise<RedmineTimeEntry> {
    const url = new URL('/time_entries.json', this.baseUrl);
    const res = await fetch(url.toString(), {
      method: 'POST', headers: this.headers(),
      body: JSON.stringify({ time_entry: params }),
    });
    if (!res.ok) throw new Error(`Create time entry failed: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { time_entry: RedmineTimeEntry }).time_entry;
  }

  async listTimeEntries(filters: TimeEntryFilters): Promise<RedmineTimeEntry[]> {
    const params: Record<string, string> = { limit: String(filters.limit ?? 100) };
    if (filters.project_id) params.project_id = String(filters.project_id);
    if (filters.user_id) params.user_id = String(filters.user_id);
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.offset) params.offset = String(filters.offset);
    return (await this.get<{ time_entries: RedmineTimeEntry[] }>('/time_entries.json', params)).time_entries;
  }
}
