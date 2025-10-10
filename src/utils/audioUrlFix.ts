// Audio URL Fix Utilities
export const needsUrlFix = (url: string): boolean => {
  if (!url) return true;
  
  // Prüfe auf problematische URL-Patterns
  if (url.startsWith('blob:') && url.includes('localhost:5174')) {
    return true;
  }
  
  if (url.startsWith('aural-audio-')) {
    return true;
  }
  
  if (url.includes('sessionStorage') || url.includes('localStorage')) {
    return true;
  }
  
  return false;
};

export const fixAudioUrl = async (url: string, trackId: string): Promise<string | null> => {
  if (!needsUrlFix(url)) {
    return url;
  }
  
  try {
    // Versuche die URL zu reparieren
    if (url.startsWith('blob:')) {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    }
    
    // Fallback: null zurückgeben
    return null;
  } catch (error) {
    console.error('Failed to fix audio URL:', error);
    return null;
  }
};
