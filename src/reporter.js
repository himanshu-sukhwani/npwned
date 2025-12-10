import chalk from 'chalk';
import Table from 'cli-table3';

export function generateReport(dependencies, results, options = {}) {
    const isDeep = options.deep;

    const headers = ['Package', 'Version', 'Status'];
    if (isDeep) {
        headers.push('Severity');
        headers.push('Patched');
    }
    headers.push('Advisory');

    const table = new Table({
        head: headers,
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

                const row = [
                    chalk.red(pkgName),
                    pkgVersion,
                    chalk.red('VULNERABLE')
                ];

                if (isDeep) {
                    // Calculate Severity (Max)
                    let maxSeverity = 'UNKNOWN';
                    // Simple hack: check for CRITICAL, HIGH, MODERATE, LOW keywords if available
                    // Or parse CVSS score.
                    // OSV uses schema: severity: [ { type: 'CVSS_V3', score: '...' } ] or database_specific: { severity: 'MODERATE' }

                    const severities = result.vulns.map(v => {
                        if (v.database_specific && v.database_specific.severity) return v.database_specific.severity;
                        return null;
                    }).filter(Boolean);

                    if (severities.length > 0) {
                        maxSeverity = severities.join(', '); // Show all for now or optimize?
                    }

                    row.push(chalk.yellow(maxSeverity));

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
                    row.push(chalk.green(patchedStr));
                }

                row.push(chalk.red(ids));
                table.push(row);
            }
        });
    }

    if (vulnerabilityCount === 0) {
        console.log(chalk.green('\n✅ No vulnerabilities found in dependencies.\n'));
    } else {
        console.log(chalk.red(`\n⚠️  Found ${vulnerabilityCount} vulnerabilities!\n`));
        if (!isDeep) {
            console.log(chalk.dim('(Run with --deep to see severity and patched versions)\n'));
        }
        console.log(table.toString());
    }
}
