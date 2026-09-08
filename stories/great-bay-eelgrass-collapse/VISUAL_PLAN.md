# Visual Plan: Great Bay Eelgrass Collapse

## Goal

Illustrate the story as richly as possible using:
1. **Assets we already own or can extract** from local source files (PREP, UNH, EPA, GRANIT).
2. **Assets likely available with permission** from PREP/UNH/CLF.
3. **New data visualizations** we can build from the numbers in our reporting.
4. **Only a few things we must illustrate from scratch** (eelgrass anatomy, cross-section, hero).

## Permission Guidance

| Source | Likely terms | Action needed |
|:---|:---|:---|
| PREP / UNH | Public-interest educational/research use usually allowed with attribution | Email Kalle Matso or PREP communications for explicit permission; credit photos/figures to PREP |
| CLF | Advocacy materials generally reusable with attribution | Ask Melissa Paly for any CLF-produced graphics |
| EPA | Federal public domain | Can reuse EPA screenshots, maps, fact sheets freely |
| GRANIT (UNH) | Public geospatial data | Free to use with attribution; maps built from it are ours |
| GB2030 / Ross Strategic | Foundation-funded planning docs | Ask PREP/7 Rivers to the Coast; likely shareable |
| Routhier aerial photos (2006) | Source unclear | Verify provenance before publication; may be PREP/UNH |

For anything that is not clearly ours or public domain, we should **ask before publishing** and keep placeholder attribution in the HTML.

## Existing Local Visual Assets

### Already converted/deployed
| Asset | File | Status |
|:---|:---|:---|
| Eelgrass year-slider map | `/eelgrass-indepthnh-embed/` | ✅ Live |
| MS4/waiver status map | `assets/ms4-waiver-map.html` + `.png` | ✅ Bundled |
| Stormwater accountability table | `assets/stormwater-accountability-table.html` | ✅ Bundled |
| Great Bay 2030 watershed map | `assets/gb2030-watershed-map.jpg` | ✅ Live |

### Available to extract/convert
| Asset | Location | Best use |
|:---|:---|:---|
| SOOE 2022 impervious-cover maps | `source-documents/GRANIT_downloads/PREP_SOOE/SOOE-2022/Figure_IS-1.pdf` through `Figure_IS-6.pdf` | Section on nonpoint runoff / impervious cover |
| Town-level impervious cover choropleth | `PREP_SOOE/imperv2021/` shapefile + town boundaries | Same; more precise than current table |
| Conservation lands maps | `ConservationLands_HUC10.png`, `ConservationLands_HUC12.png`, `ConsTownMapRevised.pdf`, `ConsWatershedMapRevised.pdf` | Watershed protection / land-conservation section |
| Routhier aerial/site photos (2006) | `source-documents/GRANIT_downloads/Routhier/RL/d-photos/IMG_*.JPG` | Possible "before" photos; verify permission |
| Great Bay 2030 vision graphics | `source-documents/Great Bay 2030/GB2030-Vision.pdf` | Restoration/future section |
| PREP 2010 presentation maps | `source-documents/PREP_presentation_Dec_2010.pdf` | Historical context / watershed anatomy |
| SOOE 2023 extended report figures | `source-documents/SOOE-2023-Extended-Report-updated-2024.pdf` | Data charts, indicators, photos |
| NH coastal restoration database | `GRANIT_Data/Vector_Data/Environment_and_Conservation/nh_coastal_restoration_database/` | Restoration project locations |
| Salt marsh + shoreline armoring data | `d-saltmarshmetrics2022/`, `d-shorelinestructureinventory/` | Habitat context (optional) |

### Data we can turn into charts
| Dataset | Source | Possible chart |
|:---|:---|:---|
| Eelgrass acreage by year | `/eelgrass-map/GIS_eelgrass_map/eelgrass_yearly_summary.json` | Line/bar chart of collapse |
| Nitrogen loads | SOOE 2023 text / extended report | Stacked bar: point vs. nonpoint vs. EPA target |
| Municipal wastewater spending | Draft text + SOOE | Bar chart: what towns spent |
| Impervious cover by town | Draft table + GRANIT | Bar chart or choropleth map |
| MS4/waiver status | `data/stormwater_tracking_nh_towns.csv` | Categorical map (done) or donut chart |
| Stormwater standards adoption | Draft text | 24/2/1/15 split chart |
| Water residence time comparison | Draft text | Great Bay vs. Odense vs. Portsmouth Harbor |

