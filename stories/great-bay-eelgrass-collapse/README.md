# Great Bay Eelgrass Collapse — Story Package

A self-contained HTML version of the rough draft, ready to preview or host.

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

## Visuals still to create

The following are shown as placeholders in `index.html`:

- Top visual from Denisha
- Eelgrass coverage slider (year-to-year)
- Cross-section graphic of eelgrass in water/soil with rhizome
- Great Bay 2030 watershed map
- Stormwater regulation Tableau embed

## Hosting

This is a static package. To host it:

1. Upload the entire `story-package/` directory to your web server.
2. Link to `index.html`.
3. Replace placeholder `<div class="visual-placeholder">` elements with real images, sliders, or embeds as they are created.

## Regenerating

The conversion script is saved at:
`/home/kinch/Desktop/INDNH-stories/great-bay-eelgrass/story-package/build_from_draft.py`

Run it from the story-package directory if the source draft changes:

```bash
cd /home/kinch/Desktop/INDNH-stories/great-bay-eelgrass/story-package
python3 build_from_draft.py
```

## Note

This is a **rough draft**. Typos and placeholder visuals are expected. The HTML has been lightly cleaned for pitching but the canonical source remains `../the writing`.
