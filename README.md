# aaronrdavis.news

Portfolio and professional site for **Aaron R. Davis** — journalist, investigator, and researcher.

- **Live site:** https://aaronrdavis.news
- **Dashboard:** https://dashboard.aaronrdavis.news
- **GitHub:** https://github.com/AR-Davis

## About this repository

This is the source for my public portfolio. It includes case files, selected reporting clips, and data-journalism prototypes built with HTML, JavaScript, and Cloudflare Pages.

Key pages:
- `/` — Main portfolio and services overview
- `/cases/dc-foia-plr/` — Public litigation record for *Tax Analysts v. District of Columbia*
- `/pi-services.html` — Investigative and litigation-support services (not linked from the site)
- `/stories/great-bay-eelgrass-collapse/` — Environmental investigation, published as a self-hosted feature story

## Deployment

Deployed to Cloudflare Pages via the Wrangler CLI.

## Published surface

The deploy root is the repo root, so `_worker.js` blocks repo documentation from being served:
`*.md`, `*.toml`, `package.json`, build/config files (`_headers`, `_worker.js`), and dot-paths
other than `/.well-known/`. Add a new notes file anywhere and it stays private by default.
