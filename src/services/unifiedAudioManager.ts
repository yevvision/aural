/**
 * Unified Audio Manager
 * 
 * Dieses System koordiniert alle Audio-Management-Systeme und stellt sicher,
 * dass Audio-Dateien konsistent und zuverlässig gespeichert und geladen werden.
 */

import { audioLogger } from '../utils/audioLogger';
import { persistentAudioStorage } from './persistentAudioStorage';
import { audioMigrationManager } from './audioMigrationManager';
import { AudioUrlManager } from './audioUrlManager';

// Lokale Interface-Definition um Import-Probleme zu vermeiden
interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  duration: number;
  url: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    totalLikes: number;
    totalUploads: number;
    bio?: string;
    createdAt: Date;
  };
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  comments?: any[];
  commentsCount?: number;
  plays?: number;
  createdAt: Date;
  waveformData?: number[];
  tags?: string[];
  gender?: 'Female' | 'Male' | 'Mixed' | 'Couple' | 'Diverse';
  filename?: string;
  fileSize?: number;
  format?: string;
  isPublic?: boolean;
  status?: 'active' | 'pending' | 'inactive' | 'approved' | 'rejected';
}

export interface AudioManagerResult {
  success: boolean;
  url?: string;
  error?: string;
  source?: string;
}

class UnifiedAudioManagerClass {
  private isInitialized = false;
  private migrationCompleted = false;

