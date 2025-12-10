import chalk from 'chalk';
import ora from 'ora';
import { findPackageJson, parsePackageJson, findPackageLock, parsePackageLock } from './parser.js';
import { checkVulnerabilities } from './checker.js';
import { generateReport } from './reporter.js';

export async function run() {
    console.log(chalk.bold.blue('npwned - Dependency Vulnerability Checker\n'));

    const spinner = ora('Scanning for dependency files...').start();

    let pkgData = null;
    let sourceFile = '';

    // Priority 1: package-lock.json (Recursive/Full Tree)
    const lockPath = findPackageLock();
    if (lockPath) {
        spinner.text = 'Found package-lock.json. Parsing full dependency tree...';
        const lockData = parsePackageLock(lockPath);
        if (lockData) {
            pkgData = lockData;
            sourceFile = 'package-lock.json';
        }
    }

    // Priority 2: package.json (Top-level only)
    if (!pkgData) {
        const packagePath = findPackageJson();
        if (packagePath) {
            spinner.text = 'Found package.json. Parsing top-level dependencies...';
            pkgData = parsePackageJson(packagePath);
            sourceFile = 'package.json';
        }
    }

    if (!pkgData) {
        spinner.fail('No package.json or package-lock.json found in current directory.');
        return;
    }

    const depCount = Object.keys(pkgData.dependencies).length;

    if (depCount === 0) {
        spinner.succeed(`No dependencies found in ${sourceFile}.`);
        return;
    }

    spinner.succeed(`Loaded ${depCount} dependencies from ${sourceFile}.`);
    const checkSpinner = ora(`Checking against OSV database...`).start();

    try {
        const results = await checkVulnerabilities(pkgData.dependencies);
        checkSpinner.stop();
        generateReport(pkgData.dependencies, results);
    } catch (error) {
        checkSpinner.fail('Failed to check dependencies.');
        console.error(error);
    }
}
