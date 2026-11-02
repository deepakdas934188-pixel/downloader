const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  🚀 SA Downloader - Universal Media Downloader PWA Studio');
console.log('\x1b[36m%s\x1b[0m', '  ✨ Angular 19 + Ionic + Next.js Engine + FFmpeg Processing');
console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Start Backend (Next.js on port 3001)
const backendDir = path.join(__dirname, 'backend');
console.log('\x1b[35m%s\x1b[0m', '[Backend] Starting Next.js API server on http://localhost:3001 ...');
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: backendDir,
  shell: true,
  stdio: 'inherit'
});

// 2. Start Frontend (Angular + Ionic on port 4200)
const frontendDir = path.join(__dirname, 'frontend');
console.log('\x1b[32m%s\x1b[0m', '[Frontend] Starting Angular + Ionic PWA on http://localhost:4200 ...\n');
const frontend = spawn(npmCmd, ['start'], {
  cwd: frontendDir,
  shell: true,
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});

