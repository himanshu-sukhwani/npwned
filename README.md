# npwned

> **N**PM **Pwnd**? Check if your dependencies are compromised.

`npwned` is a lightweight CLI utility that checks your `package.json` dependencies against the [Google OSV](https://osv.dev/) (Open Source Vulnerabilities) database. It helps you identify known vulnerabilities in your project's dependency tree.

**New:** Now supports recursive checking via `package-lock.json`!

## Installation

```bash
npm install -g npwned
```

or run it directly with `npx`:

```bash
npx npwned
```

## Usage

Navigate to your project directory (where your `package.json` is located) and run:

```bash
npwned
```

### Output Example

```
npwned - Dependency Vulnerability Checker

Reading package.json...
Checking 42 dependencies against OSV database...

⚠️  Found 1 vulnerabilities!

┌─────────┬──────────┬────────────┬─────────────────────┐
│ Package │ Version  │ Status     │ Advisory            │
├─────────┼──────────┼────────────┼─────────────────────┤
│ lodash  │ ^4.17.15 │ VULNERABLE │ GHSA-29mw-wpgm-hmr9 │
└─────────┴──────────┴────────────┴─────────────────────┘
```

## How it works

1.  Parses your `package.json` to get a list of dependencies.
2.  Queries the [OSV API](https://osv.dev/docs/#tag/api) in batch mode.
3.  Reports any known vulnerabilities found for the specified versions.

## License

MIT
