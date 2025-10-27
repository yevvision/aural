import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { AudioUrlManager } from '../services/audioUrlManager';
import type { AudioTrack } from '../types';

// Global singleton audio element
let globalAudio: HTMLAudioElement | null = null;

export const initializeGlobalAudio = (): HTMLAudioElement => {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'metadata';
    console.log('🎵 Global audio element created');
  }
  return globalAudio;
};

export const getGlobalAudio = (): HTMLAudioElement | null => globalAudio;

// Simplified URL resolution - only 3 cases
const resolveAudioUrl = (track: AudioTrack): string | null => {
  // 1. Direct server URL
  if (track.url && !track.url.startsWith('aural-audio-') && !track.url.startsWith('data:')) {
    return track.url;
  }
  
  // 2. Local recording
  if (track.url && track.url.startsWith('aural-audio-')) {
    return AudioUrlManager.getAudioUrlByUniqueId(track.url);
  }
  
  // 3. Generate server URL
  if (track.filename) {
    return `https://goaural.com/uploads/${track.filename}`;
  }
  
  return null;
};

// Hook for components that need to react to audio state changes
export const useGlobalAudioManager = () => {
  const {
    currentTrack,
    isPlaying,
    setCurrentTime,
    setDuration,
    setLoading,
    setFinished,
    togglePlay: storeTogglePlay,
  } = usePlayerStore();

  // Initialize audio element once
  useEffect(() => {
    initializeGlobalAudio();
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;
    
    console.log('🎵 Loading track:', currentTrack.title);
    setLoading(true);
    
    // Resolve URL
    const audioUrl = resolveAudioUrl(currentTrack);
    if (!audioUrl) {
      console.error('❌ No audio URL found for track:', currentTrack.id);
      setLoading(false);
      return;
    }
    
    console.log('🔍 Audio URL:', audioUrl);
    audio.src = audioUrl;
    audio.load();
    
    // Play if needed
    if (isPlaying) {
      audio.play().catch(e => console.error('Play error:', e));
    }
  }, [currentTrack, isPlaying, setLoading]);

  // Handle audio events
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio) return;
 
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
      console.log('✅ Audio loaded:', audio.duration);
    };
 
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
 
    const handleEnded = () => {
      storeTogglePlay();
      setCurrentTime(0);
      setFinished(true);
    };
 
    const handleError = () => {
      console.error('❌ Audio error:', audio.error);
      setLoading(false);
    };
 
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
 
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [setDuration, setCurrentTime, setLoading, setFinished, storeTogglePlay]);

  // Control play/pause
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(e => console.error('Play error:', e));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return {};
};

// Initialize the global audio manager
export const initializeGlobalAudioManager = () => {
  console.log('🎵 Initializing simplified audio manager...');
  initializeGlobalAudio();
  console.log('✅ Simplified audio manager initialized');
};
