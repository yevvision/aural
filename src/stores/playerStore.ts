import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlaybackState, AudioTrack, PlaybackQueue } from '../types';

// German spec: Enhanced player store with queue management and advanced features
interface PlayerStore extends PlaybackState {
  // German spec: Queue management
  queue: AudioTrack[];
  history: AudioTrack[];
  
  // Actions
  setCurrentTrack: (track: AudioTrack, playlist?: AudioTrack[]) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  expand: () => void;
  collapse: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  
  // German spec: Advanced playback controls
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  
  // German spec: Playlist management
  setPlaylist: (tracks: AudioTrack[], startIndex?: number) => void;
  playNext: (track: AudioTrack) => void;
  playLater: (track: AudioTrack) => void;
}

const initialState: PlaybackState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isExpanded: false,
  isLoading: false,
  // German spec: Additional state
  playlist: [],
  currentIndex: -1,
  repeatMode: 'none',
  isShuffled: false,
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      queue: [],
      history: [],
      
      setCurrentTrack: (track, playlist) => {
        const state = get();
        const currentTrack = state.currentTrack;
        
        // Add previous track to history
        if (currentTrack && currentTrack.id !== track.id) {
          set((prevState) => ({
            history: [currentTrack, ...prevState.history.slice(0, 49)] // Keep last 50 tracks
          }));
        }
        
        if (playlist) {
          const index = playlist.findIndex(t => t.id === track.id);
          set({ 
            currentTrack: track, 
            playlist,
            currentIndex: index,
            currentTime: 0, 
            duration: 0,
            isLoading: true 
          });
        } else {
          set({ 
            currentTrack: track, 
            currentTime: 0, 
            duration: 0,
            isLoading: true 
          });
        }
      },
      
      togglePlay: () => {
        set((state) => {
          // Log the toggle action for debugging
          console.log('Toggling play state from', state.isPlaying, 'to', !state.isPlaying);
          console.log('Current track:', state.currentTrack?.title);
          return { isPlaying: !state.isPlaying };
        });
      },
      
      setCurrentTime: (time) => {
        set({ currentTime: time });
      },
      
      setDuration: (duration) => {
        set({ duration, isLoading: false });
      },
      
      setVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
      },
      
      expand: () => {
        set({ isExpanded: true });
      },
      
      collapse: () => {
        set({ isExpanded: false });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      reset: () => {
        set({ ...initialState, queue: [], history: [] });
      },
      
      // German spec: Advanced playback controls
      nextTrack: () => {
        const state = get();
        if (state.playlist && state.playlist.length > 0) {
          let nextIndex: number;
          
          if (state.isShuffled) {
            // Shuffle: random track that's not current
            const availableIndices = state.playlist
              .map((_, i) => i)
              .filter(i => i !== state.currentIndex);
            nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          } else {
            // Normal: next track in playlist
            nextIndex = (state.currentIndex + 1) % state.playlist.length;
          }
          
          const nextTrack = state.playlist[nextIndex];
          if (nextTrack) {
            get().setCurrentTrack(nextTrack, state.playlist);
          }
        } else if (state.queue.length > 0) {
          // Play from queue if no playlist
          const nextTrack = state.queue[0];
          get().setCurrentTrack(nextTrack);
          get().removeFromQueue(0);
        }
      },
      
      previousTrack: () => {
        const state = get();
        
        // If more than 3 seconds played, restart current track
        if (state.currentTime > 3) {
          get().seekTo(0);
          return;
        }
        
        if (state.playlist && state.playlist.length > 0) {
          let prevIndex: number;
          
          if (state.isShuffled) {
            // Shuffle: random track
            const availableIndices = state.playlist
              .map((_, i) => i)
              .filter(i => i !== state.currentIndex);
            prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          } else {
            // Normal: previous track in playlist
            prevIndex = state.currentIndex > 0 
              ? state.currentIndex - 1 
              : state.playlist.length - 1;
          }
          
          const prevTrack = state.playlist[prevIndex];
          if (prevTrack) {
            get().setCurrentTrack(prevTrack, state.playlist);
          }
        } else if (state.history.length > 0) {
          // Play from history
          const prevTrack = state.history[0];
          get().setCurrentTrack(prevTrack);
          set((prevState) => ({
            history: prevState.history.slice(1)
          }));
        }
      },
      
      seekTo: (time) => {
        const state = get();
        const clampedTime = Math.max(0, Math.min(time, state.duration));
        set({ currentTime: clampedTime });
      },
      
      addToQueue: (track) => {
        set((state) => ({
          queue: [...state.queue, track]
        }));
      },
      
      removeFromQueue: (index) => {
        set((state) => ({
          queue: state.queue.filter((_, i) => i !== index)
        }));
      },
      
      clearQueue: () => {
        set({ queue: [] });
      },
      
      toggleRepeat: () => {
        set((state) => {
          const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
          const currentIndex = modes.indexOf(state.repeatMode || 'none');
          const nextIndex = (currentIndex + 1) % modes.length;
          return { repeatMode: modes[nextIndex] };
        });
      },
      
      toggleShuffle: () => {
        set((state) => ({ isShuffled: !state.isShuffled }));
      },
      
      // German spec: Playlist management
      setPlaylist: (tracks, startIndex = 0) => {
        const track = tracks[startIndex];
        if (track) {
          get().setCurrentTrack(track, tracks);
        } else {
          set({ playlist: tracks, currentIndex: -1 });
        }
      },
      
      playNext: (track) => {
        set((state) => ({
          queue: [track, ...state.queue]
        }));
      },
      
      playLater: (track) => {
        set((state) => ({
          queue: [...state.queue, track]
        }));
      },
    }),
    {
      name: 'aural-player-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
        // Don't persist current playback state, only user preferences
      }),
    }
  )
);