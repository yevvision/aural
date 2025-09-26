import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { validateAudioBlob, repairAudioBlob } from '../utils/audioValidation';

type UseWaveformEditorOpts = {
  container: HTMLElement | null;
  audioBlob: Blob | null;
  barWidth?: number;
  height?: number;
};

export function useWaveformEditor({ container, audioBlob, barWidth = 2, height = 120 }: UseWaveformEditorOpts) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<ReturnType<typeof RegionsPlugin['create']> | null>(null);
  const [duration, setDuration] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [allRegions, setAllRegions] = useState<{ start: number; end: number; id: string }[]>([]);

  // Debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`🔍 useWaveformEditor: ${logMessage}`, data || '');
  };

  const create = useCallback(() => {
    if (!container) {
      addDebugLog('Container not available, skipping WaveSurfer creation');
      return;
    }
    
    try {
      addDebugLog('Creating WaveSurfer instance', { 
        container: container.tagName, 
        barWidth, 
        height,
        hasPreviousInstance: !!wsRef.current 
      });
      
      // Destroy previous instance if any
      if (wsRef.current) {
        addDebugLog('Destroying previous WaveSurfer instance');
        wsRef.current.destroy();
      }

      const ws = WaveSurfer.create({
        container,
        height,
        barWidth,
        barGap: 1,
        barRadius: 2,
        waveColor: '#9ca3af',      // neutral gray
        progressColor: '#ef4444',  // red-500
        cursorColor: '#ffffff',
        interact: true,
        normalize: true,
        minPxPerSec: 80,           // increased for better mobile touch accuracy
        autoScroll: true,
        autoCenter: true,
        // Mobile-specific optimizations
        // responsive: true, // Not supported in current version
        fillParent: true,
        // Better touch handling
        backend: 'MediaElement',
        mediaControls: false,
        // Enhanced mobile touch support
        cursorWidth: 2,
        hideScrollbar: true,
        // Better touch responsiveness
        // pixelRatio: window.devicePixelRatio || 1, // Not supported in current version
      });

      // Regions plugin with mobile optimizations
      const regions = ws.registerPlugin(RegionsPlugin.create());
      
      // Touch: regions are draggable/resizable by default
      regions.on('region-created', (r: any) => {
        console.log('Region created:', r);
        const newRegion = { start: r.start, end: r.end, id: r.id };
        setAllRegions(prev => [...prev, newRegion]);
        setSelection({ start: r.start, end: r.end });
      });
      regions.on('region-updated', (r: any) => {
        console.log('Region updated:', r);
        setAllRegions(prev => prev.map(region => 
          region.id === r.id ? { ...region, start: r.start, end: r.end } : region
        ));
        setSelection({ start: r.start, end: r.end });
      });
      regions.on('region-clicked', (r: any, e: MouseEvent) => {
        e.stopPropagation();
        console.log('Region clicked:', r);
        setSelection({ start: r.start, end: r.end });
      });
      regions.on('region-removed', (r: any) => {
        console.log('Region removed:', r);
        setAllRegions(prev => prev.filter(region => region.id !== r.id));
      });

      ws.on('ready', () => {
        const duration = ws.getDuration();
        addDebugLog('WaveSurfer ready event fired', { duration, isFinite: isFinite(duration) });
        console.log('WaveSurfer: Ready, duration:', duration);
        
        // Behebe Infinity Duration Problem
        const validDuration = isFinite(duration) && duration > 0 ? duration : 0;
        if (!isFinite(duration) || duration <= 0) {
          console.warn('Audio duration is invalid:', duration, 'Using fallback duration: 0');
        }
        
        setIsReady(true);
        setDuration(validDuration);
        
        // Add mobile touch event listeners
        if (container) {
          addDebugLog('Adding mobile touch event listeners');
          // Haptic feedback for touch interactions
          const triggerHaptic = () => {
            if ('vibrate' in navigator) {
              navigator.vibrate(10); // Short vibration for touch feedback
            }
          };
          
          // Touch start for haptic feedback
          container.addEventListener('touchstart', triggerHaptic, { passive: true });
          
          // Double tap to zoom
          let lastTap = 0;
          container.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
              // Double tap detected - zoom in/out
              const currentZoom = ws.getScroll();
              const newZoom = currentZoom > 1 ? 1 : 2;
              ws.zoom(newZoom * 80);
              triggerHaptic();
            }
            lastTap = currentTime;
          }, { passive: true });
        }
      });

      ws.on('error', (error: any) => {
        addDebugLog('WaveSurfer error event', { error: error.message || error });
        console.error('WaveSurfer error:', error);
      });

      wsRef.current = ws;
      regionsRef.current = regions;
      addDebugLog('WaveSurfer instance created successfully', { 
        hasWaveSurfer: !!wsRef.current, 
        hasRegions: !!regionsRef.current 
      });
    } catch (error) {
      addDebugLog('Failed to create WaveSurfer instance', { error: error.message || error });
      console.error('Failed to create WaveSurfer instance:', error);
    }
  }, [container, barWidth, height]);

  useEffect(() => {
    if (!container) return;
    create();
    return () => { wsRef.current?.destroy(); wsRef.current = null; };
  }, [container]); // Remove create from dependencies to prevent infinite loop

  useEffect(() => {
    if (!audioBlob || !wsRef.current) {
      if (audioBlob && !wsRef.current) {
        addDebugLog('Audio blob available but WaveSurfer not ready', { 
          blobSize: audioBlob.size, 
          hasWaveSurfer: !!wsRef.current 
        });
      }
      return;
    }

    addDebugLog('Starting audio blob loading process', { 
      blobSize: audioBlob.size, 
      blobType: audioBlob.type,
      hasWaveSurfer: !!wsRef.current 
    });
    console.log('WaveSurfer: Loading audio blob, size:', audioBlob.size);
    
    // Validate and fix audio blob before loading
    const validateAndLoadAudio = async () => {
      try {
        addDebugLog('Starting audio validation before WaveSurfer loading');
        // First, validate the audio blob by creating an Audio element
        const audio = new Audio();
        const url = URL.createObjectURL(audioBlob);
        audio.src = url;
        addDebugLog('Created audio element for validation', { url });
        
        const loadPromise = new Promise<boolean>((resolve, reject) => {
          const timeout = setTimeout(() => {
            addDebugLog('Audio validation timeout after 15 seconds');
            reject(new Error('Audio loading timeout'));
          }, 15000);
          
          audio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
            addDebugLog('Audio metadata loaded in validation', { duration: audio.duration });
            console.log('Audio metadata loaded, duration:', audio.duration);
            
            // Check if duration is valid (not Infinity or NaN)
            if (isFinite(audio.duration) && audio.duration > 0) {
              addDebugLog('Audio validation successful, proceeding to WaveSurfer', { duration: audio.duration });
              console.log('Audio duration is valid:', audio.duration);
              URL.revokeObjectURL(url);
              resolve(true);
            } else {
              addDebugLog('Audio duration is invalid in validation', { duration: audio.duration });
              console.warn('Audio duration is invalid:', audio.duration);
              URL.revokeObjectURL(url);
              // Don't reject immediately - try to continue anyway
              console.log('Continuing despite invalid duration - WaveSurfer might handle it better');
              resolve(true);
            }
          });
          
          audio.addEventListener('error', (e) => {
            clearTimeout(timeout);
            addDebugLog('Audio validation error', { error: e });
            console.error('Audio loading error:', e);
            URL.revokeObjectURL(url);
            reject(new Error('Audio loading failed'));
          });
          
          // Force load
          addDebugLog('Starting audio load for validation');
          audio.load();
        });
        
        await loadPromise;
        
        // If validation passed, load into WaveSurfer
        addDebugLog('Validation passed, loading blob into WaveSurfer');
        if (wsRef.current) {
          wsRef.current.loadBlob(audioBlob);
        }
        
      } catch (error) {
        addDebugLog('Audio validation failed, attempting to fix blob', { error: error.message || error });
        console.error('Failed to validate or load audio blob:', error);
        
        // Try to fix the audio blob by converting it
        try {
          addDebugLog('Attempting to fix audio blob using AudioContext');
          console.log('Attempting to fix audio blob...');
          const fixedBlob = await fixAudioBlob(audioBlob);
          if (fixedBlob && wsRef.current) {
            addDebugLog('Audio blob fixed successfully, loading into WaveSurfer', { 
              originalSize: audioBlob.size, 
              fixedSize: fixedBlob.size 
            });
            console.log('Audio blob fixed, loading into WaveSurfer');
            wsRef.current.loadBlob(fixedBlob);
          } else {
            addDebugLog('Failed to fix audio blob, trying direct load');
            console.error('Failed to fix audio blob, trying direct load');
            // Last resort: try to load the original blob directly
            if (wsRef.current) {
              console.log('Attempting direct blob load as fallback');
              wsRef.current.loadBlob(audioBlob);
            } else {
              throw new Error('Could not fix audio blob and WaveSurfer not available');
            }
          }
        } catch (fixError) {
          addDebugLog('Audio blob fix failed, trying direct load', { error: fixError.message || fixError });
          console.error('Failed to fix audio blob:', fixError);
          
          // Last resort: try to load the original blob directly
          if (wsRef.current) {
            console.log('Attempting direct blob load as final fallback');
            try {
              wsRef.current.loadBlob(audioBlob);
            } catch (directLoadError) {
              console.error('Direct blob load also failed:', directLoadError);
              throw new Error('Could not load audio blob in any way');
            }
          } else {
            throw new Error('Could not validate or fix audio blob');
          }
        }
      }
    };
    
    validateAndLoadAudio();
  }, [audioBlob]);

  // Helper function to fix audio blob
  const fixAudioBlob = async (blob: Blob): Promise<Blob | null> => {
    try {
      // Create a new AudioContext to process the audio
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('Audio buffer decoded successfully, duration:', audioBuffer.duration);
      
      // Convert back to WAV format
      const wavBlob = await audioBufferToWav(audioBuffer);
      await audioContext.close();
      
      return wavBlob;
    } catch (error) {
      console.error('Failed to fix audio blob:', error);
      return null;
    }
  };

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Create WAV header
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
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
    
    // Convert audio data
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

  const addOrReplaceRegion = useCallback((start = 0, end?: number) => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    // Clear existing regions
    const existingRegions = regionsRef.current.getRegions();
    existingRegions.forEach((region: any) => region.remove());

    const dur = wsRef.current.getDuration();
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const s = clamp(start, 0, dur);
    const e = clamp(end ?? s + Math.min(5, dur - s), s, dur);

    const region = regionsRef.current.addRegion({
      start: s,
      end: e,
      color: 'rgba(245, 158, 11, 0.25)', // orange
      drag: true,
      resize: true,
    });
    setSelection({ start: s, end: e });
    // Seek to start for immediate feedback
    wsRef.current.setTime(s);
  }, [isReady]);

  const addNewRegion = useCallback((start = 0, end?: number) => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    
    const dur = wsRef.current.getDuration();
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const s = clamp(start, 0, dur);
    const e = clamp(end ?? s + Math.min(5, dur - s), s, dur);

    // All regions are orange
    const region = regionsRef.current.addRegion({
      start: s,
      end: e,
      color: 'rgba(245, 158, 11, 0.25)', // orange
      drag: true,
      resize: true,
    });
    
    console.log('Added new region:', { start: s, end: e, id: region.id });
    setSelection({ start: s, end: e });
  }, [isReady, allRegions.length]);

  const removeRegion = useCallback((start: number, end: number) => {
    if (!regionsRef.current) return;
    
    const regions = regionsRef.current.getRegions();
    const regionToRemove = regions.find((region: any) => 
      Math.abs(region.start - start) < 0.01 && Math.abs(region.end - end) < 0.01
    );
    
    if (regionToRemove) {
      regionToRemove.remove();
      console.log('Removed region:', { start, end });
    }
  }, []);

  // Auto-create initial region when audio is ready
  useEffect(() => {
    if (isReady && duration > 0 && allRegions.length === 0) {
      // Create initial region covering the first 5 seconds or full duration if shorter
      const initialEnd = Math.min(5, duration);
      addNewRegion(0, initialEnd);
    }
  }, [isReady, duration, allRegions.length, addNewRegion]);

  const zoom = useCallback((pxPerSec: number) => {
    if (!wsRef.current) return;
    wsRef.current.zoom(pxPerSec);
  }, []);

  const play = useCallback(() => {
    wsRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    wsRef.current?.pause();
  }, []);

  const playing = useCallback(() => {
    return !!wsRef.current?.isPlaying();
  }, []);

  const setTime = useCallback((t: number) => {
    wsRef.current?.setTime(t);
  }, []);

  return {
    wavesurfer: wsRef,
    duration,
    selection,
    isReady,
    allRegions,
    addOrReplaceRegion,
    addNewRegion,
    removeRegion,
    zoom,
    play,
    pause,
    playing,
    setTime,
  };
}