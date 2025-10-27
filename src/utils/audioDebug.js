// Audio Debug Utilities
export const debugAudioPlayback = (track) => {
    console.log(`🔊 [AudioDebug] Track info:`, {
        id: track?.id,
        title: track?.title,
        url: track?.url,
        duration: track?.duration,
        artist: track?.artist
    });
};
export const audioDebugLogger = {
    log: (message, data) => {
        console.log(`🔊 [AudioDebug] ${message}`, data || '');
    },
    error: (message, error) => {
        console.error(`❌ [AudioDebug] ${message}`, error || '');
    },
    warn: (message, data) => {
        console.warn(`⚠️ [AudioDebug] ${message}`, data || '');
    }
};
export const debugAudioState = {
    logState: (state) => {
        console.log('🔊 [AudioState]', state);
    }
};
