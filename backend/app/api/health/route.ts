import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import { getYtDlpPath, getFfmpegPath } from '@/lib/binaries';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ytDlpPath = getYtDlpPath();
  const ffmpegPath = getFfmpegPath();

  let ytDlpVersion = 'unknown';
  let ytDlpOk = false;
  try {
    const res = spawnSync(ytDlpPath, ['--version'], { encoding: 'utf-8', windowsHide: true });
    if (res.status === 0) {
      ytDlpVersion = res.stdout.trim();
      ytDlpOk = true;
    }
  } catch (e) {
    ytDlpOk = false;
  }

  let ffmpegOk = fs.existsSync(ffmpegPath);
  if (!ffmpegOk) {
    try {
      const res = spawnSync(ffmpegPath, ['-version'], { encoding: 'utf-8', windowsHide: true });
      if (res.status === 0) {
        ffmpegOk = true;
      }
    } catch (e) {
      ffmpegOk = false;
    }
  }

  return NextResponse.json({
    status: ytDlpOk ? 'ok' : 'degraded',
    ytdlp: {
      ok: ytDlpOk,
      version: ytDlpVersion,
      path: ytDlpPath
    },
    ffmpeg: {
      ok: ffmpegOk,
      path: ffmpegPath
    },
    timestamp: new Date().toISOString()
  });
}