## Section-by-Section Visual Recommendations

### 1. Hook / "Hope vs. Collapse"

**Current placeholder:** Top hero visual from Denisha

**Options:**
- **A.** Keep asking Denisha for a strong opener photo of eelgrass beds or aerial Great Bay.
- **B.** Use one of the Routhier 2006 aerial photos if it shows healthy eelgrass or the bay — with permission.
- **C.** Build a **headline chart** showing the 2025 collapse numbers:
  - Great Bay estuary: 1,063 → 211 acres (−80%)
  - Great Bay proper: ~1,100 → 21.5 acres (−98%)
  - This could be a dramatic large-type graphic that doubles as the hero.

**Recommendation:** Do B if permission is quick; otherwise C as a fallback hero. Keep the eelgrass slider below it.

### 2. The Science — Why Recovery Takes So Long

**Current placeholder:** Cross-section graphic of eelgrass in water/soil with rhizome

**Options:**
- **A.** Create the cross-section from scratch (SVG or Python matplotlib/illustration tool). Show:
  - Water surface
  - Eelgrass blades
  - Rhizome network in sediment
  - Pollutants settling
  - Sediment being stirred by storm
  - Light blocked by algae/sediment
- **B.** Build a **water-residence-time comparison**:
  - Portsmouth Harbor: hours
  - Hampton-Seabrook: 24–48 hours
  - Odense Fjord: ~17 days
  - Great Bay: up to a month or more
  - Simple horizontal bar chart or icon comparison.
- **C.** Extract or recreate a Great Bay watershed anatomy map showing the rivers feeding the bay (could come from PREP 2010 presentation or GRANIT NHD data).

**Recommendation:** Build A and B ourselves. Use C if we can extract a clean PREP map with permission.

### 3. The Lawsuit and the Deal

**Current placeholder:** None in this section

**Options:**
- **A.** **Timeline graphic** of the legal/permit arc:
  - Early 2000s: CLF pressure, impaired listings
  - 2011–2013: town split, lawsuits, FOIA
  - 2017: Newmarket upgrade complete
  - 2019: Exeter upgrade complete
  - 2021: Great Bay Total Nitrogen General Permit
  - 2026–2027: EPA MS4 reevaluation
- **B.** **Municipal investment chart**:
  - Portsmouth ~$90–100M
  - Exeter ~$60M
  - Newmarket $11M
  - Epping $38M bond
  - Could be a horizontal bar chart with town names.
- **C.** **Trading mechanism diagram**: a simple flowchart showing how towns can swap wastewater-plant upgrades for stormwater reductions.

**Recommendation:** Build A and B. C is optional if the text explains the trading well enough.

### 4. Dover Does It

**Current placeholder:** None specifically (GB2030 map was placed earlier)

**Options:**
- **A.** **Dover BMP diagram**: what a bioretention pond does — stormwater in, filter media, alum sludge, cleaner water out. SVG or simple illustration.
- **B.** Photo of a Dover BMP if we can get one from Tim Puls or Dover Public Works.
- **C.** **Maintenance calendar/infographic**: 80 city BMPs, 120 private BMPs inspected annually.

**Recommendation:** Build A and C ourselves; ask Tim Puls for B.

### 5. You've Come A Long Way, Baby / The Gap

**Current placeholder:** None in this section

**Options:**
- **A.** **Nitrogen load stacked bar chart**:
  - Point source: 197 tons/year
  - Nonpoint source: 699 tons/year
  - Total: 895 tons/year
  - EPA target: 384 tons/year
  - Gap: 511 tons/year still to cut
- **B.** **Impervious-cover map**: use `Figure_IS-1.pdf` through `Figure_IS-6.pdf` or build a cleaner choropleth from GRANIT.
- **C.** **Stormwater standards adoption chart**: 24 complete / 2 in progress / 1 partial / 15 not adopted — donut or stacked bar.
- **D.** **MS4/waiver map**: already built; could be embedded in this section instead of earlier.
- **E.** **Before/after eelgrass photo pair** if we can identify locations from the Routhier photos and match to 2025 data.

