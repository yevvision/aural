import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
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
import { Button } from '../components/ui/Button';
import { Heading, Body, Caption } from '../components/ui/Typography';
import { MultiToggle } from '../components/ui/Toggle';
import { LiquidGlassHeader } from '../components/ui/LiquidGlassHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LiquidGlassEffect } from '../components/ui/LiquidGlassEffect';

// Gender filters for audio content
const genderFilters = [
  { type: 'all', label: 'All' },
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
  const { currentUser } = useUserStore();
  const { tracks, isLoading, toggleLike, toggleBookmark, addCommentToTrack, loadData, forceAddHollaTracks } = useDatabase(currentUser?.id); // Verwende aktuellen User
  const { followedUsers, myTracks } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('all');
  const navigate = useNavigate();

  // Simplified initialization - NUR EINMAL beim Mount
  useEffect(() => {
    setIsInitialized(true);

    // Höre auf Track-Approval Events
    const handleTrackApproved = (event: CustomEvent) => {
      loadData(); // Lade Daten neu
    };

    window.addEventListener('trackApproved', handleTrackApproved as EventListener);
    
    return () => {
      window.removeEventListener('trackApproved', handleTrackApproved as EventListener);
    };
  }, []); // Leere Dependency-Array um infinite loop zu vermeiden

  // Load data when component mounts
  useEffect(() => {
    if (isInitialized && loadData) {
      loadData();
    }
  }, [isInitialized]); // Entferne loadData aus Dependencies da es jetzt mit useCallback stabilisiert ist

  const handleGenderFilterChange = (value: string) => {
    setSelectedGenderFilter(value);
  };

  const getCategoryTracks = (categoryId: string, maxItems: number = 10) => {
    if (!tracks || tracks.length === 0) return [];
    
    let categoryTracks = [...tracks];
    
    // Apply gender filter
    if (selectedGenderFilter !== 'all') {
      categoryTracks = categoryTracks.filter(track => {
        if (selectedGenderFilter === 'females') return track.gender === 'female';
        if (selectedGenderFilter === 'males') return track.gender === 'male';
        if (selectedGenderFilter === 'couples') return track.gender === 'couple';
        if (selectedGenderFilter === 'diverse') return track.gender === 'diverse';
        return true;
      });
    }
    
    // Category-specific filtering logic
    switch (categoryId) {
      case 'new':
        // Sort by creation date (newest first)
        categoryTracks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'bookmarked':
        // Filter bookmarked tracks
        categoryTracks = categoryTracks.filter(track => track.isBookmarked);
        break;
      case 'subscribs':
        // Filter tracks from followed users
        categoryTracks = categoryTracks.filter(track => 
          followedUsers.some(user => user.id === track.userId)
        );
        break;
      case 'top_rated':
        // Sort by likes (highest first)
        categoryTracks.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'most_commented':
        // Sort by comment count (highest first)
        categoryTracks.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
        break;
      default:
        break;
    }
    
    return categoryTracks.slice(0, maxItems);
  };

  return (
    <div className="w-full">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Concept Explanation Box with Liquid Glass Effect */}
        <RevealOnScroll direction="up" className="mb-6">
              <LiquidGlassEffect
                intensity={0.0}
                chromaticDispersion={0.015}
                borderRadius={16}
                backgroundBlur={30}
                mouseTracking={false}
                className="w-full"
              >
            <div className="rounded-2xl p-6 border-0 text-center">
              <Heading level={1} className="mb-4 text-white font-semibold">
                Hear desire, live fantasy
              </Heading>
              <p className="text-[13px] font-normal leading-relaxed text-white/80 mb-4">
                Aural is the platform for erotic audio. Listen, explore, and publish recordings — 
                anonymous, sensual, and free from images.
              </p>
              
              {/* Demo Button */}
              <Button
                onClick={() => navigate('/demo')}
                variant="ghost"
                size="sm"
                className="text-orange-400 hover:text-orange-300 border border-orange-400/30 hover:border-orange-400/50"
              >
                <Play size={16} className="mr-2" />
                Demo Center
              </Button>
            </div>
          </LiquidGlassEffect>
        </RevealOnScroll>

        {/* Gender Filter as Tabs */}
        <RevealOnScroll direction="up" className="mb-6">
          <div className="tabs-container">
            <Tabs value={selectedGenderFilter} onValueChange={handleGenderFilterChange} className="w-full">
              <LiquidGlassEffect
                intensity={0.0}
                chromaticDispersion={0.015}
                borderRadius={26}
                backgroundBlur={30}
                mouseTracking={false}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5 bg-transparent border-0 rounded-full p-1 h-[53px] items-center justify-center">
                  {genderFilters.map((filter) => (
                      <TabsTrigger
                        key={filter.type}
                        value={filter.type}
                        className="text-[11px] text-white/70 font-normal data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:!font-semibold rounded-full transition-all duration-300 h-[45px] flex items-center justify-center hover:text-white hover:bg-white/20"
                      >
                        {filter.label}
                      </TabsTrigger>
                  ))}
                </TabsList>
              </LiquidGlassEffect>
              {genderFilters.map((filter) => (
                <TabsContent key={filter.type} value={filter.type} className="mt-4">
                </TabsContent>
              ))}
            </Tabs>
          </div>
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
          <StaggerWrapper>
            {feedCategories.map((category, categoryIndex) => {
              const categoryTracks = getCategoryTracks(category.id, 6);
              
              if (categoryTracks.length === 0) return null;
              
              return (
                <StaggerItem key={category.id} index={categoryIndex}>
                  <div className="mb-8">
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full bg-${category.color}`}></div>
                        <span className="category-header-fixed font-normal text-white">
                          {category.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/category/${category.id}`)}
                        className="text-text-secondary"
                      >
                        <ChevronRight size={14} />
                      </Button>
                    </div>

                    {/* Audio Cards Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {categoryTracks.map((track, trackIndex) => (
                        <StaggerItem key={track.id} index={trackIndex}>
                          <AudioCard
                            track={track}
                            onLike={() => toggleLike(track.id)}
                            onBookmark={() => toggleBookmark(track.id)}
                            onComment={(comment) => addCommentToTrack(track.id, comment)}
                            onPlay={() => navigate(`/player/${track.id}`)}
                          />
                        </StaggerItem>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerWrapper>
        )}

        {/* Empty State */}
        {!isLoading && tracks && tracks.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
            </div>
            <Heading level={2} className="mb-2 text-white text-[11px]">
              No tracks yet
            </Heading>
            <Body color="secondary" className="mb-6 text-[11px]">
              Be the first to share your voice and start the conversation.
            </Body>
            <Button
              variant="primary"
              onClick={() => navigate('/record')}
              className="mx-auto"
            >
              Start Recording
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
