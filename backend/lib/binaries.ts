import path from 'path';
import fs from 'fs';

export function getYtDlpPath(): string {
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  
  // 1. Check process.cwd()/bin
  const localBin = path.join(process.cwd(), 'bin', binName);
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  // 2. Check process.cwd()/backend/bin
  const backendBin = path.join(process.cwd(), 'backend', 'bin', binName);
  if (fs.existsSync(backendBin)) {
    return backendBin;
  }

  // 3. Check relative to __dirname
  const rootBin = path.resolve(__dirname, '..', '..', 'bin', binName);
  if (fs.existsSync(rootBin)) {
    return rootBin;
  }

  // 4. Fallback to system PATH
  return binName;
}

export function getFfmpegPath(): string {
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'ffmpeg.exe' : 'ffmpeg';

  // 1. Check process.cwd()/bin
  const localBin = path.join(process.cwd(), 'bin', binName);
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  // 2. Check process.cwd()/backend/bin
  const backendBin = path.join(process.cwd(), 'backend', 'bin', binName);
  if (fs.existsSync(backendBin)) {
    return backendBin;
  }

  // 3. Check node_modules/@ffmpeg-installer for Windows & Linux
  const archDirs = ['win32-x64', 'linux-x64', 'linux-ia32', 'linux-arm', 'linux-arm64', 'darwin-x64', 'darwin-arm64'];
  for (const arch of archDirs) {
    const candidate1 = path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', arch, binName);
    if (fs.existsSync(candidate1)) return candidate1;

    const candidate2 = path.join(process.cwd(), 'backend', 'node_modules', '@ffmpeg-installer', arch, binName);
    if (fs.existsSync(candidate2)) return candidate2;
  }

  // 4. Try loading @ffmpeg-installer/ffmpeg
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
      return ffmpegInstaller.path;
    }
  } catch (e) {
    // ignore
  }

  // 5. Fallback to system PATH
  return binName;
}
