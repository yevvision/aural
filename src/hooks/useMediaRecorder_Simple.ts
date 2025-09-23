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
  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Erstelle WAV-Header
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV-Header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Konvertiere Audio-Daten
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Hilfsfunktion zum Reparieren von Audio-Blobs
  const fixAudioBlob = async (blob: Blob): Promise<Blob | null> => {
    try {
      addDebugLog('Attempting to fix audio blob using AudioContext...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      addDebugLog('Audio buffer decoded successfully', { 
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      });
      
      // Konvertiere zurück zu WAV-Format
      const wavBlob = await audioBufferToWav(audioBuffer);
      await audioContext.close();
      
      addDebugLog('Audio blob fixed successfully', { 
        originalSize: blob.size, 
        fixedSize: wavBlob.size 
      });
      
      return wavBlob;
    } catch (error) {
      addDebugLog('Failed to fix audio blob', { error: error.message || error });
      return null;
    }
  };

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
          
          // Fix the blob if it's webm
          if (selectedMimeType.includes('webm')) {
            addDebugLog('Starting immediate blob repair for webm...');
            fixAudioBlob(blob).then(fixedBlob => {
              if (fixedBlob) {
                addDebugLog('Recording blob fixed successfully', { 
                  originalSize: blob.size, 
                  fixedSize: fixedBlob.size 
                });
                
                // Validate the fixed blob
                const fixedAudio = new Audio();
                const fixedUrl = URL.createObjectURL(fixedBlob);
                fixedAudio.src = fixedUrl;
                
                fixedAudio.addEventListener('loadedmetadata', () => {
                  addDebugLog('Fixed recording validation - metadata loaded', { duration: fixedAudio.duration });
                  
                  if (isFinite(fixedAudio.duration) && fixedAudio.duration > 0) {
                    addDebugLog('Fixed recording is valid', { duration: fixedAudio.duration });
                    
                    // Update the store with the fixed blob
                    setRecordedBlob(fixedBlob);
                    
                    // Call the completion callback with the fixed blob and duration
                    options.onRecordingComplete?.(fixedBlob, fixedAudio.duration);
                    
                    addDebugLog('Recording completed successfully with fixed blob');
                  } else {
                    addDebugLog('Fixed recording still has invalid duration', { duration: fixedAudio.duration });
                    // Still try to use the original blob
                    options.onRecordingComplete?.(blob, duration);
                  }
                  
                  URL.revokeObjectURL(fixedUrl);
                });
                
                fixedAudio.addEventListener('error', (e) => {
                  addDebugLog('Fixed recording validation error', { error: e });
                  // Still try to use the original blob
                  options.onRecordingComplete?.(blob, duration);
                  URL.revokeObjectURL(fixedUrl);
                });
                
                fixedAudio.load();
              } else {
                addDebugLog('Could not fix recording blob, using original');
                options.onRecordingComplete?.(blob, duration);
              }
            }).catch(error => {
              addDebugLog('Error during blob fixing', error);
              options.onRecordingComplete?.(blob, duration);
            });
          } else {
            // For non-webm formats, use the blob directly
            addDebugLog('Using blob directly (not webm)');
            options.onRecordingComplete?.(blob, duration);
          }
          
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
  }, [options, setRecordedBlob]); // Include dependencies but control them carefully

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
