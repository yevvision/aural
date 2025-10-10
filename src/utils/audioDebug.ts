// Audio Debug Utilities
export const debugAudioPlayback = (track: any) => {
  console.log(`🔊 [AudioDebug] Track info:`, {
    id: track?.id,
    title: track?.title,
    url: track?.url,
    duration: track?.duration,
    artist: track?.artist
  });
};

export const audioDebugLogger = {
  log: (message: string, data?: any) => {
    console.log(`🔊 [AudioDebug] ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ [AudioDebug] ${message}`, error || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [AudioDebug] ${message}`, data || '');
  }
};

export const debugAudioState = {
  logState: (state: any) => {
    console.log('🔊 [AudioState]', state);
  }
};
