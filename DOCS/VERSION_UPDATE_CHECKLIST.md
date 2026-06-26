# Version Update Checklist

When pushing a new version update, update these files to maintain consistency across the project:

## Required Updates

### 1. Version Display Files
- **[js/ui/MainMenuScreen.js](js/ui/MainMenuScreen.js)**
  - Update `drawVersionBox()` version string (line ~808)
  - Update `drawTechnologyBranding()` version text width calculation (line ~878)

- **[js/ui/AboutScreen.js](js/ui/AboutScreen.js)**
  - Update version display text (line ~46)
  - Update engine version display text (line ~49)

### 2. Landing Page (index.html)
- **Tagline badge** (line ~868): Update version in `<span class="tagline">`
- **Engine info badge** (line ~870): Update engine version in `<span class="engine-name">`
- **Technical Specs** (line ~1344): Update engine version in stats section
- **Version Info Bubbles** (starting ~1419): Add new section for current version with recent features

### 3. News Reel Content
- **[js/core/constants.js](js/core/constants.js)**
  - Update `NEWS_UPDATES` constant (line ~109)
  - Include highlights from most recent versions
  - Keep format: "NEW: [Version]: [Feature] | [Feature] | ..."
  - Clean up older entries to keep it concise

### 4. Documentation Files (Optional but Recommended)
- **[DOCS/CHANGELOG.md](DOCS/CHANGELOG.md)**: Add entry for new version
- **[DOCS/SCRATCHPAD.md](DOCS/SCRATCHPAD.md)**: Update with completed tasks
- **[DOCS/SUMMARY.md](DOCS/SUMMARY.md)**: Update "Recent Updates" section if major changes

### 5. Server Files (if applicable)
- **[launch.ps1](launch.ps1)**: Update `$SERVER_VERSION` variable
- **[LOCAL_SERVER/package.json](LOCAL_SERVER/package.json)**: Update version field
- **[huggingface-space-SERVER/package.json](huggingface-space-SERVER/package.json)**: Update version field

### 6. Itch.io HTML build (when publishing the browser build)
- **Always** run from repo root: `powershell -NoProfile -ExecutionPolicy Bypass -File ITCH/build-itch.ps1`
- Upload the generated **`Zombobs_Web.zip`** only. The script validates **no backslashes** in zip entry names (Windows default zips break itch CDN → **403** on all `css/` / `js/`).
- **Never** ship an Explorer/`Compress-Archive`/`CreateFromDirectory` zip for itch without replacing the script’s validation logic.
- Full checklist: [ITCH/DOCS/ITCH_IO_GUIDE.md](../ITCH/DOCS/ITCH_IO_GUIDE.md)

## Version Format

Use consistent format: `V0.X.Y.Z ALPHA` (with space before ALPHA)

Example: `V0.8.4 ALPHA`

## Quick Reference

**Files that need version updates:**
1. `js/ui/MainMenuScreen.js` - Main menu version box
2. `js/ui/AboutScreen.js` - About screen version display
3. `index.html` - Landing page (4 locations)
4. `js/core/constants.js` - News reel content
5. `launch.ps1` - Server version (if server exists)

**Version info bubble format (index.html):**
```html
<div>
    <div class="side-heading">V0.X.Y.Z ALPHA</div>
    <ul class="mini-list">
        <li><span>🎵</span> <strong>Feature Name</strong>: Description text</li>
        <!-- More features... -->
    </ul>
</div>
```

[AMENDED 2026-06-25 — V0.8.4 ALPHA shipped]: Updated `NEWS_UPDATES`, landing bubbles, UI version boxes, server packages, itch copy. In-game news reel is the live update modality; landing bubbles are the web marketing modality.

[AMENDED 2026-06-25 — V0.8.4 modality pass]: News reel now includes subtitle *The Chaos & Horde Update*, scrap kill drops, touch fix, Phase 4 engine. Landing bubbles expanded to nine items (scrap economy loop, shrine **E**/45%, music intensity, `GameLoopSystem`, controls in Settings). Itch `page_description.md` gained V0.8.4 section; audio copy fixed (MP3 not procedural).

[AMENDED 2026-06-25 — controls hub]: In-game HUD instructions removed; Settings → Controls is single source of truth. `NEWS_UPDATES` adds *Controls in Settings ⚙️*.

