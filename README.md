# WA Badak - Cloudflare Workers Static Site

Static HTML/CSS/JS site prepared for Cloudflare Workers Builds.

## GitHub structure

- index.html
- style.css
- app.js
- wrangler.jsonc
- package.json
- .assetsignore
- README.md

## Cloudflare Workers Builds

- Build command: None
- Deploy command: `npx wrangler deploy`
- Root directory: `/` (leave it empty/default)
- Production branch: `main`

The Wrangler config serves the repository root as static assets.