**Recommendation:** Build A, B, and C. D is already bundled; decide placement. E is a stretch goal.

### 6. THE TIMES ARE CHANGING / Climate Whiplash and Time Lag

**Current placeholder:** None

**Options:**
- **A.** **Climate whiplash chart**: 2025 drought → intense rain → "chocolate milk" → eelgrass collapse. Simple event timeline or icon strip.
- **B.** **Sediment time-lag diagram**: 122 years of degradation → ~60 years to reverse; show carbon locked in sediment, storms re-stirring it.
- **C.** **Odense Fjord comparison**: map side-by-side or infographic comparing Odense to Great Bay (both shallow, long residence, eutrophic).
- **D.** **Vicious-cycle loop diagram**: nutrients → algae → blocks light → eelgrass dies → sediment loosens → more resuspension → less light.

**Recommendation:** Build A, B, and D ourselves. C optional if we can get a clean Odense map.

### 7. Holding the Line / What You Can Do

**Current placeholder:** Stormwater Tableau table (now embedded as accountability table)

**Options:**
- **A.** **Restoration roadmap timeline**:
  - Now–2026: Great Bay 2030 experiments
  - Dec 2026: MAAM final report
  - 2026–2027: EPA MS4 reevaluation
  - ~2028: next SOOE report
  - Ongoing: town meetings, BMP maintenance
- **B.** **"What you can do" infographic**: show individual actions and their relative impact (fertilizer, pet waste, septic, rain barrel, show up at town meeting).
- **C.** **Great Bay 2030 focal areas map**: already deployed; could be reused here if it fits better than in Section 3.

**Recommendation:** Build A and B. C is already live; move if desired.

## Priority Triage

### Quick wins (build or extract this week)
1. **Eelgrass acreage headline chart** — we have the JSON data.
2. **Nitrogen load chart** — numbers are in the draft.
3. **Impervious-cover map** — extract from SOOE Figure_IS PDFs or build from GRANIT.
4. **Stormwater standards adoption chart** — numbers are in the draft.
5. **Municipal investment chart** — numbers are in the draft.

### Medium effort (next week)
6. **Cross-section eelgrass diagram** — needs original illustration.
7. **Water-residence-time comparison** — simple chart.
8. **Timeline of lawsuit/permit** — needs design but data is ready.
9. **Dover BMP diagram** — simple original illustration.
10. **Vicious-cycle / sediment time-lag diagrams** — original illustrations.

### Permission-dependent / stretch
11. **Hero photo** — Denisha or Routhier/PREP photos.
12. **Dover BMP photo** — ask Tim Puls.
13. **SOOE/PREP figure extracts** — ask permission if not clearly public.
14. **Odense Fjord comparison** — need source material.

## Proposed File Structure for New Assets

```
stories/great-bay-eelgrass-collapse/assets/
├── existing files...
├── chart-eelgrass-acreage.svg        # or .png
├── chart-nitrogen-loads.svg
├── chart-municipal-investment.svg
├── chart-stormwater-adoption.svg
├── chart-water-residence-time.svg
├── map-impervious-cover.svg          # or extracted PDF PNG
├── diagram-eelgrass-cross-section.svg
├── diagram-bioretention-pond.svg
├── diagram-sediment-timelag.svg
├── diagram-vicious-cycle.svg
├── timeline-lawsuit-permit.svg
├── restoration-roadmap.svg
└── hero-[source].jpg                   # when available
```

## Tools to Build These

- **Charts**: Python `matplotlib` or `altair` (for SVG), or D3 in an HTML embed.
- **Maps**: QGIS + `geopandas`, or extract from existing PDFs with `pdftoppm`.
- **Diagrams**: SVG by hand, or use `matplotlib`/draw.io/Inkscape.
- **Photos**: `pdftoppm` for PDF figures; `convert`/`PIL` for resizing.

## Next Step Recommendation

Start with the quick wins. I can generate the five charts above as SVG/PNG files and update the HTML to embed them, then we can tackle the original diagrams and permission asks in parallel.

## Note on the Current Story File

This plan is designed to drop into the existing `index.html` placeholders. We should **not** edit `the writing` source file; we only add/replace visual elements in the HTML package.
