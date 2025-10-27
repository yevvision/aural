import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, User, Play, Clock, Send, ArrowLeft, Upload, Bookmark, UserPlus, ChevronDown, ChevronUp, Trash2, Bell, Activity } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { usePlayerStore } from '../stores/playerStore';
import { useActivityStore } from '../stores/activityStore';
import { useDatabase } from '../hooks/useDatabase';
import { timeAgo, sanitizeAudioTrack } from '../utils';
import { groupActivitiesByTime, getRecentUnreadCount, type TimePeriod, type GroupedActivities } from '../utils/notificationUtils';
import { Button } from '../components/ui/Button';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { MultiToggle } from '../components/ui/Toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LiquidGlassEffect } from '../components/ui/LiquidGlassEffect';
import type { AudioTrack, NotificationActivity } from '../types';

export const CommentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('trackId');
  
  const { currentUser } = useUserStore();
  const { setCurrentTrack } = usePlayerStore();
  const { activities, markAllAsRead, userActivities, markAllUserActivitiesAsRead, removeUserActivitiesFromNotifications, cleanupOldActivities } = useActivityStore();
  const { tracks, addCommentToTrack, activities: dbActivities, notifications: dbNotifications, isLoading, markNotificationAsRead, markActivityAsRead } = useDatabase(currentUser?.id);
  
  // Verwende Daten aus der zentralen Datenbank
  const userNotifications = dbNotifications || [];
  const userActivitiesFromDB = dbActivities || [];
  
  // Debug-Log für Benachrichtigungen
  console.log('🔔 CommentsPage - DB activities:', userActivitiesFromDB.length);
  console.log('🔔 CommentsPage - DB notifications:', userNotifications.length);
  console.log('🔔 CommentsPage - Current user ID:', currentUser?.id);
  console.log('🔔 CommentsPage - DB notifications:', userNotifications);
  console.log('🔔 CommentsPage - isLoading:', isLoading);
  console.log('🔔 CommentsPage - dbActivities:', dbActivities);
  console.log('🔔 CommentsPage - dbNotifications:', dbNotifications);
  
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

  // Listen for track approval events and database reload events to refresh notifications
  useEffect(() => {
    const handleTrackApproved = (event: CustomEvent) => {
      console.log('📢 Track approved event received:', event.detail);
      // Force re-render by updating a dummy state
      // The useActivityStore will automatically provide the updated activities
    };

    const handleReloadDatabaseData = (event: CustomEvent) => {
      console.log('📢 CommentsPage: Reload database data requested:', event.detail);
      // Force re-render by updating a dummy state
      // The useDatabase hook will automatically provide the updated data
    };

    window.addEventListener('trackApproved', handleTrackApproved as EventListener);
    window.addEventListener('reloadDatabaseData', handleReloadDatabaseData as EventListener);
    
    return () => {
      window.removeEventListener('trackApproved', handleTrackApproved as EventListener);
      window.removeEventListener('reloadDatabaseData', handleReloadDatabaseData as EventListener);
    };
  }, []);
  
  // Mark activities as read when user visits the page and data is loaded
  useEffect(() => {
    // Only run if we have data and there are unread items
    if (viewMode === 'notifications' && userNotifications && userNotifications.length > 0) {
      const unreadNotifications = userNotifications.filter(n => !n.isRead);
      if (unreadNotifications.length > 0) {
        console.log('🔔 CommentsPage: Markiere', unreadNotifications.length, 'Notifications als gelesen');
        
        // Markiere alle Notifications als gelesen in der zentralen Datenbank
        if (markNotificationAsRead) {
          unreadNotifications.forEach(notification => {
            markNotificationAsRead(notification.id);
          });
        }
        // Auch im ActivityStore markieren
        markAllAsRead();
        
        // Dispatch event to notify navigation that notifications were marked as read
        window.dispatchEvent(new CustomEvent('notificationsMarkedAsRead', {
          detail: { count: unreadNotifications.length }
        }));
      }
    } else if (viewMode === 'my_activity' && userActivitiesFromDB && userActivitiesFromDB.length > 0) {
      const unreadActivities = userActivitiesFromDB.filter(a => !a.isRead);
      if (unreadActivities.length > 0) {
        console.log('🔔 CommentsPage: Markiere', unreadActivities.length, 'User Activities als gelesen');
        
        // Markiere alle User Activities als gelesen in der zentralen Datenbank
        if (markActivityAsRead) {
          unreadActivities.forEach(activity => {
            markActivityAsRead(activity.id);
          });
        }
        // Auch im ActivityStore markieren
        markAllUserActivitiesAsRead();
        
        // Dispatch event to notify navigation that user activities were marked as read
        window.dispatchEvent(new CustomEvent('userActivitiesMarkedAsRead', {
          detail: { count: unreadActivities.length }
        }));
      }
    }
  }, [viewMode, userNotifications?.length, userActivitiesFromDB?.length]); // Nur bei Änderung der Datenlänge
  

  
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !selectedTrack || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      const comment = {
        id: Date.now().toString(),
        content: commentText.trim(),
        user: {
          id: currentUser.id,
          username: currentUser.username,
          totalLikes: 0,
          totalUploads: 0,
          createdAt: new Date()
        },
        trackId: selectedTrack.id,
        createdAt: new Date()
      };
      addCommentToTrack(selectedTrack.id, comment);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackClick = (trackId: string) => {
    console.log('🎵 handleTrackClick called with trackId:', trackId);
    console.log('🎵 Available tracks:', tracks.length);
    console.log('🎵 Track IDs:', tracks.map(t => t.id));
    
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      console.log('✅ Track found, setting current track and navigating');
      setCurrentTrack(track);
      navigate(`/player/${trackId}`);
    } else {
      console.log('❌ Track not found in tracks list');
      // Fallback: Navigiere trotzdem zum Player, falls der Track in der URL verfügbar ist
      console.log('🔄 Fallback: Navigating to player page anyway');
      navigate(`/player/${trackId}`);
    }
  };

  const handleTrackClickWithRejectionCheck = (trackId: string, activityType: string) => {
    console.log('🔍 handleTrackClickWithRejectionCheck called:', { trackId, activityType });
    
    // Prüfe ob es sich um einen abgelehnten Upload handelt
    if (activityType === 'upload_rejected' || activityType === 'my_upload_rejected') {
      // Für abgelehnte Uploads: Keine Navigation, nur orange Anzeige
      console.log('Track is rejected, not navigating to player');
      return;
    }
    
    // Für alle anderen Tracks: Normale Navigation
    console.log('✅ Track is approved, navigating to player');
    handleTrackClick(trackId);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };
  
  const handleBack = () => {
    navigate(-1);
  };

  // Nur externe Benachrichtigungen zählen für die Badge-Anzeige (nur letzte Woche)
  const unreadCount = getRecentUnreadCount(userNotifications);
  
  const displayActivities = viewMode === 'notifications' ? userNotifications : userActivitiesFromDB;
  
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
      case 'upload_approved':
        return <Upload {...iconProps} />;
      case 'upload_rejected':
      case 'my_upload_rejected':
        return <Upload {...iconProps} />;
      case 'my_delete':
        return <Trash2 {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  // Show loading state if data is still loading or no current user
  if (isLoading || !currentUser) {
    return (
      <PageTransition>
        <div className="news-page-background max-w-md mx-auto px-4 py-6 pb-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-text-secondary">
                {!currentUser ? 'Benutzer wird geladen...' : 'Lade Benachrichtigungen...'}
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="news-page-background max-w-md mx-auto px-4 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Activity View Tabs - Reorganized with notifications on left and my_activity on right */}
          <RevealOnScroll direction="up" className="mb-6">
            <div className="tabs-container">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "notifications" | "my_activity")} className="w-full">
                <LiquidGlassEffect
                  intensity={0.0}
                  chromaticDispersion={0.015}
                  borderRadius={26}
                  backgroundBlur={30}
                  mouseTracking={false}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-transparent border-0 rounded-full p-1 h-[53px] items-center justify-center">
                    <TabsTrigger
                      value="notifications"
                      className="text-[11px] text-white/70 font-normal data-[state=active]:!bg-[#ff4e3a] data-[state=active]:!text-white data-[state=active]:!font-semibold rounded-full transition-all duration-300 h-[45px] flex items-center justify-center hover:text-white hover:bg-white/20"
                    >
                      <Bell size={14} className="mr-1.5" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger
                      value="my_activity"
                      className="text-[11px] text-white/70 font-normal data-[state=active]:!bg-[#ff4e3a] data-[state=active]:!text-white data-[state=active]:!font-semibold rounded-full transition-all duration-300 h-[45px] flex items-center justify-center hover:text-white hover:bg-white/20"
                    >
                      <Activity size={14} className="mr-1.5" />
                      My Activities
                    </TabsTrigger>
                  </TabsList>
                </LiquidGlassEffect>
                <TabsContent value="notifications" className="mt-4">
                </TabsContent>
                <TabsContent value="my_activity" className="mt-4">
                </TabsContent>
              </Tabs>
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
                    className="flex items-start space-x-3 py-3 px-2 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-all duration-200"
                  >
                      {/* Activity Icon */}
                      <div className="flex-shrink-0 mt-0.5 relative">
                        {getActivityIcon(activity.type, 16)}
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
                                    onClick={() => handleTrackClickWithRejectionCheck(activity.trackId || '', activity.type)}
                                    className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}by{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
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
                                    onClick={() => handleTrackClickWithRejectionCheck(activity.trackId || '', activity.type)}
                                    className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}by{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
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
                                    onClick={() => handleTrackClickWithRejectionCheck(activity.trackId || '', activity.type)}
                                    className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}by{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
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
                                    onClick={() => handleTrackClickWithRejectionCheck(activity.trackId || '', activity.type)}
                                    className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
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
                                    className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
                                  >
                                    {activity.followedUser?.username}
                                  </span>
                                </>
                              )}
                              {activity.type === 'my_upload_rejected' && (
                                <>
                                  {' '}upload was rejected:{' '}
                                  <span className="font-medium text-[#ff4e3a]">
                                    „{activity.trackTitle}"
                                  </span>
                                </>
                              )}
                              {activity.type === 'my_delete' && (
                                <>
                                  {' '}deleted{' '}
                                  <span className="font-medium text-[#ff4e3a]">
                                    „{activity.trackTitle}"
                                  </span>
                                </>
                              )}
                            </>
                          ) : (
                            // Notifications from others
                            <>
                              {activity.type === 'upload_approved' ? (
                                <>
                                  Your upload{' '}
                                  <span
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🖱️ Click on upload_approved track:', activity.trackTitle, 'ID:', activity.trackId);
                                      handleTrackClickWithRejectionCheck(activity.trackId || '', activity.type);
                                    }}
                                    className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {' '}was approved
                                </>
                              ) : activity.type === 'upload_rejected' ? (
                                <>
                                  Your upload{' '}
                                  <span className="font-medium text-[#ff4e3a]">
                                    „{activity.trackTitle}"
                                  </span>
                                  {' '}was rejected
                                </>
                              ) : (
                                <>
                                  <span
                                    onClick={() => handleUserClick((activity as NotificationActivity).user.id)}
                                    className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
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
                                        onClick={() => handleTrackClickWithRejectionCheck(activity.trackId || '', activity.type)}
                                        className="font-medium text-[#ff4e3a] hover:text-[#ff4e3a] transition-colors duration-200 cursor-pointer"
                                      >
                                        {activity.type === 'followed_user_upload' ? '' : '„'}{activity.trackTitle}{activity.type === 'followed_user_upload' ? '' : '"'}
                                      </span>
                                    </>
                                  )}
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
                          <Clock size={10} strokeWidth={2} />
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