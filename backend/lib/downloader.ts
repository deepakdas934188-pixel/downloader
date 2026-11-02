import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getYtDlpPath, getFfmpegPath } from './binaries';
import { DownloadRequest } from './types';

export interface ProcessResult {
  filePath: string;
  fileName: string;
  contentType: string;
  cleanup: () => void;
}

export async function processDownload(
  req: DownloadRequest,
  onProgress?: (percent: number, speed: string, eta: string) => void
): Promise<ProcessResult> {
  const ytDlpPath = getYtDlpPath();
  const ffmpegPath = getFfmpegPath();
  
  const jobId = `dl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tempDir = os.tmpdir();
  const outputTemplate = path.join(tempDir, `${jobId}.%(ext)s`);

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '--no-call-home',
    '--ffmpeg-location', ffmpegPath,
    '-o', outputTemplate
  ];

  // 1. Private Account Cookies
  let tempCookieFile: string | null = null;
  if (req.cookies && req.cookies.trim().length > 0) {
    tempCookieFile = path.join(tempDir, `cookie_${jobId}.txt`);
    fs.writeFileSync(tempCookieFile, req.cookies.trim(), 'utf-8');
    args.push('--cookies', tempCookieFile);
  }

  // 2. Live Stream Handling
  if (req.isLive) {
    args.push('--live-from-start');
    args.push('--hls-use-mpegts');
  }

  // 3. Trim / Specific Part
  if (req.trim && req.trim.enabled && (req.trim.start || req.trim.end)) {
    const start = req.trim.start || '00:00:00';
    const end = req.trim.end ? req.trim.end : 'inf';
    args.push('--download-sections', `*${start}-${end}`);
    args.push('--force-keyframes-at-cuts');
  }

  // 4. Type: Audio Only vs Video
  let targetFormat = req.format || (req.type === 'audio' ? 'mp3' : 'mp4');
  let contentType = 'application/octet-stream';

  if (req.type === 'audio') {
    args.push('-x'); // Extract audio
    args.push('--audio-format', targetFormat);
    
    // Audio quality/bitrate
    const bitrate = req.quality || '320k';
    args.push('--audio-quality', bitrate.replace('k', ''));

    switch (targetFormat) {
      case 'mp3': contentType = 'audio/mpeg'; break;
      case 'm4a': contentType = 'audio/mp4'; break;
      case 'wav': contentType = 'audio/wav'; break;
      case 'flac': contentType = 'audio/flac'; break;
      case 'ogg': contentType = 'audio/ogg'; break;
      default: contentType = 'audio/mpeg';
    }
  } else {
    // Video type
    const quality = req.quality || 'best';
    let formatFilter = 'bestvideo+bestaudio/best';

    if (quality && quality !== 'best') {
      const height = quality.replace('p', '');
      if (!isNaN(Number(height))) {
        formatFilter = `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`;
      }
    }

    args.push('-f', formatFilter);
    args.push('--merge-output-format', targetFormat);

    switch (targetFormat) {
      case 'mp4': contentType = 'video/mp4'; break;
      case 'mkv': contentType = 'video/x-matroska'; break;
      case 'webm': contentType = 'video/webm'; break;
      default: contentType = 'video/mp4';
    }
  }

  // Add Target URL
  args.push(req.url);

  console.log(`[downloader] Running command: ${ytDlpPath} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, args, { windowsHide: true });
    let stderrData = '';

    proc.stdout.on('data', (chunk) => {
      const str = chunk.toString();
      // Parse progress: [download]  45.2% of ~  20.40MiB at  2.50MiB/s ETA 00:04
      const percentMatch = str.match(/([0-9.]+)%/);
      const speedMatch = str.match(/at\s+([0-9.]+[A-Za-z/]+)/);
      const etaMatch = str.match(/ETA\s+([0-9:]+)/);

      if (percentMatch && onProgress) {
        const percent = parseFloat(percentMatch[1]);
        const speed = speedMatch ? speedMatch[1] : '';
        const eta = etaMatch ? etaMatch[1] : '';
        onProgress(percent, speed, eta);
      }
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('close', (code) => {
      // Remove temporary cookie file
      if (tempCookieFile && fs.existsSync(tempCookieFile)) {
        try { fs.unlinkSync(tempCookieFile); } catch (e) { /* ignore */ }
      }

      if (code !== 0) {
        return reject(new Error(stderrData || `yt-dlp exited with error code ${code}`));
      }

      // Find the generated file in temp dir
      const matchedFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(jobId));
      if (matchedFiles.length === 0) {
        return reject(new Error('Downloaded file not found in output directory.'));
      }

      const generatedFileName = matchedFiles[0];
      const generatedFilePath = path.join(tempDir, generatedFileName);

      resolve({
        filePath: generatedFilePath,
        fileName: generatedFileName,
        contentType,
        cleanup: () => {
          if (fs.existsSync(generatedFilePath)) {
            try {
              fs.unlinkSync(generatedFilePath);
              console.log(`[downloader] Cleaned up temporary file: ${generatedFilePath}`);
            } catch (err) {
              console.error(`[downloader] Error deleting temp file:`, err);
            }
          }
        }
      });
    });

    proc.on('error', (err) => {
      if (tempCookieFile && fs.existsSync(tempCookieFile)) {
        try { fs.unlinkSync(tempCookieFile); } catch (e) { /* ignore */ }
      }
      reject(err);
    });
  });
}

