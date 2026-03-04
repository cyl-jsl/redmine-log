import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../lib/config.js';
import { RedmineClient } from '../lib/redmine-client.js';
import { localDateStr } from '../lib/parse-utils.js';

export function getDateRange(period: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => localDateStr(d);

  if (period === 'today') {
    const d = fmt(today);
    return { from: d, to: d };
  }

  if (period === 'week') {
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return { from: fmt(monday), to: fmt(friday) };
  }

  // Range format: YYYY-MM-DD:YYYY-MM-DD
  const parts = period.split(':');
  if (parts.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0]) && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
    return { from: parts[0], to: parts[1] };
  }

  throw new Error(`Invalid period: ${period}. Use "today", "week", or "YYYY-MM-DD:YYYY-MM-DD".`);
}

export const viewCommand = new Command('view')
  .description('View time entries')
  .argument('[period]', 'today, week, or YYYY-MM-DD:YYYY-MM-DD', 'today')
  .action(async (period: string) => {
    const config = loadConfig();
    if (!config) {
      console.error(chalk.red('Not initialized. Run: redmine-log init'));
      process.exit(1);
    }

    const { from, to } = getDateRange(period);
    const client = new RedmineClient(config.url, config.apiKey);
    const entries = await client.listTimeEntries({ user_id: 'me', from, to });

    if (entries.length === 0) {
      console.log(chalk.yellow(`No time entries found for ${from}${from !== to ? ` to ${to}` : ''}`));
      return;
    }

    console.log(chalk.cyan(`\nTime entries: ${from}${from !== to ? ` → ${to}` : ''}\n`));

    let totalHours = 0;
    for (const e of entries) {
      totalHours += e.hours;
      const issue = e.issue ? `#${e.issue.id}` : '';
      const dept = e.custom_fields?.find((cf) => cf.name.includes('部門'))?.value ?? '';
      console.log(
        `  ${chalk.dim(e.spent_on)}  ${String(e.hours).padStart(5)}h  ` +
        `${chalk.cyan(e.project.name.padEnd(20))} ${issue.padEnd(8)} ` +
        `${e.activity.name.padEnd(12)} ${dept ? chalk.magenta(dept) + ' ' : ''}` +
        `${chalk.dim(e.comments || '')}`,
      );
    }

    console.log(`\n  ${chalk.bold('Total:')} ${totalHours}h`);

    // Highlight empty days in week view
    if (period === 'week') {
      const entryDates = new Set(entries.map((e) => e.spent_on));
      const { from: weekStart } = getDateRange('week');
      const start = new Date(weekStart);
      const emptyDays: string[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = localDateStr(d);
        if (d <= new Date() && !entryDates.has(dateStr)) {
          emptyDays.push(dateStr);
        }
      }
      if (emptyDays.length > 0) {
        console.log(chalk.red(`\n  Missing entries: ${emptyDays.join(', ')}`));
      }
    }
  });
