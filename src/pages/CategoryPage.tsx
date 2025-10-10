import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { AudioCard } from '../components/feed/AudioCard';
import { useFeedStore } from '../stores/feedStore';
import { useUserStore } from '../stores/userStore';
import { useDatabaseSync } from '../hooks/useDatabaseSync';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';

// German spec: Category names mapping
const categoryNames = {
  new: 'Neu',
  bookmarked: 'Gemerkt',
  subscribs: 'Subscribs',
  top_rated: 'Top Rated',
  most_commented: 'Most Commented',
};

export const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { tracks } = useFeedStore();
  const { myTracks, followedUsers } = useUserStore();
  const { getTracksSorted } = useDatabaseSync();

  const [isLoading, setIsLoading] = useState(true);
  const [categoryTracks, setCategoryTracks] = useState<any[]>([]);

  // German spec: Load and filter tracks for the specific category from database
  const loadCategoryTracks = () => {
    if (!categoryId) return;
    
    setIsLoading(true);
    
    // WICHTIG: Verwende nur Datenbank-Tracks für Konsistenz mit Admin-Seite
    const allTracks = getTracksSorted('date', 'desc');
    
    console.log('CategoryPage: Lade Tracks aus Datenbank:', allTracks.length);
    console.log('CategoryPage: Tracks:', allTracks.map(t => ({ id: t.id, title: t.title, user: t.user.username })));
    
    // Filtere nur aktive Tracks (nicht in Warteschlange)
    const activeTracks = allTracks.filter(track => !track.status || track.status === 'active');
    let filteredTracks = activeTracks;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    switch (categoryId) {
      case 'new':
        // Show newest uploads (last 7 days)
        filteredTracks = allTracks
          .filter(track => new Date(track.createdAt) > oneWeekAgo)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'bookmarked':
        // Show only bookmarked tracks
        filteredTracks = allTracks.filter(track => track.isBookmarked);
        break;
      case 'subscribs':
        // Show tracks from followed users
        filteredTracks = allTracks.filter(track => track.user && followedUsers.includes(track.user.id));
        break;
      case 'top_rated':
        // Sort by likes
        filteredTracks = [...allTracks].sort((a, b) => b.likes - a.likes);
        break;
      case 'most_commented':
        // Sort by comments
        filteredTracks = [...allTracks].sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
        break;
      default:
        filteredTracks = allTracks;
    }

    // Limit to 20 tracks
    filteredTracks = filteredTracks.slice(0, 20);

    setCategoryTracks(filteredTracks);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCategoryTracks();
  }, [categoryId, getTracksSorted]);

  // WICHTIG: Erzwinge Neuinitialisierung wenn sich die Datenbank ändert
  useEffect(() => {
    console.log('CategoryPage: Datenbank hat sich geändert, lade Tracks neu...');
    if (categoryId) {
      loadCategoryTracks();
    }
  }, [getTracksSorted]); // Removed setTracks and tracks dependencies

  const handleBack = () => {
    navigate(-1);
  };

  if (!categoryId || !categoryNames[categoryId as keyof typeof categoryNames]) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <div className="true-black-card text-center">
            <h2 className="text-lg font-medium text-text-primary mb-2">Category not found</h2>
            <button 
              onClick={() => navigate('/')}
              className="text-accent-blue hover:underline"
            >
              Go back to feed
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 invisible">
          <div className="w-10 h-10" /> {/* Spacer for centering */}
          
          <h1 className="text-lg font-medium text-text-primary">
            {categoryNames[categoryId as keyof typeof categoryNames]}
          </h1>
          
          <div className="w-10 h-10" /> {/* Spacer for centering */}
        </div>

        <div className="px-4 py-6 pb-24">

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Category Tracks */}
          {!isLoading && (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {categoryTracks.length === 0 ? (
                <RevealOnScroll direction="up">
                  <div className="true-black-card text-center py-12">
                    <div className="text-4xl mb-4">🎙️</div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      Keine Audio-Inhalte gefunden
                    </h3>
                    <p className="text-text-secondary">
                      Diese Kategorie enthält noch keine Aufnahmen.
                    </p>
                  </div>
                </RevealOnScroll>
              ) : (
                <StaggerWrapper className="space-y-1.5">
                  {categoryTracks.map((track, index) => (
                    <StaggerItem key={track.id}>
                      <AudioCard 
                        track={track} 
                        index={index} 
                        showDeleteButton={true}
                        onDelete={(trackId) => {
                          // Delete from user store
                          useUserStore.getState().deleteMyTrack(trackId);
                          // Update local state instead of global store
                          setCategoryTracks(prev => prev.filter(t => t.id !== trackId));
                        }}
                      />
                    </StaggerItem>
                  ))}
                </StaggerWrapper>
              )}

            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};