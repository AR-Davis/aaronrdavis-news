# Deployment Plan: Eelgrass Story Package to aaronrdavis.news

## Status

✅ **Deployed to Cloudflare Pages** at `https://master.aaronrdavis-news.pages.dev/stories/great-bay-eelgrass-collapse/`

⚠️ **Custom domain `aaronrdavis.news` routing issue detected** — all subpaths (e.g. `/stories/...`, `/eelgrass-indepthnh-embed/`) currently return the homepage HTML instead of the requested asset. This appears to be a Cloudflare zone/page rule or custom-domain configuration problem, not a code problem. The Pages deployment alias URL works correctly.

## Goal

Publish the rough-draft eelgrass story and its supporting graphics as a public, pitch-ready page on `aaronrdavis.news`, with a path that can be shared with NH publications and funders.

## Current Site Setup

- **Site:** `aaronrdavis.news`
- **Platform:** Cloudflare Pages
- **Repo:** `/home/kinch/Projects/aaronrdavis-news/`
- **Deploy tool:** Wrangler (`wrangler.toml` + `npm run deploy`)
- **Auth:** Currently public; `_worker.js` has a disabled basic-auth gate
- **Existing eelgrass assets already on the site:**
  - `/eelgrass-indepthnh-embed/` — year-slider map embed for InDepthNH
  - `/eelgrass-map/` — full-screen eelgrass coverage map with yearly GeoJSON

## Live URLs

| URL | Status |
|:---|:---|
| `https://master.aaronrdavis-news.pages.dev/stories/great-bay-eelgrass-collapse/` | ✅ Live, story renders correctly |
| `https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/` | ⚠️ Returns homepage (custom domain issue) |
| `https://master.aaronrdavis-news.pages.dev/eelgrass-indepthnh-embed/` | ✅ Live, embed renders correctly |
| `https://aaronrdavis.news/eelgrass-indepthnh-embed/` | ⚠️ Returns homepage (custom domain issue) |

## Files Added

```
stories/great-bay-eelgrass-collapse/
├── index.html          # story page (with live embeds + 2 remaining placeholders)
├── style.css           # page styling
├── README.md           # package notes
├── build_from_draft.py # regeneration script
├── story.md            # intermediate markdown
├── DEPLOYMENT_PLAN.md  # this file
└── assets/
    ├── stormwater-accountability-table.html
    ├── ms4-waiver-map.html
    ├── ms4-waiver-map.png
    ├── ms4-waiver-epa.png
    └── gb2030-watershed-map.jpg   # converted from PDF
```

## Embed Choices

- **Eelgrass year-slider:** Compact `/eelgrass-indepthnh-embed/` embedded via iframe at 500px tall (420px on mobile). Large enough to show the collapse clearly while staying inside the story flow.
- **Great Bay 2030 watershed map:** Converted the 7.8MB `GB-2030-map.pdf` to a 302KB, 1200px-wide progressive JPEG and embedded as an in-story figure.
- **Stormwater accountability table:** Embedded the existing `assets/stormwater-accountability-table.html` via iframe in place of the Tableau placeholder.

## Visual Assets Status

| Asset | Status | How it's used |
|:---|:---|:---|
| Eelgrass year-slider map | ✅ Live | iframe to `/eelgrass-indepthnh-embed/` |
| Great Bay 2030 watershed map | ✅ Live | `assets/gb2030-watershed-map.jpg` |
| Stormwater accountability table | ✅ Live | iframe to `assets/stormwater-accountability-table.html` |
| MS4/waiver map | ✅ Bundled | `assets/ms4-waiver-map.html` + PNG fallback |
| Top hero visual | ❌ Placeholder | To be supplied by Denisha |
| Eelgrass cross-section diagram | ❌ Placeholder | To be created |

## What Was Done

1. Converted `GB-2030-map.pdf` → `gb2030-watershed-map.jpg` (1200px wide, 302KB, progressive JPEG).
2. Copied `story-package/` into `/home/kinch/Projects/aaronrdavis-news/stories/great-bay-eelgrass-collapse/`.
3. Updated the story `index.html`:
   - Added Open Graph tags.
   - Added CSS for iframe embeds and in-story images.
   - Replaced the eelgrass slider placeholder with a 500px-tall iframe to `/eelgrass-indepthnh-embed/`.
   - Replaced the GB2030 map placeholder with the converted JPEG figure.
   - Replaced the stormwater Tableau placeholder with the existing accountability table iframe.
   - Kept placeholders for the hero visual and cross-section diagram.
4. Updated `aaronrdavis-news/index.html` homepage with a "Featured Story" section and updated Projects list.
5. Committed and deployed via `npm run deploy`.

## How to Fix the Custom Domain

1. Open the Cloudflare dashboard for `aaronrdavis.news`.
2. Go to **Pages** → `aaronrdavis-news` → **Custom domains**.
3. Verify `aaronrdavis.news` is listed and active. If it shows a warning, re-validate or remove/re-add.
4. Check **Rules** → **Page Rules** and **Transform Rules** for any wildcard redirect to `/`.
5. Check **Workers & Pages** → **Triggers/Routes** to ensure no worker route overrides the Pages deployment.
6. If a Cloudflare Access or redirect rule is catching all paths, disable or narrow it.
7. After fixing, purge cache (**Caching** → **Purge Everything**) and test with `curl -s https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/`.

## Regenerating

If the source draft changes, run the build script from the story directory:

```bash
cd /home/kinch/Projects/aaronrdavis-news/stories/great-bay-eelgrass-collapse
python3 build_from_draft.py
```

Then re-deploy from the repo root:

```bash
cd /home/kinch/Projects/aaronrdavis-news
npm run deploy
```

## Next Steps

1. Fix custom-domain routing so `https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/` resolves correctly.
2. Create/receive the top hero visual and eelgrass cross-section diagram.
3. Replace the two remaining placeholders in `index.html`.
4. Share the final `aaronrdavis.news` URL with NH publications and funders.
