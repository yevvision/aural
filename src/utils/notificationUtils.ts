import type { NotificationActivity, UserActivity } from '../types';

// Time period grouping utilities
export type TimePeriod = 'this_week' | 'last_week' | 'week_2' | 'week_3' | 'week_4' | 'week_5' | 'month_1' | 'month_2' | 'month_3' | 'month_4' | 'month_5' | 'month_6' | 'older';

export interface GroupedActivities {
  period: TimePeriod;
  label: string;
  activities: (NotificationActivity | UserActivity)[];
  isCollapsed: boolean;
  isDefaultExpanded: boolean;
}

// Check if activity is within 6 months
export const isWithinSixMonths = (createdAt: Date): boolean => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return createdAt >= sixMonthsAgo;
};

// Get time period for an activity
export const getTimePeriod = (createdAt: Date): TimePeriod => {
  const now = new Date();
  const activityDate = new Date(createdAt);
  
  // Calculate start of this week (Monday)
  const thisWeekStart = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days to Monday
  thisWeekStart.setDate(now.getDate() - daysToMonday);
  thisWeekStart.setHours(0, 0, 0, 0);
  
  // Calculate start of last week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  
  // Check if within this week
  if (activityDate >= thisWeekStart) {
    return 'this_week';
  }
  
  // Check if within last week
  if (activityDate >= lastWeekStart) {
    return 'last_week';
  }
  
  // Check last 5 weeks (weeks 2-5)
  for (let week = 2; week <= 5; week++) {
    const weekStart = new Date(lastWeekStart);
    weekStart.setDate(lastWeekStart.getDate() - (week - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    if (activityDate >= weekStart && activityDate < weekEnd) {
      return `week_${week}` as TimePeriod;
    }
  }
  
  // Check last 6 months
  for (let month = 1; month <= 6; month++) {
    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - month);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthStart.getMonth() + 1);
    monthEnd.setDate(1);
    monthEnd.setHours(0, 0, 0, 0);
    
    if (activityDate >= monthStart && activityDate < monthEnd) {
      return `month_${month}` as TimePeriod;
    }
  }
  
  return 'older';
};

// Get display label for time period
export const getTimePeriodLabel = (period: TimePeriod): string => {
  switch (period) {
    case 'this_week':
      return 'Diese Woche';
    case 'last_week':
      return 'Letzte Woche';
    case 'week_2':
      return 'Vor 2 Wochen';
    case 'week_3':
      return 'Vor 3 Wochen';
    case 'week_4':
      return 'Vor 4 Wochen';
    case 'week_5':
      return 'Vor 5 Wochen';
    case 'month_1':
      return 'Vor 1 Monat';
    case 'month_2':
      return 'Vor 2 Monaten';
    case 'month_3':
      return 'Vor 3 Monaten';
    case 'month_4':
      return 'Vor 4 Monaten';
    case 'month_5':
      return 'Vor 5 Monaten';
    case 'month_6':
      return 'Vor 6 Monaten';
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
  // Filter activities within 6 months
  const recentActivities = activities.filter(activity => 
    isWithinSixMonths(activity.createdAt)
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
  const orderedPeriods: TimePeriod[] = [
    'this_week', 'last_week', 'week_2', 'week_3', 'week_4', 'week_5',
    'month_1', 'month_2', 'month_3', 'month_4', 'month_5', 'month_6', 'older'
  ];
  
  return orderedPeriods
    .filter(period => grouped[period] && grouped[period].length > 0)
    .map(period => ({
      period,
      label: getTimePeriodLabel(period),
      activities: grouped[period].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      isCollapsed: collapsedPeriods.has(period),
      isDefaultExpanded: period === 'this_week' // Only this week is expanded by default
    }));
};

// Get total count of activities within 6 months
export const getRecentActivityCount = (activities: (NotificationActivity | UserActivity)[]): number => {
  return activities.filter(activity => isWithinSixMonths(activity.createdAt)).length;
};

// Get unread count for recent activities only
export const getRecentUnreadCount = (activities: (NotificationActivity | UserActivity)[]): number => {
  return activities.filter(activity => 
    !activity.isRead && isWithinSixMonths(activity.createdAt)
  ).length;
};
