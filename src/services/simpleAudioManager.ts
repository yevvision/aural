/**
 * Simple Audio Manager
 * 
 * Einfache und robuste Lösung für Audio-Management
 * Verwendet Base64-URLs für maximale Persistenz
 */

import { persistentAudioStorage } from './persistentAudioStorage';
import { audioLogger } from '../utils/audioLogger';

interface AudioTrack {
  id: string;
  title: string;
  url?: string;
  filename?: string;
  user?: any;
  [key: string]: any;
}

class SimpleAudioManagerClass {
  private static instance: SimpleAudioManagerClass;

  public static getInstance(): SimpleAudioManagerClass {
    if (!SimpleAudioManagerClass.instance) {
      SimpleAudioManagerClass.instance = new SimpleAudioManagerClass();
    }
    return SimpleAudioManagerClass.instance;
  }

  /**
   * Initialisiert den Audio Manager
   */
  async initialize(): Promise<void> {
    audioLogger.info('manager', 'SimpleAudioManager initialized');
  }

  /**
   * Speichert ein neues Audio
   */
  async storeNewAudio(trackId: string, blob: Blob): Promise<string> {
    console.log('🎵 SimpleAudioManager: Storing new audio:', trackId);
    
    try {
      // Speichere direkt in der persistenten Speicherung
      const base64Url = await persistentAudioStorage.storeAudio(trackId, blob, {
        title: `Track ${trackId}`,
        size: blob.size,
        type: blob.type
      });
      
      console.log('✅ SimpleAudioManager: Audio stored successfully');
      console.log('📊 Storage details:', {
        trackId,
        blobSize: blob.size,
        urlType: 'base64',
        urlLength: base64Url.length
      });
      
      return base64Url;
      
    } catch (error) {
      console.error('❌ SimpleAudioManager: Error storing audio:', error);
      throw error;
    }
  }

  /**
   * Lädt ein Audio für die Wiedergabe
   */
  async loadAudioForPlayback(track: AudioTrack): Promise<string | null> {
    console.log('🎵 SimpleAudioManager: Loading audio for playback:', track.id);
    
    try {
      // Versuche aus der persistenten Speicherung zu laden
      const audioUrl = persistentAudioStorage.getAudio(track.id);
      
      if (audioUrl) {
        console.log('✅ SimpleAudioManager: Audio loaded successfully');
        return audioUrl;
      }
      
      console.log('❌ SimpleAudioManager: No audio data found for track:', track.id);
      return null;
      
    } catch (error) {
      console.error('❌ SimpleAudioManager: Error loading audio:', error);
      return null;
    }
  }

  /**
   * Gibt Debug-Informationen zurück
   */
  getDebugInfo(): any {
    const stats = persistentAudioStorage.getStats();
    const allIds = persistentAudioStorage.getAllAudioIds();
    
    return {
      storage: {
        type: 'PersistentAudioStorage',
        stats,
        audioIds: allIds
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton-Instanz
export const simpleAudioManager = SimpleAudioManagerClass.getInstance();

// Globale Debug-Funktionen
if (typeof window !== 'undefined') {
  (window as any).simpleAudioManager = simpleAudioManager;
  (window as any).getAudioDebugInfo = () => simpleAudioManager.getDebugInfo();
}
