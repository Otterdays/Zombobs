const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const webDir = path.resolve(__dirname, '..', 'www');

const copyTargets = [
  'index.html',
  'landing.html',
  'css',
  'js',
  'assets',
  'LEGAL'
];

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const copyPath = (src, dest) => {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
    return;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
};

const syncWeb = () => {
  if (fs.existsSync(webDir)) {
    fs.rmSync(webDir, { recursive: true, force: true });
  }

  ensureDir(webDir);

  copyTargets.forEach((target) => {
    const src = path.join(rootDir, target);
    if (!fs.existsSync(src)) {
      console.warn(`[sync-web] Missing: ${target}`);
      return;
    }

    const dest = path.join(webDir, target);
    copyPath(src, dest);
  });

  console.log(`[sync-web] Synced ${copyTargets.length} targets to ${webDir}`);
};

syncWeb();
