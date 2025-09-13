import { usePlayerStore } from '../stores/playerStore';
import { useCallback } from 'react';
import type { AudioTrack } from '../types';
import { getGlobalAudio, initializeGlobalAudio } from './useGlobalAudioManager';
import { useDatabase } from './useDatabase';

export const useAudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setCurrentTrack,
    togglePlay
  } = usePlayerStore();
  
  const { incrementPlay } = useDatabase('user-1');

  const play = useCallback((track?: AudioTrack) => {
    if (track && track.id !== currentTrack?.id) {
      setCurrentTrack(track);
      // Erhöhe Play-Anzahl für neuen Track
      incrementPlay(track.id);
    }
    if (!isPlaying) {
      togglePlay();
    }
  }, [currentTrack, isPlaying, setCurrentTrack, togglePlay, incrementPlay]);

  const pause = useCallback(() => {
    if (isPlaying) {
      togglePlay();
    }
  }, [isPlaying, togglePlay]);

  const seek = useCallback((time: number) => {
    // Set the current time in the store, and the global audio manager will sync it
    const { setCurrentTime } = usePlayerStore.getState();
    setCurrentTime(time);
  }, []);

  const toggle = useCallback(() => {
    // Ensure the global audio element exists before toggling
    const audio = getGlobalAudio();
    if (!audio && currentTrack) {
      console.warn('Global audio element not available, attempting to play track:', currentTrack.title);
    }
    
    // If we're trying to play but the audio element doesn't exist, initialize it
    if (!audio && currentTrack && !usePlayerStore.getState().isPlaying) {
      initializeGlobalAudio();
    }
    
    togglePlay();
  }, [togglePlay, currentTrack]);

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