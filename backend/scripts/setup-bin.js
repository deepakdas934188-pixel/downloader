const fs = require('fs');
const path = require('path');
const https = require('https');

const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const isWin = process.platform === 'win32';
const ytDlpFileName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const targetYtDlp = path.join(binDir, ytDlpFileName);

// Copy FFmpeg from @ffmpeg-installer if missing
const ffmpegFileName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
const targetFfmpeg = path.join(binDir, ffmpegFileName);
if (!fs.existsSync(targetFfmpeg)) {
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
      fs.copyFileSync(ffmpegInstaller.path, targetFfmpeg);
      console.log(`[setup-bin] Copied ffmpeg from installer to: ${targetFfmpeg}`);
    }
  } catch (err) {
    console.log('[setup-bin] Note: @ffmpeg-installer not found or copy skipped.');
  }
}

if (fs.existsSync(targetYtDlp)) {
  console.log(`[setup-bin] yt-dlp binary already exists at: ${targetYtDlp}`);
  process.exit(0);
}

const downloadUrl = isWin
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

console.log(`[setup-bin] Downloading ${ytDlpFileName} from: ${downloadUrl}`);

function downloadFile(url, dest, callback) {
  const file = fs.createWriteStream(dest);
  const request = (targetUrl) => {
    https.get(targetUrl, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        request(response.headers.location);
        return;
      }

      if (response.statusCode !== 200) {
        callback(new Error(`Failed to download binary: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          if (!isWin) {
            fs.chmodSync(dest, 0o755);
          }
          callback(null);
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      callback(err);
    });
  };

  request(url);
}

downloadFile(downloadUrl, targetYtDlp, (err) => {
  if (err) {
    console.error('[setup-bin] Error downloading yt-dlp:', err.message);
    process.exit(1);
  } else {
    console.log(`[setup-bin] Successfully downloaded ${ytDlpFileName} to ${targetYtDlp}`);
    process.exit(0);
  }
});
