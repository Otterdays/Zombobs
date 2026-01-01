# How to Publish ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS to Itch.io

## 1. Prepare the Build
Since Itch.io hosts static files, we need to zip only the files the browser needs (excluding the server code).

1.  **Create a folder** on your Desktop named `ZOMBOBS_Web_Build`.
2.  **Copy** these items from your project folder into it:
    *   `index.html`
    *   `zombie-game.html`
    *   `assets/` (folder - includes icons subfolder with favicon files)
    *   `css/` (folder)
    *   `js/` (folder)
    *   `sample_assets/` (folder)
3.  **Do NOT Copy:** `server/`, `DOCS/`, `debugs/`, or hidden git files.

## 2. Zip It
1.  Open the `ZOMBOBS_Web_Build` folder.
2.  Select **all files** inside (Ctrl+A).
3.  Right-click -> `Send to` -> `Compressed (zipped) folder`.
4.  Name the file `ZOMBOBS_Web.zip`.

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
        > ⚠️ **Early Production**: This game is currently in active development (V0.8.3.3 ALPHA). Features may change, bugs may exist, and content is still being added. Your feedback is welcome!
7.  **Visibility:** Set to **Draft** (to test) or **Public** (to release).
8.  Click **Save & View Page**.

## Note on Multiplayer
Your multiplayer features rely on a backend server (`server.js`). Since Itch.io only hosts the frontend files, **Multiplayer will not work**. The game will gracefully default to Single Player mode.

## Troubleshooting

### 403 Forbidden Errors
If you see `Failed to load resource: the server responded with a status of 403` errors for CSS or JS files:
- **Cause:** Itch.io's CDN can be strict about relative paths with `./` prefix
- **Solution:** Ensure all resource paths in `zombie-game.html` use clean relative paths (e.g., `js/main.js` instead of `./js/main.js`)
- This has been fixed in v0.8.3.3, but if you're using an older version, update your paths manually

### Console Warnings
You may see warnings like "Unrecognized feature: 'monetization'" or "'xr'" in the browser console:
- **These are harmless** - they come from itch.io's iframe wrapper, not your game
- The game includes code to suppress these warnings
- They will not affect gameplay

