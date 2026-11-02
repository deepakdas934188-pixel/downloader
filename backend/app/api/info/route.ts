import { NextRequest, NextResponse } from 'next/server';
import { extractMediaInfo } from '../../../lib/extractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, cookies } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const info = await extractMediaInfo(url.trim(), cookies);
    return NextResponse.json(info);
  } catch (error: any) {
    console.error('[API /api/info Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract media information' },
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

