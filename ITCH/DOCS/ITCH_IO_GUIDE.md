<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# How to Publish ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS to Itch.io

## Mandatory rule (do not skip)

**Always produce the upload zip with the repo script** from the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ITCH/build-itch.ps1
```

Output: `Zombobs_Web.zip` in the repo root. The script (1) uses **forward slashes** in every zip entry name, (2) **fails the build** if any path contains `\` or required files are missing. **Do not** use Windows Explorer “Compressed (zipped) folder”, **`Compress-Archive`**, or **`[ZipFile]::CreateFromDirectory`** for Itch uploads — they store `css\style.css`, which **does not** match itch’s URLs (`css/style.css`) and causes **403** on all assets.

## 1. Prepare the Build
Since Itch.io hosts static files, we need to zip only the files the browser needs (excluding the server code).

1.  **Create a folder** on your Desktop named `ZOMBOBS_Web_Build`.
2.  **Copy** these items from your project folder into it:
    *   `index.html` (game entry — this is what Itch loads in the browser)
    *   `landing.html` (optional; only if you link to it from your project page — not the default embed entry)
    *   `assets/` (folder - includes icons subfolder with favicon files)
    *   `css/` (folder)
    *   `js/` (folder — must include `js/vendor/socket.io.min.js` for multiplayer client code)
    *   `sample_assets/` (folder)
3.  **Do NOT Copy:** `server/`, `DOCS/`, `debugs/`, or hidden git files.

## 2. Zip It
**Preferred:** Run `ITCH/build-itch.ps1` (see [Mandatory rule](#mandatory-rule-do-not-skip) above). No manual zipping.

**Manual zip (emergency only):** If you must zip by hand, you need a tool that writes **POSIX `/` paths** inside the archive (e.g. WSL `zip`, 7-Zip with Unix path mode). Windows Explorer and `Compress-Archive` are **not** safe for Itch.io.

**Critical:** After extraction, `index.html` must sit at the **root** of the archive (same level as `js/`, `css/`, `assets/`). A single top-level folder like `ZOMBOBS_Web_Build/index.html` breaks the embed.

## 3. Upload to Itch.io
1.  Log in to [itch.io](https://itch.io) and go to **Dashboard** -> **Create new project**.
2.  **Title:** ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS
3.  **Kind of project:** Select **HTML**.
4.  **Uploads:** Upload your `ZOMBOBS_Web.zip`.
5.  **Embed Options:**
    *   Check **"This file will be played in the browser"**.
    *   **Viewport Dimensions:** `1280` x `720` (or leave default/auto).
    *   Check **"Mobile Friendly"** (optional, but good practice).
6.  **Details:** Fill in description, genre (Shooter/Survival), and tags.
    *   **Recommended Description:** Include this disclaimer at the top:
        > ⚠️ **Early Production**: This game is currently in active development (V0.9.0 ALPHA). Features may change, bugs may exist, and content is still being added. Your feedback is welcome!
7.  **Visibility:** Set to **Draft** (to test) or **Public** (to release).
8.  Click **Save & View Page**.

## Note on Multiplayer
Your multiplayer features rely on a backend server (`server.js`). Since Itch.io only hosts the frontend files, **Multiplayer will not work**. The game will gracefully default to Single Player mode.

## Troubleshooting

### 403 Forbidden Errors (CSS/JS/fonts all fail; game stuck on “Loading”)
If **every** asset under `css/`, `js/`, etc. returns **403** but paths in DevTools look correct (e.g. `.../html/12345/css/style.css`):

- **Cause (Windows):** Zips built with `Compress-Archive` or `[ZipFile]::CreateFromDirectory` on Windows often store entries as `css\style.css` (**backslash**). Itch’s CDN looks up **`css/style.css` (forward slash)**. Names do not match → **403** for those files.
- **Fix:** Build with `powershell -File ITCH/build-itch.ps1` from the repo root. That script rewrites entry names to use **only `/`**. Re-upload the new zip.
- **Also:** Itch hosts your game under a subdirectory. **Absolute paths** starting with `/` resolve wrong and often **403**. Use **relative** paths in `index.html` (e.g. `css/style.css`, `js/main.js`). Match **filename case** exactly (CDN is case-sensitive).
- **Zip layout:** `index.html` must be at the **root** of the zip (see “Zip It” above).

### ERR_BLOCKED_BY_CSP / script from CDN never loads
- **Cause:** Embedded HTML games sometimes run under a **Content Security Policy** that blocks third-party `<script src="https://...">` tags.
- **Solution:** This project loads Socket.IO from **`js/vendor/socket.io.min.js`** (bundled in the repo). Do not switch the game page back to the CDN tag for Itch uploads.

### Console Warnings
You may see warnings like "Unrecognized feature: 'monetization'" or "'xr'" in the browser console:
- **These are harmless** - they come from itch.io's iframe wrapper, not your game
- The game includes code to suppress these warnings
- They will not affect gameplay

