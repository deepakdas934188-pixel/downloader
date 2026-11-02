import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  public canInstall: boolean = false;

  constructor() {
    this.initPwa();
  }

  private initPwa() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall = true;
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall = false;
      console.log('Downloader PWA was installed successfully');
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall = false;
    return outcome === 'accepted';
  }
}

