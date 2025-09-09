import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AudioTrack, RecordingState } from '../types';
import { sanitizeAudioTrack, sanitizeUser } from '../utils';
import { useActivityStore } from './activityStore';

interface UserActivity {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'upload';
  trackId?: string;
  fromUserId?: string;
  message?: string;
  createdAt: Date;
  isRead: boolean;
}

interface UserPreferences {
  notifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
  };
  privacy: {
    publicProfile: boolean;
    allowComments: boolean;
  };
  playback: {
    autoplay: boolean;
    volume: number;
  };
}

interface UserStore {
  // State
  currentUser: User | null;
  myTracks: AudioTrack[];
  likedTracks: string[]; // Track IDs
  bookmarkedTracks: string[]; // Track IDs
  followedUsers: string[]; // User IDs
  activities: UserActivity[];
  preferences: UserPreferences;
  
  // Actions
  setCurrentUser: (user: User) => void;
  addMyTrack: (track: AudioTrack) => void;
  updateMyTrack: (trackId: string, updates: Partial<AudioTrack>) => void; // Add updateMyTrack method
  updateProfile: (updates: Partial<User>) => void;
  deleteMyTrack: (trackId: string) => void;
  
  // Track interactions
  likeTrack: (trackId: string) => void;
  unlikeTrack: (trackId: string) => void;
  bookmarkTrack: (trackId: string) => void;
  unbookmarkTrack: (trackId: string) => void;
  
  // User interactions
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  
  // Activity management
  addActivity: (activity: Omit<UserActivity, 'id' | 'createdAt' | 'isRead'>) => void;
  markActivityAsRead: (activityId: string) => void;
  markAllActivitiesAsRead: () => void;
  
  // Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  
  // Utilities
  getUnreadActivityCount: () => number;
  isTrackLiked: (trackId: string) => boolean;
  isTrackBookmarked: (trackId: string) => boolean;
  isUserFollowed: (userId: string) => boolean;
  
  // Admin functions
  filterMyTracksByUser: (userId: string) => void;
  clearAllTracksExceptUser: (userId: string) => void;
  clearAllTracksExceptHoller: () => void;
  
  logout: () => void;
  reset: () => void;
}

