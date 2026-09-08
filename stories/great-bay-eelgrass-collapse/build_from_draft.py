#!/usr/bin/env python3
"""Build an HTML story package from the eelgrass draft."""
import re
from pathlib import Path
import shutil
import subprocess

src_dir = Path("/home/kinch/Desktop/INDNH-stories/great-bay-eelgrass")
pkg_dir = src_dir / "story-package"
assets_dir = pkg_dir / "assets"

pkg_dir.mkdir(parents=True, exist_ok=True)
assets_dir.mkdir(parents=True, exist_ok=True)

text = (src_dir / "the writing").read_text()

# Copy existing assets
copy_map = {
    src_dir / "embeds" / "stormwater-accountability-table.html": assets_dir / "stormwater-accountability-table.html",
    src_dir / "embeds" / "ms4-waiver-map" / "ms4-waiver-map.html": assets_dir / "ms4-waiver-map.html",
    src_dir / "embeds" / "ms4-waiver-map" / "ms4-waiver-map.png": assets_dir / "ms4-waiver-map.png",
    src_dir / "MS4 and waiver info from EPA.png": assets_dir / "ms4-waiver-epa.png",
}

for src, dst in copy_map.items():
    if src.exists():
        shutil.copy2(src, dst)
        print(f"Copied: {dst.name}")
    else:
        print(f"Missing asset: {src}")


def convert_ascii_table(md_text):
    """Find and convert ASCII box-drawing tables to markdown tables."""
    lines = md_text.splitlines()
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Detect table start
        if re.match(r"^┌[─┬┼]+┐\s*$", line):
            table_lines = []
            while i < len(lines) and not re.match(r"^└[─┴┼]+┘\s*$", lines[i]):
                table_lines.append(lines[i])
                i += 1
            if i < len(lines):
                table_lines.append(lines[i])  # bottom border
                i += 1
            # Caption line
            caption = ""
            if i < len(lines) and lines[i].strip().startswith("*Table"):
                caption = lines[i].strip().strip("*")
                i += 1
            out.append(ascii_to_markdown(table_lines, caption))
            continue
        out.append(line)
        i += 1
    return "\n".join(out)


def ascii_to_markdown(table_lines, caption):
    rows = []
    for line in table_lines:
        stripped = line.strip()
        # Skip lines composed only of box-drawing characters and spaces
        if re.match(r"^[\s┌├┼┤└┬┴─┐│┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋]*$", stripped):
            continue
        parts = [p.strip() for p in line.split("│")]
        # Remove empty leading/trailing cells from box drawing
        parts = [p for p in parts if p != ""]
        if parts and len(parts) >= 2:
            rows.append(parts)
    if not rows:
        return ""
    md = ["| " + " | ".join(rows[0]) + " |"]
    md.append("| " + " | ".join(["---"] * len(rows[0])) + " |")
    for row in rows[1:]:
        md.append("| " + " | ".join(row) + " |")
    if caption:
        md.append(f"\n*{caption}*")
    return "\n".join(md)


text = convert_ascii_table(text)

# Clean up the text
lines = text.splitlines()
md_lines = []
i = 0
while i < len(lines):
    line = lines[i]

    # Skip the legend/instructions block at the top
    if i < 30 and line.strip() in {
        "Legend:",
        ">>>>>>>>>>>>>>> = new subhed",
        "#### = graphics or embeds I will create later.",
        "Sections:",
        "1. Intro",
        "2. The Science",
        "3. The Lawsuit & The Deal (subsection 'Dover Does It')",
        "4. Youve Come A Long Way, Baby",
        "5. The Times Are Changing",
        "6. Holding the Line and Active Restoration",
        "----------------------------------------",
    }:
        i += 1
        continue

    # Convert subhed markers to h2
    if line.strip().startswith(">>>>>>>>>>>>>>>"):
        heading = line.strip().replace(">>>>>>>>>>>>>>>", "").strip()
        if heading:
            md_lines.append(f"\n## {heading}\n")
        i += 1
        continue

    # Convert top visual markers to placeholder divs
    if line.strip().startswith("###"):
        label = line.strip().replace("#", "").strip()
        if "VISUAL" in label.upper() or "SLIDER" in label.upper():
            md_lines.append(f"\n<div class=\"visual-placeholder\" data-label=\"{label}\"></div>\n")
            i += 1
            continue

    # Convert #### embed markers to placeholder divs
    if line.strip().startswith("####"):
        label = line.strip().replace("#", "").strip()
        md_lines.append(f"\n<div class=\"visual-placeholder\" data-label=\"{label}\"></div>\n")
        i += 1
        continue

    if "ADD JUMP TO STORMWATER REG TABLEAU TABLE HERE" in line:
        md_lines.append('\n<div class="embed-wrapper"><p><em>Stormwater accountability table embed would appear here. See <a href="assets/stormwater-accountability-table.html">assets/stormwater-accountability-table.html</a>.</em></p></div>\n')
        i += 1
        continue

    # Convert raw URLs to links
    if re.match(r"^https?://\S+$", line.strip()):
        url = line.strip()
        md_lines.append(f"\n[{url}]({url})\n")
        i += 1
        continue

    md_lines.append(line)
    i += 1

md_text = "\n".join(md_lines)

# Write markdown intermediate
md_path = pkg_dir / "story.md"
md_path.write_text(md_text)

