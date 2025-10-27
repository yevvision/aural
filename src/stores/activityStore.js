import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isWithinSixMonths } from '../utils/notificationUtils';
export const useActivityStore = create()(persist((set, get) => ({
    activities: [],
    unreadCount: 0,
    userActivities: [],
    userUnreadCount: 0,
    addActivity: (activityData) => {
        const newActivity = {
            ...activityData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            isRead: false
        };
        // Speichere auch in der zentralen Datenbank
        try {
            import('../services/databaseService').then(({ default: DatabaseService }) => {
                DatabaseService.addNotification(newActivity);
                console.log('🔔 ActivityStore: Benachrichtigung in zentrale DB gespeichert:', newActivity.type);
            });
        }
        catch (error) {
            console.error('🔔 ActivityStore: Fehler beim Speichern in zentrale DB:', error);
        }
        set((state) => ({
            activities: [newActivity, ...state.activities].slice(0, 100), // Keep only last 100 activities
            unreadCount: state.unreadCount + 1
        }));
        // Dispatch event to notify navigation about new notification
        window.dispatchEvent(new CustomEvent('newNotification', {
            detail: { type: newActivity.type, id: newActivity.id }
        }));
    },
    markAsRead: (activityId) => {
        set((state) => ({
            activities: state.activities.map(activity => activity.id === activityId && !activity.isRead
                ? { ...activity, isRead: true }
                : activity),
            unreadCount: Math.max(0, state.unreadCount - 1)
        }));
    },
    markAllAsRead: () => {
        set((state) => {
            const updatedActivities = state.activities.map(activity => ({ ...activity, isRead: true }));
            // Speichere auch in der zentralen Datenbank
            try {
                import('../services/databaseService').then(({ default: DatabaseService }) => {
                    updatedActivities.forEach(activity => {
                        DatabaseService.markNotificationAsRead(activity.id);
                    });
                    console.log('🔔 ActivityStore: Alle Notifications in zentrale DB als gelesen markiert');
                    // Trigger a global event to reload data
                    window.dispatchEvent(new CustomEvent('reloadDatabaseData'));
                });
            }
            catch (error) {
                console.error('🔔 ActivityStore: Fehler beim Markieren in zentrale DB:', error);
            }
            // Benachrichtige die Navigation über die Änderung
            window.dispatchEvent(new CustomEvent('notificationsMarkedAsRead', {
                detail: { count: updatedActivities.length }
            }));
            return {
                activities: updatedActivities,
                unreadCount: 0
            };
        });
    },
    clearActivities: () => {
        set({ activities: [], unreadCount: 0 });
    },
    // Remove user's own activities from notifications (they should only be in userActivities)
    removeUserActivitiesFromNotifications: () => {
        set((state) => {
            const filteredActivities = state.activities.filter(activity => activity.user.id !== 'self' && activity.user.username !== 'Du');
            return {
                activities: filteredActivities,
                unreadCount: filteredActivities.filter(a => !a.isRead).length
            };
        });
    },
    getActivitiesByType: (type) => {
        return get().activities.filter(activity => activity.type === type);
    },
    cleanupOldActivities: () => {
        set((state) => {
            const recentActivities = state.activities.filter(activity => isWithinSixMonths(activity.createdAt));
            const recentUserActivities = state.userActivities.filter(activity => isWithinSixMonths(activity.createdAt));
            return {
                activities: recentActivities,
                userActivities: recentUserActivities,
                unreadCount: recentActivities.filter(a => !a.isRead).length,
                userUnreadCount: recentUserActivities.filter(a => !a.isRead).length
            };
        });
    },
    // User's own activities
    addUserActivity: (activityData) => {
        const newActivity = {
            ...activityData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            isRead: false
        };
        // Speichere auch in der zentralen Datenbank
        try {
            import('../services/databaseService').then(({ default: DatabaseService }) => {
                DatabaseService.addUserActivity(newActivity);
                console.log('🔔 ActivityStore: User-Aktivität in zentrale DB gespeichert:', newActivity.type);
            });
        }
        catch (error) {
            console.error('🔔 ActivityStore: Fehler beim Speichern in zentrale DB:', error);
        }
        set((state) => ({
            userActivities: [newActivity, ...state.userActivities].slice(0, 100), // Keep only last 100 activities
            userUnreadCount: state.userUnreadCount + 1
        }));
    },
    // Function to add user's own activity to notifications as well
    addUserActivityAsNotification: (activityData) => {
        // Only add to user's own activities, NOT to notifications
        const newActivity = {
            ...activityData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            isRead: false
        };
        // Speichere auch in der zentralen Datenbank
        try {
            import('../services/databaseService').then(({ default: DatabaseService }) => {
                DatabaseService.addUserActivity(newActivity);
                console.log('🔔 ActivityStore: User-Aktivität (Notification) in zentrale DB gespeichert:', newActivity.type);
            });
        }
        catch (error) {
            console.error('🔔 ActivityStore: Fehler beim Speichern in zentrale DB:', error);
        }
        set((state) => ({
            userActivities: [newActivity, ...state.userActivities].slice(0, 100),
            userUnreadCount: state.userUnreadCount + 1
            // Do NOT add to notifications - only user activities
        }));
    },
    markUserActivityAsRead: (activityId) => {
        set((state) => ({
            userActivities: state.userActivities.map(activity => activity.id === activityId && !activity.isRead
                ? { ...activity, isRead: true }
                : activity),
            userUnreadCount: Math.max(0, state.userUnreadCount - 1)
        }));
    },
    markAllUserActivitiesAsRead: () => {
        set((state) => {
            const updatedUserActivities = state.userActivities.map(activity => ({ ...activity, isRead: true }));
            // Speichere auch in der zentralen Datenbank
            try {
                import('../services/databaseService').then(({ default: DatabaseService }) => {
                    updatedUserActivities.forEach(activity => {
                        DatabaseService.markActivityAsRead(activity.id);
                    });
                    console.log('🔔 ActivityStore: Alle User Activities in zentrale DB als gelesen markiert');
                    // Trigger a global event to reload data
                    window.dispatchEvent(new CustomEvent('reloadDatabaseData'));
                });
            }
            catch (error) {
                console.error('🔔 ActivityStore: Fehler beim Markieren in zentrale DB:', error);
            }
            // Benachrichtige die Navigation über die Änderung
            window.dispatchEvent(new CustomEvent('userActivitiesMarkedAsRead', {
                detail: { count: updatedUserActivities.length }
            }));
            return {
                userActivities: updatedUserActivities,
                userUnreadCount: 0
            };
        });
    },
    clearUserActivities: () => {
        set({ userActivities: [], userUnreadCount: 0 });
    },
    getUserActivitiesByType: (type) => {
        return get().userActivities.filter(activity => activity.type === type);
    }
}), {
    name: 'aural-activity-store',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        activities: state.activities,
        unreadCount: state.unreadCount,
        userActivities: state.userActivities,
        userUnreadCount: state.userUnreadCount
    })
}));
