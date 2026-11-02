import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {
  private directoryHandle: any = null;
  private directoryName: string = '';

  constructor() {
    this.restoreSavedDirectory();
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  getDirectoryName(): string {
    return this.directoryName || (this.isSupported() ? 'Default Downloads' : 'Standard Browser Downloads');
  }

  hasCustomDirectory(): boolean {
    return this.directoryHandle !== null;
  }

  async selectDirectory(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Direct folder selection is not supported in this browser. Downloads will save to your default Downloads folder.');
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });
      
      this.directoryHandle = handle;
      this.directoryName = handle.name;
      
      // Store directory name in localStorage for UI state
      localStorage.setItem('selected_dir_name', handle.name);
      return handle.name;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return this.directoryName;
      }
      throw err;
    }
  }

  async saveFileToDevice(blob: Blob, fileName: string, subfolder?: string): Promise<{ path: string; method: 'fs-access' | 'browser' }> {
    // 1. Try File System Access API if directory was selected
    if (this.directoryHandle) {
      try {
        let targetDir = this.directoryHandle;

        // If user wants a subfolder (e.g. 'Videos' or 'Audio' or 'Trimmed')
        if (subfolder) {
          targetDir = await this.directoryHandle.getDirectoryHandle(subfolder, { create: true });
        }

        const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        return {
          path: `${this.directoryName}/${subfolder ? subfolder + '/' : ''}${fileName}`,
          method: 'fs-access'
        };
      } catch (err) {
        console.warn('Failed to save to selected directory, falling back to browser download', err);
      }
    }

    // 2. Standard Browser Fallback download
    this.triggerBrowserDownload(blob, fileName);
    return {
      path: fileName,
      method: 'browser'
    };
  }

  triggerBrowserDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  private restoreSavedDirectory() {
    const saved = localStorage.getItem('selected_dir_name');
    if (saved) {
      this.directoryName = saved;
    }
  }
}

