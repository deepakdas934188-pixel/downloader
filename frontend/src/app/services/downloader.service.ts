import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

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
}

export interface MediaInfo {
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

export interface DownloadOptions {
  url: string;
  type: 'video' | 'audio';
  format: string;
  quality: string;
  trim?: {
    enabled: boolean;
    start?: string;
    end?: string;
  };
  cookies?: string;
  isLive?: boolean;
}

export interface DownloadProgress {
  state: 'starting' | 'progress' | 'complete' | 'error';
  progress: number;
  loaded?: number;
  total?: number;
  blob?: Blob;
  fileName?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DownloaderService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = this.detectApiUrl();
  }

  private detectApiUrl(): string {
    if (typeof window === 'undefined') {
      return 'http://localhost:3001/api';
    }

    // 1. Check user-configured override in localStorage
    const saved = localStorage.getItem('omni_custom_api_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // 2. If running locally in Angular dev server (port 4200), point to local Next.js on 3001
    const host = window.location.hostname;
    const port = window.location.port;
    if ((host === 'localhost' || host === '127.0.0.1') && port === '4200') {
      return 'http://localhost:3001/api';
    }

    // 3. If running on Render (*.onrender.com), default to the deployed backend service
    if (host.includes('.onrender.com')) {
      return 'https://omnistream-backend.onrender.com/api';
    }

    // 4. In production on cloud or reverse proxy, use relative '/api'
    return '/api';
  }

  setApiUrl(url: string) {
    const cleaned = url.trim().replace(/\/+$/, '');
    this.apiUrl = cleaned;
    if (typeof window !== 'undefined') {
      if (cleaned && cleaned !== '/api') {
        localStorage.setItem('omni_custom_api_url', cleaned);
      } else {
        localStorage.removeItem('omni_custom_api_url');
      }
    }
  }

  resetApiUrl() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('omni_custom_api_url');
    }
    this.apiUrl = this.detectApiUrl();
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  isCustomUrl(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('omni_custom_api_url');
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      catchError(err => {
        const errorMsg = `Backend engine unreachable at ${this.apiUrl}. Check deployment or settings.`;
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  fetchInfo(url: string, cookies?: string): Observable<MediaInfo> {
    return this.http.post<MediaInfo>(`${this.apiUrl}/info`, { url, cookies }).pipe(
      catchError(err => {
        const msg = err.error?.error || err.message || 'Failed to fetch media metadata';
        return throwError(() => new Error(msg));
      })
    );
  }

  downloadMedia(options: DownloadOptions): Observable<DownloadProgress> {
    return new Observable<DownloadProgress>(subscriber => {
      subscriber.next({ state: 'starting', progress: 0 });

      const req = new HttpRequest('POST', `${this.apiUrl}/download`, options, {
        reportProgress: true,
        responseType: 'blob'
      });

      this.http.request(req).subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.DownloadProgress) {
            const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 50;
            subscriber.next({
              state: 'progress',
              progress: percent,
              loaded: event.loaded,
              total: event.total
            });
          } else if (event instanceof HttpResponse) {
            // Extract filename from Content-Disposition header if available
            let fileName = `download_${Date.now()}.${options.format}`;
            const disposition = event.headers.get('content-disposition');
            if (disposition && disposition.indexOf('filename=') !== -1) {
              const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
              if (matches != null && matches[1]) {
                fileName = matches[1].replace(/['"]/g, '');
              }
            }

            subscriber.next({
              state: 'complete',
              progress: 100,
              blob: event.body as Blob,
              fileName
            });
            subscriber.complete();
          }
        },
        error: (err) => {
          subscriber.next({
            state: 'error',
            progress: 0,
            error: err.error?.error || err.message || 'Download failed during transfer'
          });
          subscriber.error(err);
        }
      });
    });
  }
}
