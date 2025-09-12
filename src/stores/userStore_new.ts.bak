import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User, AudioTrack, UserActivity, UserPreferences } from '../types';
import DatabaseService from '../services/databaseService';

// Neuer UserStore - verwendet zentrale Datenbank als einzige Quelle der Wahrheit
interface UserStore {
  // State
  currentUser: User | null;
  myTracks: AudioTrack[];
  likedTracks: AudioTrack[];
  bookmarkedTracks: AudioTrack[];
  activities: UserActivity[];
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentUser: (user: User) => void;
  loadUserData: (userId: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  
  // Track Operations (delegieren an zentrale DB)
  addMyTrack: (track: AudioTrack) => void;
  updateMyTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  deleteMyTrack: (trackId: string) => void;
  
  // User Interactions
  likeTrack: (trackId: string) => void;
  unlikeTrack: (trackId: string) => void;
  bookmarkTrack: (trackId: string) => void;
  unbookmarkTrack: (trackId: string) => void;
  
  // Activity Management
  addActivity: (activity: Omit<UserActivity, 'id' | 'createdAt' | 'isRead'>) => void;
  markActivityAsRead: (activityId: string) => void;
  markAllActivitiesAsRead: () => void;
  
  // Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  
  // Utilities
  isTrackLiked: (trackId: string) => boolean;
  isTrackBookmarked: (trackId: string) => boolean;
  getUnreadActivityCount: () => number;
  
  // Admin functions
  logout: () => void;
  reset: () => void;
}

// Default user for demo
const defaultUser: User = {
  id: 'user-1',
  username: 'yevvo',
  email: 'yevvo@example.com',
  totalLikes: 0,
  totalUploads: 0,
  createdAt: new Date(),
  isVerified: false
};

const defaultPreferences: UserPreferences = {
  notifications: {
    likes: true,
    comments: true,
    follows: true,
    newTracks: true
  },
  privacy: {
    profileVisible: true,
    tracksVisible: true,
    allowComments: true
  }
};

export const useUserStore = create<UserStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial State
        currentUser: defaultUser,
        myTracks: [],
        likedTracks: [],
        bookmarkedTracks: [],
        activities: [],
        preferences: defaultPreferences,
        isLoading: false,
        error: null,
        
        // Actions
        setCurrentUser: (user) => {
          set((state) => {
            state.currentUser = user;
          });
          // Lade User-Daten nach Setzen des aktuellen Users
          get().loadUserData(user.id);
        },
        
        loadUserData: (userId) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            // Lade User-spezifische Daten aus zentraler DB
            const likedTracks = DatabaseService.getUserLikedTracks(userId);
            const bookmarkedTracks = DatabaseService.getUserBookmarkedTracks(userId);
            const activities = DatabaseService.getUserActivities(userId);
            
            // Lade alle Tracks und filtere nach User
            const allTracks = DatabaseService.getTracks(userId);
            const myTracks = allTracks.filter(track => track.user.id === userId);
            
            set((state) => {
              state.myTracks = myTracks;
              state.likedTracks = likedTracks;
              state.bookmarkedTracks = bookmarkedTracks;
              state.activities = activities;
              state.isLoading = false;
            });
            
