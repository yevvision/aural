import { useState, useRef, useCallback, useEffect } from 'react';
import { useRecordingStore } from '../stores/userStore';

interface UseMediaRecorderOptions {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onError?: (error: string) => void;
}

export const useMediaRecorder = (options: UseMediaRecorderOptions = {}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancellingRef = useRef(false);
  const { setRecordedBlob } = useRecordingStore();

  // Debug logging helper
  const addDebugLog = (message: string, data?: any) => {
    console.log(`🎤 MediaRecorder: ${message}`, data || '');
  };

  // Hilfsfunktion zum Konvertieren von AudioBuffer zu WAV

  // Audio repair functions removed - let useWaveformEditor handle validation and repair

  const initializeMediaRecorder = useCallback(async (): Promise<boolean> => {
    try {
      addDebugLog('Initializing MediaRecorder...');
      
      // Check for MediaRecorder support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addDebugLog('MediaDevices API not supported');
        setIsSupported(false);
        setIsCheckingSupport(false);
        return false;
      }

      if (!window.MediaRecorder) {
        addDebugLog('MediaRecorder not supported');
        setIsSupported(false);
        setIsCheckingSupport(false);
        return false;
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      addDebugLog('Got user media stream', { 
        tracks: stream.getTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      streamRef.current = stream;
      
      // Check supported MIME types
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          addDebugLog('Selected MIME type', { type });
          break;
        }
      }
      
      if (!selectedMimeType) {
        addDebugLog('No supported MIME types found');
        setIsSupported(false);
        setIsCheckingSupport(false);
        return false;
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });
      
      addDebugLog('MediaRecorder created', { 
        mimeType: selectedMimeType,
        state: mediaRecorder.state
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          addDebugLog('MediaRecorder data available', { size: event.data.size });
        }
      };

      mediaRecorder.onstart = () => {
        addDebugLog('MediaRecorder started');
        setIsRecording(true);
        setIsPaused(false);
        startTimeRef.current = Date.now();
        chunksRef.current = [];
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(elapsed);
        }, 100);
      };

      mediaRecorder.onpause = () => {
        addDebugLog('MediaRecorder paused');
        setIsPaused(true);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorder.onresume = () => {
        addDebugLog('MediaRecorder resumed');
        setIsPaused(false);
        startTimeRef.current = Date.now() - (duration * 1000);
        
        // Resume duration timer
        durationIntervalRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(elapsed);
        }, 100);
      };

      mediaRecorder.onstop = () => {
        addDebugLog('MediaRecorder stopped', { chunksCount: chunksRef.current.length });
        
        // Clear duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        setIsRecording(false);
        setIsPaused(false);
        
        // Check if this is a cancellation
        if (isCancellingRef.current) {
          addDebugLog('Recording was cancelled, not processing data');
          isCancellingRef.current = false;
          return;
        }
        
        const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        addDebugLog('Total recording data size', { totalSize });
        
        if (chunksRef.current.length === 0 || totalSize === 0) {
          addDebugLog('No recording data available');
          options.onError?.('Keine Aufnahmedaten vorhanden');
          return;
        }
        
        try {
          const blob = new Blob(chunksRef.current, { type: selectedMimeType });
          addDebugLog('Created recording blob', {
            size: blob.size,
            type: blob.type
          });
          
          if (blob.size === 0) {
            addDebugLog('Created blob is empty');
            options.onError?.('Aufnahme ist leer');
            return;
          }
          
          // Store the blob immediately
              setRecordedBlob(blob);
              
          // Call the completion callback with the original blob
          // Let the downstream components handle validation and repair
          addDebugLog('Recording completed, calling completion callback');
              options.onRecordingComplete?.(blob, duration);
          
        } catch (error) {
          addDebugLog('Error creating blob', { error: error.message || error });
          options.onError?.('Fehler beim Erstellen der Aufnahme');
        }
      };

      mediaRecorder.onerror = (event) => {
        addDebugLog('MediaRecorder error', { error: event });
        options.onError?.('Aufnahmefehler');
        setIsRecording(false);
        setIsPaused(false);
      };

      setIsSupported(true);
      setIsCheckingSupport(false);
      return true;

    } catch (error) {
      addDebugLog('Failed to initialize MediaRecorder', { error: error.message || error });
      setIsSupported(false);
      setIsCheckingSupport(false);
      options.onError?.('Fehler beim Initialisieren der Aufnahme');
      return false;
    }
  }, [options, setRecordedBlob]);

  const startRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || isRecording) {
      addDebugLog('Cannot start recording', { 
        hasRecorder: !!mediaRecorderRef.current, 
        isRecording 
      });
      return;
    }

    try {
      addDebugLog('Starting recording...');
      mediaRecorderRef.current.start(100); // 100ms timeslice
      addDebugLog('MediaRecorder started with 100ms timeslice');
    } catch (error) {
      addDebugLog('Error starting recording', { error: error.message || error });
      options.onError?.('Fehler beim Starten der Aufnahme');
    }
  }, [isRecording, options]);

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording || isPaused) {
      addDebugLog('Cannot pause recording', { 
        hasRecorder: !!mediaRecorderRef.current, 
        isRecording, 
        isPaused 
      });
      return;
    }

    try {
      addDebugLog('Pausing recording...');
      mediaRecorderRef.current.pause();
    } catch (error) {
      addDebugLog('Error pausing recording', { error: error.message || error });
      options.onError?.('Fehler beim Pausieren der Aufnahme');
    }
  }, [isRecording, isPaused, options]);

  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording || !isPaused) {
      addDebugLog('Cannot resume recording', { 
        hasRecorder: !!mediaRecorderRef.current, 
        isRecording, 
        isPaused 
      });
      return;
    }

    try {
      addDebugLog('Resuming recording...');
      mediaRecorderRef.current.resume();
    } catch (error) {
      addDebugLog('Error resuming recording', { error: error.message || error });
      options.onError?.('Fehler beim Fortsetzen der Aufnahme');
    }
  }, [isRecording, isPaused, options]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) {
      addDebugLog('Cannot stop recording', { 
        hasRecorder: !!mediaRecorderRef.current, 
        isRecording 
      });
      return;
    }

    try {
      addDebugLog('Stopping MediaRecorder...');
        mediaRecorderRef.current.stop();
      } catch (error) {
      addDebugLog('Error stopping recording', { error: error.message || error });
        options.onError?.('Fehler beim Stoppen der Aufnahme');
    }
  }, [isRecording, options]);

  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      addDebugLog('Cannot cancel recording - no recorder');
      return;
    }

    try {
      addDebugLog('Cancelling recording...');
      isCancellingRef.current = true;
      
      if (isRecording) {
      mediaRecorderRef.current.stop();
      }
      
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      chunksRef.current = [];
    } catch (error) {
      addDebugLog('Error cancelling recording', { error: error.message || error });
      options.onError?.('Fehler beim Abbrechen der Aufnahme');
    }
  }, [isRecording, options]);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getCurrentStream = useCallback(() => {
    return streamRef.current;
  }, []);

  // Initialize on mount - only once
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await initializeMediaRecorder();
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isSupported,
    isRecording,
    isPaused,
    duration,
    isCheckingSupport,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
    getCurrentStream,
  };
};
