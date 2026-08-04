# Security Policy (SECURITY)

## 1. Security Architecture

1. **Client-Side Processing**: Documents remain entirely within the browser and are never transmitted to external servers.
2. **XSS Protection**: `react-markdown` and `rehype-raw` sanitize output HTML to eliminate script execution vectors.
3. **Storage Isolation**: Encapsulated LocalStorage usage.

## 2. Vulnerability Reporting
Please report security vulnerabilities privately to the development team.
