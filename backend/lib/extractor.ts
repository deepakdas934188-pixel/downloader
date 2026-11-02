import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getYtDlpPath } from './binaries';
import { MediaInfoResponse, MediaFormat } from './types';

export async function extractMediaInfo(url: string, cookies?: string): Promise<MediaInfoResponse> {
  const ytDlpPath = getYtDlpPath();
  const args = [
    '--dump-single-json',
    '--no-playlist',
    '--no-warnings',
    '--no-call-home',
    '--quiet',
    url
  ];

  let tempCookieFile: string | null = null;
  if (cookies && cookies.trim().length > 0) {
    tempCookieFile = path.join(os.tmpdir(), `ytdlp_cookie_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
    fs.writeFileSync(tempCookieFile, cookies.trim(), 'utf-8');
    args.splice(1, 0, '--cookies', tempCookieFile);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, args, { windowsHide: true });
    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('close', (code) => {
      if (tempCookieFile && fs.existsSync(tempCookieFile)) {
        try { fs.unlinkSync(tempCookieFile); } catch (e) { /* ignore */ }
      }

      if (code !== 0 || !stdoutData.trim()) {
        const errMsg = stderrData || `Extractor failed with exit code ${code}`;
        return reject(new Error(errMsg));
      }

      try {
        const raw = JSON.parse(stdoutData);
        
        // Compute available resolutions from formats
        const formats: MediaFormat[] = (raw.formats || []).map((f: any) => ({
          format_id: f.format_id,
          format_note: f.format_note,
          ext: f.ext,
          resolution: f.resolution || (f.height ? `${f.height}p` : undefined),
          width: f.width,
          height: f.height,
          fps: f.fps,
          vcodec: f.vcodec,
          acodec: f.acodec,
          filesize: f.filesize,
          filesize_approx: f.filesize_approx,
          tbr: f.tbr,
          abr: f.abr,
          vbr: f.vbr
        }));

        const resSet = new Set<string>();
        for (const f of formats) {
          if (f.height) {
            resSet.add(`${f.height}p`);
          }
        }
        
        // Sort resolutions descending
        const standardResOrder = ['4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
        const availableResolutions = standardResOrder.filter(r => resSet.has(r));
        for (const r of Array.from(resSet)) {
          if (!availableResolutions.includes(r)) {
            availableResolutions.push(r);
          }
        }

        let embedUrl: string | undefined = undefined;
        let playbackUrl: string | undefined = undefined;

        const isYt = (raw.extractor_key && raw.extractor_key.toLowerCase().includes('youtube')) ||
                     url.includes('youtube.com') || url.includes('youtu.be');

        if (isYt && raw.id) {
          embedUrl = `https://www.youtube-nocookie.com/embed/${raw.id}?enablejsapi=1&rel=0`;
        }

        // Direct video stream for native HTML5 video player
        if (raw.url) {
          playbackUrl = raw.url;
        } else if (raw.formats && raw.formats.length > 0) {
          // Find single-file stream with video
          const singleStream = raw.formats.find((f: any) => f.vcodec !== 'none' && f.acodec !== 'none' && f.url && f.ext === 'mp4');
          if (singleStream) {
            playbackUrl = singleStream.url;
          } else {
            const anyVideo = raw.formats.find((f: any) => f.vcodec !== 'none' && f.url);
            if (anyVideo) playbackUrl = anyVideo.url;
          }
        }

        const info: MediaInfoResponse = {
          id: raw.id || 'media',
          title: raw.title || 'Untitled Video',
          description: raw.description,
          thumbnail: raw.thumbnail,
          duration: raw.duration,
          duration_string: raw.duration_string || (raw.duration ? formatDuration(raw.duration) : undefined),
          uploader: raw.uploader || raw.channel || raw.creator,
          uploader_url: raw.uploader_url,
          extractor: raw.extractor || 'generic',
          extractor_key: raw.extractor_key || 'Generic',
          webpage_url: raw.webpage_url || url,
          is_live: Boolean(raw.is_live),
          formats,
          availableResolutions,
          hasAudio: formats.some(f => f.acodec && f.acodec !== 'none'),
          embedUrl,
          playbackUrl
        };

        resolve(info);
      } catch (err: any) {
        reject(new Error(`Failed to parse media metadata: ${err.message}`));
      }
    });

    proc.on('error', (err) => {
      if (tempCookieFile && fs.existsSync(tempCookieFile)) {
        try { fs.unlinkSync(tempCookieFile); } catch (e) { /* ignore */ }
      }
      reject(err);
    });
  });
}

function formatDuration(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

