import { useState, useCallback, useRef } from 'react';
import { validateAudioBlob, repairAudioBlob } from '../utils/audioValidation';

interface UseLoadAudioOptions {
  onSuccess?: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface UseLoadAudioReturn {
  isLoading: boolean;
  error: string | null;
  progress: number;
  loadAudio: (audioBlob: Blob) => Promise<Blob | null>;
  reset: () => void;
}

export function useLoadAudio(options: UseLoadAudioOptions = {}): UseLoadAudioReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { onSuccess, onError, onProgress } = options;

  const loadAudio = useCallback(async (audioBlob: Blob): Promise<Blob | null> => {
    // Reset previous state
    setError(null);
    setProgress(0);
    setIsLoading(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Validate audio blob
      setProgress(10);
      if (!validateAudioBlob(audioBlob)) {
        throw new Error('Ungültige Audio-Datei. Bitte wählen Sie eine gültige Audio-Datei aus.');
      }

      // Step 2: Repair blob if necessary
      setProgress(30);
      let processedBlob = audioBlob;
      if (!audioBlob.type.startsWith('audio/') || audioBlob.type === 'application/octet-stream') {
        const repairedBlob = repairAudioBlob(audioBlob);
        if (!repairedBlob) {
          throw new Error('Audio-Datei konnte nicht repariert werden. Bitte versuchen Sie eine andere Datei.');
        }
        processedBlob = repairedBlob;
      }

      // Step 3: Additional validation
      setProgress(50);
      if (processedBlob.size === 0) {
        throw new Error('Audio-Datei ist leer. Bitte wählen Sie eine gültige Datei aus.');
      }

      // Step 4: Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (processedBlob.size > maxSize) {
        throw new Error(`Datei zu groß. Maximum: ${Math.round(maxSize / (1024 * 1024))}MB`);
      }

      // Step 5: Test audio loading (optional - skip if problematic)
      setProgress(70);
      try {
        const testAudio = new Audio();
        const testUrl = URL.createObjectURL(processedBlob);
        
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            URL.revokeObjectURL(testUrl);
            resolve(); // Don't reject, just continue
          }, 5000); // 5 second timeout - shorter

          testAudio.oncanplaythrough = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(testUrl);
            resolve();
          };

          testAudio.onerror = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(testUrl);
            resolve(); // Don't reject, just continue
          };

          testAudio.src = testUrl;
          testAudio.load();
        });
      } catch (testError) {
        // Ignore test errors and continue
        console.warn('Audio test failed, but continuing:', testError.message);
      }

      // Step 6: Success
      setProgress(100);
      setIsLoading(false);
      
      onSuccess?.(processedBlob);
      return processedBlob;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Audio-Datei';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    isLoading,
    error,
    progress,
    loadAudio,
    reset
  };
}
