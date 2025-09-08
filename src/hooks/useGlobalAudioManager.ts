import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useRecordingStore } from '../stores/userStore';
import type { AudioTrack } from '../types';

// Global singleton audio element - only one instance across the entire app
let globalAudio: HTMLAudioElement | null = null;
let isAudioManagerInitialized = false;

export const initializeGlobalAudio = (): HTMLAudioElement => {
  if (!globalAudio) {
    console.log('Creating global audio element...');
    globalAudio = new Audio();
    globalAudio.preload = 'metadata';
    
    // Pause any other audio elements that might exist
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      if (audio !== globalAudio) {
        audio.pause();
      }
    });
  }
  return globalAudio;
};

export const getGlobalAudio = (): HTMLAudioElement | null => {
  // If global audio doesn't exist but manager is initialized, try to create it
  if (!globalAudio && isAudioManagerInitialized) {
    console.log('Recreating global audio element...');
    return initializeGlobalAudio();
  }
  return globalAudio;
};

// Initialize the global audio manager - should only be called once from AppLayout
export const initializeGlobalAudioManager = () => {
  if (isAudioManagerInitialized) {
    console.log('Global audio manager already initialized');
    return;
  }
  
  console.log('Initializing global audio manager...');
  isAudioManagerInitialized = true;
  
  const audio = initializeGlobalAudio();
  const store = usePlayerStore.getState();
  
  // Event listeners
  const handleLoadedMetadata = () => {
    store.setDuration(audio.duration);
    store.setLoading(false);
  };
  
  const handleTimeUpdate = () => {
    store.setCurrentTime(audio.currentTime);
  };
  
  const handleEnded = () => {
    console.log('Audio playback ended');
    store.setCurrentTime(0);
    // Only toggle play if currently playing to avoid state issues
    if (store.isPlaying) {
      store.togglePlay(); // This will set isPlaying to false
    }
  };
  
  const handleError = (e: Event) => {
    const audioElement = e.target as HTMLAudioElement;
    console.error('Global audio playback error for track:', store.currentTrack?.title);
    console.error('Audio source:', audioElement?.src);
    console.error('Error code:', audioElement?.error?.code);
    console.error('Error message:', audioElement?.error?.message);
    
    // Try to handle base64 audio URLs that might have loading issues
    const currentTrack = store.currentTrack;
    if (currentTrack?.url?.startsWith('data:audio/') && audioElement) {
      console.log('Attempting to reload base64 audio...');
      // Force reload for base64 content
      audioElement.load();
    }
    
    store.setLoading(false);
  };
  
  audio.addEventListener('loadedmetadata', handleLoadedMetadata);
  audio.addEventListener('timeupdate', handleTimeUpdate);
  audio.addEventListener('ended', handleEnded);
  audio.addEventListener('error', handleError);
};