# Create CSS
style = """body {
    font-family: Georgia, "Times New Roman", serif;
    line-height: 1.7;
    max-width: 760px;
    margin: 0 auto;
    padding: 2rem 1rem;
    color: #222;
    background: #fff;
}

.story-header {
    border-bottom: 4px solid #2d5a4a;
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
}

.story-header h1 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 2.6rem;
    line-height: 1.15;
    margin: 0 0 0.5rem 0;
    color: #1a1a1a;
}

.dek {
    font-size: 1.25rem;
    color: #444;
    font-style: italic;
    margin: 0 0 1rem 0;
}

.byline {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 0.95rem;
    color: #666;
}

h2, h3 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.25;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    color: #2d5a4a;
}

h2 { font-size: 1.8rem; }

p { margin: 0 0 1.2rem 0; }

blockquote {
    border-left: 4px solid #2d5a4a;
    margin: 1.5rem 0;
    padding: 0 1.2rem;
    color: #444;
    font-style: italic;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.5rem 0;
    font-size: 0.95rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

th, td {
    border: 1px solid #ccc;
    padding: 0.5rem 0.75rem;
    text-align: left;
}

th { background: #f4f4f4; }

.visual-placeholder {
    border: 2px dashed #2d5a4a;
    background: #f8faf8;
    padding: 2.5rem 1rem;
    margin: 1.5rem 0;
    text-align: center;
    color: #555;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    border-radius: 4px;
}

.visual-placeholder::before {
    content: "[Visual: " attr(data-label) "]";
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.visual-placeholder::after {
    content: "Placeholder — asset to be created or inserted.";
    display: block;
    font-size: 0.9rem;
    color: #777;
}

.embed-wrapper {
    border: 1px solid #ccc;
    background: #fafafa;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
}

.service-box {
    background: #f4f4f4;
    padding: 1.5rem;
    margin: 2.5rem 0 2rem 0;
    border-left: 4px solid #2d5a4a;
}

.service-box h3 {
    margin-top: 0;
    color: #2d5a4a;
}

.service-box ul {
    margin-bottom: 0;
}

ul { margin-bottom: 1.2rem; }

a { color: #2d5a4a; }

.asset-note {
    background: #fff8e1;
    border: 1px solid #ffe082;
    padding: 1rem;
    margin: 2rem 0;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 0.95rem;
}
"""
(pkg_dir / "style.css").write_text(style)

# Generate HTML with pandoc
try:
    subprocess.run([
        "pandoc", str(md_path), "-o", str(pkg_dir / "index.html"),
        "--standalone",
        "--css=style.css",
        "--metadata", "title=Great Bay Eelgrass Collapse",
    ], check=True)
    print(f"Generated: {pkg_dir / 'index.html'}")
except subprocess.CalledProcessError as e:
    print(f"Pandoc failed: {e}")

# Post-process HTML to add header and service-box class
html = (pkg_dir / "index.html").read_text()

# Add header after title-block
header_html = """<div class="story-header">
<h1>Great Bay Eelgrass Collapse</h1>
<p class="dek">A rough draft on the loss of New Hampshire’s underwater meadows — and what it will take to bring them back.</p>
<p class="byline">By Aaron R. Davis</p>
</div>
"""
html = html.replace(
    '<h1 class="title">Great Bay Eelgrass Collapse</h1>\n</header>',
    '<h1 class="title">Great Bay Eelgrass Collapse</h1>\n</header>' + "\n" + header_html
)

# Add asset note before body close
asset_note = """<div class="asset-note">
<p><strong>Assets bundled with this package:</strong></p>
<ul>
<li><a href="assets/stormwater-accountability-table.html">Stormwater accountability table (HTML)</a></li>
<li><a href="assets/ms4-waiver-map.html">MS4/waiver map (HTML)</a></li>
<li><a href="assets/ms4-waiver-map.png">MS4/waiver map (PNG)</a></li>
<li><a href="assets/ms4-waiver-epa.png">MS4/waiver EPA screenshot (PNG)</a></li>
</ul>
<p><strong>Visuals still to create:</strong> eelgrass slider, cross-section diagram, watershed map, stormwater Tableau embed jump.</p>
</div>
"""
html = html.replace('</body>', asset_note + "\n</body>")

# Style the service box
html = html.replace('<p>Service box — How to get involved:</p>', '<div class="service-box"><h3>How to get involved</h3>')
html = html.replace('</p>\n\n<ul>\n<li>Great Bay 2030:', '</p>\n\n<ul>\n<li><a href="https://prepestuaries.org/what-we-do/great-bay-2030/">Great Bay 2030</a>')
html = html.replace('</li>\n</ul>\n\n<p>For more information on Great Bay 2030, contact:', '</li>\n</ul></div>\n\n<p>For more information on Great Bay 2030, contact:')

# Fix plain service box URLs (split across lines)
html = html.replace('<li>7 Rivers to the Coast volunteer and event hub:\n7rivers2coast.org</li>',
                    '<li><a href="https://7rivers2coast.org/">7 Rivers to the Coast volunteer and event hub</a></li>')
html = html.replace('<li>Great Bay 2030: prepestuaries.org/what-we-do/great-bay-2030</li>',
                    '<li><a href="https://prepestuaries.org/what-we-do/great-bay-2030/">Great Bay 2030</a></li>')
html = html.replace('<li>Great Bay Alliance: greatbay.org</li>',
                    '<li><a href="https://greatbay.org/">Great Bay Alliance</a></li>')
html = html.replace('<li>State of Our Estuaries indicators dashboard:\nstateofourestuaries.org</li>',
                    '<li><a href="https://stateofourestuaries.org/">State of Our Estuaries indicators dashboard</a></li>')

# Close service-box div before asset-note
html = html.replace('</ul>\n<div class="asset-note">', '</ul>\n</div>\n<div class="asset-note">')

(pkg_dir / "index.html").write_text(html)
print("Post-processed index.html")
