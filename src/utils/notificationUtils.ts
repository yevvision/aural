import type { NotificationActivity, UserActivity } from '../types';

// Time period grouping utilities
export type TimePeriod = 'today' | 'yesterday' | 'this_week' | 'older';

export interface GroupedActivities {
  period: TimePeriod;
  label: string;
  activities: (NotificationActivity | UserActivity)[];
  isCollapsed: boolean;
}

// Check if activity is within one week
export const isWithinOneWeek = (createdAt: Date): boolean => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return createdAt >= oneWeekAgo;
};

// Get time period for an activity
export const getTimePeriod = (createdAt: Date): TimePeriod => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay()); // Start of this week (Sunday)
  
  const activityDate = new Date(createdAt);
  const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
  
  if (activityDay.getTime() === today.getTime()) {
    return 'today';
  } else if (activityDay.getTime() === yesterday.getTime()) {
    return 'yesterday';
  } else if (activityDate >= thisWeekStart) {
    return 'this_week';
  } else {
    return 'older';
  }
};

// Get display label for time period
export const getTimePeriodLabel = (period: TimePeriod): string => {
  switch (period) {
    case 'today':
      return 'Heute';
    case 'yesterday':
      return 'Gestern';
    case 'this_week':
      return 'Diese Woche';
    case 'older':
      return 'Älter';
    default:
      return 'Unbekannt';
  }
};

// Group activities by time period
export const groupActivitiesByTime = (
  activities: (NotificationActivity | UserActivity)[],
  collapsedPeriods: Set<TimePeriod> = new Set()
): GroupedActivities[] => {
  // Filter activities within one week
  const recentActivities = activities.filter(activity => 
    isWithinOneWeek(activity.createdAt)
  );
  
  // Group by time period
  const grouped = recentActivities.reduce((acc, activity) => {
    const period = getTimePeriod(activity.createdAt);
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(activity);
    return acc;
  }, {} as Record<TimePeriod, (NotificationActivity | UserActivity)[]>);
  
  // Convert to array with proper ordering
  const orderedPeriods: TimePeriod[] = ['today', 'yesterday', 'this_week', 'older'];
  
  return orderedPeriods
    .filter(period => grouped[period] && grouped[period].length > 0)
    .map(period => ({
      period,
      label: getTimePeriodLabel(period),
      activities: grouped[period].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      isCollapsed: collapsedPeriods.has(period)
    }));
};

// Get total count of activities within one week
export const getRecentActivityCount = (activities: (NotificationActivity | UserActivity)[]): number => {
  return activities.filter(activity => isWithinOneWeek(activity.createdAt)).length;
};

// Get unread count for recent activities only
export const getRecentUnreadCount = (activities: (NotificationActivity | UserActivity)[]): number => {
  return activities.filter(activity => 
    !activity.isRead && isWithinOneWeek(activity.createdAt)
  ).length;
};
