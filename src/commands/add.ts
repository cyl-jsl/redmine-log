import { Command } from 'commander';
import chalk from 'chalk';
import { parseHours, parseDate } from '../lib/parse-utils.js';
import { loadConfig } from '../lib/config.js';
import { loadCache } from '../lib/cache.js';
import { loadAliases, resolveProject, resolveActivity, resolveDept } from '../lib/alias-resolver.js';
import { RedmineClient } from '../lib/redmine-client.js';
import type { CreateTimeEntryParams } from '../types.js';

export interface ParsedAddArgs {
  hours: number;
  project: string;
  activity: string;
  issue?: number;
}

export function parseAddArgs(args: string[]): ParsedAddArgs {
  if (args.length < 3) {
    throw new Error('Usage: redmine-log add <hours> <project> [#issue] <activity>');
  }

  const hours = parseHours(args[0]);

  // Extract #issue from anywhere in the remaining args
  let issue: number | undefined;
  const remaining: string[] = [];
  for (let i = 1; i < args.length; i++) {
    const m = args[i].match(/^#(\d+)$/);
    if (m && issue === undefined) {
      issue = Number(m[1]);
    } else {
      remaining.push(args[i]);
    }
  }

  if (remaining.length < 2) {
    throw new Error('Usage: redmine-log add <hours> <project> [#issue] <activity>');
  }

  return { hours, project: remaining[0], activity: remaining[1], issue };
}

export const addCommand = new Command('add')
  .description('Add a single time entry')
  .argument('<args...>', 'hours project [#issue] activity')
  .option('-d, --date <date>', 'Date (YYYY-MM-DD, MM/DD, today, yesterday)', 'today')
  .option('--dept <dept>', 'Department (歸屬部門)')
  .option('-c, --comment <comment>', 'Comment (內容說明)', '')
  .action(async (args: string[], opts) => {
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

    const parsed = parseAddArgs(args);
    const spentOn = parseDate(opts.date);

    const project = resolveProject(parsed.project, aliases, cache);
    if (!project) {
      console.error(chalk.red(`Project not found: ${parsed.project}`));
      process.exit(1);
    }

    const activity = resolveActivity(parsed.activity, aliases, cache);
    if (!activity) {
      console.error(chalk.red(`Activity not found: ${parsed.activity}`));
      process.exit(1);
    }

    const params: CreateTimeEntryParams = {
      project_id: project.id,
      issue_id: parsed.issue,
      spent_on: spentOn,
      hours: parsed.hours,
      activity_id: activity.id,
      comments: opts.comment,
    };

    if (opts.dept && config.deptCustomFieldId) {
      const dept = resolveDept(opts.dept, aliases, cache);
      if (!dept) {
        console.error(chalk.red(`Department not found: ${opts.dept}`));
        process.exit(1);
      }
      params.custom_fields = [{ id: config.deptCustomFieldId, value: dept }];
    }

    console.log(chalk.cyan('\nTime Entry Preview:'));
    console.log(`  Date:     ${spentOn}`);
    console.log(`  Project:  ${project.name}`);
    if (parsed.issue) console.log(`  Issue:    #${parsed.issue}`);
    console.log(`  Hours:    ${parsed.hours}`);
    console.log(`  Activity: ${activity.name}`);
    if (params.custom_fields) console.log(`  Dept:     ${params.custom_fields[0].value}`);
    if (opts.comment) console.log(`  Comment:  ${opts.comment}`);

    const client = new RedmineClient(config.url, config.apiKey);
    const entry = await client.createTimeEntry(params);
    console.log(chalk.green(`\nCreated time entry #${entry.id}`));
  });
