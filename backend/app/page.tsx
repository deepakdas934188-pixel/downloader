import React from 'react';

export default function Home() {
  return (
    <main style={{ padding: '3rem', textAlign: 'center' }}>
      <h1>⚡ Universal Media Downloader Backend API</h1>
      <p>Next.js Core Engine with yt-dlp & FFmpeg Processing</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/api/health" style={{ color: '#38bdf8', textDecoration: 'none', border: '1px solid #38bdf8', padding: '0.5rem 1rem', borderRadius: '8px' }}>
          Check Engine Health (/api/health)
        </a>
      </div>
    </main>
  );
}

