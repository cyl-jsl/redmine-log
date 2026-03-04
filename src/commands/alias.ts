import { Command } from 'commander';
import chalk from 'chalk';
import { loadAliases, saveAliases } from '../lib/alias-resolver.js';
import type { AliasMap } from '../types.js';

type AliasCategory = 'projects' | 'activities' | 'depts' | 'issues';

const VALID_CATEGORIES: AliasCategory[] = ['projects', 'activities', 'depts', 'issues'];

function validateCategory(cat: string): AliasCategory {
  if (!VALID_CATEGORIES.includes(cat as AliasCategory)) {
    throw new Error(`Invalid category: ${cat}. Use: ${VALID_CATEGORIES.join(', ')}`);
  }
  return cat as AliasCategory;
}

export const aliasCommand = new Command('alias')
  .description('Manage aliases');

aliasCommand
  .command('list')
  .description('List all aliases')
  .action(() => {
    const aliases = loadAliases();
    let hasAny = false;

    for (const cat of VALID_CATEGORIES) {
      const entries = Object.entries(aliases[cat]);
      if (entries.length > 0) {
        hasAny = true;
        console.log(chalk.cyan(`\n${cat}:`));
        for (const [alias, target] of entries) {
          console.log(`  ${alias} → ${target}`);
        }
      }
    }

    if (!hasAny) {
      console.log(chalk.yellow('No aliases defined.'));
    }
  });

aliasCommand
  .command('set <category> <alias> <target>')
  .description('Set an alias (category: projects, activities, depts, issues)')
  .action((category: string, alias: string, target: string) => {
    const cat = validateCategory(category);
    const aliases = loadAliases();
    (aliases[cat] as Record<string, string | number>)[alias] =
      cat === 'issues' ? Number(target) : target;
    saveAliases(aliases);
    console.log(chalk.green(`Set ${cat} alias: ${alias} → ${target}`));
  });

aliasCommand
  .command('rm <category> <alias>')
  .description('Remove an alias')
  .action((category: string, alias: string) => {
    const cat = validateCategory(category);
    const aliases = loadAliases();
    if (!(alias in aliases[cat])) {
      console.error(chalk.red(`Alias not found: ${cat}/${alias}`));
      process.exit(1);
    }
    delete (aliases[cat] as Record<string, string | number>)[alias];
    saveAliases(aliases);
    console.log(chalk.green(`Removed ${cat} alias: ${alias}`));
  });
