#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig } from '../lib/config.js';
import { loadCache } from '../lib/cache.js';
import { loadAliases, resolveProject, resolveActivity, resolveDept } from '../lib/alias-resolver.js';
import { parseHours, parseDate } from '../lib/parse-utils.js';
import { getDateRange } from '../commands/view.js';
import { RedmineClient } from '../lib/redmine-client.js';
import type { RedmineConfig, CacheData, AliasMap } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireConfig(): { config: RedmineConfig; client: RedmineClient } {
  const config = loadConfig();
  if (!config) throw new Error('redmine-log 尚未初始化，請先執行 redmine-log init');
  return { config, client: new RedmineClient(config.url, config.apiKey) };
}

function requireCache(): CacheData {
  const cache = loadCache();
  if (!cache) throw new Error('快取不存在，請先執行 redmine-log sync');
  return cache;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: 'redmine-log',
  version: '0.1.0',
});

// ---------------------------------------------------------------------------
// Tool: log_time
// ---------------------------------------------------------------------------

server.tool(
  'log_time',
  '登打工時到 Redmine。支援別名與模糊匹配。',
  {
    hours: z.string().describe('時數，例如 "4h", "30m", "1.5"'),
    project: z.string().describe('專案名稱、identifier 或別名（支援模糊匹配）'),
    activity: z.string().describe('活動類型名稱或別名（支援模糊匹配）'),
    issue: z.number().optional().describe('Issue 編號（可選）'),
    date: z.string().optional().describe('日期，預設 today。支援 yesterday, MM/DD, YYYY-MM-DD'),
    dept: z.string().optional().describe('歸屬部門名稱或別名（可選，支援模糊匹配）'),
    comment: z.string().optional().describe('備註說明（可選）'),
  },
  async ({ hours, project, activity, issue, date, dept, comment }) => {
    const { config, client } = requireConfig();
    const cache = requireCache();
    const aliases = loadAliases();

    // Parse hours
    const parsedHours = parseHours(hours);

    // Parse date
    const spentOn = parseDate(date);

    // Resolve project
    const resolvedProject = resolveProject(project, aliases, cache);
    if (!resolvedProject) {
      return { content: [{ type: 'text' as const, text: `找不到專案「${project}」。請使用 list_projects 查看可用專案。` }] };
    }

    // Resolve activity
    const resolvedActivity = resolveActivity(activity, aliases, cache);
    if (!resolvedActivity) {
      return { content: [{ type: 'text' as const, text: `找不到活動類型「${activity}」。請使用 list_activities 查看可用類型。` }] };
    }

    // Resolve issue from alias if it's a string alias
    let issueId = issue;
    if (!issueId && aliases.issues) {
      // Check if project or other hints map to an issue alias
      // (issue is optional, only use if explicitly provided)
    }

    // Resolve dept
    let customFields: Array<{ id: number; value: string }> | undefined;
    if (dept && config.deptCustomFieldId) {
      const resolvedDept = resolveDept(dept, aliases, cache);
      if (!resolvedDept) {
        return { content: [{ type: 'text' as const, text: `找不到部門「${dept}」。` }] };
      }
      customFields = [{ id: config.deptCustomFieldId, value: resolvedDept }];
    }

    // Create time entry
    const entry = await client.createTimeEntry({
      project_id: resolvedProject.id,
      issue_id: issueId,
      spent_on: spentOn,
      hours: parsedHours,
      activity_id: resolvedActivity.id,
      comments: comment ?? '',
      custom_fields: customFields,
    });

    return {
      content: [{
        type: 'text' as const,
        text: `已登打工時 #${entry.id}：${parsedHours}h → ${resolvedProject.name} / ${resolvedActivity.name}（${spentOn}）${comment ? ` — ${comment}` : ''}`,
      }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: view_time_entries
// ---------------------------------------------------------------------------

server.tool(
  'view_time_entries',
  '查看已登打的工時紀錄。',
  {
    period: z.string().optional().describe('查詢期間：today（預設）、week、或 YYYY-MM-DD:YYYY-MM-DD'),
  },
  async ({ period }) => {
    const { client } = requireConfig();
    const { from, to } = getDateRange(period ?? 'today');
    const entries = await client.listTimeEntries({ user_id: 'me', from, to });

    if (entries.length === 0) {
      return { content: [{ type: 'text' as const, text: `${from}${from !== to ? ` ~ ${to}` : ''} 沒有工時紀錄。` }] };
    }

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const lines = entries.map((e) => {
      const issue = e.issue ? ` #${e.issue.id}` : '';
      const dept = e.custom_fields?.find((cf) => cf.name.includes('部門'))?.value ?? '';
      return `${e.spent_on}  ${e.hours}h  ${e.project.name}${issue}  ${e.activity.name}${dept ? `  [${dept}]` : ''}${e.comments ? `  "${e.comments}"` : ''}`;
    });

    lines.push(`\n合計：${totalHours}h`);

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: list_projects
// ---------------------------------------------------------------------------

server.tool(
  'list_projects',
  '列出可用的 Redmine 專案。可選模糊搜尋。',
  {
    query: z.string().optional().describe('搜尋關鍵字（可選，模糊比對專案名稱）'),
  },
  async ({ query }) => {
    const cache = requireCache();
    let projects = cache.projects;

    if (query) {
      const q = query.toLowerCase();
      projects = projects.filter(
        (p) => p.name.toLowerCase().includes(q) || p.identifier.toLowerCase().includes(q),
      );
    }

    if (projects.length === 0) {
      return { content: [{ type: 'text' as const, text: query ? `找不到符合「${query}」的專案。` : '沒有快取的專案資料，請執行 redmine-log sync。' }] };
    }

    const lines = projects.map((p) => `${p.name} (${p.identifier})`);
    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: list_activities
// ---------------------------------------------------------------------------

server.tool(
  'list_activities',
  '列出可用的活動類型（如：開發、設計、會議等）。',
  {},
  async () => {
    const cache = requireCache();
    const lines = cache.activities.map((a) => `${a.name}${a.is_default ? ' (預設)' : ''}`);
    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  },
);

// ---------------------------------------------------------------------------
// Tool: list_aliases
// ---------------------------------------------------------------------------

server.tool(
  'list_aliases',
  '列出所有已設定的別名對照表（專案、活動、部門、Issue）。',
  {},
  async () => {
    const aliases = loadAliases();
    const sections: string[] = [];

    const format = (label: string, map: Record<string, string | number>) => {
      const entries = Object.entries(map);
      if (entries.length === 0) return;
      sections.push(`【${label}】\n${entries.map(([k, v]) => `  ${k} → ${v}`).join('\n')}`);
    };

    format('專案', aliases.projects);
    format('活動', aliases.activities);
    format('部門', aliases.depts);
    format('Issue', aliases.issues);

    return {
      content: [{
        type: 'text' as const,
        text: sections.length > 0 ? sections.join('\n\n') : '尚未設定任何別名。',
      }],
    };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
