---
name: GeoJSON property key
description: The bundled countries.geojson uses `name` not `ADMIN` for country names
---

The local GeoJSON file at `artifacts/conflicts-dashboard/public/countries.geojson` uses `properties.name` for country names, NOT `properties.ADMIN`. Code must use `feature?.properties?.name || feature?.properties?.ADMIN` to handle both. The file was downloaded from datasets/geo-countries and bundled locally to avoid slow external fetches.

**Why:** Raw GitHub fetch of 14MB GeoJSON was unreliable in the Replit sandbox; bundled version loads instantly.

**How to apply:** Any code reading country names from this GeoJSON must use `properties.name` as the primary key.
