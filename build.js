#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// Clean and create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Directories and files to copy
const itemsToCopy = [
  { src: 'manifest.json', dest: 'manifest.json' },
  { src: 'js', dest: 'js', isDir: true },
  { src: 'pages', dest: 'pages', isDir: true },
  { src: 'assets', dest: 'assets', isDir: true },
  { src: 'README.md', dest: 'README.md' },
  { src: 'LICENSE', dest: 'LICENSE' }
];

// Recursive copy function
function copyRecursive(src, dest) {
  const srcPath = path.join(__dirname, src);
  const destPath = path.join(distDir, dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`Warning: ${src} not found, skipping...`);
    return;
  }

  const stats = fs.statSync(srcPath);

  if (stats.isDirectory()) {
    fs.mkdirSync(destPath, { recursive: true });
    const files = fs.readdirSync(srcPath);
    files.forEach(file => {
      // Skip hidden files and .DS_Store
      if (file.startsWith('.')) return;

      const srcFile = path.join(srcPath, file);
      const destFile = path.join(destPath, file);
      const relSrc = path.relative(__dirname, srcFile);
      const relDest = path.relative(distDir, destFile);

      copyRecursive(relSrc, relDest);
    });
  } else {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${src}`);
  }
}

// Copy all items
console.log('Building Chrome extension...\n');
itemsToCopy.forEach(item => {
  copyRecursive(item.src, item.dest);
});

console.log('\n✓ Build complete! Extension packaged in dist/');
console.log('  Run "npm run zip" to create reckoning.zip for distribution');
