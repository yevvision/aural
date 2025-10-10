/**
 * Central Audio Manager
 * Zentrale Koordination aller Audio-Operationen
 */

import { audioPersistenceManager } from './audioPersistenceManager';
import { AudioUrlManager } from './audioUrlManager';
import { simpleBlobStorage } from './simpleBlobStorage';
// import { storeBlob, getBlob, createBlobUrl } from '../utils/audioBlobFix';

// Temporary replacement functions
const storeBlob = (id: string, blob: Blob) => {
  // Simple implementation
  console.log('storeBlob called', id, blob);
};

const getBlob = (id: string): Blob | null => {
  // Simple implementation
  console.log('getBlob called', id);
  return null;
};

const createBlobUrl = (id: string): string => {
  // Simple implementation
  console.log('createBlobUrl called', id);
  return '';
};

interface AudioTrack {
  id: string;
  title: string;
  url?: string;
  filename?: string;
  user?: any;
  [key: string]: any;
}

class CentralAudioManagerClass {
  private isInitialized = false;

  /**
   * Initialisiert den Audio-Manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 CentralAudioManager: Initializing...');
    
    try {
      // Migriere bestehende Audio-Daten
      await this.migrateExistingAudioData();
      
      this.isInitialized = true;
      console.log('✅ CentralAudioManager: Initialized successfully');
      
    } catch (error) {
      console.error('❌ CentralAudioManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Migriert bestehende Audio-Daten
   */
  private async migrateExistingAudioData(): Promise<void> {
    console.log('🔄 CentralAudioManager: Migrating existing audio data...');
    
    try {
      // @ts-ignore
      const db = window.database || {};
      if (db.tracks) {
        let migratedCount = 0;
        
        for (const track of db.tracks) {
          if (track.url && track.url.startsWith('blob:')) {
            // Versuche den ursprünglichen Blob zu finden
            const urlInfo = AudioUrlManager.getUrlInfo(track.id);
            if (urlInfo && urlInfo.originalBlob) {
              // Migriere zu AudioPersistenceManager
              await audioPersistenceManager.storeAudio(track.id, urlInfo.originalBlob);
              migratedCount++;
            }
          }
        }
        
        console.log(`✅ CentralAudioManager: Migrated ${migratedCount} audio files`);
      }
    } catch (error) {
      console.error('❌ CentralAudioManager: Migration failed:', error);
    }
  }

  /**
   * Speichert ein neues Audio
   */
  async storeNewAudio(trackId: string, blob: Blob): Promise<string> {
    console.log('🎵 CentralAudioManager: Storing new audio:', trackId);
    
    try {
      // 1. Speichere in der einfachen In-Memory-Speicherung (sofort verfügbar)
      storeBlob(trackId, blob);
      
      // 2. Erstelle Blob-URL
      const blobUrl = createBlobUrl(trackId);
      if (!blobUrl) {
        throw new Error('Failed to create blob URL');
      }
      
      // 3. Speichere auch in SimpleBlobStorage (LocalStorage-basiert)
      await simpleBlobStorage.storeBlob(trackId, blob, {
        title: `Track ${trackId}`,
        size: blob.size,
        type: blob.type
      });
      
      // 4. Speichere auch in AudioUrlManager für Kompatibilität
      await AudioUrlManager.storeAudioUrl(trackId, blob, 'base64');
      
      // 5. Speichere auch in AudioPersistenceManager für zusätzliche Sicherheit
      await audioPersistenceManager.storeAudio(trackId, blob);
      
      console.log('✅ CentralAudioManager: New audio stored successfully with multiple fallbacks');
      console.log('📊 Storage details:', {
        trackId,
        blobSize: blob.size,
        urlType: 'blob',
        storedIn: ['InMemory', 'SimpleBlobStorage', 'AudioUrlManager', 'AudioPersistenceManager']
      });
      
      return blobUrl;
      
    } catch (error) {
      console.error('❌ CentralAudioManager: Error storing new audio:', error);
      throw error;
    }
  }

