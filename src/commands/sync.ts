import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../lib/config.js';
import { saveCache } from '../lib/cache.js';
import { RedmineClient } from '../lib/redmine-client.js';
import { findDeptCustomField } from './init.js';

export const syncCommand = new Command('sync')
  .description('Re-fetch projects, activities, and dept values')
  .action(async () => {
    const config = loadConfig();
    if (!config) {
      console.error(chalk.red('Not initialized. Run: redmine-log init'));
      process.exit(1);
    }

    console.log(chalk.yellow('Syncing with Redmine...'));
    const client = new RedmineClient(config.url, config.apiKey);

    const projects = await client.listProjects();
    console.log(chalk.green(`  ${projects.length} projects`));

    const activities = await client.listActivities();
    console.log(chalk.green(`  ${activities.length} activities`));

    let deptValues: string[] | undefined;
    const customFields = await client.listCustomFields();
    if (customFields) {
      const dept = findDeptCustomField(customFields);
      if (dept) {
        deptValues = dept.values;
        console.log(chalk.green(`  ${dept.values.length} dept values`));
      }
    }

    saveCache({ projects, activities, deptValues });
    console.log(chalk.green('\nCache updated.'));
  });
