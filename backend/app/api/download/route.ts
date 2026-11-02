import { NextRequest, NextResponse } from 'next/server';
import { processDownload } from '@/lib/downloader';
import { DownloadRequest } from '@/lib/types';
import fs from 'fs';
import { Readable } from 'stream';

// Disables static rendering for this dynamic stream route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let cleanupFn: (() => void) | null = null;
  try {
    const body: DownloadRequest = await req.json();

    if (!body.url || !body.url.trim()) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 });
    }

    const result = await processDownload(body);
    cleanupFn = result.cleanup;

    const stat = fs.statSync(result.filePath);
    const nodeStream = fs.createReadStream(result.filePath);

    // Ensure cleanup is performed when reading is completed or stream errors
    nodeStream.on('close', () => {
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    });

    nodeStream.on('error', (err) => {
      console.error('[Stream error]:', err);
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    });

    // Convert Node stream to Web ReadableStream
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    const safeFilename = encodeURIComponent(result.fileName);

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${result.fileName}"; filename*=UTF-8''${safeFilename}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length'
      }
    });
  } catch (error: any) {
    if (cleanupFn) {
      try { cleanupFn(); } catch (e) { /* ignore */ }
    }
    console.error('[API /api/download Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Download processing failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
      'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length'
    }
  });
}

