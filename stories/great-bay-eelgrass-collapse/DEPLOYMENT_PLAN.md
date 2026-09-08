# Deployment Plan: Eelgrass Story Package to aaronrdavis.news

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

## Proposed URL Structure

```
https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/
```

This path is publication-style, descriptive, and future-proof.

## Files to Add

### 1. Story directory

Copy the contents of this `story-package/` directory into:

```
/home/kinch/Projects/aaronrdavis-news/stories/great-bay-eelgrass-collapse/
```

So it becomes:

```
stories/great-bay-eelgrass-collapse/
├── index.html          # story page
├── style.css           # page styling
├── assets/
│   ├── stormwater-accountability-table.html
│   ├── ms4-waiver-map.html
│   ├── ms4-waiver-map.png
│   └── ms4-waiver-epa.png
```

### 2. Reuse existing graphics

The new `index.html` currently uses placeholders for two visuals that already exist on the site:

| Placeholder in story | Existing asset on site | Suggested embed |
|:---|:---|:---|
| "SLIDER VISUAL OF EELGRASS COVERAGE, YR TO YR" | `/eelgrass-map/` or `/eelgrass-indepthnh-embed/` | iframe to `/eelgrass-map/?year=2025` or full-width embed |
| "ADD GRAPHIC OF PREP'S GB 2030 MAP OF WATERSHED" | `embeds/ms4-waiver-map.html` (already copied into assets) | Use local `assets/ms4-waiver-map.html` |

**Decision needed:** Should the story page embed the full `/eelgrass-map/` (best for standalone viewing) or the compact `/eelgrass-indepthnh-embed/` (better for in-article framing)?

### 3. Update site homepage

Add a section to `/home/kinch/Projects/aaronrdavis-news/index.html` linking to the new story:

```html
<h2>Featured Story</h2>
<p>
  <a href="/stories/great-bay-eelgrass-collapse/">
    <strong>Great Bay Eelgrass Collapse</strong>
  </a><br>
  A rough draft on the loss of New Hampshire’s underwater meadows and what it will take to bring them back.
</p>
```

## Deployment Steps

1. **Copy the package into the site repo**
   ```bash
   cp -r /home/kinch/Desktop/INDNH-stories/great-bay-eelgrass/story-package \
         /home/kinch/Projects/aaronrdavis-news/stories/great-bay-eelgrass-collapse
   ```

2. **Replace placeholders with real embeds**
   - Embed eelgrass slider (iframe to `/eelgrass-map/` or `/eelgrass-indepthnh-embed/`)
   - Confirm MS4/waiver map loads from `assets/ms4-waiver-map.html`
   - Decide whether to create a top hero visual and cross-section graphic now or leave as placeholders

3. **Update `index.html` homepage**
   - Add "Featured Story" or "Latest Work" section pointing to the new path

4. **Test locally**
   ```bash
   cd /home/kinch/Projects/aaronrdavis-news
   npx wrangler pages dev .
   ```
   Then visit `http://localhost:8788/stories/great-bay-eelgrass-collapse/`

5. **Deploy**
   ```bash
   npm run deploy
   ```
   Or, if wrangler is not configured:
   ```bash
   npx wrangler pages deploy .
   ```

6. **Verify**
   - Visit `https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/`
   - Check that assets load and placeholders render clearly
   - Confirm homepage link works

## Visual Assets Status

| Asset | Status | Location |
|:---|:---|:---|
| Eelgrass year-slider map | ✅ Exists | `/eelgrass-map/` and `/eelgrass-indepthnh-embed/` |
| MS4/waiver map | ✅ Exists | `assets/ms4-waiver-map.html` |
| Stormwater accountability table | ✅ Exists | `assets/stormwater-accountability-table.html` |
| Top hero visual | ❌ Needed | To be created or supplied by Denisha |
| Cross-section eelgrass diagram | ❌ Needed | To be created |
| Great Bay 2030 watershed map | ❌ Needed | To be created or pulled from PREP |

## Optional Enhancements

- **Custom domain path:** Could also live at `stories.eelgrass.aaronrdavis.news` if you want a cleaner share link, but a subdirectory is simpler.
- **Open Graph tags:** Add `<meta property="og:title">`, `og:description`, and `og:image` to `index.html` so the link looks good when shared.
- **Analytics:** Cloudflare Web Analytics can be enabled from the dashboard without code changes.
- **Print stylesheet:** Add `@media print` rules if you expect editors to print the draft.

## Risks

- **Wrangler authentication:** Tinker inventory noted Cloudflare Workers was "unauthenticated" earlier. You may need to log in with `npx wrangler login` before deploying.
- **Asset paths:** If the story page uses relative paths like `assets/...`, they will work under `/stories/great-bay-eelgrass-collapse/`. If any absolute paths were used, they would need updating.
- **Large GeoJSON for eelgrass map:** The existing `/eelgrass-map/` loads many GeoJSON files. Ensure they are included if the slider is embedded.

## Next Action

Decide on the eelgrass slider embed choice (`/eelgrass-map/` vs `/eelgrass-indepthnh-embed/`) and whether to create the missing hero/cross-section visuals before the first deploy, or publish with placeholders and iterate.
