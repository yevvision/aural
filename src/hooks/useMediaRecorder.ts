import { useState, useRef, useCallback, useEffect } from 'react';
import { useRecordingStore } from '../stores/userStore';

interface UseMediaRecorderOptions {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onError?: (error: string) => void;
}

export const useMediaRecorder = (options: UseMediaRecorderOptions = {}) => {
  const [isSupported, setIsSupported] = useState(true); // Default to true to avoid initial false negative
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const isCancellingRef = useRef<boolean>(false);

  const {
    isRecording,
    isPaused,
    duration,
    setDuration,
    startRecording: storeStartRecording,
    pauseRecording,
    resumeRecording,
    stopRecording: storeStopRecording,
    setRecordedBlob,
    reset,
  } = useRecordingStore();

  // Expose the current stream for audio analysis
  const getCurrentStream = useCallback(() => streamRef.current, []);

  // Check browser support with retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const checkSupport = () => {
      const supported = 
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function' &&
        typeof MediaRecorder !== 'undefined';
      
      if (supported || retryCount >= maxRetries) {
        setIsSupported(supported);
        setIsCheckingSupport(false);
      } else {
        retryCount++;
        // Retry after a short delay
        setTimeout(checkSupport, 100);
      }
    };
    
    checkSupport();
  }, []);

  // Duration tracking - fixed to handle pause correctly and page visibility
  useEffect(() => {
    let interval: number | null = null;
    let lastUpdateTime = Date.now();
    let hiddenStartTime = 0;
    
    const updateDuration = () => {
      if (!isPaused && isRecording) {
        const now = Date.now();
        const currentElapsed = (now - startTimeRef.current - pausedDurationRef.current) / 1000;
        setDuration(currentElapsed);
        lastUpdateTime = now;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden - store the time
        hiddenStartTime = Date.now();
        console.log('📱 Page became hidden, pausing timer updates');
      } else {
        // Page became visible - adjust for hidden time
        if (hiddenStartTime > 0) {
          const hiddenDuration = Date.now() - hiddenStartTime;
          pausedDurationRef.current += hiddenDuration;
          console.log('📱 Page became visible, adjusting for hidden time:', hiddenDuration, 'ms');
          hiddenStartTime = 0;
        }
        // Immediately update duration when page becomes visible
        updateDuration();
      }
    };
    
    if (isRecording) {
      // Start the interval
      interval = setInterval(updateDuration, 100);
      
      // Listen for page visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Also listen for window focus/blur events as backup
      window.addEventListener('focus', handleVisibilityChange);
      window.addEventListener('blur', handleVisibilityChange);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [isRecording, isPaused, setDuration]);

  const initializeMediaRecorder = useCallback(async (): Promise<boolean> => {
    try {
      // Wait for support check to complete
      if (isCheckingSupport) {
        // Wait a bit for the support check to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!isSupported) {
        options.onError?.('Media recording is not supported in this browser');
        return false;
      }

      // Request microphone permission with better configuration
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1, // Mono recording
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      
      // Create MediaRecorder with better configuration
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 // Set a reasonable bitrate
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Event listeners
      mediaRecorder.ondataavailable = (event) => {
        console.log('MediaRecorder data available:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Add error handling for MediaRecorder
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        options.onError?.('Fehler beim Aufnehmen der Audio-Daten');
      };
      
      // Add warning handling (if supported)
      if ('onwarning' in mediaRecorder) {
        (mediaRecorder as any).onwarning = (event: any) => {
          console.warn('MediaRecorder warning:', event);
        };
      }

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks count:', chunksRef.current.length);
        
        // Check if this is a cancellation
        if (isCancellingRef.current) {
          console.log('Recording was cancelled, not processing data');
          isCancellingRef.current = false;
          return;
        }
        
        const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('Total recording data size:', totalSize);
        
        if (chunksRef.current.length === 0 || totalSize === 0) {
          console.error('No recording data available');
          options.onError?.('Keine Aufnahmedaten vorhanden');
          return;
        }
        
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('Created recording blob:', {
            size: blob.size,
            type: blob.type
          });
          
          if (blob.size === 0) {
            console.error('Created blob is empty');
            options.onError?.('Aufnahme ist leer');
            return;
          }
          
          setRecordedBlob(blob);
          options.onRecordingComplete?.(blob, duration);
        } catch (error) {
          console.error('Failed to create recording blob:', error);
          options.onError?.('Fehler beim Erstellen der Aufnahme');
        }
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Error handler is already added above

      return true;
    } catch (error) {
      console.error('Failed to initialize media recorder:', error);
      options.onError?.('Failed to access microphone');
      return false;
    }
  }, [isSupported, isCheckingSupport, options, setRecordedBlob, duration]);

  const startRecording = useCallback(async () => {
    const initialized = await initializeMediaRecorder();
    if (!initialized || !mediaRecorderRef.current) return;

    storeStartRecording();
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    
    // Start recording with optimal timeslice
    mediaRecorderRef.current.start(100); // Collect data every 100ms
    
    console.log('MediaRecorder started with 100ms timeslice');
  }, [initializeMediaRecorder, storeStartRecording]);

  const pauseRecordingAction = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      pauseRecording();
      pausedDurationRef.current += Date.now() - startTimeRef.current;
    }
  }, [isRecording, isPaused, pauseRecording]);

  const resumeRecordingAction = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      resumeRecording();
      startTimeRef.current = Date.now();
    }
  }, [isRecording, isPaused, resumeRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping MediaRecorder...');
      
      // Set a timeout to detect if the MediaRecorder gets stuck
      const stopTimeout = setTimeout(() => {
        console.error('MediaRecorder stop timeout - forcing cleanup');
        options.onError?.('Fehler beim Stoppen der Aufnahme. Bitte versuche es erneut.');
        
        // Force cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        reset();
      }, 10000); // 10 second timeout
      
      // Override the onstop handler to clear the timeout
      const originalOnStop = mediaRecorderRef.current.onstop;
      mediaRecorderRef.current.onstop = (event) => {
        clearTimeout(stopTimeout);
        if (originalOnStop && mediaRecorderRef.current) {
          originalOnStop.call(mediaRecorderRef.current, event);
        }
      };
      
      try {
        mediaRecorderRef.current.stop();
        storeStopRecording();
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
        clearTimeout(stopTimeout);
        options.onError?.('Fehler beim Stoppen der Aufnahme');
      }
    }
  }, [isRecording, storeStopRecording, options, reset]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Set cancellation flag before stopping
      isCancellingRef.current = true;
      mediaRecorderRef.current.stop();
      
      // Clear recorded data
      chunksRef.current = [];
      
      // Cleanup stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
    reset();
  }, [isRecording, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    // State
    isSupported,
    isRecording,
    isPaused,
    duration,
    isCheckingSupport, // Expose this state
    
    // Actions
    startRecording,
    pauseRecording: pauseRecordingAction,
    resumeRecording: resumeRecordingAction,
    stopRecording,
    cancelRecording,
    
    // Audio stream access
    getCurrentStream,
    
    // Utils
    formatDuration: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
  };
}