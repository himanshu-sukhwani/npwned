import axios from 'axios';
import chalk from 'chalk';

const OSV_API_URL = 'https://api.osv.dev/v1/querybatch';

export async function checkVulnerabilities(dependencies, options = {}) {
    const queries = Object.entries(dependencies).map(([name, version]) => {
        const cleanVersion = version.replace(/[^0-9.]/g, '');
        return {
            package: {
                name: name,
                ecosystem: 'npm'
            },
            version: cleanVersion
        };
    });

    const BATCH_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < queries.length; i += BATCH_SIZE) {
        chunks.push(queries.slice(i, i + BATCH_SIZE));
    }

    try {
        // 1. Get batch results (stripped)
        const promises = chunks.map(chunk => axios.post(OSV_API_URL, { queries: chunk }));
        const responses = await Promise.all(promises);
        const allResults = responses.flatMap(response => response.data.results);

        // 2. Collect unique vulnerability IDs
        const vulnIds = new Set();
        allResults.forEach(result => {
            if (result && result.vulns) {
                result.vulns.forEach(v => vulnIds.add(v.id));
            }
        });

        if (vulnIds.size === 0) return allResults;

        // 3. Fetch full details for each ID (ONLY IF DEEP SCAN IS REQUESTED)
        if (options.deep) {
            // We can use Promise.all, but let's limit concurrency slightly if huge? 
            // For a CLI, 10-20 concurrent requests is fine.
            const fullVulns = new Map();
            const idList = Array.from(vulnIds);

            // Simple concurrent fetch
            const detailPromises = idList.map(async (id) => {
                try {
                    const res = await axios.get(`https://api.osv.dev/v1/vulns/${id}`);
                    return res.data;
                } catch (e) {
                    // If fetch fails, we just won't have details. Return stripped or null.
                    console.error(chalk.yellow(`Failed to fetch details for ${id}`));
                    return null;
                }
            });

            const details = await Promise.all(detailPromises);
            details.forEach(searchedVuln => {
                if (searchedVuln) {
                    fullVulns.set(searchedVuln.id, searchedVuln);
                }
            });

            // 4. Hydrate results
            allResults.forEach(result => {
                if (result && result.vulns) {
                    result.vulns = result.vulns.map(v => fullVulns.get(v.id) || v);
                }
            });
        }

        return allResults;
    } catch (error) {
        if (error.response) {
            console.error(chalk.red(`OSV API Error: ${error.response.status} ${error.response.statusText}`));
        } else {
            console.error(chalk.red('Network error checking vulnerabilities:', error.message));
        }
        return [];
    }
}
