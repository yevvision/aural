import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NotificationActivity, User, AudioTrack } from '../types';

// German spec: Notifications store for Comments/Likes page
interface NotificationsStore {
  // State
  activities: NotificationActivity[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  addActivity: (activity: Omit<NotificationActivity, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (activityId: string) => void;
  markAllAsRead: () => void;
  removeActivity: (activityId: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  
  // German spec: Helper functions
  getLikeActivities: () => NotificationActivity[];
  getCommentActivities: () => NotificationActivity[];
  getFollowActivities: () => NotificationActivity[];
  getActivitiesByType: (type: NotificationActivity['type']) => NotificationActivity[];
  
  // German spec: Batch operations
  addLikeActivity: (user: User, trackId: string, trackTitle: string) => void;
  addCommentActivity: (user: User, trackId: string, trackTitle: string, commentText: string) => void;
  addFollowActivity: (user: User) => void;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const initialState = {
  activities: [],
  unreadCount: 0,
  isLoading: false,
};

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addActivity: (activity) => {
        const newActivity: NotificationActivity = {
          ...activity,
          id: generateId(),
          createdAt: new Date(),
          isRead: false,
        };
        
        set((state) => ({
          activities: [newActivity, ...state.activities],
          unreadCount: state.unreadCount + 1,
        }));
      },
      
      markAsRead: (activityId) => {
        set((state) => {
          const activity = state.activities.find(a => a.id === activityId);
          if (!activity || activity.isRead) return state;
          
          return {
            activities: state.activities.map(a =>
              a.id === activityId ? { ...a, isRead: true } : a
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },
      
      markAllAsRead: () => {
        set((state) => ({
          activities: state.activities.map(a => ({ ...a, isRead: true })),
          unreadCount: 0,
        }));
      },
      
      removeActivity: (activityId) => {
        set((state) => {
          const activity = state.activities.find(a => a.id === activityId);
          const wasUnread = activity && !activity.isRead;
          
          return {
            activities: state.activities.filter(a => a.id !== activityId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },
      
      clearAll: () => {
        set({ activities: [], unreadCount: 0 });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      // German spec: Helper functions
      getLikeActivities: () => {
        const state = get();
        return state.activities.filter(a => a.type === 'like');
      },
      
      getCommentActivities: () => {
        const state = get();
        return state.activities.filter(a => a.type === 'comment');
      },
      
      getFollowActivities: () => {
        const state = get();
        return state.activities.filter(a => a.type === 'follow');
      },
      
      getActivitiesByType: (type) => {
        const state = get();
        return state.activities.filter(a => a.type === type);
      },
      
      // German spec: Convenient methods for adding specific activity types
      addLikeActivity: (user, trackId, trackTitle) => {
        get().addActivity({
          type: 'like',
          user,
          trackId,
          trackTitle,
        });
      },
      
      addCommentActivity: (user, trackId, trackTitle, commentText) => {
        get().addActivity({
          type: 'comment',
          user,
          trackId,
          trackTitle,
          commentText,
        });
      },
      
      addFollowActivity: (user) => {
        get().addActivity({
          type: 'follow',
          user,
        });
      },
    }),
    {
      name: 'aural-notifications-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activities: state.activities,
        unreadCount: state.unreadCount,
        // Don't persist loading state
      }),
    }
  )
);