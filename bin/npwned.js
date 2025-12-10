#!/usr/bin/env node

import { program } from 'commander';
import { run } from '../src/index.js';

program
  .version('1.1.4')
  .description('Check package.json dependencies against vulnerability lists')
  .option('-d, --deep', 'Perform deep scan (fetch full details and severity)')
  .option('-q, --quick', 'Perform quick scan (default)')
  .action((options) => {
    run(options);
  });

program.parse(process.argv);
