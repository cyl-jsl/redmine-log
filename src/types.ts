// ===== Config =====
export interface RedmineConfig {
  url: string;
  apiKey: string;
  deptCustomFieldId?: number;
}

// ===== Cache =====
export interface CacheData {
  projects: RedmineProject[];
  activities: RedmineActivity[];
  deptValues?: string[];
  updatedAt: string;
}

// ===== Aliases =====
export interface AliasMap {
  projects: Record<string, string>;    // alias -> project name/identifier
  activities: Record<string, string>;  // alias -> activity name
  depts: Record<string, string>;       // alias -> dept name
  issues: Record<string, number>;      // alias -> issue id
}

// ===== Redmine API Types =====
export interface RedmineProject {
  id: number;
  name: string;
  identifier: string;
  status: number;
}

export interface RedmineActivity {
  id: number;
  name: string;
  is_default?: boolean;
}

export interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  subject: string;
  tracker: { id: number; name: string };
}

export interface RedmineCustomField {
  id: number;
  name: string;
  customized_type: string;
  possible_values?: Array<{ value: string }>;
}

export interface RedmineTimeEntry {
  id: number;
  project: { id: number; name: string };
  issue?: { id: number };
  user: { id: number; name: string };
  activity: { id: number; name: string };
  hours: number;
  comments: string;
  spent_on: string;
  custom_fields?: Array<{ id: number; name: string; value: string }>;
}

export interface CreateTimeEntryParams {
  project_id?: number;
  issue_id?: number;
  spent_on: string;
  hours: number;
  activity_id: number;
  comments: string;
  custom_fields?: Array<{ id: number; value: string }>;
}

export interface TimeEntryFilters {
  project_id?: number;
  user_id?: number | 'me';
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
