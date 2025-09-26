// Audio URL Manager
export class AudioUrlManager {
  private static urlCache = new Map<string, string>();
  
  static getAudioUrl(trackId: string): string | null {
    return this.urlCache.get(trackId) || null;
  }
  
  static setAudioUrl(trackId: string, url: string): void {
    this.urlCache.set(trackId, url);
  }
  
  static async storeAudioUrl(trackId: string, blob: Blob, type: string = 'blob'): Promise<void> {
    try {
      if (type === 'blob') {
        const url = URL.createObjectURL(blob);
        this.setAudioUrl(trackId, url);
      } else if (type === 'base64') {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64Url = reader.result as string;
            this.setAudioUrl(trackId, base64Url);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
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
}
