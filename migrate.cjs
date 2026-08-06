const fs = require('fs');
const path = require('path');

// 1. Create directories
const backendDir = 'vision-central-backend';
const frontendDir = 'vision-central-web';

[
  backendDir, 
  backendDir + '/src', 
  backendDir + '/src/routes',
  frontendDir,
  frontendDir + '/src',
  frontendDir + '/src/components',
  frontendDir + '/src/pages',
  frontendDir + '/src/hooks',
  frontendDir + '/src/services',
  frontendDir + '/src/lib',
  frontendDir + '/src/utils',
  frontendDir + '/src/config'
].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// 2. Move backend files
const backendFiles = [
  'server.ts',
  'src/feedWorker'
];

fs.renameSync('src/feedWorker', backendDir + '/src/feedWorker');

// 3. Move frontend files
const frontendFiles = [
  'index.html',
  'vite.config.ts',
  'src/App.tsx',
  'src/index.css',
  'src/main.tsx',
  'src/types.ts',
  'src/components',
  'src/lib',
  'src/services',
  'src/utils'
];

frontendFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const dest = path.join(frontendDir, f);
    if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(f, dest);
  }
});

console.log("Migration structure created.");
