// Audio Persistence Manager
export const audioPersistenceManager = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save audio data:', error);
    }
  },
  
  load: (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load audio data:', error);
      return null;
    }
  },
  
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove audio data:', error);
    }
  },
  
  storeAudio: (id: string, blob: Blob) => {
    // Temporary implementation
    console.log('storeAudio called', id, blob);
  },
  
  getAudio: (id: string): Blob | null => {
    // Temporary implementation
    console.log('getAudio called', id);
    return null;
  },
  
  createTemporaryBlobUrl: (id: string): string => {
    // Temporary implementation
    console.log('createTemporaryBlobUrl called', id);
    return '';
  },
  
  autoRepairAllAudioUrls: async function() {
    try {
      console.log('🔧 Auto-repairing audio URLs...');
      
      // Lade alle gespeicherten Audio-Daten
      const audioData = this.load('aural-central-database');
      if (!audioData || !audioData.tracks) {
        console.log('No audio data found to repair');
        return;
      }
      
      let repairedCount = 0;
      
      // Durchlaufe alle Tracks und repariere URLs
      for (const track of audioData.tracks) {
        if (track.url && (track.url.startsWith('blob:') || track.url.includes('localhost:5174'))) {
          // Versuche URL zu reparieren
          try {
            const response = await fetch(track.url);
            if (response.ok) {
              const blob = await response.blob();
              const newUrl = URL.createObjectURL(blob);
              track.url = newUrl;
              repairedCount++;
            }
          } catch (error) {
            console.warn(`Failed to repair URL for track ${track.id}:`, error);
          }
        }
      }
      
      // Speichere reparierte Daten
      if (repairedCount > 0) {
        this.save('aural-central-database', audioData);
        console.log(`✅ Repaired ${repairedCount} audio URLs`);
      } else {
        console.log('No URLs needed repair');
      }
      
    } catch (error) {
      console.error('Failed to auto-repair audio URLs:', error);
    }
  }
};
