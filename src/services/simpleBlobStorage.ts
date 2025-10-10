/**
 * Simple Blob Storage
 * 
 * Einfache und robuste Blob-Speicherung für Audio-Dateien
 */

import { audioLogger } from '../utils/audioLogger';

interface StoredBlob {
  id: string;
  blob: Blob;
  metadata: {
    title: string;
    size: number;
    type: string;
    createdAt: number;
  };
}

class SimpleBlobStorageClass {
  private storage: Map<string, StoredBlob> = new Map();
  private readonly STORAGE_KEY = 'aural_simple_blob_storage';

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Lädt gespeicherte Blobs aus LocalStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Konvertiere Base64 zurück zu Blob
        Object.entries(data).forEach(([id, blobData]: [string, any]) => {
          if (blobData.base64) {
            const blob = this.base64ToBlob(blobData.base64, blobData.metadata.type);
            if (blob) {
              this.storage.set(id, {
                id,
                blob,
                metadata: blobData.metadata
              });
            }
          }
        });
        audioLogger.info('manager', 'Loaded blobs from localStorage', { count: this.storage.size });
      }
    } catch (error) {
      audioLogger.error('manager', 'Failed to load blobs from localStorage', { error: error.message });
    }
  }

  /**
   * Speichert Blobs in LocalStorage
   */
  private saveToLocalStorage(): void {
    try {
      const data: Record<string, any> = {};
      this.storage.forEach((storedBlob, id) => {
        data[id] = {
          base64: this.blobToBase64(storedBlob.blob),
          metadata: storedBlob.metadata
        };
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      audioLogger.info('manager', 'Saved blobs to localStorage', { count: this.storage.size });
    } catch (error) {
      audioLogger.error('manager', 'Failed to save blobs to localStorage', { error: error.message });
    }
  }

  /**
   * Speichert einen Blob
   */
  async storeBlob(id: string, blob: Blob, metadata: Partial<StoredBlob['metadata']> = {}): Promise<void> {
    const storedBlob: StoredBlob = {
      id,
      blob,
      metadata: {
        title: metadata.title || `Blob ${id}`,
        size: blob.size,
        type: blob.type,
        createdAt: Date.now(),
        ...metadata
      }
    };

    this.storage.set(id, storedBlob);
    this.saveToLocalStorage();

    audioLogger.info('manager', 'Blob stored successfully', {
      id,
      size: blob.size,
      type: blob.type
    }, id);
  }

  /**
   * Lädt einen Blob
   */
  async getBlob(id: string): Promise<Blob | null> {
    const storedBlob = this.storage.get(id);
    if (storedBlob) {
      audioLogger.info('manager', 'Blob retrieved successfully', {
        id,
        size: storedBlob.blob.size,
        age: Date.now() - storedBlob.metadata.createdAt
      }, id);
      return storedBlob.blob;
    }

    audioLogger.warn('manager', 'Blob not found', { id }, id);
    return null;
  }

  /**
   * Erstellt eine Blob-URL
   */
  async createBlobUrl(id: string): Promise<string | null> {
    const blob = await this.getBlob(id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      audioLogger.info('manager', 'Blob URL created', { id, url });
      return url;
    }
    return null;
  }

  /**
   * Löscht einen Blob
   */
  async deleteBlob(id: string): Promise<void> {
    if (this.storage.has(id)) {
      this.storage.delete(id);
      this.saveToLocalStorage();
      audioLogger.info('manager', 'Blob deleted', { id }, id);
    }
  }

  /**
   * Gibt alle gespeicherten Blob-IDs zurück
   */
  getAllBlobIds(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Gibt Statistiken zurück
   */
  getStats(): { count: number; totalSize: number; oldestBlob: number; newestBlob: number } {
    const blobs = Array.from(this.storage.values());
    const totalSize = blobs.reduce((sum, blob) => sum + blob.metadata.size, 0);
    const timestamps = blobs.map(blob => blob.metadata.createdAt);
    
    return {
      count: blobs.length,
      totalSize,
      oldestBlob: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestBlob: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Bereinigt alte Blobs
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 Tage
    const cutoffTime = Date.now() - maxAge;
    const toDelete: string[] = [];

    this.storage.forEach((storedBlob, id) => {
      if (storedBlob.metadata.createdAt < cutoffTime) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => {
      this.storage.delete(id);
      audioLogger.info('manager', 'Cleaned up old blob', { id }, id);
    });

    if (toDelete.length > 0) {
      this.saveToLocalStorage();
      audioLogger.info('manager', 'Cleanup completed', { deletedCount: toDelete.length });
    }
  }

  /**
   * Konvertiert Blob zu Base64
   */
  private blobToBase64(blob: Blob): string {
    // Für kleine Blobs, verwende FileReader
    if (blob.size < 10 * 1024 * 1024) { // 10MB
      return 'data:' + blob.type + ';base64,' + btoa(String.fromCharCode(...new Uint8Array(blob as any)));
    }
    
    // Für große Blobs, verwende eine andere Strategie
    return 'large_blob_' + blob.size + '_' + blob.type;
  }

  /**
   * Konvertiert Base64 zu Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob | null {
    try {
      if (base64.startsWith('data:')) {
        const [header, data] = base64.split(',');
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
      }
      return null;
    } catch (error) {
      audioLogger.error('manager', 'Failed to convert Base64 to Blob', { error: error.message });
      return null;
    }
  }
}

// Singleton-Instanz
export const simpleBlobStorage = new SimpleBlobStorageClass();

// Automatische Bereinigung alle 24 Stunden
setInterval(() => {
  simpleBlobStorage.cleanup();
}, 24 * 60 * 60 * 1000);

// Globale Debug-Funktionen
if (typeof window !== 'undefined') {
  (window as any).simpleBlobStorage = simpleBlobStorage;
  (window as any).getSimpleBlobStats = () => simpleBlobStorage.getStats();
  (window as any).getAllSimpleBlobIds = () => simpleBlobStorage.getAllBlobIds();
  (window as any).cleanupSimpleBlobs = () => simpleBlobStorage.cleanup();
}
