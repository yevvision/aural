import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AudioTrack, FeedFilter, SearchFilters, AudioCategory } from '../types';
import { useActivityStore } from './activityStore';
import { useUserStore } from './userStore';
import { centralDB } from '../database/centralDatabase_simple';

// German spec: Enhanced feed store with categories, search, and German filters
interface FeedStore {
  // State
  tracks: AudioTrack[];
  audioItems: AudioTrack[];
  isLoading: boolean;
  filter: FeedFilter['type'];
  hasMore: boolean;
  
  // German spec: Categories and grouping
  categories: AudioCategory[];
  featuredTracks: AudioTrack[];
  trendingTracks: AudioTrack[];
  
  // German spec: Search and filtering
  searchQuery: string;
  searchResults: AudioTrack[];
  searchFilters: SearchFilters;
  recentSearches: string[];
  
  // German spec: Pagination
  currentPage: number;
  totalPages: number;
  cursor: string | null;
  
  // Like-Update Lock (verhindert Überschreibung während Update)
  isUpdatingLikes: boolean;
  lastLikeUpdate: { trackId: string; timestamp: number } | null;
  // Bookmark-Update Lock (verhindert Überschreibung von Like-Daten während Bookmark-Update)
  isUpdatingBookmark: boolean;
  lastBookmarkUpdate: { trackId: string; timestamp: number } | null;
  
  // Actions
  setTracks: (tracks: AudioTrack[]) => void;
  addTrack: (track: AudioTrack) => void;
  updateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  toggleLike: (trackId: string) => void;
  toggleBookmark: (trackId: string) => void; // New bookmark functionality
  addComment: (trackId: string, commentText: string) => void; // New comment functionality
  addCommentToTrack?: (trackId: string, commentText: string) => void; // Compatibility alias
  toggleCommentLike: (trackId: string, commentId: string) => void; // New comment like functionality
  setFilter: (filter: FeedFilter['type']) => void;
  setLoading: (loading: boolean) => void;
  loadMoreTracks: () => void;
  reset: () => void;
  loadTracksFromDatabase: () => void; // Load tracks from centralDB
  
  // German spec: Advanced actions
  refreshFeed: () => void;
  searchTracks: (query: string, filters?: SearchFilters) => void;
  clearSearch: () => void;
  addToRecentSearches: (query: string) => void;
  optimisticUpdate: (trackId: string, updates: Partial<AudioTrack>) => void;
  
  // German spec: Category management
  setCategories: (categories: AudioCategory[]) => void;
  filterByCategory: (categoryId: string) => void;
  
  // German spec: Featured content
  setFeaturedTracks: (tracks: AudioTrack[]) => void;
  setTrendingTracks: (tracks: AudioTrack[]) => void;
  
  // Sync with user store
  syncWithUserStore: () => void;
  
  // Delete all tracks by a specific user
  deleteTracksByUser: (userId: string) => void;
}

const initialState = {
  tracks: [],
  audioItems: [],
  isLoading: false,
  filter: 'all' as FeedFilter['type'],
  hasMore: true,
  
  // German spec: Additional state
  categories: [],
  featuredTracks: [],
  trendingTracks: [],
  searchQuery: '',
  searchResults: [],
  searchFilters: {} as SearchFilters,
  recentSearches: [],
  currentPage: 1,
  totalPages: 1,
  cursor: null,
  
  // Lock für Like-Updates (verhindert Überschreibung während Update)
  isUpdatingLikes: false,
  lastLikeUpdate: null as { trackId: string; timestamp: number } | null,
  // Lock für Bookmark-Updates (verhindert Überschreibung von Like-Daten)
  isUpdatingBookmark: false,
  lastBookmarkUpdate: null as { trackId: string; timestamp: number } | null,
};

