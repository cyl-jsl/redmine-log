#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { batchCommand } from './commands/batch.js';
import { viewCommand } from './commands/view.js';
import { syncCommand } from './commands/sync.js';
import { aliasCommand } from './commands/alias.js';

const program = new Command()
  .name('redmine-log')
  .description('Redmine 工時自動化工具')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(batchCommand);
program.addCommand(viewCommand);
program.addCommand(syncCommand);
program.addCommand(aliasCommand);

program.parse();
