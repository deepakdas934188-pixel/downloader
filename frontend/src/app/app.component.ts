import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonApp,
  IonContent,
  IonIcon
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  downloadOutline,
  playOutline,
  musicalNotesOutline,
  videocamOutline,
  cutOutline,
  lockClosedOutline,
  folderOpenOutline,
  refreshOutline,
  clipboardOutline,
  sparklesOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  timeOutline,
  trashOutline,
  settingsOutline,
  chevronDownOutline,
  logoYoutube,
  logoInstagram,
  logoTiktok,
  logoTwitter,
  logoFacebook,
  informationCircleOutline,
  eyeOutline,
  radioOutline
} from 'ionicons/icons';

import { DownloaderService, MediaInfo, DownloadOptions, DownloadProgress } from './services/downloader.service';
import { FileSystemService } from './services/file-system.service';
import { PwaService } from './services/pwa.service';

export interface HistoryItem {
  id: string;
  title: string;
  thumbnail?: string;
  type: 'video' | 'audio';
  format: string;
  quality: string;
  timestamp: number;
  fileName: string;
  savedPath?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonApp,
    IonContent,
    IonIcon
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // Input URL
  mediaUrl: string = '';
  detectedPlatform: string = 'generic';

  // Analysis state
  isLoadingInfo: boolean = false;
  mediaInfo: MediaInfo | null = null;
  errorMessage: string = '';
  backendStatus: 'checking' | 'connected' | 'offline' = 'checking';
  private pollTimer: any = null;

  // Download Configuration
  downloadType: 'video' | 'audio' = 'video';
  selectedFormat: string = 'mp4';
  selectedQuality: string = '1080p';
  
  // Trimming features
  trimEnabled: boolean = false;
  trimStartTime: string = '00:00:00';
  trimEndTime: string = '';

  // Private account cookies
  showAuthModal: boolean = false;
  privateCookies: string = '';
  hasCookiesSet: boolean = false;

  // Backend API Endpoint Settings (for Render / Production deployment)
  showApiModal: boolean = false;
  apiUrlInput: string = '';

  // Live Stream
  isLiveStream: boolean = false;

  // Device Folder Management
  selectedFolder: string = '';
  subfolderCategory: string = 'SADownloads';
  fsSupported: boolean = false;

  // Download Execution & Progress
  isDownloading: boolean = false;
  downloadProgress: number = 0;
  downloadStatusText: string = '';
  lastDownloadedFile: { name: string; path: string; blob?: Blob } | null = null;

  // Local History (No Database)
  downloadHistory: HistoryItem[] = [];

  // Live Video & Trimmer properties
  durationSec: number = 0;
  currentTimeSec: number = 0;
  openSec: number = 0;
  closeSec: number = 0;
  safeEmbedUrl: SafeResourceUrl | null = null;
  activeVideoType: 'embed' | 'video' | 'thumb' = 'thumb';
  isPlayingTrimmed: boolean = false;
  @ViewChild('videoPlayer') videoPlayerRef?: ElementRef<HTMLVideoElement>;

  constructor(
    public downloaderService: DownloaderService,
    public fsService: FileSystemService,
    public pwaService: PwaService,
    private sanitizer: DomSanitizer
  ) {
    addIcons({
      downloadOutline,
      playOutline,
      musicalNotesOutline,
      videocamOutline,
      cutOutline,
      lockClosedOutline,
      folderOpenOutline,
      refreshOutline,
      clipboardOutline,
      sparklesOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      timeOutline,
      trashOutline,
      settingsOutline,
      chevronDownOutline,
      logoYoutube,
      logoInstagram,
      logoTiktok,
      logoTwitter,
      logoFacebook,
      informationCircleOutline,
      eyeOutline,
      radioOutline
    });
  }

  ngOnInit() {
    this.checkBackend();
    this.fsSupported = this.fsService.isSupported();
    this.selectedFolder = this.fsService.getDirectoryName();
    this.loadHistory();
    this.loadSavedCookies();

    // Auto-reconnect polling every 4 seconds if backend is offline
    this.pollTimer = setInterval(() => {
      if (this.backendStatus !== 'connected') {
        this.checkBackend();
      }
    }, 4000);
  }

  ngOnDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  checkBackend() {
    this.downloaderService.checkHealth().subscribe({
      next: (res) => {
        this.backendStatus = (res.status === 'ok' || res.ytdlp?.ok) ? 'connected' : 'offline';
      },
      error: () => {
        this.backendStatus = 'offline';
      }
    });
  }

