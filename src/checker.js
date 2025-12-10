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

    try {
        const response = await axios.post(OSV_API_URL, { queries });
        return response.data.results;
    } catch (error) {
        if (error.response) {
            console.error(chalk.red(`OSV API Error: ${error.response.status} ${error.response.statusText}`));
        } else {
            console.error(chalk.red('Network error checking vulnerabilities:', error.message));
        }
        return [];
    }
}
