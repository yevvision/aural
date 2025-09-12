import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, User, Play, Clock, Send, ArrowLeft, Upload, Bookmark, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useFeedStore } from '../stores/feedStore';
import { usePlayerStore } from '../stores/playerStore';
import { useActivityStore } from '../stores/activityStore';
import { timeAgo, sanitizeAudioTrack } from '../utils';
import { groupActivitiesByTime, getRecentUnreadCount, type TimePeriod, type GroupedActivities } from '../utils/notificationUtils';
import { Button } from '../components/ui/Button';
import { PageTransition, RevealOnScroll } from '../components/ui';
import type { AudioTrack, NotificationActivity } from '../types';

export const CommentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('trackId');
  
  const { currentUser } = useUserStore();
  const { tracks, addComment } = useFeedStore();
  const { setCurrentTrack } = usePlayerStore();
  const { activities, markAllAsRead, userActivities, markAllUserActivitiesAsRead, removeUserActivitiesFromNotifications, cleanupOldActivities } = useActivityStore();
  
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'notifications' | 'my_activity'>('notifications'); // Default to notifications
  const [collapsedPeriods, setCollapsedPeriods] = useState<Set<TimePeriod>>(new Set()); // Only this_week is expanded by default
  
  // Load specific track if trackId is provided
  useEffect(() => {
    if (trackId) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        setSelectedTrack(sanitizeAudioTrack(track));
      }
    }
  }, [trackId, tracks]);
  
  // Remove user's own activities from notifications and cleanup old activities on component mount
  useEffect(() => {
    removeUserActivitiesFromNotifications();
    cleanupOldActivities();
  }, [removeUserActivitiesFromNotifications, cleanupOldActivities]);
  
  // Mark activities as read when leaving the page (cleanup function)
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts (page change)
      if (viewMode === 'notifications') {
        markAllAsRead();
      } else {
        markAllUserActivitiesAsRead();
      }
    };
  }, [markAllAsRead, markAllUserActivitiesAsRead, viewMode]);
  
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !selectedTrack || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      addComment(selectedTrack.id, commentText.trim());
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackClick = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setCurrentTrack(track);
      navigate(`/player/${trackId}`);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };
  
  const handleBack = () => {
    navigate(-1);
  };

  // Nur externe Benachrichtigungen zählen für die Badge-Anzeige (nur letzte Woche)
  const unreadCount = getRecentUnreadCount(activities);
  
  const displayActivities = viewMode === 'notifications' ? activities : userActivities;
  
  // Group activities by time period
  const groupedActivities = groupActivitiesByTime(displayActivities, collapsedPeriods);
  
  // Initialize collapsed periods based on default expanded state
  useEffect(() => {
    const defaultCollapsed = new Set<TimePeriod>();
    groupedActivities.forEach(group => {
      if (!group.isDefaultExpanded) {
        defaultCollapsed.add(group.period);
      }
    });
    setCollapsedPeriods(defaultCollapsed);
  }, [groupedActivities.length]); // Only run when groups change
  
  // Toggle collapse state for a time period
  const toggleCollapse = (period: TimePeriod) => {
    setCollapsedPeriods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(period)) {
        newSet.delete(period);
      } else {
        newSet.add(period);
      }
      return newSet;
    });
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string, size: number = 16) => {
    const iconProps = { size, className: "text-white" };
    
    switch (type) {
      case 'like':
      case 'my_like':
        return <Heart {...iconProps} />;
      case 'comment':
      case 'my_comment':
        return <MessageCircle {...iconProps} />;
      case 'follow':
      case 'my_follow':
        return <UserPlus {...iconProps} className="text-white" />;
      case 'bookmark':
      case 'my_bookmark':
        return <Bookmark {...iconProps} />;
      case 'my_upload':
        return <Upload {...iconProps} />;
      case 'followed_user_upload':
        return <Upload {...iconProps} />;
      case 'upload':
        return <Upload {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Activity View Toggle - Reorganized with notifications on left and my_activity on right */}
          <RevealOnScroll direction="up">
            <div className="glass-surface rounded-full p-1 mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('notifications')}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === 'notifications'
                      ? 'bg-gradient-primary text-white shadow-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setViewMode('my_activity')}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === 'my_activity'
                      ? 'bg-gradient-primary text-white shadow-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  My Activities
                </button>
              </div>
            </div>
          </RevealOnScroll>

          {/* Activities List - Grouped by Time Period */}
          <div className="space-y-1">
            {groupedActivities.length === 0 ? (
              <RevealOnScroll direction="up" delay={0.1}>
                <div className="text-center py-12">
                  <MessageCircle size={48} className="text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    {viewMode === 'my_activity' ? 'No recent activities' : 'No recent notifications'}
                  </h3>
                  <p className="text-text-secondary">
                    {viewMode === 'my_activity' 
                      ? 'When you like, comment, bookmark or upload tracks, you\'ll see it here'
                      : 'When others interact with your recordings, you\'ll see it here'
                    }
                  </p>
                  <p className="text-text-secondary text-sm mt-2">
                    Only activities from the last 6 months are shown
                  </p>
                </div>
              </RevealOnScroll>
            ) : (
              <div className="space-y-4">
                {groupedActivities.map((group, groupIndex) => (
                  <div key={group.period} className="space-y-2">
                    {/* Time Period Header */}
                    <motion.button
                      onClick={() => toggleCollapse(group.period)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                    >
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {group.label}
                        </h3>
                        <span className="px-2 py-1 bg-gradient-primary/20 text-gradient-strong text-xs font-medium rounded-full">
                          {group.activities.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {group.activities.some(a => !a.isRead) && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                        {group.isCollapsed ? (
                          <ChevronDown size={16} className="text-text-secondary" />
                        ) : (
                          <ChevronUp size={16} className="text-text-secondary" />
                        )}
                      </div>
                    </motion.button>

                    {/* Activities in this period */}
                    {!group.isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1"
                      >
                        {group.activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex items-start space-x-3 py-3 px-2 border-b border-white/10 last:border-b-0 transition-all duration-200 ${
                      viewMode === 'my_activity' 
                        ? 'hover:bg-white/5' 
                        : activity.isRead 
                          ? 'hover:bg-white/5' 
                          : 'bg-gradient-primary/10 border-l-2 border-gradient-primary'
                    }`}
                  >
                      {/* Activity Icon */}
                      <div className="flex-shrink-0 mt-0.5 relative">
                        <div className={`${!activity.isRead && viewMode === 'notifications' ? 'bg-red-500 rounded-full p-1' : ''}`}>
                          {getActivityIcon(activity.type, 16)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-sm leading-tight text-left">
                          {viewMode === 'my_activity' ? (
                            // User's own activities
                            <>
                              You have
                              {activity.type === 'my_like' && (
                                <>
                                  {' '}liked{' '}
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}by{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                      >
                                        {activity.trackUser.username}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                              {activity.type === 'my_comment' && (
                                <>
                                  {' '}commented on{' '}
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}by{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                      >
                                        {activity.trackUser.username}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                              {activity.type === 'my_bookmark' && (
                                <>
                                  {' '}bookmarked{' '}
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}by{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                      >
                                        {activity.trackUser.username}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                              {activity.type === 'my_upload' && (
                                <>
                                  {' '}uploaded{' '}
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                </>
                              )}
                              {activity.type === 'my_follow' && (
                                <>
                                  {' '}started following{' '}
                                  <span
                                    onClick={() => handleUserClick(activity.followedUser?.id || '')}
                                    className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                  >
                                    {activity.followedUser?.username}
                                  </span>
                                </>
                              )}
                            </>
                          ) : (
                            // Notifications from others
                            <>
                              <span
                                onClick={() => handleUserClick((activity as NotificationActivity).user.id)}
                                className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                              >
                                {(activity as NotificationActivity).user.id === 'self' 
                                  ? 'You have' 
                                  : `${(activity as NotificationActivity).user.username}`}
                              </span>
                              {activity.type === 'like' ? ' liked' : 
                               activity.type === 'bookmark' ? ' bookmarked' : 
                               activity.type === 'follow' ? ' is now following you' :
                               activity.type === 'followed_user_upload' ? ' uploaded' :
                               activity.type === 'upload' ? ' uploaded' : ' commented on'}
                              {activity.type !== 'follow' && (
                                <>
                                  {' '}
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-orange-500 hover:text-orange-400 transition-colors duration-200 cursor-pointer"
                                  >
                                    {activity.type === 'followed_user_upload' ? '' : '„'}{activity.trackTitle}{activity.type === 'followed_user_upload' ? '' : '"'}
                                  </span>
                                  {activity.type === 'like' ? ' liked' : 
                                   activity.type === 'bookmark' ? ' bookmarked' : 
                                   activity.type === 'followed_user_upload' ? ' uploaded' :
                                   activity.type === 'upload' ? ' uploaded' : ' commented'}
                                </>
                              )}
                            </>
                          )}
                        </p>

                        {/* Comment text for comments */}
                        {(activity.type === 'comment' || activity.type === 'my_comment') && activity.commentText && (
                          <p className="text-text-secondary text-sm italic mb-5">
                            „{activity.commentText}"
                          </p>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                          <Clock size={10} />
                          <span>{timeAgo(activity.createdAt)}</span>
                          {!activity.isRead && viewMode === 'notifications' && (
                            <span className="w-1.5 h-1.5 bg-gradient-primary rounded-full ml-2"></span>
                          )}
                        </div>
                      </div>
                    </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};