            console.log('✅ UserStore: User-Daten geladen:', {
              myTracks: myTracks.length,
              likedTracks: likedTracks.length,
              bookmarkedTracks: bookmarkedTracks.length,
              activities: activities.length
            });
          } catch (error) {
            console.error('❌ UserStore: Fehler beim Laden der User-Daten:', error);
            set((state) => {
              state.error = 'Fehler beim Laden der User-Daten';
              state.isLoading = false;
            });
          }
        },
        
        updateProfile: (updates) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;
          
          const updatedUser = { ...currentUser, ...updates };
          set((state) => {
            state.currentUser = updatedUser;
          });
          
          // TODO: Update in zentraler DB
          console.log('👤 UserStore: Profil aktualisiert:', updates);
        },
        
        // Track Operations - delegieren an zentrale DB
        addMyTrack: (track) => {
          console.log('➕ UserStore: addMyTrack()', track.id, track.title);
          
          const success = DatabaseService.addTrack(track);
          if (success) {
            // Lade User-Daten neu nach Track-Hinzufügung
            get().loadUserData(track.user.id);
          }
        },
        
        updateMyTrack: (trackId, updates) => {
          console.log('🔄 UserStore: updateMyTrack()', trackId);
          
          const success = DatabaseService.updateTrack(trackId, updates);
          if (success) {
            // Lade User-Daten neu nach Track-Update
            const currentUser = get().currentUser;
            if (currentUser) {
              get().loadUserData(currentUser.id);
            }
          }
        },
        
        deleteMyTrack: (trackId) => {
          console.log('🗑️ UserStore: deleteMyTrack()', trackId);
          
          const success = DatabaseService.deleteTrack(trackId);
          if (success) {
            // Lade User-Daten neu nach Track-Löschung
            const currentUser = get().currentUser;
            if (currentUser) {
              get().loadUserData(currentUser.id);
            }
          }
        },
        
        // User Interactions - delegieren an zentrale DB
        likeTrack: (trackId) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;
          
          console.log('❤️ UserStore: likeTrack()', trackId);
          get().toggleLike(trackId, currentUser.id);
        },
        
        unlikeTrack: (trackId) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;
          
          console.log('💔 UserStore: unlikeTrack()', trackId);
          get().toggleLike(trackId, currentUser.id);
        },
        
        bookmarkTrack: (trackId) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;
          
          console.log('🔖 UserStore: bookmarkTrack()', trackId);
          get().toggleBookmark(trackId, currentUser.id);
        },
        
        unbookmarkTrack: (trackId) => {
          const currentUser = get().currentUser;
          if (!currentUser) return;
          
          console.log('🔓 UserStore: unbookmarkTrack()', trackId);
          get().toggleBookmark(trackId, currentUser.id);
        },
        
        // Activity Management - delegieren an zentrale DB
        addActivity: (activity) => {
          console.log('📝 UserStore: addActivity()', activity.type);
          
          const success = DatabaseService.addUserActivity(activity);
          if (success) {
            // Lade User-Daten neu nach Activity-Hinzufügung
            const currentUser = get().currentUser;
            if (currentUser) {
              get().loadUserData(currentUser.id);
            }
          }
        },
        
        markActivityAsRead: (activityId) => {
          console.log('📝 UserStore: markActivityAsRead()', activityId);
          
          const success = DatabaseService.markActivityAsRead(activityId);
          if (success) {
            // Lade User-Daten neu nach Activity-Update
            const currentUser = get().currentUser;
            if (currentUser) {
              get().loadUserData(currentUser.id);
            }
          }
        },
        
        markAllActivitiesAsRead: () => {
          console.log('📝 UserStore: markAllActivitiesAsRead()');
          
          const activities = get().activities;
          activities.forEach(activity => {
            if (!activity.isRead) {
              DatabaseService.markActivityAsRead(activity.id);
            }
          });
          
          // Lade User-Daten neu
          const currentUser = get().currentUser;
          if (currentUser) {
            get().loadUserData(currentUser.id);
          }
        },
        
        // Preferences
        updatePreferences: (updates) => {
          set((state) => {
            state.preferences = { ...state.preferences, ...updates };
          });
          console.log('⚙️ UserStore: Preferences aktualisiert:', updates);
        },
        
        // Utilities
        isTrackLiked: (trackId) => {
          return get().likedTracks.some(track => track.id === trackId);
        },
        
        isTrackBookmarked: (trackId) => {
          return get().bookmarkedTracks.some(track => track.id === trackId);
        },
        
        getUnreadActivityCount: () => {
          return get().activities.filter(activity => !activity.isRead).length;
        },
        
        // Admin functions
        logout: () => {
          set((state) => {
            state.currentUser = null;
            state.myTracks = [];
            state.likedTracks = [];
            state.bookmarkedTracks = [];
            state.activities = [];
          });
          console.log('👋 UserStore: User ausgeloggt');
        },
        
        reset: () => {
          set((state) => {
            state.currentUser = defaultUser;
            state.myTracks = [];
            state.likedTracks = [];
            state.bookmarkedTracks = [];
            state.activities = [];
            state.preferences = defaultPreferences;
            state.isLoading = false;
            state.error = null;
          });
          console.log('🔄 UserStore: Store zurückgesetzt');
        }
      })),
      {
        name: 'aural-user-store-new',
        // Nur UI-State und User-Info persistieren, nicht die Tracks (die kommen aus zentraler DB)
        partialize: (state) => ({
          currentUser: state.currentUser,
          preferences: state.preferences
        })
      }
    )
  )
);

// Listener für Datenbank-Änderungen
DatabaseService.addListener(() => {
  console.log('🔄 UserStore: Datenbank-Änderung erkannt, lade User-Daten neu...');
  const currentUser = useUserStore.getState().currentUser;
  if (currentUser) {
    useUserStore.getState().loadUserData(currentUser.id);
  }
});

export default useUserStore;
