---
name: Vite API proxy
description: Frontend /api/* fetches require a Vite dev server proxy to reach the API server
---

The conflicts-dashboard Vite config must include a proxy for `/api` routes pointing to the API server (port 8080). Without it, `fetch('/api/conflicts')` returns the Vite HTML page instead of JSON.

**Why:** Vite serves the frontend and doesn't automatically forward unknown routes to another server.

**How to apply:** In `vite.config.ts` server block, add: `proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }`
