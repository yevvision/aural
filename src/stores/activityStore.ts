import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NotificationActivity, UserActivity } from '../types';

interface ActivityStore {
  activities: NotificationActivity[];
  unreadCount: number;
  
  // User's own activities
  userActivities: UserActivity[];
  userUnreadCount: number;
  
  // Actions for notifications (from others)
  addActivity: (activity: Omit<NotificationActivity, 'id' | 'createdAt'>) => void;
  markAsRead: (activityId: string) => void;
  markAllAsRead: () => void;
  clearActivities: () => void;
  getActivitiesByType: (type: 'like' | 'comment' | 'follow' | 'bookmark' | 'followed_user_upload' | 'upload') => NotificationActivity[];
  
  // Actions for user's own activities
  addUserActivity: (activity: Omit<UserActivity, 'id' | 'createdAt' | 'isRead'>) => void;
  // New function to add user's own activity to notifications as well
  addUserActivityAsNotification: (activity: Omit<UserActivity, 'id' | 'createdAt' | 'isRead'>) => void;
  markUserActivityAsRead: (activityId: string) => void;
  markAllUserActivitiesAsRead: () => void;
  clearUserActivities: () => void;
  getUserActivitiesByType: (type: 'my_like' | 'my_comment' | 'my_upload' | 'my_bookmark' | 'my_follow') => UserActivity[];
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],
      unreadCount: 0,
      userActivities: [],
      userUnreadCount: 0,
      
      addActivity: (activityData) => {
        const newActivity: NotificationActivity = {
          ...activityData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          isRead: false
        };
        
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100), // Keep only last 100 activities
          unreadCount: state.unreadCount + 1
        }));
      },
      
      markAsRead: (activityId) => {
        set((state) => ({
          activities: state.activities.map(activity =>
            activity.id === activityId && !activity.isRead
              ? { ...activity, isRead: true }
              : activity
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          activities: state.activities.map(activity => ({ ...activity, isRead: true })),
          unreadCount: 0
        }));
      },
      
      clearActivities: () => {
        set({ activities: [], unreadCount: 0 });
      },
      
      getActivitiesByType: (type) => {
        return get().activities.filter(activity => activity.type === type);
      },
      
      // User's own activities
      addUserActivity: (activityData) => {
        const newActivity: UserActivity = {
          ...activityData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          isRead: false
        };
        
        set((state) => ({
          userActivities: [newActivity, ...state.userActivities].slice(0, 100), // Keep only last 100 activities
          userUnreadCount: state.userUnreadCount + 1
        }));
      },
      
      // Function to add user's own activity to notifications as well
      addUserActivityAsNotification: (activityData) => {
        // Add to user's own activities (no notification dot for these)
        const newActivity: UserActivity = {
          ...activityData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          isRead: false
        };
        
        // Also add to notifications with a special type to indicate it's the user's own interaction
        const notificationActivity: NotificationActivity = {
          ...activityData,
          id: 'notification-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          isRead: false,
          user: {
            id: 'self',
            username: 'Du',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date()
          },
          type: activityData.type === 'my_like' ? 'like' : 
                activityData.type === 'my_comment' ? 'comment' : 
                activityData.type === 'my_bookmark' ? 'bookmark' : 
                activityData.type === 'my_upload' ? 'upload' : 'like'
        };
        
        set((state) => ({
          userActivities: [newActivity, ...state.userActivities].slice(0, 100),
          userUnreadCount: state.userUnreadCount + 1,
          // Add to notifications but mark as read immediately to avoid notification dot
          activities: [{ ...notificationActivity, isRead: true }, ...state.activities].slice(0, 100),
          unreadCount: state.unreadCount // Don't increment unread count for user's own activities
        }));
      },
      
      markUserActivityAsRead: (activityId) => {
        set((state) => ({
          userActivities: state.userActivities.map(activity =>
            activity.id === activityId && !activity.isRead
              ? { ...activity, isRead: true }
              : activity
          ),
          userUnreadCount: Math.max(0, state.userUnreadCount - 1)
        }));
      },
      
      markAllUserActivitiesAsRead: () => {
        set((state) => ({
          userActivities: state.userActivities.map(activity => ({ ...activity, isRead: true })),
          userUnreadCount: 0
        }));
      },
      
      clearUserActivities: () => {
        set({ userActivities: [], userUnreadCount: 0 });
      },
      
      getUserActivitiesByType: (type) => {
        return get().userActivities.filter(activity => activity.type === type);
      }
    }),
    {
      name: 'aural-activity-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        activities: state.activities,
        unreadCount: state.unreadCount,
        userActivities: state.userActivities,
        userUnreadCount: state.userUnreadCount
      })
    }
  )
);