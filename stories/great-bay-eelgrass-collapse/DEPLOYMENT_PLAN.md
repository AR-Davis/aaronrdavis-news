# Deployment Plan: Eelgrass Story Package to aaronrdavis.news

## Status

✅ **Deployed and live on the custom domain:**
```
https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/
```

## Goal

Publish the rough-draft eelgrass story and its supporting graphics as a public, pitch-ready page on `aaronrdavis.news`, with a path that can be shared with NH publications and funders.

## Current Site Setup

- **Site:** `aaronrdavis.news`
- **Platform:** Cloudflare Pages
- **Repo:** `/home/kinch/Projects/aaronrdavis-news/`
- **Production branch:** `main` (the Cloudflare Pages project is configured to treat `main` as the production branch)
- **Deploy tool:** Wrangler (`wrangler.toml` + `npm run deploy`)
- **Auth:** Currently public; `_worker.js` has a disabled basic-auth gate
- **Existing eelgrass assets already on the site:**
  - `/eelgrass-indepthnh-embed/` — year-slider map embed for InDepthNH
  - `/eelgrass-map/` — full-screen eelgrass coverage map with yearly GeoJSON

## Live URLs

| URL | Status |
|:---|:---|
| `https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/` | ✅ Live |
| `https://aaronrdavis.news/eelgrass-indepthnh-embed/` | ✅ Live |
| `https://aaronrdavis.news/eelgrass-map/` | ✅ Live |
| `https://aaronrdavis.news/` | ✅ Live, with Featured Story section |

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
5. Committed and deployed via `npm run deploy` from the `main` branch.

## Branch Note

The Cloudflare Pages project is configured to treat `main` as the production branch. The repo was originally on `master`, so deploying from `master` created only Preview deployments that did not serve on `aaronrdavis.news`. We now have a local `main` branch at the same commit. **Future deploys should run from `main`.**

## Regenerating

If the source draft changes, run the build script from the story directory:

```bash
cd /home/kinch/Projects/aaronrdavis-news/stories/great-bay-eelgrass-collapse
python3 build_from_draft.py
```

Then deploy from the `main` branch:

```bash
cd /home/kinch/Projects/aaronrdavis-news
git checkout main
npm run deploy
```

## Next Steps

1. Create/receive the top hero visual and eelgrass cross-section diagram.
2. Replace the two remaining placeholders in `index.html`.
3. Re-deploy from `main`.
4. Share the final `aaronrdavis.news/stories/great-bay-eelgrass-collapse/` URL with NH publications and funders.
