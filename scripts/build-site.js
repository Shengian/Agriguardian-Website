const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const platformDir = path.join(rootDir, 'platform');
const distSiteDir = path.join(rootDir, 'dist_site');

console.log('1. Installing platform dependencies...');
execSync('npm install --include=dev', { cwd: platformDir, stdio: 'inherit' });

console.log('2. Building platform React app...');
execSync('npm run build', { cwd: platformDir, stdio: 'inherit' });

console.log('3. Preparing dist_site directory...');
if (fs.existsSync(distSiteDir)) {
  fs.rmSync(distSiteDir, { recursive: true, force: true });
}
fs.mkdirSync(distSiteDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('4. Copying website static files...');
const filesToCopy = [
  'index.html',
  'portals.html',
  'employee-login.html',
  'employer-login.html',
  'intern-login.html',
  'intern-dashboard.html',
  'css',
  'js',
  'assets'
];

filesToCopy.forEach(item => {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(distSiteDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
  }
});

console.log('5. Copying React platform dist build into dist_site and root...');
const platformDist = path.join(platformDir, 'dist');
if (fs.existsSync(platformDist)) {
  const platformAssets = path.join(platformDist, 'assets');
  if (fs.existsSync(platformAssets)) {
    // Copy React assets to dist_site/assets and root assets/
    copyRecursiveSync(platformAssets, path.join(distSiteDir, 'assets'));
    copyRecursiveSync(platformAssets, path.join(rootDir, 'assets'));
  }
  
  // Copy React platform index.html to app.html in both dist_site and root
  fs.copyFileSync(path.join(platformDist, 'index.html'), path.join(distSiteDir, 'app.html'));
  fs.copyFileSync(path.join(platformDist, 'index.html'), path.join(rootDir, 'app.html'));
}

console.log('6. Creating Netlify _redirects file in both dist_site and root...');
const redirectsContent = `/login/*     /app.html    200
/admin/*     /app.html    200
/employee/*  /app.html    200
/portals     /app.html    200
`;
fs.writeFileSync(path.join(distSiteDir, '_redirects'), redirectsContent, 'utf8');
fs.writeFileSync(path.join(rootDir, '_redirects'), redirectsContent, 'utf8');

console.log('✓ Build complete! Updated root and dist_site ready for Netlify');