  /**
   * Lädt ein Audio für die Wiedergabe
   */
  async loadAudioForPlayback(track: AudioTrack): Promise<string | null> {
    console.log('🎵 CentralAudioManager: Loading audio for playback:', track.id);
    
    try {
      // 1. Versuche aus der einfachen In-Memory-Speicherung zu laden (schnellster Zugriff)
      let audioUrl = createBlobUrl(track.id);
      
      if (audioUrl) {
        console.log('✅ CentralAudioManager: Audio loaded from InMemory storage');
        return audioUrl;
      }
      
      // 2. Fallback: Versuche aus AudioPersistenceManager zu laden
      audioUrl = audioPersistenceManager.getAudio(track.id);
      
      if (audioUrl) {
        console.log('✅ CentralAudioManager: Audio loaded from persistence manager');
        return audioUrl;
      }
      
      // 3. Fallback: Versuche aus AudioUrlManager zu laden
      audioUrl = AudioUrlManager.getAudioUrl(track.id);
      
      if (audioUrl && audioUrl.startsWith('data:audio/')) {
        console.log('✅ CentralAudioManager: Audio loaded from URL manager');
        return audioUrl;
      }
      
      // 4. Letzter Fallback: Versuche eine neue Blob-URL zu erstellen
      const blobUrl = await audioPersistenceManager.createTemporaryBlobUrl(track.id);
      
      if (blobUrl) {
        console.log('✅ CentralAudioManager: Temporary blob URL created');
        return blobUrl;
      }
      
      // 4. Versuche vom Server zu laden
      audioUrl = await this.loadAudioFromServer(track);
      
      if (audioUrl) {
        console.log('✅ CentralAudioManager: Audio loaded from server');
        return audioUrl;
      }
      
      console.log('❌ CentralAudioManager: No audio source found');
      return null;
      
    } catch (error) {
      console.error('❌ CentralAudioManager: Error loading audio:', error);
      return null;
    }
  }

  /**
   * Lädt Audio vom Server
   */
  private async loadAudioFromServer(track: AudioTrack): Promise<string | null> {
    try {
      console.log('🌐 CentralAudioManager: Loading audio from server:', track.id);
      
      const possiblePaths = this.generateServerPaths(track);
      
      for (const path of possiblePaths) {
        try {
          console.log('🔍 CentralAudioManager: Trying server path:', path);
          const response = await fetch(path);
          
          if (response.ok) {
            const blob = await response.blob();
            if (blob.type.startsWith('audio/')) {
              console.log('✅ CentralAudioManager: Found audio on server:', path);
              
              // Speichere für zukünftige Verwendung
              await audioPersistenceManager.storeAudio(track.id, blob);
              
              // Konvertiere zu Base64
              const base64Url = await this.blobToBase64(blob);
              return base64Url;
            }
          }
        } catch (error) {
          console.log('❌ CentralAudioManager: Server path failed:', path, error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ CentralAudioManager: Error loading from server:', error);
      return null;
    }
  }

  /**
   * Generiert mögliche Server-Pfade
   */
  private generateServerPaths(track: AudioTrack): string[] {
    const paths = [];
    
    // 1. Direkter filename-Pfad
    if (track.filename) {
      paths.push(`/uploads/${track.filename}`);
    }
    
    // 2. User-basierter Pfad
    if (track.user?.username && track.filename) {
      paths.push(`/uploads/${track.user.username}/${track.filename}`);
    }
    
    // 3. ID-basierte Pfade
    const extensions = ['wav', 'mp3', 'webm', 'ogg', 'm4a'];
    for (const ext of extensions) {
      paths.push(`/uploads/${track.id}.${ext}`);
      paths.push(`/uploads/audio_${track.id}.${ext}`);
    }
    
    return paths;
  }

  /**
   * Konvertiert Blob zu Base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Repariert alle Audio-URLs
   */
  async repairAllAudioUrls(): Promise<number> {
    console.log('🔧 CentralAudioManager: Repairing all audio URLs...');
    
    try {
      // @ts-ignore
      const db = window.database || {};
      if (!db.tracks) {
        console.log('❌ CentralAudioManager: No tracks found in database');
        return 0;
      }
      
      let repairedCount = 0;
      
      for (const track of db.tracks) {
        if (track.url && track.url.startsWith('blob:')) {
          console.log('🔧 CentralAudioManager: Repairing track:', track.id);
          
          const newUrl = await this.loadAudioForPlayback(track);
          if (newUrl) {
            track.url = newUrl;
            repairedCount++;
            console.log('✅ CentralAudioManager: Track repaired:', track.id);
          } else {
            console.log('❌ CentralAudioManager: Could not repair track:', track.id);
          }
        }
      }
      
      console.log(`✅ CentralAudioManager: Repaired ${repairedCount} audio URLs`);
      return repairedCount;
      
    } catch (error) {
      console.error('❌ CentralAudioManager: Error repairing audio URLs:', error);
      return 0;
    }
  }

  /**
   * Debug-Informationen
   */
  getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      persistenceManager: { type: 'audioPersistenceManager' },
      availableAudioIds: []
    };
  }
}

// Singleton-Instanz
export const centralAudioManager = new CentralAudioManagerClass();

// Globale Debug-Funktionen
if (typeof window !== 'undefined') {
  (window as any).centralAudioManager = centralAudioManager;
  (window as any).repairAllAudioUrls = () => centralAudioManager.repairAllAudioUrls();
  (window as any).getCentralAudioDebugInfo = () => centralAudioManager.getDebugInfo();
}
