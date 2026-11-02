export interface MediaFormat {
  format_id: string;
  format_note?: string;
  ext: string;
  resolution?: string;
  width?: number;
  height?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  abr?: number;
  vbr?: number;
}

export interface MediaInfoResponse {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  duration_string?: string;
  uploader?: string;
  uploader_url?: string;
  extractor: string;
  extractor_key: string;
  webpage_url: string;
  is_live: boolean;
  formats: MediaFormat[];
  availableResolutions: string[];
  hasAudio: boolean;
  embedUrl?: string;
  playbackUrl?: string;
}

export interface DownloadRequest {
  url: string;
  type: 'video' | 'audio';
  format?: string;        // mp4, mkv, webm, mp3, m4a, wav, flac
  quality?: string;       // best, 2160p, 1440p, 1080p, 720p, 480p, 360p, 320k, 192k, 128k
  trim?: {
    enabled: boolean;
    start?: string;       // e.g. "00:00:10" or "10"
    end?: string;         // e.g. "00:00:45" or "45"
  };
  cookies?: string;       // Raw Netscape cookies or session data for private accounts
  isLive?: boolean;       // Enable live stream recording flags
}

