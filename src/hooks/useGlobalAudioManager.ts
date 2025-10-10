import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useRecordingStore } from '../stores/userStore';
import { AudioUrlManager } from '../services/audioUrlManager';
import { simpleAudioManager } from '../services/simpleAudioManager';
import { audioLogger } from '../utils/audioLogger';
import { useDatabase } from './useDatabase';
import { useUserStore } from '../stores/userStore';
import type { AudioTrack } from '../types';

// Global singleton audio element - only one instance across the entire app
let globalAudio: HTMLAudioElement | null = null;
let isAudioManagerInitialized = false;

export const initializeGlobalAudio = (): HTMLAudioElement => {
  if (!globalAudio) {
    // Creating global audio element
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
    // Global audio manager already initialized
    return;
  }
  
    // Initializing global audio manager
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
    const currentState = store;
    store.setCurrentTime(0);
    // Always set isPlaying to false when audio ends
    if (currentState.isPlaying) {
      console.log('Setting isPlaying to false after audio ended');
      store.togglePlay(); // This will set isPlaying to false
    }
  };
  
  const handleError = (e: Event) => {
    const audioElement = e.target as HTMLAudioElement;
    const currentTrack = store.currentTrack;
    
    // Detailliertes Logging des Fehlers
    audioLogger.error('playback', 'Global audio playback error', {
      trackTitle: currentTrack?.title,
      trackId: currentTrack?.id,
      audioSource: audioElement?.src,
      errorCode: audioElement?.error?.code,
      errorMessage: audioElement?.error?.message,
      readyState: audioElement?.readyState,
      networkState: audioElement?.networkState
    }, currentTrack?.id, audioElement?.src);
    
    console.error('Global audio playback error for track:', currentTrack?.title);
    console.error('Audio source:', audioElement?.src);
    console.error('Error code:', audioElement?.error?.code);
    console.error('Error message:', audioElement?.error?.message);
    
    // Try to handle base64 audio URLs that might have loading issues
    if (currentTrack?.url?.startsWith('data:audio/') && audioElement) {
      audioLogger.info('playback', 'Attempting to reload base64 audio content', {}, currentTrack.id, currentTrack.url);
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
  
  const { currentUser } = useUserStore();
  const { incrementPlay } = useDatabase(currentUser?.id);

  // Update audio source when track changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;
    
    setLoading(true);
    console.log('🎵 Loading track:', currentTrack.title, 'URL type:', typeof currentTrack.url);
    
    // Logging des Track-Ladens
    audioLogger.info('playback', 'Starting to load track', {
      trackTitle: currentTrack.title,
      trackId: currentTrack.id,
      originalUrl: currentTrack.url,
      urlType: typeof currentTrack.url
    }, currentTrack.id, currentTrack.url);
    
    // Versuche zuerst die URL aus dem AudioUrlManager zu laden
    let audioUrl = currentTrack.url;
    
    // Prüfe ob es eine einzigartige URL ist (beginnt mit 'aural-audio-')
    if (audioUrl && audioUrl.startsWith('aural-audio-')) {
      console.log('🔍 Unique URL detected, resolving from AudioUrlManager...');
      const resolvedUrl = AudioUrlManager.getAudioUrlByUniqueId(audioUrl);
      if (resolvedUrl) {
        audioUrl = resolvedUrl;
        console.log('✅ Resolved unique URL successfully');
      } else {
        console.error('❌ Failed to resolve unique URL:', audioUrl);
        setLoading(false);
        return;
      }
    } else if (!audioUrl || audioUrl === '') {
      console.log('🔍 No URL in track, trying AudioUrlManager...');
      audioUrl = AudioUrlManager.getAudioUrl(currentTrack.id);
      
      if (audioUrl) {
        console.log('✅ Found URL in AudioUrlManager');
      } else {
        console.error('❌ No URL found in AudioUrlManager for track:', currentTrack.id);
        setLoading(false);
        return;
      }
    }
    
    // Für Base64-URLs, lade direkt ohne Validierung
    if (audioUrl.startsWith('data:audio/')) {
      console.log('🔍 Base64 URL detected, loading directly...');
      audio.src = audioUrl;
      audio.load();
    } else if (audioUrl.startsWith('blob:')) {
      console.log('🔍 Blob URL detected, loading directly...');
      audio.src = audioUrl;
      audio.load();
    } else {
      console.log('🔍 Other URL type detected, loading directly...');
      audio.src = audioUrl;
      audio.load();
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
    if (!audio) {
      if (isPlaying) {
        console.warn('Audio element not available but trying to play');
      }
      return;
    }
    
    // If no current track, ensure audio is paused
    if (!currentTrack) {
      if (!audio.paused) {
        console.log('No current track, pausing audio');
        audio.pause();
      }
      return;
    }
    
    // Play/pause effect triggered
    
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

  // Handle audio ended event
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio) return;

    const handleEnded = () => {
      console.log('Audio playback ended in useGlobalAudioManager');
      const currentState = usePlayerStore.getState();
      usePlayerStore.getState().setCurrentTime(0);
      // Always set isPlaying to false when audio ends
      if (currentState.isPlaying) {
        console.log('Setting isPlaying to false after audio ended');
        usePlayerStore.getState().togglePlay();
      }
    };

    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  const play = useCallback((track?: AudioTrack) => {
    if (track && track.id !== currentTrack?.id) {
      usePlayerStore.getState().setCurrentTrack(track);
      // Erhöhe Play-Anzahl für neuen Track
      incrementPlay(track.id);
    } else if (track && track.id === currentTrack?.id && !isPlaying) {
      // Erhöhe Play-Anzahl auch wenn der gleiche Track erneut abgespielt wird
      incrementPlay(track.id);
    }
    if (!isPlaying) {
      // Before playing, check if audio is in a valid state
      const audio = getGlobalAudio();
      const store = usePlayerStore.getState();
      
      // Play called
      
      // If audio is in an invalid state, reload it
      if (audio && (audio.readyState === 0 || audio.networkState === 3 || !audio.src)) {
        if (currentTrack?.url) {
          audio.src = currentTrack.url;
          audio.load();
        }
      }
      
      storeTogglePlay();
    }
  }, [currentTrack, isPlaying, storeTogglePlay, incrementPlay]);

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
    
    // Toggle called
    
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