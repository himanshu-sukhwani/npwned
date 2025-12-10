#!/usr/bin/env node

import { program } from 'commander';
import { run } from '../src/index.js';

program
  .version('1.0.0')
  .description('Check package.json dependencies against vulnerability lists')
  .action(() => {
    run();
  });

program.parse(process.argv);
