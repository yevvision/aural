// Audio URL Manager
export class AudioUrlManager {
  private static urlCache = new Map<string, string>();
  
  static getAudioUrl(trackId: string): string | null {
    return this.urlCache.get(trackId) || null;
  }
  
  static setAudioUrl(trackId: string, url: string): void {
    this.urlCache.set(trackId, url);
  }
  
  static async storeAudioUrl(trackId: string, blob: Blob, type: string = 'blob'): Promise<string> {
    try {
      if (type === 'blob') {
        const url = URL.createObjectURL(blob);
        this.setAudioUrl(trackId, url);
        return url;
      } else if (type === 'base64') {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64Url = reader.result as string;
            this.setAudioUrl(trackId, base64Url);
            resolve(base64Url);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else if (type === 'unique') {
        // Für einzigartige URLs, erstelle eine spezielle Kennung
        const uniqueId = `aural-audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const url = URL.createObjectURL(blob);
        this.setAudioUrl(trackId, uniqueId);
        this.setAudioUrl(uniqueId, url); // Speichere auch die tatsächliche URL
        return uniqueId;
      }
      throw new Error(`Unsupported type: ${type}`);
    } catch (error) {
      console.error('Failed to store audio URL:', error);
      throw error;
    }
  }
  
  static clearCache(): void {
    this.urlCache.clear();
  }
  
  static removeUrl(trackId: string): void {
    this.urlCache.delete(trackId);
  }
  
  static clearTrackUrls(trackId: string): void {
    this.urlCache.delete(trackId);
  }
  
  static getUrlInfo(trackId: string): { originalBlob: Blob } {
    // Temporary implementation
    return { originalBlob: new Blob() };
  }
  
  static getUrlStats(): any {
    // Temporary implementation
    return {};
  }
  
  static getAudioUrlByUniqueId(uniqueId: string): string | null {
    return this.urlCache.get(uniqueId) || null;
  }
  
  static base64ToBlob(base64: string, mimeType: string = 'audio/mpeg'): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}
