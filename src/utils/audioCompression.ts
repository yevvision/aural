/**
 * Audio Compression Service
 * Nutzt FFmpeg.wasm für clientseitige Audio-Kompression vor dem Upload
 */

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
}

export interface CompressionOptions {
  targetBitrate?: number; // kbps, default: 128
  targetFormat?: 'mp3' | 'aac';
  maxFileSize?: number; // bytes, optional limit
}

/**
 * Komprimiert eine Audio-Datei für den Upload
 */
export async function compressAudioForUpload(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    targetBitrate = 128,
    targetFormat = 'mp3',
    maxFileSize
  } = options;

  console.log('🎵 AudioCompression: Starting compression...', {
    fileName: file.name,
    originalSize: file.size,
    targetFormat,
    targetBitrate
  });

  // 1. Prüfe ob Kompression nötig ist
  const shouldCompress = shouldCompressFile(file, targetBitrate, maxFileSize);
  
  if (!shouldCompress) {
    console.log('✅ AudioCompression: No compression needed');
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      format: file.type
    };
  }

  try {
    // 2. Konvertiere zu WAV falls nötig (FFmpeg braucht WAV als Input)
    const wavBlob = await convertToWav(file);
    console.log('🔄 AudioCompression: Converted to WAV, size:', wavBlob.size);

    // 3. Komprimiere mit FFmpeg Worker
    const compressedBlob = await compressWithFFmpeg(
      wavBlob,
      targetFormat,
      targetBitrate
    );
    console.log('✅ AudioCompression: Compression complete, size:', compressedBlob.size);

    // 4. Erstelle File-Objekt
    const compressedFile = new File(
      [compressedBlob],
      getCompressedFileName(file.name, targetFormat),
      { type: `audio/${targetFormat}` }
    );

    const compressionRatio = ((file.size - compressedFile.size) / file.size) * 100;

    console.log('📊 AudioCompression: Results', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: `${compressionRatio.toFixed(1)}%`,
      format: targetFormat
    });

    return {
      compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio,
      format: targetFormat
    };

  } catch (error) {
    console.error('❌ AudioCompression: Error during compression:', error);
    
    // Fallback: Original-Datei zurückgeben
    console.log('⚠️ AudioCompression: Using original file as fallback');
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      format: file.type
    };
  }
}

/**
 * Prüft ob eine Datei komprimiert werden sollte
 */
function shouldCompressFile(
  file: File,
  targetBitrate: number,
  maxFileSize?: number
): boolean {
  // 1. Prüfe Dateigröße-Limit
  if (maxFileSize && file.size <= maxFileSize) {
    return false;
  }

  // 2. Prüfe Dateiformat
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // WAV-Dateien immer komprimieren (sind meist sehr groß)
  if (fileType.includes('wav') || fileName.endsWith('.wav')) {
    return true;
  }

  // WebM-Dateien komprimieren (oft unoptimiert)
  if (fileType.includes('webm') || fileName.endsWith('.webm')) {
    return true;
  }

  // M4A/OGG komprimieren (nicht alle Browser unterstützen gut)
  if (fileType.includes('m4a') || fileType.includes('ogg') || 
      fileName.endsWith('.m4a') || fileName.endsWith('.ogg')) {
    return true;
  }

  // MP3 nur komprimieren wenn sehr groß oder hohe Bitrate
  if (fileType.includes('mp3') || fileName.endsWith('.mp3')) {
    // Schätze Bitrate basierend auf Dateigröße und Dauer
    // Grobe Schätzung: 1 Minute = ~1MB bei 128kbps
    const estimatedBitrate = (file.size * 8) / (60 * 1000); // kbps
    return file.size > 5 * 1024 * 1024 || estimatedBitrate > targetBitrate * 1.5;
  }

  // Unbekannte Formate komprimieren
  return true;
}

/**
 * Konvertiert eine Audio-Datei zu WAV (für FFmpeg Input)
 */
async function convertToWav(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    audio.onloadedmetadata = async () => {
      try {
        // Erstelle AudioContext für Konvertierung
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);
        const destination = audioContext.createMediaStreamDestination();
        
        source.connect(destination);
        
        // Starte Aufnahme
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const webmBlob = new Blob(chunks, { type: 'audio/webm' });
          resolve(webmBlob);
        };
        
        // Starte Aufnahme und spiele Audio ab
        mediaRecorder.start();
        audio.play();
        
        // Stoppe nach Audio-Dauer
        setTimeout(() => {
          mediaRecorder.stop();
          audio.pause();
          audioContext.close();
        }, audio.duration * 1000 + 1000); // +1s Buffer
        
      } catch (error) {
        reject(error);
      }
    };
    
    audio.onerror = () => {
      reject(new Error('Failed to load audio for conversion'));
    };
    
    audio.src = URL.createObjectURL(file);
  });
}

/**
 * Komprimiert Audio mit FFmpeg Worker
 */
async function compressWithFFmpeg(
  wavBlob: Blob,
  format: 'mp3' | 'aac',
  bitrate: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Erstelle Worker
    const worker = new Worker('/src/workers/ffmpegWorker.js');
    
    worker.onmessage = (event) => {
      const { type, data, error } = event.data;
      
      if (type === 'done') {
        const compressedBlob = new Blob([data], { 
          type: `audio/${format}` 
        });
        worker.terminate();
        resolve(compressedBlob);
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(error));
      }
    };
    
    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };
    
    // Konvertiere Blob zu ArrayBuffer
    wavBlob.arrayBuffer().then(arrayBuffer => {
      worker.postMessage({
        type: 'encode',
        wavArrayBuffer: arrayBuffer,
        fmt: format,
        kbps: bitrate
      });
    }).catch(reject);
  });
}

/**
 * Generiert komprimierten Dateinamen
 */
function getCompressedFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_compressed.${format}`;
}

/**
 * Formatiert Dateigröße für Anzeige
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Schätzt Kompressions-Verbesserung
 */
export function estimateCompressionSavings(originalSize: number, format: string): {
  estimatedSize: number;
  estimatedSavings: number;
} {
  let compressionFactor = 1;
  
  switch (format.toLowerCase()) {
    case 'wav':
      compressionFactor = 0.1; // WAV → MP3: ~90% Ersparnis
      break;
    case 'webm':
      compressionFactor = 0.3; // WebM → MP3: ~70% Ersparnis
      break;
    case 'm4a':
    case 'ogg':
      compressionFactor = 0.5; // M4A/OGG → MP3: ~50% Ersparnis
      break;
    case 'mp3':
      compressionFactor = 0.7; // MP3 Re-encoding: ~30% Ersparnis
      break;
    default:
      compressionFactor = 0.4; // Unbekannt: ~60% Ersparnis
  }
  
  const estimatedSize = Math.round(originalSize * compressionFactor);
  const estimatedSavings = Math.round((1 - compressionFactor) * 100);
  
  return {
    estimatedSize,
    estimatedSavings
  };
}
