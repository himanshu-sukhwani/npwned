import axios from 'axios';
import chalk from 'chalk';

const OSV_API_URL = 'https://api.osv.dev/v1/querybatch';

export async function checkVulnerabilities(dependencies) {
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
        const promises = chunks.map(chunk => axios.post(OSV_API_URL, { queries: chunk }));
        const responses = await Promise.all(promises);

        // Merge results from all batches
        const allResults = responses.flatMap(response => response.data.results);
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
