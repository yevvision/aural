// Audio Logger Utilities
export const audioLogger = {
    log: (message, data) => {
        console.log(`🎵 [AudioLogger] ${message}`, data || '');
    },
    info: (source, message, data, trackId) => {
        console.log(`🎵 [AudioLogger:${source}] ${message}`, data || '', trackId ? `(Track: ${trackId})` : '');
    },
    error: (source, message, error, trackId) => {
        console.error(`❌ [AudioLogger:${source}] ${message}`, error || '', trackId ? `(Track: ${trackId})` : '');
    },
    warn: (source, message, data, trackId) => {
        console.warn(`⚠️ [AudioLogger:${source}] ${message}`, data || '', trackId ? `(Track: ${trackId})` : '');
    },
    debug: (message, data) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`🐛 [AudioLogger] ${message}`, data || '');
        }
    }
};
