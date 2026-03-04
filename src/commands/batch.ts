import { Command } from 'commander';
import fs from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin } from 'node:process';
import chalk from 'chalk';
import { parseHours, parseDate } from '../lib/parse-utils.js';
import { loadConfig } from '../lib/config.js';
import { loadCache } from '../lib/cache.js';
import { loadAliases, resolveProject, resolveActivity, resolveDept } from '../lib/alias-resolver.js';
import { RedmineClient } from '../lib/redmine-client.js';
import type { CreateTimeEntryParams } from '../types.js';

export interface BatchLine {
  date: string;
  project: string;
  issue: string;
  hours: string;
  activity: string;
  dept: string;
  comment: string;
}

export function parseBatchLine(line: string): BatchLine {
  const parts = line.split(',').map((s) => s.trim());
  return {
    date: parts[0] ?? '',
    project: parts[1] ?? '',
    issue: parts[2] ?? '',
    hours: parts[3] ?? '',
    activity: parts[4] ?? '',
    dept: parts[5] ?? '',
    comment: parts.slice(6).join(',').trim(),
  };
}

export function parseBatchLines(lines: string[]): BatchLine[] {
  return lines
    .filter((l) => l.trim() !== '' && !l.trim().startsWith('#'))
    .map(parseBatchLine);
}

async function readLines(filePath?: string): Promise<string[]> {
  if (filePath) {
    return fs.readFileSync(filePath, 'utf-8').split('\n');
  }
  const rl = createInterface({ input: stdin });
  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines;
}

export const batchCommand = new Command('batch')
  .description('Batch add time entries from CSV')
  .option('-f, --file <path>', 'Read from file instead of stdin')
  .action(async (opts) => {
    const config = loadConfig();
    if (!config) {
      console.error(chalk.red('Not initialized. Run: redmine-log init'));
      process.exit(1);
    }
    const cache = loadCache();
    if (!cache) {
      console.error(chalk.red('No cache. Run: redmine-log sync'));
      process.exit(1);
    }
    const aliases = loadAliases();

    const rawLines = await readLines(opts.file);
    const entries = parseBatchLines(rawLines);

    if (entries.length === 0) {
      console.log(chalk.yellow('No entries found.'));
      return;
    }

    console.log(chalk.cyan(`\nBatch Preview (${entries.length} entries):\n`));
    console.log(
      `  ${'Date'.padEnd(12)}${'Project'.padEnd(15)}${'Issue'.padEnd(8)}` +
      `${'Hours'.padEnd(7)}${'Activity'.padEnd(12)}${'Dept'.padEnd(10)}Comment`,
    );
    console.log('  ' + '-'.repeat(80));

    const resolved: Array<{ params: CreateTimeEntryParams; line: BatchLine; error?: string }> = [];

    for (const line of entries) {
      const project = resolveProject(line.project, aliases, cache);
      const activity = resolveActivity(line.activity, aliases, cache);
      let error: string | undefined;

      if (!project) error = `Project not found: ${line.project}`;
      else if (!activity) error = `Activity not found: ${line.activity}`;

      let hours: number;
      let spentOn: string;
      try {
        hours = parseHours(line.hours);
        spentOn = parseDate(line.date);
      } catch (e) {
        error = (e as Error).message;
        hours = 0;
        spentOn = '';
      }

      const params: CreateTimeEntryParams = {
        project_id: project?.id,
        issue_id: line.issue ? Number(line.issue.replace('#', '')) : undefined,
        spent_on: spentOn,
        hours,
        activity_id: activity?.id ?? 0,
        comments: line.comment,
      };

      if (line.dept && config.deptCustomFieldId) {
        const dept = resolveDept(line.dept, aliases, cache);
        if (dept) {
          params.custom_fields = [{ id: config.deptCustomFieldId, value: dept }];
        } else {
          error = `Department not found: ${line.dept}`;
        }
      }

      const mark = error ? chalk.red('✗') : chalk.green('✓');
      console.log(
        `  ${mark} ${line.date.padEnd(10)}${line.project.padEnd(15)}${line.issue.padEnd(8)}` +
        `${line.hours.padEnd(7)}${line.activity.padEnd(12)}${line.dept.padEnd(10)}${line.comment}`,
      );
      if (error) console.log(chalk.red(`    → ${error}`));

      resolved.push({ params, line, error });
    }

    const valid = resolved.filter((r) => !r.error);
    const invalid = resolved.filter((r) => r.error);

    if (valid.length === 0) {
      console.log(chalk.red('\nNo valid entries to submit.'));
      return;
    }

    console.log(`\n  ${chalk.green(`${valid.length} valid`)}${invalid.length > 0 ? `, ${chalk.red(`${invalid.length} errors`)}` : ''}`);

    const client = new RedmineClient(config.url, config.apiKey);
    let success = 0;
    let failed = 0;

    for (const { params } of valid) {
      try {
        await client.createTimeEntry(params);
        success++;
      } catch {
        failed++;
      }
    }

    console.log(chalk.green(`\nSubmitted: ${success} success`) + (failed > 0 ? chalk.red(`, ${failed} failed`) : ''));
  });
