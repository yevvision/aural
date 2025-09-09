import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AudioTrack, User, FeedFilter } from '../types';
import DatabaseService from '../services/databaseService';

// Neuer FeedStore - verwendet zentrale Datenbank als einzige Quelle der Wahrheit
interface FeedStore {
  // State
  tracks: AudioTrack[];
  isLoading: boolean;
  error: string | null;
  currentFilter: FeedFilter['type'];
  searchQuery: string;
  
  // Actions
  loadTracks: (currentUserId?: string) => void;
  setTracks: (tracks: AudioTrack[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: FeedFilter['type']) => void;
  setSearchQuery: (query: string) => void;
  
  // Track Operations (delegieren an zentrale DB)
  toggleLike: (trackId: string, userId: string) => void;
  toggleBookmark: (trackId: string, userId: string) => void;
  addComment: (trackId: string, commentText: string, userId: string) => void;
  
  // Search & Filter
  searchTracks: (query: string) => AudioTrack[];
  getTracksSorted: (sortBy: string, order: 'asc' | 'desc') => AudioTrack[];
  
  // Utility
  refresh: () => void;
}

export const useFeedStore = create<FeedStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial State
        tracks: [],
        isLoading: false,
        error: null,
        currentFilter: 'all',
        searchQuery: '',
        
        // Actions
        loadTracks: (currentUserId?: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const tracks = DatabaseService.getTracks(currentUserId);
            set((state) => {
              state.tracks = tracks;
              state.isLoading = false;
            });
            console.log('✅ FeedStore: Tracks geladen:', tracks.length);
          } catch (error) {
            console.error('❌ FeedStore: Fehler beim Laden der Tracks:', error);
            set((state) => {
              state.error = 'Fehler beim Laden der Tracks';
              state.isLoading = false;
            });
          }
        },
        
        setTracks: (tracks) => {
          set((state) => {
            state.tracks = tracks;
          });
        },
        
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },
        
        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },
        
        setFilter: (filter) => {
          set((state) => {
            state.currentFilter = filter;
          });
        },
        
        setSearchQuery: (query) => {
          set((state) => {
            state.searchQuery = query;
          });
        },
        
        // Track Operations - delegieren an zentrale DB
        toggleLike: (trackId, userId) => {
          console.log('❤️ FeedStore: toggleLike()', trackId, userId);
          
          const success = DatabaseService.toggleLike(trackId, userId);
          if (success) {
            // Lade Tracks neu nach Like-Änderung
            get().loadTracks(userId);
          }
        },
        
        toggleBookmark: (trackId, userId) => {
          console.log('🔖 FeedStore: toggleBookmark()', trackId, userId);
          
          const success = DatabaseService.toggleBookmark(trackId, userId);
          if (success) {
            // Lade Tracks neu nach Bookmark-Änderung
            get().loadTracks(userId);
          }
        },
        
        addComment: (trackId, commentText, userId) => {
          console.log('💬 FeedStore: addComment()', trackId, commentText.substring(0, 50));
          
          const newComment = {
            id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: commentText,
            user: {
              id: userId,
              username: 'Du', // TODO: Echten Username aus UserStore holen
              totalLikes: 0,
              totalUploads: 0,
              createdAt: new Date()
            },
            trackId,
            createdAt: new Date(),
            likes: 0,
            isLiked: false
          };
          
          const success = DatabaseService.addCommentToTrack(trackId, newComment);
          if (success) {
            // Lade Tracks neu nach Kommentar-Hinzufügung
            get().loadTracks(userId);
          }
        },
        
        // Search & Filter
        searchTracks: (query) => {
          return DatabaseService.searchTracks(query);
        },
        
        getTracksSorted: (sortBy, order) => {
          return DatabaseService.getTracksSorted(sortBy as any, order);
        },
        
        // Utility
        refresh: () => {
          console.log('🔄 FeedStore: refresh()');
          get().loadTracks();
        }
      })),
      {
        name: 'aural-feed-store-new',
        // Nur UI-State persistieren, nicht die Tracks (die kommen aus zentraler DB)
        partialize: (state) => ({
          currentFilter: state.currentFilter,
          searchQuery: state.searchQuery
        })
      }
    )
  )
);

// Listener für Datenbank-Änderungen
DatabaseService.addListener(() => {
  console.log('🔄 FeedStore: Datenbank-Änderung erkannt, lade Tracks neu...');
  useFeedStore.getState().refresh();
});

export default useFeedStore;
