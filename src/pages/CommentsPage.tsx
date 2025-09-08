import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, User, Play, Clock, Send, ArrowLeft, Upload, Bookmark, UserPlus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useFeedStore } from '../stores/feedStore';
import { usePlayerStore } from '../stores/playerStore';
import { useActivityStore } from '../stores/activityStore';
import { timeAgo, sanitizeAudioTrack } from '../utils';
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
  const { activities, markAllAsRead, userActivities, markAllUserActivitiesAsRead } = useActivityStore();
  
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'notifications' | 'my_activity'>('notifications'); // Default to notifications
  
  // Load specific track if trackId is provided
  useEffect(() => {
    if (trackId) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        setSelectedTrack(sanitizeAudioTrack(track));
      }
    }
  }, [trackId, tracks]);
  
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

  // Nur externe Benachrichtigungen zählen für die Badge-Anzeige
  const unreadCount = activities.filter(a => !a.isRead).length;
  
  const displayActivities = viewMode === 'notifications' ? activities : userActivities;

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
                  Benachrichtigungen
                </button>
                <button
                  onClick={() => setViewMode('my_activity')}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === 'my_activity'
                      ? 'bg-gradient-primary text-white shadow-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  Meine Aktivitäten
                </button>
              </div>
            </div>
          </RevealOnScroll>

          {/* Activities List - Table Format */}
          <div className="space-y-1">
            {displayActivities.length === 0 ? (
              <RevealOnScroll direction="up" delay={0.1}>
                <div className="text-center py-12">
                  <MessageCircle size={48} className="text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    {viewMode === 'my_activity' ? 'Noch keine eigenen Aktivitäten' : 'Noch keine Benachrichtigungen'}
                  </h3>
                  <p className="text-text-secondary">
                    {viewMode === 'my_activity' 
                      ? 'Wenn du Tracks likest, kommentierst, merkst oder hochlädst, siehst du es hier'
                      : 'Wenn andere mit deinen Aufnahmen interagieren, siehst du es hier'
                    }
                  </p>
                </div>
              </RevealOnScroll>
            ) : (
              <div>
                {displayActivities.map((activity, index) => (
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
                              Du hast
                              {activity.type === 'my_like' && (
                                <>
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-gradient-strong hover:text-gradient-deep transition-colors duration-200 ml-1 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}von{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium hover:text-gradient-strong transition-colors duration-200 cursor-pointer"
                                      >
                                        {activity.trackUser.username}
                                      </span>
                                    </>
                                  )}
                                  {' '}geliked
                                </>
                              )}
                              {activity.type === 'my_comment' && (
                                <>
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-gradient-strong hover:text-gradient-deep transition-colors duration-200 ml-1 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}von{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium hover:text-gradient-strong transition-colors duration-200 cursor-pointer"
                                      >
                                        {activity.trackUser.username}
                                      </span>
                                    </>
                                  )}
                                  {' '}kommentiert
                                </>
                              )}
                              {activity.type === 'my_bookmark' && (
                                <>
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-gradient-strong hover:text-gradient-deep transition-colors duration-200 ml-1 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {activity.trackUser && (
                                    <>
                                      {' '}von{' '}
                                      <span
                                        onClick={() => handleUserClick(activity.trackUser?.id || '')}
                                        className="font-medium hover:text-gradient-strong transition-colors duration-200 cursor-pointer"
                                      >
                                        {activity.trackUser.username}
                                      </span>
                                    </>
                                  )}
                                  {' '}gemerkt
                                </>
                              )}
                              {activity.type === 'my_upload' && (
                                <>
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-gradient-strong hover:text-gradient-deep transition-colors duration-200 ml-1 cursor-pointer"
                                  >
                                    „{activity.trackTitle}"
                                  </span>
                                  {' '}hochgeladen
                                </>
                              )}
                              {activity.type === 'my_follow' && (
                                <>
                                  <span
                                    onClick={() => handleUserClick(activity.followedUser?.id || '')}
                                    className="font-medium hover:text-gradient-strong transition-colors duration-200 ml-1 cursor-pointer"
                                  >
                                    {activity.followedUser?.username}
                                  </span>
                                  {' '}gefolgt
                                </>
                              )}
                            </>
                          ) : (
                            // Notifications from others
                            <>
                              <span
                                onClick={() => handleUserClick((activity as NotificationActivity).user.id)}
                                className="font-medium hover:text-gradient-strong transition-colors duration-200 cursor-pointer"
                              >
                                {(activity as NotificationActivity).user.id === 'self' 
                                  ? 'Du hast' 
                                  : `${(activity as NotificationActivity).user.username}`}
                              </span>
                              {activity.type === 'like' ? ' hat' : 
                               activity.type === 'bookmark' ? ' hat' : 
                               activity.type === 'follow' ? ' folgt dir jetzt' :
                               activity.type === 'followed_user_upload' ? ' hat' :
                               activity.type === 'upload' ? ' hat' : ' hat'}
                              {activity.type !== 'follow' && (
                                <>
                                  {' '}
                                  <span
                                    onClick={() => handleTrackClick(activity.trackId || '')}
                                    className="font-medium text-gradient-strong hover:text-gradient-deep transition-colors duration-200 cursor-pointer"
                                  >
                                    {activity.type === 'followed_user_upload' ? '' : '„'}{activity.trackTitle}{activity.type === 'followed_user_upload' ? '' : '"'}
                                  </span>
                                  {activity.type === 'like' ? ' geliked' : 
                                   activity.type === 'bookmark' ? ' gemerkt' : 
                                   activity.type === 'followed_user_upload' ? ' hochgeladen' :
                                   activity.type === 'upload' ? ' hochgeladen' : ' kommentiert'}
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
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};