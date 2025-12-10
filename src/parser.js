import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function findPackageJson() {
    const cwd = process.cwd();
    const packagePath = path.join(cwd, 'package.json');
    if (fs.existsSync(packagePath)) {
        return packagePath;
    }
    return null;
}

export function findPackageLock() {
    const cwd = process.cwd();
    const lockPath = path.join(cwd, 'package-lock.json');
    if (fs.existsSync(lockPath)) {
        return lockPath;
    }
    return null;
}

export function parsePackageJson(packagePath) {
    try {
        const data = fs.readFileSync(packagePath, 'utf8');
        const json = JSON.parse(data);
        const deps = json.dependencies || {};
        const devDeps = json.devDependencies || {};

        const allDeps = {};

        // Normalize to standard list
        Object.keys(deps).forEach(k => {
            allDeps[k] = deps[k];
        });
        Object.keys(devDeps).forEach(k => {
            allDeps[k] = devDeps[k];
        });

        return {
            name: json.name,
            version: json.version,
            dependencies: allDeps,
            type: 'package.json'
        };
    } catch (error) {
        console.error(chalk.red('Error parsing package.json:', error.message));
        process.exit(1);
    }
}

export function parsePackageLock(lockPath) {
    try {
        const data = fs.readFileSync(lockPath, 'utf8');
        const json = JSON.parse(data);
        const allDeps = {};

        // Modern lock files (v2/v3) use 'packages' object where '' is root
        if (json.packages) {
            Object.entries(json.packages).forEach(([pkgPath, val]) => {
                if (!pkgPath) return; // skip root
                // pkgPath looks like node_modules/foo or node_modules/foo/node_modules/bar
                const name = pkgPath.split('node_modules/').pop();
                // We only want the name, e.g. 'bar'. If it was scoped '@scope/bar', split works too?
                // node_modules/@scope/bar -> pop -> @scope/bar. YES.

                if (val.version) {
                    allDeps[name] = val.version;
                }
            });
        } else if (json.dependencies) {
            // v1 lockfile approach - recursive scan
            const extractDeps = (deps) => {
                if (!deps) return;
                Object.keys(deps).forEach(name => {
                    const dep = deps[name];
                    if (dep.version) {
                        allDeps[name] = dep.version;
                    }
                    if (dep.dependencies) {
                        extractDeps(dep.dependencies);
                    }
                });
            };
            extractDeps(json.dependencies);
        }

        return {
            name: json.name,
            version: json.version,
            dependencies: allDeps,
            type: 'package-lock.json'
        };
    } catch (error) {
        console.error(chalk.red('Error parsing package-lock.json:', error.message));
        return null;
    }
}
