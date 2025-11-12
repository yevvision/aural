import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play, Star, Bookmark, Users, TrendingUp, MessageCircle, Plus, Circle, Heart, User, UserCheck, Users2, Search, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AudioCard } from '../components/feed/AudioCard';
import { TopAccountsCarousel } from '../components/feed/TopAccountsCarousel';
import { useUserStore } from '../stores/userStore';
import { useFeedStore } from '../stores/feedStore';
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
import { AllGendersIcon, FemalesIcon, MalesIcon, DiverseIcon } from '../components/icons/GenderIcons';
import { VoidOfSoundIcon } from '../components/icons/VoidOfSoundIcon';

// Gender filters for audio content
const genderFilters = [
  { type: 'all', label: 'All genders', icon: AllGendersIcon },
  { type: 'females', label: 'Females', icon: FemalesIcon },
  { type: 'males', label: 'Males', icon: MalesIcon },
  { type: 'diverse', label: 'Diverse', icon: DiverseIcon },
];

// Feed categories - wie im Screenshot
const feedCategories = [
  { 
    id: 'new', 
    name: 'New', 
    color: 'accent-red',
    gradient: 'bg-red-900/95',
    icon: Star
  },
  { 
    id: 'bookmarked', 
    name: 'Bookmarked', 
    color: 'accent-red',
    gradient: 'bg-red-900/95',
    icon: Bookmark
  },
  { 
    id: 'subscribs', 
    name: 'Following', 
    color: 'accent-red',
    gradient: 'bg-red-900/95',
    icon: Users
  },
  { 
    id: 'top_rated', 
    name: 'Most Liked', 
    color: 'accent-red',
    gradient: 'bg-red-900/95',
    icon: Heart
  },
  { 
    id: 'most_commented', 
    name: 'Most Commented', 
    color: 'accent-red',
    gradient: 'bg-red-900/95',
    icon: MessageCircle
  },
];

