import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AudioCard } from '../components/feed/AudioCard';
import { useUserStore } from '../stores/userStore';
import { useDatabase } from '../hooks/useDatabase';
import { useActivityStore } from '../stores/activityStore';
import { 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';

// German spec: Show me filter (Couples, Females, Males)
const genderFilters = [
  { type: 'couples', label: 'Paare' },
  { type: 'females', label: 'Females' },
  { type: 'males', label: 'Males' },
  { type: 'diverse', label: 'Diverse' },
];

// German spec: Feed categories with red sections
const feedCategories = [
  { id: 'new', name: 'Neu', color: 'accent-red' }, // New category
  { id: 'bookmarked', name: 'Gemerkt', color: 'accent-red' }, // Bookmarked category
  { id: 'subscribs', name: 'Subscribs', color: 'accent-red' },
  { id: 'top_rated', name: 'Top Rated', color: 'accent-red' },
  { id: 'most_commented', name: 'Most Commented', color: 'accent-red' },
];

export const FeedPage = () => {
  console.log('FeedPage: Rendering...');
  const { tracks, isLoading } = useDatabase();
  const { followedUsers } = useUserStore();
  const { myTracks } = useUserStore(); // Add user's own tracks
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('couples');
  const navigate = useNavigate();

  // Note: alex_voice is no longer automatically followed


  // Simplified initialization
  useEffect(() => {
    console.log('🎯 FeedPage: Component mounted, tracks werden automatisch geladen...');
    setIsInitialized(true);
  }, []);

  // Debug: Log tracks to see what's loaded
  useEffect(() => {
    console.log('FeedPage tracks:', tracks.map(t => ({ id: t.id, title: t.title, user: t.user?.username })));
    console.log('FeedPage: Anzahl Tracks:', tracks.length);
  }, [tracks]);

  // Debug: Log tracks to see what's loaded
  useEffect(() => {
    console.log('🎯 FeedPage: Tracks haben sich geändert:', tracks.length);
  }, [tracks]);

  // Create notifications for followed users' new uploads
  useEffect(() => {
    if (tracks.length > 0 && followedUsers.length > 0) {
      const { addActivity } = useActivityStore.getState();
      
      // Check for new uploads from followed users
      tracks.forEach(track => {
        if (track.user && followedUsers.includes(track.user.id)) {
          // Check if this is a new upload (created in the last 24 hours)
          const now = new Date();
          const trackDate = new Date(track.createdAt);
          const hoursDiff = (now.getTime() - trackDate.getTime()) / (1000 * 60 * 60);
          const isFutureTrack = trackDate > now;
          
          // For demo purposes, consider tracks as "new" if they're recent or future
          if (hoursDiff < 24 || isFutureTrack) {
            // Check if notification already exists for this track
            const existingNotifications = useActivityStore.getState().activities;
            const notificationExists = existingNotifications.some(activity => 
              activity.type === 'followed_user_upload' && 
              activity.trackId === track.id
            );
            
            if (!notificationExists) {
              addActivity({
                type: 'followed_user_upload',
                user: track.user,
                trackId: track.id,
                trackTitle: track.title,
                isRead: false
              });
            }
          }
        }
      });
    }
  }, [tracks, followedUsers]);

  // Watch for changes in user tracks to update the feed
  useEffect(() => {
    if (isInitialized && myTracks.length > 0) {
      // Add user's own tracks that aren't in feed data
      const userTracksNotInFeed = myTracks.filter(userTrack => 
        !tracks.find(track => track.id === userTrack.id)
      );
      
      if (userTracksNotInFeed.length > 0) {
        const finalTracks = [...userTracksNotInFeed, ...tracks];
        setTracks(finalTracks);
      }
    }
  }, [myTracks, isInitialized, tracks, setTracks]);

  // Fallback: Wenn keine Tracks geladen sind, zeige eine Nachricht
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Inhalte...</p>
        </div>
      </div>
    );
  }

  const handleGenderFilterChange = (filterType: string) => {
    setSelectedGenderFilter(filterType);
    setLoading(true);
    
    // German spec: Filter tracks by gender while preserving user interactions and including user tracks
    setTimeout(() => {
      // Add user's own tracks that aren't in feed data
      const userTracksNotInFeed = myTracks.filter(userTrack => 
        !tracks.find(track => track.id === userTrack.id)
      );
      
      const allTracksWithUser = [...userTracksNotInFeed, ...tracks];
      let filteredTracks = allTracksWithUser;
      
      switch (filterType) {
        case 'couples':
          filteredTracks = allTracksWithUser.filter(track => track.gender === 'Mixed' || track.gender === 'Couple');
          break;
        case 'females':
          filteredTracks = allTracksWithUser.filter(track => track.gender === 'Female');
          break;
        case 'males':
          filteredTracks = allTracksWithUser.filter(track => track.gender === 'Male');
          break;
        case 'diverse':
          filteredTracks = allTracksWithUser.filter(track => track.gender === 'Diverse');
          break;
        default:
          filteredTracks = allTracksWithUser;
      }
      
      setTracks(filteredTracks);
      setLoading(false);
    }, 300);
  };

  // Helper function to safely convert to Date for sorting
  const toSafeDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  };

  // German spec: Get tracks for each category (preview) - using current tracks to preserve bookmarks
  const getCategoryTracks = (categoryId: string, maxItems = 3) => {
    let categoryTracks = [...tracks]; // Use current tracks with preserved state
    
    // Debug: Log all tracks with their dates
    console.log(`=== ${categoryId.toUpperCase()} CATEGORY DEBUG ===`);
    console.log('All tracks before sorting:', tracks.map(t => ({
      id: t.id,
      title: t.title,
      createdAt: t.createdAt,
      createdAtType: typeof t.createdAt,
      user: t.user?.username
    })));
    
    switch (categoryId) {
      case 'new':
        // Show newest uploads - prioritize by creation date (newest first)
        // Create a new sorted array without mutating the original
        categoryTracks = [...tracks]
          .sort((a, b) => toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime());
        break;
      case 'bookmarked':
        // Show only bookmarked tracks, sorted by date (newest first)
        categoryTracks = [...tracks]
          .filter(track => track.isBookmarked)
          .sort((a, b) => toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime());
        break;
      case 'subscribs':
        // Show tracks from followed users, sorted by date (newest first)
        categoryTracks = [...tracks]
          .filter(track => track.user && followedUsers.includes(track.user.id))
          .sort((a, b) => toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime());
        break;
      case 'top_rated':
        // Sort by date first (newest first), then by likes for ties
        categoryTracks = [...tracks].sort((a, b) => {
          const dateDiff = toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime();
          if (dateDiff !== 0) return dateDiff;
          return b.likes - a.likes;
        });
        break;
      case 'most_commented':
        // Sort by date first (newest first), then by comments for ties
        categoryTracks = [...tracks].sort((a, b) => {
          const dateDiff = toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime();
          if (dateDiff !== 0) return dateDiff;
          const aComments = a.commentsCount || 0;
          const bComments = b.commentsCount || 0;
          return bComments - aComments;
        });
        break;
    }
    
    // Debug: Log sorted tracks
    console.log(`Sorted ${categoryId} tracks:`, categoryTracks.slice(0, maxItems).map(t => ({
      id: t.id,
      title: t.title,
      createdAt: t.createdAt,
      user: t.user?.username
    })));
    console.log('=== END DEBUG ===\n');
    
    return categoryTracks.slice(0, maxItems);
  };

  return (
    <div className="w-full">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Enhanced "Show me" Filter tabs with animations - with transparent background */}
        <RevealOnScroll direction="up" className="mb-6">
          <StaggerWrapper className="flex flex-wrap gap-2 overflow-visible">
            {genderFilters.map((filterOption) => (
              <StaggerItem key={filterOption.type} className="flex-none">
                <motion.button
                  onClick={() => handleGenderFilterChange(filterOption.type)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
                    selectedGenderFilter === filterOption.type
                      ? 'bg-gradient-primary text-white'
                      : 'glass-surface text-text-secondary hover:text-text-primary hover:bg-white/15'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <span>{filterOption.label}</span>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerWrapper>
        </RevealOnScroll>

        {/* Enhanced Loading State */}
        {isLoading && (
          <motion.div 
            className="flex justify-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-8 h-8 border-2 border-gradient-strong border-t-transparent rounded-full"
            />
          </motion.div>
        )}

        {/* Enhanced Feed Content with Motion */}
        {!isLoading && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {tracks.length === 0 ? (
              <RevealOnScroll direction="up" delay={0.2}>
                <div className="text-center py-12">
                  <motion.div 
                    className="text-6xl mb-4"
                  >
                    🎙️
                  </motion.div>
                  <h3 className="text-xl font-medium text-text-primary mb-2">
                    Keine Audio-Inhalte gefunden
                  </h3>
                  <p className="text-base text-text-secondary">
                    Sei der Erste, der seine Stimme teilt!
                  </p>
                </div>
              </RevealOnScroll>
            ) : (
              <>
                {/* Enhanced Feed categories with motion - full width with true black cards */}
                <StaggerWrapper delay={0.1}>
                  {feedCategories.map((category, categoryIndex) => {
                    const categoryTracks = getCategoryTracks(category.id);
                    
                    // Only render category if it has tracks
                    if (categoryTracks.length === 0) {
                      return null;
                    }
                    
                    return (
                      <StaggerItem key={category.id}>
                        <RevealOnScroll direction="up" delay={categoryIndex * 0.1}>
                          <div className="space-y-3">
                            {/* Category header - no box, "neu" on left, arrow on right */}
                            <div className="flex items-center justify-between mb-2 mt-1">
                              <span className="text-base text-white flex-grow">
                                {category.id === 'new' ? 'neu' : category.name}
                              </span>
                              <motion.button 
                                onClick={() => navigate(`/category/${category.id}`)}
                                className="flex items-center justify-center w-6 h-6 flex-none"
                                whileHover={{ scale: 1.1, x: 5 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <ChevronRight size={16} className="text-white" />
                              </motion.button>
                            </div>
                            
                            {/* Category tracks with stagger - using true black cards */}
                            <StaggerWrapper className="space-y-1.5">
                              {categoryTracks.map((track, index) => (
                                <StaggerItem key={`${category.id}-${track.id}`}>
                                  <AudioCard 
                                    track={track} 
                                    index={index} 
                                    showDeleteButton={true}
                                    onDelete={(trackId) => {
                                      // Delete from user store
                                      useUserStore.getState().deleteMyTrack(trackId);
                                      // Delete from feed store
                                      useFeedStore.getState().setTracks(
                                        useFeedStore.getState().tracks.filter(t => t.id !== trackId)
                                      );
                                    }}
                                  />
                                </StaggerItem>
                              ))}
                            </StaggerWrapper>
                          </div>
                        </RevealOnScroll>
                      </StaggerItem>
                    );
                  })}
                </StaggerWrapper>
                
                {/* Enhanced info section - true black, full width, no shadow */}
                <RevealOnScroll direction="up" delay={0.4}>
                  <div className="true-black-card">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💡</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Need Help?</h3>
                        <p className="text-base text-white/70">
                          Entdecke neue Stimmen und teile deine eigenen Audio-Aufnahmen!
                        </p>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};