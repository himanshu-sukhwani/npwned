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

### Options

- `-d, --deep`: Perform a deep scan. Fetches full vulnerability details, including **Severity** and **Patched Versions**. (Slower)
- `-q, --quick`: Perform a quick scan. Checks for existence of vulnerabilities only. (Default, Faster)

### Output Examples

#### Quick Scan (Default)

```bash
npwned
# or
npwned --quick
```

```
⚠️  Found 1 vulnerabilities!
(Run with --deep to see severity and patched versions)

┌──────────┬─────────┬────────────┬─────────────────────┐
│ Package  │ Version │ Status     │ Advisory            │
├──────────┼─────────┼────────────┼─────────────────────┤
│ minimist │ 0.0.8   │ VULNERABLE │ GHSA-vh95-rmgr-6w4m │
└──────────┴─────────┴────────────┴─────────────────────┘
```

#### Deep Scan

```bash
npwned --deep
```

```
⚠️  Found 1 vulnerabilities!

┌──────────┬─────────┬────────────┬──────────┬───────────────┬─────────────────────┐
│ Package  │ Version │ Status     │ Severity │ Patched       │ Advisory            │
├──────────┼─────────┼────────────┼──────────┼───────────────┼─────────────────────┤
│ minimist │ 0.0.8   │ VULNERABLE │ HIGH     │ 1.2.6, 0.2.4  │ GHSA-vh95-rmgr-6w4m │
└──────────┴─────────┴────────────┴──────────┴───────────────┴─────────────────────┘
```

## How it works

1.  Parses your `package.json` to get a list of dependencies.
2.  Queries the [OSV API](https://osv.dev/docs/#tag/api) in batch mode.
3.  Reports any known vulnerabilities found for the specified versions.

## License

MIT