export const FeedPage = () => {
  const { currentUser } = useUserStore();
  const { tracks, isLoading, toggleLike, toggleBookmark, addCommentToTrack, loadTracksFromDatabase } = useFeedStore();
  const { loadData, forceAddHollaTracks } = useDatabase(currentUser?.id);
  const { followedUsers, myTracks } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('new');
  const [visibleCards, setVisibleCards] = useState<number>(0);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isClearingSearch, setIsClearingSearch] = useState(false);
  const isClearingSearchRef = useRef(false);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);

  // Simplified initialization - NUR EINMAL beim Mount
  useEffect(() => {
    setIsInitialized(true);

    // Höre auf Track-Approval Events
    const handleTrackApproved = (event: CustomEvent) => {
      console.log('🔄 FeedPage: Track approved event received, reloading data...');
      loadTracksFromDatabase(); // Lade Daten neu
    };

    window.addEventListener('trackApproved', handleTrackApproved as EventListener);
    
    return () => {
      window.removeEventListener('trackApproved', handleTrackApproved as EventListener);
    };
  }, []); // Leere Dependency-Array um infinite loop zu vermeiden

  // Load data when component mounts - NUR EINMAL
  useEffect(() => {
    if (isInitialized && loadTracksFromDatabase) {
      console.log('🔄 FeedPage: Loading data on mount...');
      loadTracksFromDatabase();
    }
  }, [isInitialized, loadTracksFromDatabase]);

  // Sequenzielles Laden der Karten nach dem Datenladen
  useEffect(() => {
    if (!isLoading && tracks && tracks.length > 0) {
      setIsLoadingCards(true);
      setVisibleCards(0);
      
      // Lade Karten sequenziell - max 10 im Viewport
      const loadCardsSequentially = async () => {
        const maxCards = Math.min(10, tracks.length);
        
        for (let i = 0; i < maxCards; i++) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Reduzierte Verzögerung für flüssigeres Laden
          setVisibleCards(i + 1);
        }
        
        setIsLoadingCards(false);
      };
      
      loadCardsSequentially();
    }
  }, [isLoading, tracks]);

  const handleGenderFilterChange = (value: string) => {
    setSelectedGenderFilter(value);
  };

  const handleCategoryFilterChange = (value: string) => {
    setSelectedCategoryFilter(value);
  };

  // Funktion zum automatischen Scrollen beim Fokus auf die Suchleiste
  const scrollToSearchOnMobile = () => {
    // Verwende doppeltes requestAnimationFrame für zuverlässiges Timing beim ersten Laden
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (searchInputRef.current && headlineRef.current) {
          const headlineElement = headlineRef.current;
          const searchElement = searchInputRef.current;
          
          // Warte noch einen Frame für bessere Position-Erkennung beim ersten Laden
          setTimeout(() => {
            const headlineRect = headlineElement.getBoundingClientRect();
            const searchRect = searchElement.getBoundingClientRect();
            const currentScrollY = window.pageYOffset || window.scrollY;
            
            // Berechne absolute Positionen im Dokument
            const headlineBottom = headlineRect.bottom + currentScrollY;
            const searchTop = searchRect.top + currentScrollY;
            
            // Ziel: Scroll so weit, dass die Headline komplett außerhalb des Viewports ist
            // Die Suchleiste soll dabei gut sichtbar sein (mit 20px Padding oben)
            // Scroll mindestens so weit, dass headlineBottom oberhalb des Viewports ist
            const targetScroll = Math.max(
              searchTop - 20, // Position der Suchleiste mit etwas Abstand oben
              headlineBottom + 20 // Mindestens Headline-Höhe + Padding
            );
            
            window.scrollTo({
              top: targetScroll - 10, // 10px weniger scrollen
              behavior: 'smooth'
            });
          }, 50); // Kurze Verzögerung für zuverlässige Position beim ersten Laden
        }
      });
    });
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Schließe Dropdown wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.gender-dropdown')) {
        setIsGenderDropdownOpen(false);
      }
    };

    if (isGenderDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGenderDropdownOpen]);

  // Berechne die meist genutzten Tags
  const getMostUsedTags = (limit: number = 15) => {
    if (!tracks || tracks.length === 0) return [];
    
    // Zähle die Häufigkeit jedes Tags
    const tagCounts = new Map<string, number>();
    
    tracks.forEach(track => {
      if (track.tags && Array.isArray(track.tags)) {
        track.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const normalizedTag = tag.toLowerCase();
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
          }
        });
      }
    });
    
    // Sortiere nach Häufigkeit und gib die Top-Tags zurück
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  };

  const getCategoryTracks = (categoryId: string, maxItems: number = 10) => {
    if (!tracks || tracks.length === 0) return [];
    
    // Erstelle eine Kopie der Tracks und dedupliziere sie basierend auf ID
    const uniqueTracks = tracks.reduce((acc: any[], track) => {
      if (!acc.find(t => t.id === track.id)) {
        acc.push(track);
      }
      return acc;
    }, []);
    
    let categoryTracks = [...uniqueTracks];
    
    // Apply gender filter
    if (selectedGenderFilter !== 'all') {
      categoryTracks = categoryTracks.filter(track => {
        if (selectedGenderFilter === 'females') return track.gender === 'Female';
        if (selectedGenderFilter === 'males') return track.gender === 'Male';
        if (selectedGenderFilter === 'diverse') return track.gender === 'Diverse';
        return true;
      });
    }

    // Apply tag filter (AND-logic: track must contain ALL selected tags)
    if (selectedTags.length > 0) {
      categoryTracks = categoryTracks.filter(track => 
        selectedTags.every(selectedTag => 
          track.tags?.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
        )
      );
    }

    // Apply search filter
    if (searchQuery.trim() && selectedTags.length === 0) {
      const query = searchQuery.toLowerCase().trim();
      categoryTracks = categoryTracks.filter(track => 
        track.title?.toLowerCase().includes(query) ||
        track.description?.toLowerCase().includes(query) ||
        track.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        track.user?.username?.toLowerCase().includes(query)
      );
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
          followedUsers.some(userId => userId === track.user.id)
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
    
    // Lazy Loading: Nur sichtbare Karten zurückgeben
    return categoryTracks.slice(0, Math.min(maxItems, visibleCards));
  };

  return (
    <div className="w-full">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Main Headline - ohne Kasten */}
        <RevealOnScroll direction="up" className="mb-8">
          <div ref={headlineRef} className="text-center">
            <h1 className="text-3xl text-white leading-tight mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400 }}>
              See less. Feel more.
            </h1>
            <h2 className="text-3xl text-white leading-tight mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400 }}>
              Real and anonymous
            </h2>
            <h3 className="text-3xl text-white leading-tight" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400 }}>
              erotic audio
            </h3>
          </div>
        </RevealOnScroll>

        {/* Gender Dropdown und Suchleiste mit Glasmorphismus */}
        <RevealOnScroll direction="up" className="mb-4">
          <div className="space-y-3">
            {/* Erste Reihe: Gender Dropdown und Suchleiste */}
            <div className="flex gap-3">
              {/* Gender Dropdown */}
              <div className="relative flex-shrink-0 gender-dropdown">
                <LiquidGlassEffect
                  intensity={0.0}
                  chromaticDispersion={0.015}
                  borderRadius={30}
                  backgroundBlur={20}
                  mouseTracking={false}
                  className={isSearchFocused ? '' : 'min-w-[140px]'}
                >
                  <button
                    onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full text-white hover:bg-white/10 transition-all duration-200 w-full h-12 ${isSearchFocused ? 'justify-center' : ''}`}
                  >
                    {(() => {
                      const selectedFilter = genderFilters.find(f => f.type === selectedGenderFilter);
                      const FilterIcon = selectedFilter?.icon || AllGendersIcon;
                      return <FilterIcon size={20} />;
                    })()}
                    {!isSearchFocused && (
                      <span className="text-sm">
                        {genderFilters.find(f => f.type === selectedGenderFilter)?.label || 'All genders'}
                      </span>
                    )}
                    <ChevronDown size={14} className={`${isSearchFocused ? '' : 'ml-auto'}`} />
                  </button>
                </LiquidGlassEffect>
                
                {/* Dropdown Menu */}
                {isGenderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden z-50">
                    {genderFilters.map((filter) => {
                      const FilterIcon = filter.icon;
                      return (
                        <button
                          key={filter.type}
                          onClick={() => {
                            handleGenderFilterChange(filter.type);
                            setIsGenderDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors duration-200 ${
                            selectedGenderFilter === filter.type ? 'text-white bg-white/5' : 'text-white/70'
                          }`}
                        >
                          <FilterIcon size={20} />
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Suchleiste */}
              <div className="flex-1 relative">
                <LiquidGlassEffect
                  intensity={0.0}
                  chromaticDispersion={0.015}
                  borderRadius={30}
                  backgroundBlur={20}
                  mouseTracking={false}
                  className="w-full"
                >
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        setIsSearchFocused(true);
                        scrollToSearchOnMobile();
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          if (!isClearingSearchRef.current && searchQuery.trim()) {
                            const query = searchQuery.trim();
                            setSelectedTags(prev => {
                              if (!prev.includes(query)) {
                                return [query, ...prev];
                              }
                              return prev;
                            });
                            setSearchQuery('');
                          }
                          setIsSearchFocused(false);
                        }, 400);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          const query = searchQuery.trim();
                          setSelectedTags(prev => {
                            if (!prev.includes(query)) {
                              return [query, ...prev];
                            }
                            return prev;
                          });
                          setSearchQuery('');
                        }
                      }}
                      placeholder="What are you into?"
                      className="w-full pl-10 pr-10 py-3 rounded-full text-white placeholder-white/50 focus:outline-none focus:bg-white/10 transition-all duration-200 bg-transparent h-12"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          isClearingSearchRef.current = true;
                          setIsClearingSearch(true);
                          setSearchQuery('');
                          setTimeout(() => {
                            isClearingSearchRef.current = false;
                            setIsClearingSearch(false);
                          }, 300);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </LiquidGlassEffect>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Popular Tags - anzeigen wenn Suche fokussiert ist oder Tags ausgewählt */}
        {(isSearchFocused || selectedTags.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-3"
          >
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 px-1 py-2">
                {(() => {
                  const allTags = getMostUsedTags(15);
                  // Manuelle Tags (nicht in allTags) kommen immer zuerst
                  const manualTags = selectedTags.filter(tag => !allTags.includes(tag));
                  // Ausgewählte Tags aus der Liste
                  const selectedTagsList = selectedTags.filter(tag => allTags.includes(tag));
                  // Nicht ausgewählte Tags
                  const unselectedTagsList = allTags.filter(tag => !selectedTags.includes(tag));
                  const sortedTags = [...manualTags, ...selectedTagsList, ...unselectedTagsList];
                  
                  return sortedTags.map((tag, index) => {
                    const isSelected = selectedTags.includes(tag);
                    const isManual = manualTags.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleTagToggle(tag)}
                        className={`shrink-0 px-4 py-2 h-12 rounded-full text-sm whitespace-nowrap transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
                          isSelected 
                            ? 'text-orange-400' 
                            : 'text-white/80 hover:text-white'
                        }`}
                        style={{ backgroundColor: '#0f0f0f' }}
                      >
                        <span>{isManual ? `"${tag}"` : `#${tag}`}</span>
                        {isSelected && (
                          <X size={14} className="shrink-0" />
                        )}
                      </motion.button>
                    );
                  });
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Kurations-Buttons mit Glasmorphismus */}
        <RevealOnScroll direction="up" className="mb-[70px]">
          <div className="overflow-x-auto scrollbar-hide px-1 py-1">
            <div className="flex space-x-2 min-w-max">
              {feedCategories.map((category) => {
                const isActive = selectedCategoryFilter === category.id;
                return (
                  <LiquidGlassEffect
                    key={category.id}
                    intensity={0.0}
                    chromaticDispersion={0.015}
                    borderRadius={30}
                    backgroundBlur={20}
                    mouseTracking={false}
                    className="flex-shrink-0"
                  >
                    <button
                      onClick={() => handleCategoryFilterChange(category.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap w-full h-12
                        ${isActive 
                          ? 'text-white font-bold bg-white/20 border border-white' 
                          : 'bg-transparent text-white/70 hover:text-white border border-transparent'
                        }
                      `}
                    >
                      <category.icon size={16} strokeWidth={2} />
                      {category.name}
                    </button>
                  </LiquidGlassEffect>
                );
              })}
            </div>
          </div>
        </RevealOnScroll>

        {/* Enhanced Loading State - nur beim ersten Laden */}
        {isLoading && tracks.length === 0 && (
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


        {/* Enhanced Feed Content with Motion - Show only selected category */}
        {(!isLoading || tracks.length > 0) && (
          <StaggerWrapper>
            {(() => {
              const selectedCategory = feedCategories.find(cat => cat.id === selectedCategoryFilter);
              const categoryTracks = getCategoryTracks(selectedCategoryFilter, 20);
              
              if (!selectedCategory || categoryTracks.length === 0) {
                return (
                  <StaggerItem>
                    <div className="text-center py-16 -mt-[50px]">
                      <div className="mb-6 flex items-center justify-center">
                        <VoidOfSoundIcon size={96} color="#ffffff" />
                      </div>
                      <h3 className="text-white text-xl font-normal mb-2">Void of sound. No audio yet.</h3>
                    </div>
                  </StaggerItem>
                );
              }
              
              return (
                <StaggerItem>
                  <div className="mb-8">
                    {/* Audio Cards Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Erste 5 Audio-Cards */}
                      {categoryTracks.slice(0, 5).map((track, trackIndex) => (
                        <StaggerItem key={`${track.id}-${selectedCategory.id}-${trackIndex}`}>
                          <AudioCard
                            track={track}
                            index={trackIndex}
                          />
                        </StaggerItem>
                      ))}
                      
                      {/* Top Accounts Carousel - nach den ersten 5 Audio-Cards */}
                      {categoryTracks.length >= 5 && (
                        <StaggerItem>
                          <TopAccountsCarousel />
                        </StaggerItem>
                      )}
                      
                      {/* Restliche Audio-Cards */}
                      {categoryTracks.slice(5).map((track, trackIndex) => (
                        <StaggerItem key={`${track.id}-${selectedCategory.id}-${trackIndex + 5}`}>
                          <AudioCard
                            track={track}
                            index={trackIndex + 5}
                          />
                        </StaggerItem>
                      ))}
                      
                      {/* Placeholder-Karten für stabile Höhe - nur anzeigen wenn noch Karten geladen werden */}
                      {isLoadingCards && categoryTracks.length < 6 && (
                        <>
                          {Array.from({ length: 6 - categoryTracks.length }).map((_, placeholderIndex) => (
                            <div 
                              key={`placeholder-${placeholderIndex}`}
                              className="true-black-card h-24 flex items-center justify-center opacity-20"
                            >
                              {/* Leere Placeholder ohne Animationen */}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })()}
          </StaggerWrapper>
        )}

        {/* Empty State */}
        {!isLoading && tracks && tracks.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 flex items-center justify-center">
              <VoidOfSoundIcon size={96} color="#ffffff" />
            </div>
            <h3 className="text-white text-xl font-normal mb-2">Void of sound. No audio yet.</h3>
          </motion.div>
        )}
      </div>
    </div>
  );
};
