/**
 * Persistent Audio Storage
 * 
 * Einfache und robuste Lösung für persistente Audio-Speicherung
 * Verwendet Base64-URLs statt Blob-URLs für maximale Persistenz
 */

import { audioLogger } from '../utils/audioLogger';

interface StoredAudio {
  id: string;
  base64Url: string;
  metadata: {
    title: string;
    size: number;
    type: string;
    duration?: number;
    createdAt: number;
  };
}

class PersistentAudioStorageClass {
  private storage: Map<string, StoredAudio> = new Map();
  private readonly STORAGE_KEY = 'aural_persistent_audio';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Initialisiert den Storage (für Kompatibilität)
   */
  async initialize(): Promise<void> {
    // Bereits im Constructor initialisiert
    console.log('✅ PersistentAudioStorage: Already initialized');
  }

  /**
   * Lädt gespeicherte Audios aus LocalStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, audioData]: [string, any]) => {
          this.storage.set(id, audioData as StoredAudio);
        });
        audioLogger.info('storage', 'Loaded audios from localStorage', { count: this.storage.size });
      }
    } catch (error) {
      audioLogger.error('storage', 'Failed to load audios from localStorage', { error: error.message });
    }
  }

  /**
   * Speichert Audios in LocalStorage
   */
  private saveToStorage(): void {
    try {
      const data: Record<string, StoredAudio> = {};
      this.storage.forEach((audio, id) => {
        data[id] = audio;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      audioLogger.info('storage', 'Saved audios to localStorage', { count: this.storage.size });
    } catch (error) {
      audioLogger.error('storage', 'Failed to save audios to localStorage', { error: error.message });
    }
  }

  /**
   * Konvertiert Blob zu Base64-URL
   */
  private async blobToBase64Url(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Speichert ein Audio
   */
  async storeAudio(id: string, blob: Blob, metadata: Partial<StoredAudio['metadata']> = {}): Promise<string> {
    try {
      // Konvertiere Blob zu Base64-URL
      const base64Url = await this.blobToBase64Url(blob);
      
      const storedAudio: StoredAudio = {
        id,
        base64Url,
        metadata: {
          title: metadata.title || `Audio ${id}`,
          size: blob.size,
          type: blob.type,
          duration: metadata.duration,
          createdAt: Date.now(),
          ...metadata
        }
      };

      this.storage.set(id, storedAudio);
      this.saveToStorage();

      audioLogger.info('storage', 'Audio stored successfully', {
        id,
        size: blob.size,
        type: blob.type,
        base64Length: base64Url.length
      }, id);

      return base64Url;
    } catch (error) {
      audioLogger.error('storage', 'Failed to store audio', { error: error.message }, id);
      throw error;
    }
  }

  /**
   * Lädt ein Audio
   */
  getAudio(id: string): string | null {
    const storedAudio = this.storage.get(id);
    if (storedAudio) {
      audioLogger.info('storage', 'Audio retrieved successfully', {
        id,
        size: storedAudio.metadata.size,
        age: Date.now() - storedAudio.metadata.createdAt
      }, id);
      return storedAudio.base64Url;
    }

    audioLogger.warn('storage', 'Audio not found', { id }, id);
    return null;
  }

  /**
   * Prüft, ob ein Audio existiert
   */
  hasAudio(id: string): boolean {
    return this.storage.has(id);
  }

  /**
   * Löscht ein Audio
   */
  deleteAudio(id: string): void {
    if (this.storage.has(id)) {
      this.storage.delete(id);
      this.saveToStorage();
      audioLogger.info('storage', 'Audio deleted', { id }, id);
    }
  }

  /**
   * Gibt alle gespeicherten Audio-IDs zurück
   */
  getAllAudioIds(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Gibt Statistiken zurück
   */
  getStats(): { count: number; totalSize: number; oldestAudio: number; newestAudio: number } {
    const audios = Array.from(this.storage.values());
    const totalSize = audios.reduce((sum, audio) => sum + audio.metadata.size, 0);
    const timestamps = audios.map(audio => audio.metadata.createdAt);
    
    return {
      count: audios.length,
      totalSize,
      oldestAudio: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestAudio: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Bereinigt alte Audios
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 Tage
    const cutoffTime = Date.now() - maxAge;
    const toDelete: string[] = [];

    this.storage.forEach((audio, id) => {
      if (audio.metadata.createdAt < cutoffTime) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => {
      this.storage.delete(id);
      audioLogger.info('storage', 'Cleaned up old audio', { id }, id);
    });

    if (toDelete.length > 0) {
      this.saveToStorage();
      audioLogger.info('storage', 'Cleanup completed', { deletedCount: toDelete.length });
    }
  }
}

// Singleton-Instanz
export const persistentAudioStorage = new PersistentAudioStorageClass();

// Automatische Bereinigung alle 24 Stunden
setInterval(() => {
  persistentAudioStorage.cleanup();
}, 24 * 60 * 60 * 1000);

// Globale Debug-Funktionen
if (typeof window !== 'undefined') {
  (window as any).persistentAudioStorage = persistentAudioStorage;
  (window as any).getAudioStats = () => persistentAudioStorage.getStats();
  (window as any).getAllAudioIds = () => persistentAudioStorage.getAllAudioIds();
  (window as any).cleanupAudios = () => persistentAudioStorage.cleanup();
  (window as any).hasAudio = (id: string) => persistentAudioStorage.hasAudio(id);
  (window as any).getAudio = (id: string) => persistentAudioStorage.getAudio(id);
}