  /**
   * Initialisiert den Unified Audio Manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔄 UnifiedAudioManager: Initializing...');
    
    try {
      // Initialisiere Migration Manager
      await audioMigrationManager.initialize();
      
      // Führe Migration durch, falls noch nicht geschehen
      if (!this.migrationCompleted) {
        console.log('🔄 UnifiedAudioManager: Running audio migration...');
        const migrationResult = await audioMigrationManager.migrateAllAudioFiles();
        
        if (migrationResult.success) {
          console.log(`✅ UnifiedAudioManager: Migration completed successfully (${migrationResult.migratedCount} files migrated)`);
          this.migrationCompleted = true;
        } else {
          console.warn(`⚠️ UnifiedAudioManager: Migration completed with errors (${migrationResult.failedCount} files failed)`);
        }
      }
      
      this.isInitialized = true;
      console.log('✅ UnifiedAudioManager: Initialized successfully');
    } catch (error) {
      console.error('❌ UnifiedAudioManager: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Speichert ein neues Audio
   */
  async storeNewAudio(trackId: string, blob: Blob, metadata: Partial<{ title: string; duration?: number }> = {}): Promise<AudioManagerResult> {
    try {
      await this.initialize();

      console.log('🎵 UnifiedAudioManager: Storing new audio:', trackId);
      
      // Speichere in PersistentAudioStorage (Base64)
      const base64Url = await persistentAudioStorage.storeAudio(trackId, blob, {
        title: metadata.title || `Track ${trackId}`,
        duration: metadata.duration,
        size: blob.size,
        type: blob.type
      });

      // Speichere auch in AudioUrlManager für bessere Kompatibilität
      try {
        await AudioUrlManager.storeAudioUrl(trackId, blob, 'base64');
      } catch (urlError) {
        console.warn('⚠️ UnifiedAudioManager: Failed to store in AudioUrlManager:', urlError);
      }

      // AudioBlobManager entfernt - verwende nur Base64 und AudioUrlManager

      audioLogger.info('unified', 'New audio stored successfully', {
        trackId,
        size: blob.size,
        type: blob.type,
        base64Length: base64Url.length
      }, trackId);

      return {
        success: true,
        url: base64Url,
        source: 'Base64'
      };

    } catch (error) {
      console.error('❌ UnifiedAudioManager: Failed to store new audio:', error);
      audioLogger.error('unified', 'Failed to store new audio', {
        trackId,
        error: error.message
      }, trackId);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lädt ein Audio für die Wiedergabe
   */
  async loadAudioForPlayback(track: AudioTrack): Promise<AudioManagerResult> {
    try {
      await this.initialize();

      console.log('🎵 UnifiedAudioManager: Loading audio for playback:', track.id);
      
      // 1. Prüfe zuerst PersistentAudioStorage (Base64)
      const base64Url = persistentAudioStorage.getAudio(track.id);
      if (base64Url) {
        console.log('✅ UnifiedAudioManager: Found audio in Base64 storage');
        audioLogger.info('unified', 'Audio loaded from Base64 storage', {
          trackId: track.id,
          urlType: 'Base64'
        }, track.id);

        return {
          success: true,
          url: base64Url,
          source: 'Base64'
        };
      }

      // 2. Prüfe, ob es sich um eine bereits gültige Base64-URL handelt
      if (track.url && track.url.startsWith('data:audio/')) {
        console.log('✅ UnifiedAudioManager: Track already has Base64 URL');
        audioLogger.info('unified', 'Audio already has Base64 URL', {
          trackId: track.id,
          urlType: 'Base64'
        }, track.id);

        return {
          success: true,
          url: track.url,
          source: 'Base64'
        };
      }

      // 3. Versuche problematische URLs zu reparieren
      if (track.url && (track.url.startsWith('blob:') || track.url.startsWith('aural-audio-'))) {
        console.log('⚠️ UnifiedAudioManager: Attempting to repair problematic URL');
        audioLogger.warn('unified', 'Attempting to repair problematic URL', {
          trackId: track.id,
          url: track.url.substring(0, 50) + '...'
        }, track.id);

        // Versuche Blob-URL zu reparieren
        if (track.url.startsWith('blob:')) {
          try {
            const response = await fetch(track.url);
            if (response.ok) {
              const blob = await response.blob();
              const newBlobUrl = URL.createObjectURL(blob);
              console.log('✅ UnifiedAudioManager: Successfully repaired blob URL');
              return {
                success: true,
                url: newBlobUrl,
                source: 'Repaired Blob'
              };
            }
          } catch (error) {
            console.log('❌ UnifiedAudioManager: Failed to repair blob URL:', error);
          }
        }

        // Versuche AudioUrlManager zu verwenden
        try {
          const audioUrl = AudioUrlManager.getAudioUrl(track.id);
          if (audioUrl) {
            console.log('✅ UnifiedAudioManager: Found audio in AudioUrlManager');
            return {
              success: true,
              url: audioUrl,
              source: 'AudioUrlManager'
            };
          }
        } catch (error) {
          console.log('❌ UnifiedAudioManager: AudioUrlManager lookup failed:', error);
        }

        // AudioBlobManager entfernt - verwende nur Base64 und AudioUrlManager

        // Alle Reparaturversuche fehlgeschlagen
        console.log('❌ UnifiedAudioManager: All repair attempts failed');
        return {
          success: false,
          error: `Audio-Datei "${track.title}" ist nicht mehr verfügbar. Bitte laden Sie sie erneut hoch.`
        };
      }

      // 4. Audio nicht gefunden
      console.log('❌ UnifiedAudioManager: Audio not found');
      audioLogger.warn('unified', 'Audio not found', {
        trackId: track.id,
        title: track.title
      }, track.id);

      return {
        success: false,
        error: `Audio-Datei "${track.title}" ist nicht verfügbar.`
      };

    } catch (error) {
      console.error('❌ UnifiedAudioManager: Failed to load audio:', error);
      audioLogger.error('unified', 'Failed to load audio', {
        trackId: track.id,
        error: error.message
      }, track.id);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prüft, ob ein Audio verfügbar ist
   */
  async isAudioAvailable(trackId: string): Promise<boolean> {
    try {
      await this.initialize();
      
      // Prüfe PersistentAudioStorage
      const base64Url = persistentAudioStorage.getAudio(trackId);
      return !!base64Url;
    } catch (error) {
      console.error('❌ UnifiedAudioManager: Failed to check audio availability:', error);
      return false;
    }
  }

  /**
   * Löscht ein Audio
   */
  async deleteAudio(trackId: string): Promise<AudioManagerResult> {
    try {
      await this.initialize();

      console.log('🗑️ UnifiedAudioManager: Deleting audio:', trackId);
      
      // Lösche aus PersistentAudioStorage
      const deleted = persistentAudioStorage.deleteAudio(trackId);
      
      if (deleted !== undefined && deleted !== null) {
        audioLogger.info('unified', 'Audio deleted successfully', {
          trackId
        }, trackId);

        return {
          success: true,
          source: 'Base64'
        };
      } else {
        return {
          success: false,
          error: 'Audio not found'
        };
      }

    } catch (error) {
      console.error('❌ UnifiedAudioManager: Failed to delete audio:', error);
      audioLogger.error('unified', 'Failed to delete audio', {
        trackId,
        error: error.message
      }, trackId);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Zeigt den aktuellen Status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    migrationCompleted: boolean;
    audioCount: number;
    storageStatus: any;
  }> {
    try {
      const storageStatus = await audioMigrationManager.getStorageStatus();
      const audioCount = persistentAudioStorage.getAllAudioIds().length;

      return {
        initialized: this.isInitialized,
        migrationCompleted: this.migrationCompleted,
        audioCount,
        storageStatus
      };
    } catch (error) {
      console.error('❌ UnifiedAudioManager: Failed to get status:', error);
      return {
        initialized: this.isInitialized,
        migrationCompleted: this.migrationCompleted,
        audioCount: 0,
        storageStatus: {}
      };
    }
  }

  /**
   * Führt eine manuelle Migration durch
   */
  async runMigration(): Promise<any> {
    try {
      console.log('🔄 UnifiedAudioManager: Running manual migration...');
      const result = await audioMigrationManager.migrateAllAudioFiles();
      
      if (result.success) {
        this.migrationCompleted = true;
        console.log('✅ UnifiedAudioManager: Manual migration completed successfully');
      } else {
        console.warn('⚠️ UnifiedAudioManager: Manual migration completed with errors');
      }
      
      return result;
    } catch (error) {
      console.error('❌ UnifiedAudioManager: Manual migration failed:', error);
      throw error;
    }
  }

  /**
   * Bereinigt alte Speicher-Systeme
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 UnifiedAudioManager: Cleaning up old storage systems...');
      await audioMigrationManager.cleanupOldStorage();
      console.log('✅ UnifiedAudioManager: Cleanup completed');
    } catch (error) {
      console.error('❌ UnifiedAudioManager: Cleanup failed:', error);
      throw error;
    }
  }
}

export const unifiedAudioManager = new UnifiedAudioManagerClass();

// Globale Debug-Funktionen
if (typeof window !== 'undefined') {
  (window as any).unifiedAudioManager = unifiedAudioManager;
  (window as any).storeNewAudio = (trackId: string, blob: Blob) => unifiedAudioManager.storeNewAudio(trackId, blob);
  (window as any).loadAudioForPlayback = (track: AudioTrack) => unifiedAudioManager.loadAudioForPlayback(track);
  (window as any).isAudioAvailable = (trackId: string) => unifiedAudioManager.isAudioAvailable(trackId);
  (window as any).getAudioStatus = () => unifiedAudioManager.getStatus();
  (window as any).runAudioMigration = () => unifiedAudioManager.runMigration();
  (window as any).cleanupAudioStorage = () => unifiedAudioManager.cleanup();
}
