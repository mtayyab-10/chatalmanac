# Server Security Headers — Deployment Guide

This document shows how to apply the production HTTP security headers
for servers and platforms that do not read the `public/_headers` file.

The `public/_headers` file works automatically on:
- Netlify
- Cloudflare Pages

For everything else, use the appropriate block below.

---

## What the headers do (plain language)

| Header | What it prevents |
|---|---|
| `Content-Security-Policy` | Blocks the browser from loading scripts, fonts, or images from any external server |
| `X-Frame-Options` | Prevents this page from being embedded inside another site (clickjacking) |
| `X-Content-Type-Options` | Stops the browser guessing the file type — it must use what the server says |
| `Referrer-Policy` | When a user clicks a link from this page, the destination site cannot see where they came from |
| `Permissions-Policy` | Disables camera, microphone, geolocation, USB, and payment APIs — none are needed |
| `Cross-Origin-Opener-Policy` | Isolates this page from other browser tabs |
| `Cross-Origin-Resource-Policy` | Prevents other sites from loading our files into their pages |

---

## Nginx

```nginx
server {
    listen 443 ssl;
    server_name chatalmanac.app;

    root /var/www/chatalmanac/dist;
    index index.html;

    # SPA fallback — all paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none';" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Resource-Policy "same-origin" always;

    # Cache static assets aggressively (they are content-hashed by Vite)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Never cache the service worker or index.html
    location ~* ^/(sw\.js|index\.html)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

## Apache (.htaccess)

```apache
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none';"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "no-referrer"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Resource-Policy "same-origin"
</IfModule>

# Cache Vite hashed assets for one year
<FilesMatch "\.([0-9a-f]{8})\.(js|css|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Never cache SW or HTML
<FilesMatch "^(sw\.js|index\.html)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>

# SPA fallback
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

---

## GitHub Pages

GitHub Pages does not support custom HTTP headers. If deploying there:

1. The CSP and security headers will not apply at the transport layer.
2. The Service Worker still provides the external-request blocking inside the browser.
3. The app still works correctly — it simply has a weaker security posture than a
   server you control.

Consider using Cloudflare Pages (free tier) as a drop-in replacement that does
support the `_headers` file.

---

## Verifying headers are set correctly

Use any of these tools after deploying:

- [securityheaders.com](https://securityheaders.com) — grades your headers A to F
- Browser developer tools → Network tab → click any request → Headers tab
- `curl -I https://chatalmanac.app/`

A correct deployment should show an **A** rating on securityheaders.com.

---

## CSP report-only mode (optional)

During a rollout you can switch to report-only mode to catch violations without
breaking the page:

```
Content-Security-Policy-Report-Only: default-src 'none'; ... report-uri /csp-report;
```

Chatalmanac does not implement a CSP report endpoint (that would require a server).
Use browser developer tools → Console to see CSP violations during testing instead.
