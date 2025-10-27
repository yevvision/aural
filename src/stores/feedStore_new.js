import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import DatabaseService from '../services/databaseService';
export const useFeedStore = create()(subscribeWithSelector(persist(immer((set, get) => ({
    // Initial State
    tracks: [],
    isLoading: false,
    error: null,
    currentFilter: 'all',
    searchQuery: '',
    // Actions
    loadTracks: (currentUserId) => {
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
        }
        catch (error) {
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
        return DatabaseService.getTracksSorted(sortBy, order);
    },
    // Utility
    refresh: () => {
        get().loadTracks();
    }
})), {
    name: 'aural-feed-store-new',
    // Nur UI-State persistieren, nicht die Tracks (die kommen aus zentraler DB)
    partialize: (state) => ({
        currentFilter: state.currentFilter,
        searchQuery: state.searchQuery
    })
})));
// Listener für Datenbank-Änderungen
DatabaseService.addListener(() => {
    useFeedStore.getState().refresh();
});
export default useFeedStore;