// Hook for components that need to react to audio state changes
export const useGlobalAudioManager = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setCurrentTime,
    setDuration,
    setLoading,
    togglePlay: storeTogglePlay,
  } = usePlayerStore();

  // Update audio source when track changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;
    
    setLoading(true);
    console.log('Loading track:', currentTrack.title, 'URL type:', typeof currentTrack.url);
    console.log('URL starts with data:', currentTrack.url?.startsWith('data:'));
    console.log('URL length:', currentTrack.url?.length);
    
    // Ensure we have a valid URL
    if (currentTrack.url) {
      // Reset audio element before setting new source
      audio.src = '';
      audio.load();
      
      audio.src = currentTrack.url;
      audio.load();
      
      // Add extra logging for base64 URLs
      if (currentTrack.url.startsWith('data:audio/')) {
        console.log('Loading base64 audio, first 100 chars:', currentTrack.url.substring(0, 100));
        // For base64 audio, set a longer timeout since it might take longer to decode
        audio.preload = 'auto';
      }
    } else {
      console.error('Track has no URL:', currentTrack);
      setLoading(false);
    }
  }, [currentTrack, setLoading]);

  // Update volume
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Play/pause control
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) {
      if (isPlaying) {
        console.warn('Audio element or track not available but trying to play');
      }
      return;
    }
    
    console.log('Play/pause effect triggered. isPlaying:', isPlaying, 'audio state:', {
      readyState: audio.readyState,
      networkState: audio.networkState,
      paused: audio.paused,
      src: audio.src ? 'set' : 'empty'
    });
    
    if (isPlaying) {
      // Check if we're currently recording - if so, don't play audio
      const recordingStore = useRecordingStore?.getState?.();
      if (recordingStore?.isRecording) {
        console.log('Cannot play audio while recording is active');
        // Pause the audio playback
        usePlayerStore.getState().togglePlay();
        return;
      }
      
      // Pause all other audio elements before playing
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach(audioEl => {
        if (audioEl !== audio && !audioEl.paused) {
          audioEl.pause();
        }
      });
      
      // Ensure audio is properly loaded before playing
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        audio.play().catch(error => {
          console.error('Failed to play audio:', error);
          console.error('Audio ready state:', audio.readyState);
          console.error('Audio network state:', audio.networkState);
          console.error('Audio src:', audio.src);
          console.error('Current track:', currentTrack);
          
          // Try to reload and play again with longer delay
          audio.load();
          setTimeout(() => {
            audio.play().catch(error2 => {
              console.error('Failed to play audio after reload:', error2);
              // Set loading to false to prevent infinite loading state
              setLoading(false);
              // Pause to reset the UI state
              usePlayerStore.getState().togglePlay();
            });
          }, 500); // Increased delay for better reliability
        });
      } else {
        // Wait for audio to load
        const handleCanPlay = () => {
          audio.play().catch(error => {
            console.error('Failed to play audio after loading:', error);
            // Set loading to false to prevent infinite loading state
            setLoading(false);
            // Pause to reset the UI state
            usePlayerStore.getState().togglePlay();
          });
          audio.removeEventListener('canplay', handleCanPlay);
        };
        audio.addEventListener('canplay', handleCanPlay);
        
        // If audio is in an error state, try to reload it
        if (audio.networkState === 3) { // NETWORK_NO_SOURCE
          console.log('Audio in error state, attempting to reload');
          if (currentTrack?.url) {
            audio.src = currentTrack.url;
            audio.load();
          }
        }
        
        // Add timeout to prevent infinite waiting - increased to 15 seconds
        const loadTimeout = setTimeout(() => {
          console.error('Audio loading timeout for track:', currentTrack.title);
          setLoading(false);
          usePlayerStore.getState().togglePlay(); // Pause to reset UI
          audio.removeEventListener('canplay', handleCanPlay);
        }, 15000);
        
        // Clean up timeout when component unmounts or track changes
        return () => {
          clearTimeout(loadTimeout);
          audio.removeEventListener('canplay', handleCanPlay);
        };
      }
    } else {
      // Always attempt to pause, even if there might be issues
      try {
        // Check if audio is actually playing before trying to pause
        if (!audio.paused) {
          audio.pause();
        }
        console.log('Audio paused successfully');
      } catch (error) {
        console.error('Failed to pause audio:', error);
        // Reset the audio element if pausing fails
        audio.load();
      }
    }
  }, [isPlaying, currentTrack, setLoading]);
  
  // Sync audio element currentTime when store currentTime changes (for seeking)
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio && Math.abs(audio.currentTime - currentTime) > 1) {
      // Only update if the difference is significant (> 1 second) to avoid loops
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  const play = useCallback((track?: AudioTrack) => {
    if (track && track.id !== currentTrack?.id) {
      usePlayerStore.getState().setCurrentTrack(track);
    }
    if (!isPlaying) {
      // Before playing, check if audio is in a valid state
      const audio = getGlobalAudio();
      const store = usePlayerStore.getState();
      
      console.log('Play called. Current state:', {
        isPlaying: store.isPlaying,
        hasAudio: !!audio,
        hasTrack: !!track,
        audioReadyState: audio?.readyState,
        audioNetworkState: audio?.networkState
      });
      
      // If audio is in an invalid state, reload it
      if (audio && (audio.readyState === 0 || audio.networkState === 3 || !audio.src)) {
        console.log('Audio element in invalid state, reloading before play');
        if (currentTrack?.url) {
          audio.src = currentTrack.url;
          audio.load();
        }
      }
      
      storeTogglePlay();
    }
  }, [currentTrack, isPlaying, storeTogglePlay]);

  const pause = useCallback(() => {
    if (isPlaying) {
      storeTogglePlay();
    }
  }, [isPlaying, storeTogglePlay]);

  const seek = useCallback((time: number) => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, [setCurrentTime]);

  const toggle = useCallback(() => {
    // Ensure the global audio element exists before toggling
    const audio = getGlobalAudio();
    const storeState = usePlayerStore.getState();
    
    console.log('Toggle called. Current state:', {
      isPlaying: storeState.isPlaying,
      hasAudio: !!audio,
      hasTrack: !!currentTrack,
      audioReadyState: audio?.readyState,
      audioNetworkState: audio?.networkState
    });
    
    // If no audio element and we have a track, initialize it
    if (!audio && currentTrack) {
      console.warn('Global audio element not available, reinitializing for track:', currentTrack.title);
      initializeGlobalAudio();
    }
    
    // Get the audio element again after potential initialization
    const currentAudio = getGlobalAudio();
    
    // If we're trying to play but the audio is in an invalid state, reset it
    if (!storeState.isPlaying && currentAudio) {
      // Check if audio is in error state or has no source
      if (currentAudio.networkState === 3 || // NETWORK_NO_SOURCE
          currentAudio.readyState === 0 ||   // HAVE_NOTHING
          !currentAudio.src) {
        console.log('Audio element in invalid state, reloading track');
        if (currentTrack?.url) {
          currentAudio.src = currentTrack.url;
          currentAudio.load();
        }
      }
    }
    
    storeTogglePlay();
  }, [storeTogglePlay, currentTrack]);

  return {
    // State
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    
    // Actions
    play,
    pause,
    seek,
    toggle,
  };
};