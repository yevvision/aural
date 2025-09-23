/**
 * Audio URL Manager - Zentrale Verwaltung aller Audio-URLs
 * 
 * Problem: Verschiedene URL-Formate (Blob, Base64, Server) werden inkonsistent gespeichert
 * Lösung: Einheitliches URL-Management mit automatischer Konvertierung
 */

export type AudioUrlType = 'blob' | 'base64' | 'server' | 'data';

export interface AudioUrlInfo {
  url: string;
  type: AudioUrlType;
  originalBlob?: Blob;
  isValid: boolean;
  lastChecked: number;
}

class AudioUrlManagerClass {
  private urlCache = new Map<string, AudioUrlInfo>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

  /**
   * Speichert eine Audio-URL mit Metadaten
   */
  async storeAudioUrl(trackId: string, blob: Blob, preferredType: AudioUrlType = 'base64'): Promise<string> {
    console.log('🎵 AudioUrlManager: Storing audio URL for track:', trackId, 'Type:', preferredType);
    
    // Erstelle URL basierend auf bevorzugtem Typ
    let url: string;
    let type: AudioUrlType;
    
    if (preferredType === 'blob') {
      url = URL.createObjectURL(blob);
      type = 'blob';
    } else if (preferredType === 'base64') {
      // Konvertiere zu Base64 (asynchron)
      url = await this.blobToBase64(blob);
      type = 'base64';
    } else {
      // Fallback zu Blob
      url = URL.createObjectURL(blob);
      type = 'blob';
    }
    
    const urlInfo: AudioUrlInfo = {
      url,
      type,
      originalBlob: blob,
      isValid: true,
      lastChecked: Date.now()
    };
    
    this.urlCache.set(trackId, urlInfo);
    console.log('✅ AudioUrlManager: URL stored successfully:', { trackId, type, urlLength: url.length });
    
    return url;
  }

  /**
   * Lädt eine Audio-URL für einen Track
   */
  getAudioUrl(trackId: string): string | null {
    const urlInfo = this.urlCache.get(trackId);
    
    if (!urlInfo) {
      console.log('❌ AudioUrlManager: No URL found for track:', trackId);
      return null;
    }
    
    // Prüfe ob URL noch gültig ist
    if (this.isUrlExpired(urlInfo)) {
      console.log('⚠️ AudioUrlManager: URL expired for track:', trackId);
      this.urlCache.delete(trackId);
      return null;
    }
    
    console.log('✅ AudioUrlManager: Retrieved URL for track:', trackId, 'Type:', urlInfo.type);
    return urlInfo.url;
  }

  /**
   * Validiert eine Audio-URL
   */
  async validateAudioUrl(url: string): Promise<boolean> {
    try {
      console.log('🔍 AudioUrlManager: Validating URL:', url.substring(0, 100) + '...');
      
      // Teste die URL mit einem Audio-Element
      const audio = new Audio();
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏰ AudioUrlManager: URL validation timeout');
          resolve(false);
        }, 5000);
        
        audio.onloadedmetadata = () => {
          clearTimeout(timeout);
          const isValid = isFinite(audio.duration) && audio.duration > 0;
          console.log('✅ AudioUrlManager: URL validation result:', isValid, 'Duration:', audio.duration);
          resolve(isValid);
        };
        
        audio.onerror = (e) => {
          clearTimeout(timeout);
          console.log('❌ AudioUrlManager: URL validation failed:', e);
          resolve(false);
        };
        
        audio.src = url;
      });
    } catch (error) {
      console.log('❌ AudioUrlManager: URL validation error:', error);
      return false;
    }
  }

  /**
   * Konvertiert einen Blob zu Base64
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
   * Konvertiert Base64 zu Blob
   */
  base64ToBlob(base64: string): Blob | null {
    try {
      const [header, data] = base64.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'audio/wav';
      
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error('❌ AudioUrlManager: Base64 to Blob conversion failed:', error);
      return null;
    }
  }

  /**
   * Prüft ob eine URL abgelaufen ist
   */
  private isUrlExpired(urlInfo: AudioUrlInfo): boolean {
    return Date.now() - urlInfo.lastChecked > this.CACHE_DURATION;
  }

  /**
   * Bereinigt abgelaufene URLs
   */
  cleanupExpiredUrls(): void {
    const now = Date.now();
    for (const [trackId, urlInfo] of this.urlCache.entries()) {
      if (now - urlInfo.lastChecked > this.CACHE_DURATION) {
        console.log('🧹 AudioUrlManager: Cleaning up expired URL for track:', trackId);
        this.urlCache.delete(trackId);
      }
    }
  }

  /**
   * Löscht alle URLs für einen Track
   */
  clearTrackUrls(trackId: string): void {
    const urlInfo = this.urlCache.get(trackId);
    if (urlInfo && urlInfo.type === 'blob') {
      URL.revokeObjectURL(urlInfo.url);
    }
    this.urlCache.delete(trackId);
    console.log('🗑️ AudioUrlManager: Cleared URLs for track:', trackId);
  }

  /**
   * Gibt alle gespeicherten URLs zurück (für Debugging)
   */
  getAllUrls(): Map<string, AudioUrlInfo> {
    return new Map(this.urlCache);
  }
}

// Singleton-Instanz
export const AudioUrlManager = new AudioUrlManagerClass();

// Automatische Bereinigung alle 10 Minuten
setInterval(() => {
  AudioUrlManager.cleanupExpiredUrls();
}, 10 * 60 * 1000);