  onUrlChange() {
    const url = this.mediaUrl.toLowerCase();
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      this.detectedPlatform = 'youtube';
    } else if (url.includes('instagram.com')) {
      this.detectedPlatform = 'instagram';
    } else if (url.includes('tiktok.com')) {
      this.detectedPlatform = 'tiktok';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      this.detectedPlatform = 'twitter';
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      this.detectedPlatform = 'facebook';
    } else if (url.includes('reddit.com')) {
      this.detectedPlatform = 'reddit';
    } else if (url.includes('twitch.tv')) {
      this.detectedPlatform = 'twitch';
    } else {
      this.detectedPlatform = 'generic';
    }
  }

  async pasteFromClipboard() {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.mediaUrl = text.trim();
          this.onUrlChange();
          this.analyzeUrl();
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied', e);
    }
  }

  clearUrl() {
    this.mediaUrl = '';
    this.mediaInfo = null;
    this.errorMessage = '';
    this.detectedPlatform = 'generic';
  }

  analyzeUrl() {
    if (!this.mediaUrl || !this.mediaUrl.trim()) {
      this.errorMessage = 'Please paste a valid video or audio URL';
      return;
    }

    this.errorMessage = '';
    this.isLoadingInfo = true;
    this.mediaInfo = null;

    this.downloaderService.fetchInfo(this.mediaUrl.trim(), this.privateCookies).subscribe({
      next: (info) => {
        this.isLoadingInfo = false;
        this.mediaInfo = info;
        this.isLiveStream = info.is_live;

        // Configure Live Video & Scrubber timeline
        this.durationSec = info.duration || 60;
        this.openSec = 0;
        this.closeSec = this.durationSec;
        this.currentTimeSec = 0;
        this.trimStartTime = this.formatTime(0);
        this.trimEndTime = this.formatTime(this.closeSec);
        this.trimEnabled = true;

        if (info.embedUrl) {
          this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(info.embedUrl);
          this.activeVideoType = 'embed';
        } else if (info.playbackUrl) {
          this.activeVideoType = 'video';
        } else {
          this.activeVideoType = 'thumb';
        }

        // Set best available default resolution
        if (info.availableResolutions && info.availableResolutions.length > 0) {
          if (info.availableResolutions.includes('1080p')) {
            this.selectedQuality = '1080p';
          } else if (info.availableResolutions.includes('720p')) {
            this.selectedQuality = '720p';
          } else {
            this.selectedQuality = info.availableResolutions[0];
          }
        } else {
          this.selectedQuality = 'best';
        }
      },
      error: (err) => {
        this.isLoadingInfo = false;
        this.errorMessage = err.message || 'Could not extract media info. Check link or cookies.';
      }
    });
  }

  formatTime(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const s = Math.floor(totalSeconds % 60);
    const m = Math.floor((totalSeconds / 60) % 60);
    const h = Math.floor(totalSeconds / 3600);

    const sStr = s.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    if (h > 0) {
      const hStr = h.toString().padStart(2, '0');
      return `${hStr}:${mStr}:${sStr}`;
    }
    return `00:${mStr}:${sStr}`;
  }

  onOpenChange(val: number) {
    const num = Number(val);
    if (num >= this.closeSec) {
      this.openSec = Math.max(0, this.closeSec - 1);
    } else {
      this.openSec = num;
    }
    this.trimStartTime = this.formatTime(this.openSec);
    this.trimEnabled = true;

    if (this.videoPlayerRef?.nativeElement) {
      this.videoPlayerRef.nativeElement.currentTime = this.openSec;
    }
  }

  onCloseChange(val: number) {
    const num = Number(val);
    if (num <= this.openSec) {
      this.closeSec = Math.min(this.durationSec, this.openSec + 1);
    } else {
      this.closeSec = num;
    }
    this.trimEndTime = this.formatTime(this.closeSec);
    this.trimEnabled = true;

    if (this.videoPlayerRef?.nativeElement) {
      this.videoPlayerRef.nativeElement.currentTime = this.closeSec;
    }
  }

  setOpenToCurrent() {
    const videoEl = this.videoPlayerRef?.nativeElement;
    const current = videoEl ? videoEl.currentTime : this.currentTimeSec;
    this.onOpenChange(Math.floor(current));
  }

  setCloseToCurrent() {
    const videoEl = this.videoPlayerRef?.nativeElement;
    const current = videoEl ? videoEl.currentTime : this.currentTimeSec;
    this.onCloseChange(Math.floor(current));
  }

  onVideoTimeUpdate() {
    const videoEl = this.videoPlayerRef?.nativeElement;
    if (videoEl) {
      this.currentTimeSec = videoEl.currentTime;
      if (this.isPlayingTrimmed && videoEl.currentTime >= this.closeSec) {
        videoEl.pause();
        this.isPlayingTrimmed = false;
      }
    }
  }

  playTrimmedSegment() {
    const videoEl = this.videoPlayerRef?.nativeElement;
    if (videoEl) {
      videoEl.currentTime = this.openSec;
      videoEl.play();
      this.isPlayingTrimmed = true;
    } else if (this.mediaInfo && this.mediaInfo.extractor_key?.toLowerCase().includes('youtube')) {
      const start = Math.floor(this.openSec);
      const end = Math.floor(this.closeSec);
      const url = `https://www.youtube-nocookie.com/embed/${this.mediaInfo.id}?start=${start}&end=${end}&autoplay=1&enablejsapi=1`;
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  resetTrimRange() {
    this.openSec = 0;
    this.closeSec = this.durationSec;
    this.trimStartTime = this.formatTime(0);
    this.trimEndTime = this.formatTime(this.durationSec);
  }

  setDownloadType(type: 'video' | 'audio') {
    this.downloadType = type;
    if (type === 'audio') {
      this.selectedFormat = 'mp3';
      this.selectedQuality = '320k';
    } else {
      this.selectedFormat = 'mp4';
      this.selectedQuality = '1080p';
    }
  }

  async chooseDeviceFolder() {
    try {
      const folderName = await this.fsService.selectDirectory();
      this.selectedFolder = folderName;
    } catch (err: any) {
      console.error('Error selecting folder:', err);
    }
  }

  startDownload() {
    if (!this.mediaUrl) return;

    this.isDownloading = true;
    this.downloadProgress = 0;
    this.downloadStatusText = 'Contacting extraction engine...';
    this.errorMessage = '';

    const options: DownloadOptions = {
      url: this.mediaUrl.trim(),
      type: this.downloadType,
      format: this.selectedFormat,
      quality: this.selectedQuality,
      trim: this.trimEnabled ? {
        enabled: true,
        start: this.trimStartTime,
        end: this.trimEndTime
      } : undefined,
      cookies: this.privateCookies.trim() || undefined,
      isLive: this.isLiveStream
    };

    this.downloaderService.downloadMedia(options).subscribe({
      next: async (event: DownloadProgress) => {
        if (event.state === 'starting') {
          this.downloadStatusText = 'Processing media & muxing streams with FFmpeg...';
          this.downloadProgress = 15;
        } else if (event.state === 'progress') {
          this.downloadProgress = event.progress;
          this.downloadStatusText = `Streaming to device: ${event.progress}%`;
        } else if (event.state === 'complete' && event.blob) {
          this.downloadProgress = 100;
          this.downloadStatusText = 'Saving file into device folder...';

          const targetSubfolder = this.downloadType === 'audio' ? 'Audio' : (this.trimEnabled ? 'Trimmed' : 'Videos');
          const saveRes = await this.fsService.saveFileToDevice(
            event.blob,
            event.fileName || `media_${Date.now()}.${this.selectedFormat}`,
            this.subfolderCategory || targetSubfolder
          );

          this.lastDownloadedFile = {
            name: event.fileName || 'download',
            path: saveRes.path,
            blob: event.blob
          };

          this.downloadStatusText = `Downloaded successfully to ${saveRes.path}!`;
          this.isDownloading = false;

          // Add to local history (No DB)
          this.addHistoryItem({
            id: 'dl_' + Date.now(),
            title: this.mediaInfo?.title || event.fileName || 'Media File',
            thumbnail: this.mediaInfo?.thumbnail,
            type: this.downloadType,
            format: this.selectedFormat,
            quality: this.selectedQuality,
            timestamp: Date.now(),
            fileName: event.fileName || '',
            savedPath: saveRes.path
          });
        }
      },
      error: (err) => {
        this.isDownloading = false;
        this.errorMessage = err.message || 'Download error. Please verify the URL.';
      }
    });
  }

  saveCookies() {
    if (this.privateCookies.trim()) {
      localStorage.setItem('omni_private_cookies', this.privateCookies.trim());
      this.hasCookiesSet = true;
    } else {
      localStorage.removeItem('omni_private_cookies');
      this.hasCookiesSet = false;
    }
    this.showAuthModal = false;
  }

  loadSavedCookies() {
    const saved = localStorage.getItem('omni_private_cookies');
    if (saved) {
      this.privateCookies = saved;
      this.hasCookiesSet = true;
    }
  }

  clearCookies() {
    this.privateCookies = '';
    this.hasCookiesSet = false;
    localStorage.removeItem('omni_private_cookies');
  }

  // Backend API URL Config (Render / Cloud deployment)
  openApiModal() {
    this.apiUrlInput = this.downloaderService.getApiUrl();
    this.showApiModal = true;
  }

  saveApiUrl() {
    if (this.apiUrlInput && this.apiUrlInput.trim()) {
      this.downloaderService.setApiUrl(this.apiUrlInput.trim());
      this.checkBackend();
      this.showApiModal = false;
    }
  }

  resetApiUrl() {
    this.downloaderService.resetApiUrl();
    this.apiUrlInput = this.downloaderService.getApiUrl();
    this.checkBackend();
  }

  // History operations (Client-side, No DB)
  loadHistory() {
    try {
      const data = localStorage.getItem('omni_history');
      if (data) {
        this.downloadHistory = JSON.parse(data);
      }
    } catch (e) {
      this.downloadHistory = [];
    }
  }

  addHistoryItem(item: HistoryItem) {
    this.downloadHistory.unshift(item);
    if (this.downloadHistory.length > 25) {
      this.downloadHistory.pop();
    }
    localStorage.setItem('omni_history', JSON.stringify(this.downloadHistory));
  }

  clearHistory() {
    this.downloadHistory = [];
    localStorage.removeItem('omni_history');
  }

  reDownload(item: HistoryItem) {
    // Fill title or url if available
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSearch() {
    document.getElementById('media-search')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToHistory() {
    document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
  }
}
