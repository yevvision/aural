// Audio Logger Utilities
export const audioLogger = {
  log: (message: string, data?: any) => {
    console.log(`🎵 [AudioLogger] ${message}`, data || '');
  },
  
  info: (source: string, message: string, data?: any, trackId?: string) => {
    console.log(`🎵 [AudioLogger:${source}] ${message}`, data || '', trackId ? `(Track: ${trackId})` : '');
  },
  
  error: (source: string, message: string, error?: any, trackId?: string) => {
    console.error(`❌ [AudioLogger:${source}] ${message}`, error || '', trackId ? `(Track: ${trackId})` : '');
  },
  
  warn: (source: string, message: string, data?: any, trackId?: string) => {
    console.warn(`⚠️ [AudioLogger:${source}] ${message}`, data || '', trackId ? `(Track: ${trackId})` : '');
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🐛 [AudioLogger] ${message}`, data || '');
    }
  }
};
