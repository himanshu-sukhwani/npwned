import chalk from 'chalk';
import Table from 'cli-table3';

export function generateReport(dependencies, results) {
    const table = new Table({
        head: ['Package', 'Version', 'Status', 'Patched', 'Advisory'],
        style: { head: ['cyan'] }
    });

    const depNames = Object.keys(dependencies);
    let vulnerabilityCount = 0;

    if (results) {
        results.forEach((result, index) => {
            const pkgName = depNames[index];
            const pkgVersion = dependencies[pkgName];

            if (result && result.vulns && result.vulns.length > 0) {
                vulnerabilityCount++;
                const ids = result.vulns.map(v => v.id).join(', ');

                // Find fixed versions
                const fixedVersions = new Set();
                result.vulns.forEach(vuln => {
                    if (vuln.affected) {
                        vuln.affected.forEach(affected => {
                            if (affected.ranges) {
                                affected.ranges.forEach(range => {
                                    if (range.events) {
                                        range.events.forEach(event => {
                                            if (event.fixed) {
                                                fixedVersions.add(event.fixed);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                const patchedStr = fixedVersions.size > 0 ? Array.from(fixedVersions).join(', ') : 'N/A';

                table.push([
                    chalk.red(pkgName),
                    pkgVersion,
                    chalk.red('VULNERABLE'),
                    chalk.green(patchedStr),
                    chalk.red(ids)
                ]);
            }
        });
    }

    if (vulnerabilityCount === 0) {
        console.log(chalk.green('\n✅ No vulnerabilities found in dependencies.\n'));
    } else {
        console.log(chalk.red(`\n⚠️  Found ${vulnerabilityCount} vulnerabilities!\n`));
        console.log(table.toString());
    }
}
