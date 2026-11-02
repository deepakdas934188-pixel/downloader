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
  // Can be configured to relative '/api' or backend server
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  setApiUrl(url: string) {
    this.apiUrl = url;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      catchError(err => throwError(() => new Error('Backend engine unreachable. Please start backend on port 3001.')))
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