interface RecordingStore extends RecordingState {
  // Actions
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  setRecordedBlob: (blob: Blob | null) => void;
  setDuration: (duration: number) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

// Default user for demo
const defaultUser: User = {
  id: 'user-1',
  username: 'you',
  avatar: undefined,
  totalLikes: 0,
  totalUploads: 0,
  bio: 'Voice enthusiast sharing intimate audio experiences',
  createdAt: new Date(),
};

const defaultPreferences: UserPreferences = {
  notifications: {
    likes: true,
    comments: true,
    follows: true,
  },
  privacy: {
    publicProfile: true,
    allowComments: true,
  },
  playback: {
    autoplay: false,
    volume: 0.8,
  },
};

// Custom storage with data sanitization
const createRobustStorage = () => ({
  getItem: (name: string) => {
    try {
      const item = localStorage.getItem(name);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // Sanitize data on retrieval
      if (parsed.state) {
        if (parsed.state.myTracks) {
          parsed.state.myTracks = parsed.state.myTracks.map(sanitizeAudioTrack);
        }
        if (parsed.state.currentUser) {
          parsed.state.currentUser = sanitizeUser(parsed.state.currentUser);
        }
        if (parsed.state.activities) {
          parsed.state.activities = parsed.state.activities.map((activity: any) => ({
            ...activity,
            createdAt: activity.createdAt || new Date()
          }));
        }
      }
      
      return JSON.stringify(parsed);
    } catch (error) {
      console.warn(`Failed to retrieve ${name} from localStorage:`, error);
      return null;
    }
  },
  
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn(`Failed to store ${name} to localStorage:`, error);
    }
  },
  
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn(`Failed to remove ${name} from localStorage:`, error);
    }
  }
});

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      currentUser: defaultUser,
      myTracks: [],
      likedTracks: [],
      bookmarkedTracks: [],
      followedUsers: [],
      activities: [],
      preferences: defaultPreferences,
      
      setCurrentUser: (user) => {
        const sanitizedUser = sanitizeUser(user);
        set({ currentUser: sanitizedUser });
      },
      
      addMyTrack: (track) => {
        const sanitizedTrack = sanitizeAudioTrack({
          ...track,
          createdAt: new Date() // Ensure fresh Date object
        });
        
        set((state) => {
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            totalUploads: state.currentUser.totalUploads + 1
          } : null;
          
          return {
            myTracks: [sanitizedTrack, ...state.myTracks],
            currentUser: updatedUser
          };
        });
        
        // Track upload activity
        useActivityStore.getState().addUserActivityAsNotification({
          type: 'my_upload',
          trackId: sanitizedTrack.id,
          trackTitle: sanitizedTrack.title
        });

      },
      
      updateMyTrack: (trackId, updates) => {
        set((state) => ({
          myTracks: state.myTracks.map(track =>
            track.id === trackId ? { ...track, ...updates } : track
          )
        }));
      },
      
      updateProfile: (updates) => {
        set((state) => {
          // Update the current user
          const updatedUser = state.currentUser ? { ...state.currentUser, ...updates } : null;
          
          // If the username was updated, also update all tracks by this user
          if (updates.username !== undefined && state.currentUser) {
            const updatedTracks = state.myTracks.map(track => ({
              ...track,
              user: {
                ...track.user,
                username: updates.username || track.user.username
              }
            }));
            
            return {
              currentUser: updatedUser,
              myTracks: updatedTracks
            };
          }
          
          return {
            currentUser: updatedUser
          };
        });
      },
      
      deleteMyTrack: (trackId) => {
        set((state) => {
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            totalUploads: Math.max(0, state.currentUser.totalUploads - 1)
          } : null;
          
          return {
            myTracks: state.myTracks.filter(track => track.id !== trackId),
            currentUser: updatedUser
          };
        });
      },
      
      // Track interactions
      likeTrack: (trackId) => {
        set((state) => {
          if (state.likedTracks.includes(trackId)) return state;
          
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            totalLikes: state.currentUser.totalLikes + 1
          } : null;
          
          return {
            likedTracks: [...state.likedTracks, trackId],
            currentUser: updatedUser
          };
        });
      },
      
      unlikeTrack: (trackId) => {
        set((state) => {
          if (!state.likedTracks.includes(trackId)) return state;
          
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            totalLikes: Math.max(0, state.currentUser.totalLikes - 1)
          } : null;
          
          return {
            likedTracks: state.likedTracks.filter(id => id !== trackId),
            currentUser: updatedUser
          };
        });
      },
      
      bookmarkTrack: (trackId) => {
        set((state) => ({
          bookmarkedTracks: state.bookmarkedTracks.includes(trackId) 
            ? state.bookmarkedTracks 
            : [...state.bookmarkedTracks, trackId]
        }));
      },
      
      unbookmarkTrack: (trackId) => {
        set((state) => ({
          bookmarkedTracks: state.bookmarkedTracks.filter(id => id !== trackId)
        }));
      },
      
      // User interactions
      followUser: (userId) => {
        set((state) => ({
          followedUsers: state.followedUsers.includes(userId)
            ? state.followedUsers
            : [...state.followedUsers, userId]
        }));
      },
      
      unfollowUser: (userId) => {
        set((state) => ({
          followedUsers: state.followedUsers.filter(id => id !== userId)
        }));
      },
      
      // Activity management
      addActivity: (activity) => {
        set((state) => ({
          activities: [{
            ...activity,
            id: generateId(),
            createdAt: new Date(),
            isRead: false
          }, ...state.activities]
        }));
      },
      
      markActivityAsRead: (activityId) => {
        set((state) => ({
          activities: state.activities.map(activity => 
            activity.id === activityId 
              ? { ...activity, isRead: true }
              : activity
          )
        }));
      },
      
      markAllActivitiesAsRead: () => {
        set((state) => ({
          activities: state.activities.map(activity => ({ ...activity, isRead: true }))
        }));
      },
      
      // Preferences
      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates }
        }));
      },
      
      // Utilities
      getUnreadActivityCount: () => {
        const state = get();
        return state.activities.filter(activity => !activity.isRead).length;
      },
      
      isTrackLiked: (trackId) => {
        const state = get();
        return state.likedTracks.includes(trackId);
      },
      
      isTrackBookmarked: (trackId) => {
        const state = get();
        return state.bookmarkedTracks.includes(trackId);
      },
      
      isUserFollowed: (userId) => {
        const state = get();
        return state.followedUsers.includes(userId);
      },
      
      // Admin functions
      filterMyTracksByUser: (userId) => {
        set((state) => {
          const filteredTracks = state.myTracks.filter(track => track.user.id === userId);
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            totalUploads: filteredTracks.length
          } : null;
          
          return {
            myTracks: filteredTracks,
            currentUser: updatedUser
          };
        });
      },
      
      clearAllTracksExceptUser: (userId) => {
        set((state) => {
          const filteredTracks = state.myTracks.filter(track => track.user.id === userId);
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            totalUploads: filteredTracks.length
          } : null;
          
          return {
            myTracks: filteredTracks,
            currentUser: updatedUser
          };
        });
      },
      
      clearAllTracksExceptHoller: () => {
        set((state) => {
          const hollaUserId = '4';
          const filteredTracks = state.myTracks.filter(track => track.user.id === hollaUserId);
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            totalUploads: filteredTracks.length
          } : null;
          
          console.log('UserStore: Lösche alle Tracks außer Holler. Vorher:', state.myTracks.length, 'Nachher:', filteredTracks.length);
          
          return {
            myTracks: filteredTracks,
            currentUser: updatedUser
          };
        });
      },
      
      logout: () => {
        set({ 
          currentUser: null, 
          myTracks: [], 
          likedTracks: [],
          bookmarkedTracks: [],
          followedUsers: [],
          activities: [],
          preferences: defaultPreferences
        });
      },
      
      reset: () => {
        set({
          currentUser: defaultUser,
          myTracks: [],
          likedTracks: [],
          bookmarkedTracks: [],
          followedUsers: [],
          activities: [],
          preferences: defaultPreferences
        });
      },
    }),
    {
      name: 'aural-user-store',
      storage: createJSONStorage(() => createRobustStorage()),
      partialize: (state) => ({
        currentUser: state.currentUser,
        myTracks: state.myTracks,
        likedTracks: state.likedTracks,
        bookmarkedTracks: state.bookmarkedTracks,
        followedUsers: state.followedUsers,
        activities: state.activities,
        preferences: state.preferences
      })
    }
  )
);

const recordingInitialState: RecordingState = {
  isRecording: false,
  isPaused: false,
  recordedBlob: null,
  duration: 0,
  isProcessing: false,
};

export const useRecordingStore = create<RecordingStore>()((set) => ({
  ...recordingInitialState,
  
  startRecording: () => {
    set({ isRecording: true, isPaused: false, recordedBlob: null, duration: 0 });
  },
  
  pauseRecording: () => {
    set({ isPaused: true });
  },
  
  resumeRecording: () => {
    set({ isPaused: false });
  },
  
  stopRecording: () => {
    set({ isRecording: false, isPaused: false });
  },
  
  setRecordedBlob: (blob) => {
    set({ recordedBlob: blob });
  },
  
  setDuration: (duration) => {
    set({ duration });
  },
  
  setProcessing: (processing) => {
    set({ isProcessing: processing });
  },
  
  reset: () => {
    set(recordingInitialState);
  },
}));