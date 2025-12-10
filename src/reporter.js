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
        style: { head: ['cyan'] },
        wordWrap: true,
        // Optional: define column widths relative to user's terminal or fixed?
        // Let's rely on wordWrap but maybe set some widths to force wrapping?
        // cli-table3 auto-size if not specified, but wrapping needs explicit width or it might just expand?
        // Actually, wordWrap works best when there is a constrained width.
        // Let's set some reasonable defaults for a standard simplified view.
        // Or better, let's just let it auto-size but truncate/wrap content manually if needed?
        // No, cli-table3 `wordWrap: true` wraps content into new lines if it exceeds the column width.
        // But what defines column width?
        // Let's try specifying colWidths to help structure it.
        // Package: 20, Version: 15, Status: 15, Severity: 15, Patched: 25, Advisory: 30
        // Total ~ 120 chars, fits in most terminals.
        colWidths: isDeep ? [20, 15, 15, 15, 25, 30] : [25, 20, 20, 45]
    });

    const depNames = Object.keys(dependencies);
    let vulnerabilityCount = 0;

    if (results) {
        results.forEach((result, index) => {
            const pkgName = depNames[index];
            const pkgVersion = dependencies[pkgName];

            if (result && result.vulns && result.vulns.length > 0) {
                vulnerabilityCount++;
                // ID calculation logic moved down to handle both modes consistent formatting?
                // Actually, `ids` variable was defined at top of loop. Let's change it there for non-deep mode too or just remove the early definition.
                // It was: const ids = result.vulns.map(v => v.id).join(', ');
                // Let's defer it.

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
                        maxSeverity = severities.join('\n'); // Stack vertically
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
                    const patchedStr = fixedVersions.size > 0 ? Array.from(fixedVersions).join('\n') : 'N/A';
                    row.push(chalk.green(patchedStr));
                }

                // Stack IDs vertically too
                const ids = result.vulns.map(v => v.id).join('\n');
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
