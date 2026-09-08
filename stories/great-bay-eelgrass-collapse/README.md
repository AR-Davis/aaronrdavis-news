# Great Bay Eelgrass Collapse — Story Package

A self-contained HTML version of the rough draft, ready to preview or host.

**Live URL:** `https://aaronrdavis.news/stories/great-bay-eelgrass-collapse/`

## Files

| File | Purpose |
|:---|:---|
| `index.html` | Full story rendered as a generic webpage |
| `style.css` | Basic article styling |
| `story.md` | Intermediate markdown used to generate the HTML |
| `assets/stormwater-accountability-table.html` | Existing HTML table embed |
| `assets/ms4-waiver-map.html` | Existing interactive map embed |
| `assets/ms4-waiver-map.png` | Map fallback PNG |
| `assets/ms4-waiver-epa.png` | EPA MS4 screenshot |
| `assets/gb2030-watershed-map.jpg` | Converted Great Bay 2030 watershed map |

## Visuals Status

| Asset | Status |
|:---|:---|
| Eelgrass year-slider map | ✅ Live iframe embed |
| Great Bay 2030 watershed map | ✅ Live image embed |
| Stormwater accountability table | ✅ Live iframe embed |
| MS4/waiver map | ✅ Bundled |
| Top hero visual | ❌ Placeholder — to be supplied by Denisha |
| Cross-section eelgrass diagram | ❌ Placeholder — to be created |

## Hosting

This is a static package. The live version is deployed on Cloudflare Pages. To host it elsewhere, upload the entire directory and link to `index.html`.

## Regenerating

The conversion script is saved at `build_from_draft.py`. Run it from this directory if the source draft changes:

```bash
python3 build_from_draft.py
```

Then re-deploy from the site repo root on the `main` branch:

```bash
cd /home/kinch/Projects/aaronrdavis-news
git checkout main
npm run deploy
```

## Note

This is a **rough draft**. The canonical source remains `../the writing`.