export const useFeedStore = create<FeedStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setTracks: (tracks) => {
        // Helper function to safely convert to Date for sorting
        const toSafeDate = (dateValue: any): Date => {
          if (!dateValue) return new Date();
          if (dateValue instanceof Date) return dateValue;
          if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          }
          return new Date();
        };
        
        // Sort tracks by creation date (newest first) to ensure proper order
        const sortedTracks = [...tracks].sort((a, b) => 
          toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime()
        );
        set({ tracks: sortedTracks, isLoading: false });
        // Sync with user store after setting tracks
        setTimeout(() => {
          get().syncWithUserStore();
        }, 0);
      },
      
      addTrack: (track) => {
        set((state) => {
          // Helper function to safely convert to Date for sorting
          const toSafeDate = (dateValue: any): Date => {
            if (!dateValue) return new Date();
            if (dateValue instanceof Date) return dateValue;
            if (typeof dateValue === 'string') {
              const parsed = new Date(dateValue);
              return isNaN(parsed.getTime()) ? new Date() : parsed;
            }
            return new Date();
          };
          
          // Insert new track at the beginning to ensure it appears at the top
          const newTracks = [track, ...state.tracks];
          // Sort all tracks by creation date to maintain proper order
          const sortedTracks = [...newTracks].sort((a, b) => 
            toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime()
          );
          return { tracks: sortedTracks };
        });
      },
      
      updateTrack: (trackId, updates) => {
        set((state) => {
          const isLikeUpdate = 'isLiked' in updates || 'likes' in updates;
          const isBookmarkUpdate = 'isBookmarked' in updates;
          
          return {
            tracks: state.tracks.map(track =>
              track.id === trackId ? { ...track, ...updates } : track
            ),
            // Markiere Like-Update, damit loadTracksFromDatabase es nicht überschreibt
            isUpdatingLikes: isLikeUpdate,
            lastLikeUpdate: isLikeUpdate ? { trackId, timestamp: Date.now() } : state.lastLikeUpdate,
            // Markiere Bookmark-Update, damit loadTracksFromDatabase Like-Daten nicht überschreibt
            isUpdatingBookmark: isBookmarkUpdate,
            lastBookmarkUpdate: isBookmarkUpdate ? { trackId, timestamp: Date.now() } : state.lastBookmarkUpdate
          };
        });
        
        // Setze isUpdatingLikes nach 1 Sekunde zurück
        if ('isLiked' in updates || 'likes' in updates) {
          setTimeout(() => {
            set((state) => ({ ...state, isUpdatingLikes: false }));
          }, 1000);
        }
        
        // Setze isUpdatingBookmark nach 1 Sekunde zurück
        if ('isBookmarked' in updates) {
          setTimeout(() => {
            set((state) => ({ ...state, isUpdatingBookmark: false }));
          }, 1000);
        }
      },
      
      toggleLike: (trackId) => {
        set((state) => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              const isLiked = !track.isLiked;
              
              // Check if this is the user's own track
              const userState = useUserStore.getState();
              const isUserTrack = userState.myTracks.some((t: AudioTrack) => t.id === trackId);
              
              // Track user activity - if it's their own track, add to notifications as well
              if (isLiked) {
                if (isUserTrack) {
                  useActivityStore.getState().addUserActivityAsNotification({
                    type: 'my_like',
                    trackId: track.id,
                    trackTitle: track.title,
                    trackUser: track.user
                  });
                } else {
                  useActivityStore.getState().addUserActivity({
                    type: 'my_like',
                    trackId: track.id,
                    trackTitle: track.title,
                    trackUser: track.user
                  });
                }
              }
              
              return {
                ...track,
                isLiked,
                likes: track.likes + (isLiked ? 1 : -1)
              };
            }
            return track;
          })
        }));
        
        // Also update user's myTracks if this is a user track
        const userState = useUserStore.getState();
        const userTrack = userState.myTracks.find((t: AudioTrack) => t.id === trackId);
        if (userTrack) {
          useUserStore.getState().updateMyTrack(trackId, {
            isLiked: !userTrack.isLiked,
            likes: userTrack.likes + (!userTrack.isLiked ? 1 : -1)
          });
        }
      },
      
      toggleBookmark: (trackId) => {
        set((state) => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              const isBookmarked = !track.isBookmarked;
              
              // Check if this is the user's own track
              const userState = useUserStore.getState();
              const isUserTrack = userState.myTracks.some((t: AudioTrack) => t.id === trackId);
              
              // Track user activity for bookmarks - if it's their own track, add to notifications as well
              if (isBookmarked) {
                if (isUserTrack) {
                  useActivityStore.getState().addUserActivityAsNotification({
                    type: 'my_bookmark',
                    trackId: track.id,
                    trackTitle: track.title,
                    trackUser: track.user
                  });
                } else {
                  useActivityStore.getState().addUserActivity({
                    type: 'my_bookmark',
                    trackId: track.id,
                    trackTitle: track.title,
                    trackUser: track.user
                  });
                }
              }
              
              return {
                ...track,
                isBookmarked
              };
            }
            return track;
          })
        }));
        
        // Also update user's bookmarked tracks and myTracks if this is a user track
        const userState = useUserStore.getState();
        const userTrack = userState.myTracks.find((t: AudioTrack) => t.id === trackId);
        
        // Update user's bookmarked tracks list
        if (userState.isTrackBookmarked(trackId)) {
          userState.unbookmarkTrack(trackId);
        } else {
          userState.bookmarkTrack(trackId);
        }
        
        // Update user's myTracks if this is a user track
        if (userTrack) {
          useUserStore.getState().updateMyTrack(trackId, {
            isBookmarked: !userTrack.isBookmarked
          });
        }
      },
      
      addComment: (trackId, commentText) => {
        set((state) => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              const newComment = {
                id: Date.now().toString(),
                content: commentText,
                user: {
                  id: 'current-user',
                  username: 'Du',
                  totalLikes: 0,
                  totalUploads: 0,
                  createdAt: new Date()
                },
                trackId,
                createdAt: new Date()
              };
              
              // Check if this is the user's own track
              const userState = useUserStore.getState();
              const isUserTrack = userState.myTracks.some((t: AudioTrack) => t.id === trackId);
              
              // Track user activity - if it's their own track, add to notifications as well
              if (isUserTrack) {
                useActivityStore.getState().addUserActivityAsNotification({
                  type: 'my_comment',
                  trackId: track.id,
                  trackTitle: track.title,
                  trackUser: track.user,
                  commentText
                });
              } else {
                useActivityStore.getState().addUserActivity({
                  type: 'my_comment',
                  trackId: track.id,
                  trackTitle: track.title,
                  trackUser: track.user,
                  commentText
                });
              }
              
              return {
                ...track,
                comments: [...(track.comments || []), newComment],
                commentsCount: (track.commentsCount || 0) + 1
              };
            }
            return track;
          })
        }));
        
        // Also update user's myTracks if this is a user track
        const userState = useUserStore.getState();
        const userTrack = userState.myTracks.find((t: AudioTrack) => t.id === trackId);
        if (userTrack) {
          const newComment = {
            id: Date.now().toString(),
            content: commentText,
            user: {
              id: 'current-user',
              username: 'Du',
              totalLikes: 0,
              totalUploads: 0,
              createdAt: new Date()
            },
            trackId,
            createdAt: new Date()
          };
          useUserStore.getState().updateMyTrack(trackId, {
            comments: [...(userTrack.comments || []), newComment],
            commentsCount: (userTrack.commentsCount || 0) + 1
          });
        }
      },

      // Compatibility alias for legacy callers
      addCommentToTrack: (trackId, commentText) => {
        get().addComment(trackId, commentText);
      },
      
      toggleCommentLike: (trackId, commentId) => {
        set((state) => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId && track.comments) {
              const updatedComments = track.comments.map(comment => {
                if (comment.id === commentId) {
                  const isLiked = !comment.isLiked;
                  const likes = (comment.likes || 0) + (isLiked ? 1 : -1);
                  return {
                    ...comment,
                    isLiked,
                    likes: likes > 0 ? likes : 0
                  };
                }
                return comment;
              });
              
              return {
                ...track,
                comments: updatedComments
              };
            }
            return track;
          })
        }));
        
        // Also update user's myTracks if this is a user track
        const userState = useUserStore.getState();
        const userTrack = userState.myTracks.find((t: AudioTrack) => t.id === trackId);
        if (userTrack && userTrack.comments) {
          const updatedComments = userTrack.comments.map(comment => {
            if (comment.id === commentId) {
              const isLiked = !comment.isLiked;
              const likes = (comment.likes || 0) + (isLiked ? 1 : -1);
              return {
                ...comment,
                isLiked,
                likes: likes > 0 ? likes : 0
              };
            }
            return comment;
          });
          
          useUserStore.getState().updateMyTrack(trackId, {
            comments: updatedComments
          });
        }
      },
      
      setFilter: (filter) => {
        set({ filter, isLoading: true, currentPage: 1 });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      loadMoreTracks: () => {
        const state = get();
        if (state.hasMore && !state.isLoading) {
          set({ isLoading: true, currentPage: state.currentPage + 1 });
        }
      },
      
      reset: () => {
        set(initialState);
      },
      
      // German spec: Advanced actions
      refreshFeed: () => {
        set({ 
          isLoading: true, 
          currentPage: 1, 
          tracks: [], 
          cursor: null 
        });
      },
      
      searchTracks: (query, filters = {}) => {
        set({ 
          searchQuery: query, 
          searchFilters: filters, 
          isLoading: true,
          searchResults: []
        });
        
        // Add to recent searches if not empty
        if (query.trim()) {
          get().addToRecentSearches(query.trim());
        }
      },
      
      clearSearch: () => {
        set({ 
          searchQuery: '', 
          searchResults: [], 
          searchFilters: {} as SearchFilters 
        });
      },
      
      addToRecentSearches: (query) => {
        set((state) => {
          const searches = [query, ...state.recentSearches.filter(s => s !== query)];
          return {
            recentSearches: searches.slice(0, 10) // Keep only last 10 searches
          };
        });
      },
      
      optimisticUpdate: (trackId, updates) => {
        // Immediate UI update before server confirmation
        get().updateTrack(trackId, updates);
      },
      
      // German spec: Category management
      setCategories: (categories) => {
        set({ categories });
      },
      
      filterByCategory: (categoryId) => {
        const state = get();
        const category = state.categories.find(c => c.id === categoryId);
        if (category) {
          set({ 
            isLoading: true,
            searchFilters: { ...state.searchFilters, tags: [category.name] },
            currentPage: 1
          });
        }
      },
      
      // German spec: Featured content
      setFeaturedTracks: (tracks) => {
        set({ featuredTracks: tracks });
      },
      
      setTrendingTracks: (tracks) => {
        set({ trendingTracks: tracks });
      },
      
      // Sync tracks with user store bookmarked status and user info
      syncWithUserStore: () => {
        const userState = useUserStore.getState();
        set((state) => ({
          tracks: state.tracks.map(track => {
            // Update bookmark status
            const isBookmarked = userState.isTrackBookmarked(track.id);
            
            // If this track is owned by the current user, update the user info
            let updatedTrack = { ...track };
            if (userState.currentUser && track.user && track.user.id === userState.currentUser.id) {
              updatedTrack = {
                ...updatedTrack,
                user: {
                  ...updatedTrack.user,
                  username: userState.currentUser.username || updatedTrack.user.username
                }
              };
            }
            
            // Update bookmark status if needed
            if (updatedTrack.isBookmarked !== isBookmarked) {
              updatedTrack = {
                ...updatedTrack,
                isBookmarked
              };
            }
            
            return updatedTrack;
          })
        }));
      },

      // Delete all tracks by a specific user
      deleteTracksByUser: (userId) => {
        set((state) => ({
          tracks: state.tracks.filter(track => track.user.id !== userId)
        }));
      },

      // Load tracks from centralDB (nutzer-spezifisch angereichert)
      loadTracksFromDatabase: () => {
        try {
          const state = get();
          
          // WICHTIG: Wenn gerade ein Like- oder Bookmark-Update läuft, warte kurz bevor du lädst
          const isLikeUpdateActive = state.isUpdatingLikes || (state.lastLikeUpdate && Date.now() - state.lastLikeUpdate.timestamp < 500);
          const isBookmarkUpdateActive = state.isUpdatingBookmark || (state.lastBookmarkUpdate && Date.now() - state.lastBookmarkUpdate.timestamp < 500);
          
          if (isLikeUpdateActive || isBookmarkUpdateActive) {
            console.log('⏳ FeedStore: Überspringe loadTracksFromDatabase - Update läuft gerade', {
              likeUpdate: isLikeUpdateActive,
              bookmarkUpdate: isBookmarkUpdateActive
            });
            setTimeout(() => {
              get().loadTracksFromDatabase();
            }, 500);
            return;
          }
          
          console.log('📥 FeedStore: Lade Tracks aus Datenbank...');
          const userId = useUserStore.getState().currentUser?.id;
          const currentState = get();
          
          // Hole Tracks direkt aus der Datenbank (bereits mit Like-Daten bereichert)
          const dbTracks = centralDB.getAllTracks(userId);
          
          // WICHTIG: Merge Like- und Bookmark-Daten - behalte aktuelle Daten für Tracks, die kürzlich aktualisiert wurden
          const mergedTracks = dbTracks.map(dbTrack => {
            const existingTrack = currentState.tracks.find(t => t.id === dbTrack.id);
            
            if (!existingTrack) {
              return dbTrack;
            }
            
            // Wenn dieser Track kürzlich aktualisiert wurde (innerhalb der letzten 2 Sekunden), behalte die Store-Daten
            const hasRecentLikeUpdate = state.lastLikeUpdate && state.lastLikeUpdate.trackId === dbTrack.id;
            const hasRecentBookmarkUpdate = state.lastBookmarkUpdate && state.lastBookmarkUpdate.trackId === dbTrack.id;
            
            if (hasRecentLikeUpdate) {
              const timeSinceUpdate = Date.now() - state.lastLikeUpdate!.timestamp;
              if (timeSinceUpdate < 2000) {
                console.log('🔒 FeedStore: Behalte Like-Daten für kürzlich aktualisierten Track', dbTrack.id, {
                  store: { likes: existingTrack.likes, isLiked: existingTrack.isLiked },
                  database: { likes: dbTrack.likes, isLiked: dbTrack.isLiked }
                });
                // Behalte Like-Daten vom Store, aber verwende andere Daten aus DB
                return {
                  ...dbTrack,
                  likes: existingTrack.likes,
                  isLiked: existingTrack.isLiked
                };
              }
            }
            
            if (hasRecentBookmarkUpdate) {
              const timeSinceUpdate = Date.now() - state.lastBookmarkUpdate!.timestamp;
              if (timeSinceUpdate < 2000) {
                console.log('🔒 FeedStore: Behalte Bookmark-Daten für kürzlich aktualisierten Track', dbTrack.id, {
                  store: { isBookmarked: existingTrack.isBookmarked },
                  database: { isBookmarked: dbTrack.isBookmarked }
                });
                // Behalte Bookmark-Daten vom Store, aber verwende Like-Daten aus DB (falls diese neuer sind)
                return {
                  ...dbTrack,
                  isBookmarked: existingTrack.isBookmarked,
                  // WICHTIG: Behalte auch Like-Daten vom Store, falls vorhanden
                  ...(existingTrack.isLiked !== undefined && {
                    likes: existingTrack.likes,
                    isLiked: existingTrack.isLiked
                  })
                };
              }
            }
            
            // Ansonsten verwende DB-Daten (Quelle der Wahrheit), aber logge Unterschiede
            if (existingTrack.likes !== dbTrack.likes || existingTrack.isLiked !== dbTrack.isLiked) {
              console.log('🔄 FeedStore: Like-Daten Unterschied für Track', dbTrack.id, {
                store: { likes: existingTrack.likes, isLiked: existingTrack.isLiked },
                database: { likes: dbTrack.likes, isLiked: dbTrack.isLiked }
              });
            }
            
            return dbTrack;
          });
          
          // Debug: Prüfe Like-Daten für alle Tracks
          const tracksWithLikes = mergedTracks.filter(t => (t.likes || 0) > 0 || t.isLiked);
          console.log('📥 FeedStore: Geladene Tracks:', mergedTracks.length);
          console.log('📥 FeedStore: Tracks mit Likes:', tracksWithLikes.length, tracksWithLikes.map(t => ({ id: t.id, title: t.title, likes: t.likes, isLiked: t.isLiked })));
          
          // Process tracks to ensure base64 URLs are preserved
          const processedTracks = mergedTracks.map(track => {
            // Log URL type for debugging
            if (track.url?.startsWith('data:audio/')) {
              console.log('FeedStore: Found base64 audio URL for track:', track.title);
            } else if (track.url?.startsWith('blob:')) {
              console.log('FeedStore: Found blob URL for track:', track.title, '- this will be invalid after page reload');
            }
            
            return track;
          });
          
          set({ tracks: processedTracks, isLoading: false });
          console.log('✅ FeedStore: Tracks erfolgreich gesetzt mit Like-Daten');
        } catch (error) {
          console.error('❌ Fehler beim Laden der Tracks aus der Datenbank:', error);
          set({ tracks: [], isLoading: false });
        }
      },

    }),
    {
      name: 'aural-feed-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist minimal data - let the centralDB be the source of truth
        filter: state.filter,
        recentSearches: state.recentSearches,
        searchFilters: state.searchFilters,
        // Don't persist tracks - they should always be loaded from centralDB
        // Don't persist loading states
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error && state) {
            // Load tracks from server first, fallback to centralDB
            setTimeout(async () => {
              try {
                // Versuche Server-Daten zu laden
                const { serverDatabaseService } = await import('../services/serverDatabaseService');
                const userId = useUserStore.getState().currentUser?.id;
                const serverTracks = await serverDatabaseService.getAllTracks();

                // In Dev/Local immer nutzer-spezifisch aus centralDB anreichern
                const enrichedLocal = centralDB.getAllTracks(userId);
                if (enrichedLocal && enrichedLocal.length > 0) {
                  console.log('📱 FeedStore: Using enriched local database tracks:', enrichedLocal.length);
                  state.setTracks(enrichedLocal);
                } else if (serverTracks && serverTracks.length > 0) {
                  console.log('🌐 FeedStore: Loaded tracks from server:', serverTracks.length);
                  state.setTracks(serverTracks);
                } else {
                  console.log('📭 FeedStore: No tracks available from server or local');
                  state.setTracks([]);
                }
              } catch (error) {
                console.error('❌ FeedStore: Server load failed, using local database:', error);
                // Fallback zu lokaler Datenbank
                const userId = useUserStore.getState().currentUser?.id;
                const dbTracks = centralDB.getAllTracks(userId);
                state.setTracks(dbTracks);
              }
              
              state.syncWithUserStore();
            }, 0);
          }
        };
      },

    }
  )
);