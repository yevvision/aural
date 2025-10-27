/**
 * Upload Helper with Progress Tracking
 * Ersetzt fetch() durch XMLHttpRequest für Upload-Fortschrittsanzeige
 */

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
  speed: number; // KB/s
  remainingTime: number; // Sekunden
  elapsedTime: number; // Sekunden
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  timeout?: number; // milliseconds, default: 30000
}

/**
 * Upload mit Fortschritts-Tracking
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  options: UploadOptions = {}
): Promise<Response> {
  const {
    onProgress,
    onSuccess,
    onError,
    timeout = 30000
  } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    // Progress Event Handler
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000;
        const loaded = event.loaded;
        const total = event.total;
        const percent = Math.round((loaded / total) * 100);

        // Berechne Upload-Geschwindigkeit (KB/s)
        const timeDiff = (currentTime - lastTime) / 1000;
        const loadedDiff = loaded - lastLoaded;
        const speed = timeDiff > 0 ? (loadedDiff / 1024) / timeDiff : 0;

        // Berechne verbleibende Zeit
        const remainingBytes = total - loaded;
        const remainingTime = speed > 0 ? remainingBytes / (speed * 1024) : 0;

        const progress: UploadProgress = {
          percent,
          loaded,
          total,
          speed: Math.round(speed * 10) / 10, // Runde auf 1 Dezimalstelle
          remainingTime: Math.round(remainingTime),
          elapsedTime: Math.round(elapsedTime * 10) / 10
        };

        onProgress(progress);

        // Update für nächste Geschwindigkeitsberechnung
        lastLoaded = loaded;
        lastTime = currentTime;
      }
    });

    // Success Handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = {
            ok: true,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(),
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            text: () => Promise.resolve(xhr.responseText),
            blob: () => Promise.resolve(new Blob([xhr.response])),
            arrayBuffer: () => Promise.resolve(xhr.response)
          };

          // Setze Response-Headers
          const headerString = xhr.getAllResponseHeaders();
          if (headerString) {
            headerString.split('\r\n').forEach(line => {
              const parts = line.split(': ');
              if (parts.length === 2) {
                response.headers.set(parts[0], parts[1]);
              }
            });
          }

          onSuccess?.(response);
          resolve(response as any);
        } catch (error) {
          const err = new Error(`Failed to parse response: ${error}`);
          onError?.(err);
          reject(err);
        }
      } else {
        const error = new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`);
        onError?.(error);
        reject(error);
      }
    });

    // Error Handler
    xhr.addEventListener('error', () => {
      const error = new Error('Network error during upload');
      onError?.(error);
      reject(error);
    });

    // Timeout Handler
    xhr.addEventListener('timeout', () => {
      const error = new Error(`Upload timeout after ${timeout}ms`);
      onError?.(error);
      reject(error);
    });

    // Abort Handler
    xhr.addEventListener('abort', () => {
      const error = new Error('Upload aborted');
      onError?.(error);
      reject(error);
    });

    // Konfiguriere Request
    xhr.open('POST', url);
    xhr.timeout = timeout;

    // Keine CORS-Headers setzen - der Server muss diese erlauben
    // XMLHttpRequest sendet automatisch die richtigen Headers

    // Starte Upload
    xhr.send(formData);
  });
}

/**
 * Formatiert Upload-Geschwindigkeit für Anzeige
 */
export function formatUploadSpeed(speed: number): string {
  if (speed < 1) {
    return `${Math.round(speed * 1024)} B/s`;
  } else if (speed < 1024) {
    return `${speed.toFixed(1)} KB/s`;
  } else {
    return `${(speed / 1024).toFixed(1)} MB/s`;
  }
}

/**
 * Formatiert verbleibende Zeit für Anzeige
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds < 60) {
    return `Noch ~${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `Noch ~${minutes}min`;
  } else {
    const hours = Math.round(seconds / 3600);
    return `Noch ~${hours}h`;
  }
}

/**
 * Formatiert Upload-Größe für Anzeige
 */
export function formatUploadSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Schätzt Upload-Zeit basierend auf Dateigröße und aktueller Geschwindigkeit
 */
export function estimateUploadTime(fileSize: number, currentSpeed: number): number {
  if (currentSpeed <= 0) return 0;
  return fileSize / (currentSpeed * 1024); // Sekunden
}

/**
 * Upload mit automatischer Retry-Logik
 */
export async function uploadWithRetry(
  url: string,
  formData: FormData,
  options: UploadOptions & { maxRetries?: number; retryDelay?: number } = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    ...uploadOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);
      
      const response = await uploadWithProgress(url, formData, {
        ...uploadOptions,
        onProgress: (progress) => {
          console.log(`📤 Upload progress: ${progress.percent}% (${formatUploadSpeed(progress.speed)})`);
          uploadOptions.onProgress?.(progress);
        }
      });

      console.log(`✅ Upload successful on attempt ${attempt}`);
      return response;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Upload attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Upload failed after all retries');
}
