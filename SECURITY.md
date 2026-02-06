# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| < 1.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in `react-sheet-table`, please report it responsibly.

**Do NOT open a public issue for security vulnerabilities.**

Instead, please email **security@skyflowlabs.com** with:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fix (optional)

### What to expect

- **Acknowledgment:** We will acknowledge your report within **48 hours**.
- **Updates:** We will provide status updates every **5 business days** until the issue is resolved.
- **Resolution:** We aim to release a patch within **14 days** of confirming the vulnerability.
- **Credit:** If you wish, we will credit you in the release notes and SECURITY.md.

### Scope

The following are in scope:

- XSS vulnerabilities in data sanitization
- Formula injection in spreadsheet/CSV exports
- Prototype pollution or injection attacks
- Dependencies with known CVEs

The following are out of scope:

- Issues in consumer applications using this library
- Vulnerabilities requiring physical access
- Social engineering attacks

## Security Features

This library includes built-in security features:

- **XSS sanitization** — HTML tag stripping, event handler detection, null byte removal
- **Formula injection prevention** — Neutralizes dangerous prefixes in spreadsheet/CSV exports
- **Input validation** — File type, size, and content validation for imports
- **Path traversal protection** — Suspicious filename detection

## Security Updates

Security updates are published as patch releases and announced via GitHub Releases.
