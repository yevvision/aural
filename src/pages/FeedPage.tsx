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

// Gender filters for audio content
const genderFilters = [
  { type: 'couples', label: 'Couples' },
  { type: 'females', label: 'Females' },
  { type: 'males', label: 'Males' },
  { type: 'diverse', label: 'Diverse' },
];

// Feed categories with accent colors
const feedCategories = [
  { id: 'new', name: 'New', color: 'accent-red' },
  { id: 'bookmarked', name: 'Bookmarked', color: 'accent-red' },
  { id: 'subscribs', name: 'Following', color: 'accent-red' },
  { id: 'top_rated', name: 'Top Rated', color: 'accent-red' },
  { id: 'most_commented', name: 'Most Commented', color: 'accent-red' },
];

export const FeedPage = () => {
  console.log('🎯 FeedPage: Rendering...');
  const { tracks, isLoading, toggleLike, toggleBookmark, addCommentToTrack } = useDatabase('user-1'); // Verwende aktuellen User
  const { followedUsers, myTracks } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('couples');
  const navigate = useNavigate();

  // Simplified initialization
  useEffect(() => {
    console.log('🎯 FeedPage: Component mounted, tracks werden automatisch geladen...');
    setIsInitialized(true);
  }, []);

  // Debug: Log tracks to see what's loaded
  useEffect(() => {
    console.log('🎯 FeedPage: Tracks aktualisiert:', {
      count: tracks.length,
      tracks: tracks.map(t => ({ id: t.id, title: t.title, user: t.user?.username }))
    });
  }, [tracks]);

  // Create notifications for followed users' new uploads
  useEffect(() => {
    if (tracks.length > 0 && followedUsers.length > 0) {
      const { addActivity } = useActivityStore.getState();
      
      // Find new uploads from followed users (simplified)
      tracks.forEach(track => {
        if (followedUsers.includes(track.user.id)) {
          const isRecentUpload = new Date(track.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
          if (isRecentUpload) {
            addActivity({
              type: 'follow',
              trackId: track.id,
              user: track.user,
              isRead: false
            });
          }
        }
      });
    }
  }, [tracks, followedUsers]);

  // Add user's own tracks to feed to ensure they show up consistently with preserved state
  useEffect(() => {
    if (isInitialized && myTracks.length > 0) {
      console.log('🎯 FeedPage: User hat eigene Tracks:', myTracks.length);
      // User tracks are now automatically included via the central database
    }
  }, [myTracks, isInitialized, tracks]);

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
    console.log('🎯 FeedPage: Gender-Filter geändert zu:', filterType);
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
      user: t.user?.username
    })));
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    switch (categoryId) {
      case 'new':
        // Show tracks from the last week, sorted by date (newest first)
        categoryTracks = tracks
          .filter(track => toSafeDate(track.createdAt) > oneWeekAgo)
          .sort((a, b) => toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime());
        break;
      case 'bookmarked':
        // Show bookmarked tracks, sorted by bookmark date (newest first)
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
        {/* Concept Explanation Box */}
        <RevealOnScroll direction="up" className="mb-6">
          <motion.div 
            className="glass-surface rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <h1 className="text-xl font-bold text-text-primary mb-2">
                Hear desire, live fantasy
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                Aural is the platform for erotic audio. Listen, explore, and publish recordings — 
                anonymous, sensual, and free from images.
              </p>
            </div>
          </motion.div>
        </RevealOnScroll>

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
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🎙️
                  </motion.div>
                  <h3 className="text-xl font-medium text-text-primary mb-2">
                    No audio content found
                  </h3>
                  <p className="text-base text-text-secondary">
                    Be the first to share your voice!
                  </p>
                </div>
              </RevealOnScroll>
            ) : (
              <>
                {/* Enhanced Category Sections with Motion */}
                {feedCategories.map((category, categoryIndex) => {
                  const categoryTracks = getCategoryTracks(category.id);
                  
                  if (categoryTracks.length === 0) return null;
                  
                  return (
                    <RevealOnScroll 
                      key={category.id} 
                      direction="up" 
                      delay={categoryIndex * 0.1}
                      className="space-y-3"
                    >
                      <motion.div 
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: categoryIndex * 0.1 }}
                      >
                        <h2 className="text-lg font-semibold text-text-primary">
                          {category.name}
                        </h2>
                        <motion.button
                          onClick={() => navigate(`/category/${category.id}`)}
                          className="flex items-center text-sm text-text-secondary hover:text-gradient-strong transition-colors"
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          View all
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </motion.button>
                      </motion.div>
                      
                      <StaggerWrapper className="space-y-3">
                        {categoryTracks.map((track, index) => (
                          <StaggerItem key={track.id}>
                            <AudioCard track={track} index={index} />
                          </StaggerItem>
                        ))}
                      </StaggerWrapper>
                    </RevealOnScroll>
                  );
                })}

                {/* Enhanced Show All Tracks Section */}
                <RevealOnScroll direction="up" delay={0.3}>
                  <motion.div 
                    className="border-t border-border-light pt-6 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-text-primary">
                        All Recordings
                      </h2>
                      <span className="text-sm text-text-secondary">
                        {tracks.length} recordings
                      </span>
                    </div>
                    
                    <StaggerWrapper className="space-y-3">
                      {tracks
                        .sort((a, b) => toSafeDate(b.createdAt).getTime() - toSafeDate(a.createdAt).getTime())
                        .map((track, index) => (
                          <StaggerItem key={track.id}>
                            <AudioCard track={track} index={index} />
                          </StaggerItem>
                        ))}
                    </StaggerWrapper>
                  </motion.div>
                </RevealOnScroll>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};