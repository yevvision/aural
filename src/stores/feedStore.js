import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useActivityStore } from './activityStore';
import { useUserStore } from './userStore';
import { centralDB } from '../database/centralDatabase_simple';
const initialState = {
    tracks: [],
    audioItems: [],
    isLoading: false,
    filter: 'all',
    hasMore: true,
    // German spec: Additional state
    categories: [],
    featuredTracks: [],
    trendingTracks: [],
    searchQuery: '',
    searchResults: [],
    searchFilters: {},
    recentSearches: [],
    currentPage: 1,
    totalPages: 1,
    cursor: null,
};
export const useFeedStore = create()(persist((set, get) => ({
    ...initialState,
    setTracks: (tracks) => {
        // Helper function to safely convert to Date for sorting
        const toSafeDate = (dateValue) => {
            if (!dateValue)
                return new Date();
            if (dateValue instanceof Date)
                return dateValue;
            if (typeof dateValue === 'string') {
                const parsed = new Date(dateValue);
                return isNaN(parsed.getTime()) ? new Date() : parsed;
            }
            return new Date();
        };
        // Sort tracks by creation date (newest first) to ensure proper order
        const sortedTracks = [...tracks].sort((a, b) => toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime());
        set({ tracks: sortedTracks, isLoading: false });
        // Sync with user store after setting tracks
        setTimeout(() => {
            get().syncWithUserStore();
        }, 0);
    },
    addTrack: (track) => {
        set((state) => {
            // Helper function to safely convert to Date for sorting
            const toSafeDate = (dateValue) => {
                if (!dateValue)
                    return new Date();
                if (dateValue instanceof Date)
                    return dateValue;
                if (typeof dateValue === 'string') {
                    const parsed = new Date(dateValue);
                    return isNaN(parsed.getTime()) ? new Date() : parsed;
                }
                return new Date();
            };
            // Insert new track at the beginning to ensure it appears at the top
            const newTracks = [track, ...state.tracks];
            // Sort all tracks by creation date to maintain proper order
            const sortedTracks = [...newTracks].sort((a, b) => toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime());
            return { tracks: sortedTracks };
        });
    },
    updateTrack: (trackId, updates) => {
        set((state) => ({
            tracks: state.tracks.map(track => track.id === trackId ? { ...track, ...updates } : track)
        }));
    },
    toggleLike: (trackId) => {
        set((state) => ({
            tracks: state.tracks.map(track => {
                if (track.id === trackId) {
                    const isLiked = !track.isLiked;
                    // Check if this is the user's own track
                    const userState = useUserStore.getState();
                    const isUserTrack = userState.myTracks.some((t) => t.id === trackId);
                    // Track user activity - if it's their own track, add to notifications as well
                    if (isLiked) {
                        if (isUserTrack) {
                            useActivityStore.getState().addUserActivityAsNotification({
                                type: 'my_like',
                                trackId: track.id,
                                trackTitle: track.title,
                                trackUser: track.user
                            });
                        }
                        else {
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
        const userTrack = userState.myTracks.find((t) => t.id === trackId);
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
                    const isUserTrack = userState.myTracks.some((t) => t.id === trackId);
                    // Track user activity for bookmarks - if it's their own track, add to notifications as well
                    if (isBookmarked) {
                        if (isUserTrack) {
                            useActivityStore.getState().addUserActivityAsNotification({
                                type: 'my_bookmark',
                                trackId: track.id,
                                trackTitle: track.title,
                                trackUser: track.user
                            });
                        }
                        else {
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
        const userTrack = userState.myTracks.find((t) => t.id === trackId);
        // Update user's bookmarked tracks list
        if (userState.isTrackBookmarked(trackId)) {
            userState.unbookmarkTrack(trackId);
        }
        else {
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
                    const isUserTrack = userState.myTracks.some((t) => t.id === trackId);
                    // Track user activity - if it's their own track, add to notifications as well
                    if (isUserTrack) {
                        useActivityStore.getState().addUserActivityAsNotification({
                            type: 'my_comment',
                            trackId: track.id,
                            trackTitle: track.title,
                            trackUser: track.user,
                            commentText
                        });
                    }
                    else {
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
        const userTrack = userState.myTracks.find((t) => t.id === trackId);
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
        const userTrack = userState.myTracks.find((t) => t.id === trackId);
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
            searchFilters: {}
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
    // Load tracks from centralDB
    loadTracksFromDatabase: () => {
        try {
            console.log('FeedStore: Lade Tracks aus Datenbank...');
            const dbTracks = centralDB.getAllTracks();
            console.log('FeedStore: Geladene Tracks:', dbTracks.length, dbTracks.map(t => ({ id: t.id, title: t.title, user: t.user.username })));
            // Process tracks to ensure base64 URLs are preserved
            const processedTracks = dbTracks.map(track => {
                // Log URL type for debugging
                if (track.url?.startsWith('data:audio/')) {
                    console.log('FeedStore: Found base64 audio URL for track:', track.title);
                }
                else if (track.url?.startsWith('blob:')) {
                    console.log('FeedStore: Found blob URL for track:', track.title, '- this will be invalid after page reload');
                }
                return track;
            });
            set({ tracks: processedTracks, isLoading: false });
            console.log('FeedStore: Tracks erfolgreich gesetzt');
            // WICHTIG: Speichere Tracks nicht mehr im localStorage - Datenbank ist die Quelle der Wahrheit
            // localStorage.removeItem('aural-feed-store');
        }
        catch (error) {
            console.error('Fehler beim Laden der Tracks aus der Datenbank:', error);
            set({ tracks: [], isLoading: false });
        }
    },
}), {
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
                // Load tracks from centralDB after rehydration
                setTimeout(() => {
                    const dbTracks = centralDB.getAllTracks();
                    state.setTracks(dbTracks);
                    state.syncWithUserStore();
                }, 0);
            }
        };
    },
}));
