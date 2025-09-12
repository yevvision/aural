import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Plus } from 'lucide-react';
import { AudioCard } from '../components/feed/AudioCard';
import { useDatabase } from '../hooks/useDatabase';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';

// Gender filters for audio content
const genderFilters = [
  { type: 'all', label: 'All' },
  { type: 'couples', label: 'Couples' },
  { type: 'females', label: 'Females' },
  { type: 'males', label: 'Males' },
  { type: 'diverse', label: 'Diverse' },
];

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('all');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  const [showMoreTags, setShowMoreTags] = useState(false);
  const { tracks, isLoading } = useDatabase('user-1');

  // Extract all unique tags from tracks
  useEffect(() => {
    const tags = new Set<string>();
    tracks.forEach(track => {
      if (track.tags && Array.isArray(track.tags)) {
        track.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tags.add(tag.toLowerCase());
          }
        });
      }
    });
    const sortedTags = Array.from(tags).sort();
    setAllTags(sortedTags);
    setVisibleTags(sortedTags.slice(0, 20));
  }, [tracks]);

  // Filter tracks by gender
  const getFilteredTracks = () => {
    if (selectedGenderFilter === 'all') {
      return tracks; // Show all tracks
    } else if (selectedGenderFilter === 'couples') {
      return tracks.filter(track => 
        track.gender === 'Couple' || 
        (track.tags && track.tags.includes('Couple'))
      );
    } else if (selectedGenderFilter === 'females') {
      return tracks.filter(track => 
        track.gender === 'Female' || 
        (track.tags && track.tags.includes('Female'))
      );
    } else if (selectedGenderFilter === 'males') {
      return tracks.filter(track => 
        track.gender === 'Male' || 
        (track.tags && track.tags.includes('Male'))
      );
    } else if (selectedGenderFilter === 'diverse') {
      return tracks.filter(track => 
        track.gender === 'Diverse' || 
        (track.tags && track.tags.includes('Diverse'))
      );
    }
    return tracks; // Show all if no filter
  };

  const debouncedSearch = debounce((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    setTimeout(() => {
      const filteredTracks = getFilteredTracks();
      let results = filteredTracks.filter(track => {
        const matchesQuery = 
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (track.tags && track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        
        return matchesQuery;
      });
      
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  }, 300);
  
  const handleSearch = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };
  
  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
  };

  const handleGenderFilterChange = (filterType: string) => {
    setSelectedGenderFilter(filterType);
  };

  const loadMoreTags = () => {
    const currentCount = visibleTags.length;
    const nextTags = allTags.slice(currentCount, currentCount + 20);
    setVisibleTags(prev => [...prev, ...nextTags]);
    setShowMoreTags(true);
  };

  const handleTagClick = (tag: string) => {
    handleSearch(tag);
  };
  
  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search Header */}
          <RevealOnScroll direction="up">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary mb-2">Search</h1>
              <p className="text-text-secondary">Discover voices and sounds</p>
            </div>
          </RevealOnScroll>
          
          {/* Search Input */}
          <RevealOnScroll direction="up" delay={0.1}>
            <div className="space-y-3">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for audio, users, tags..."
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg 
                           text-text-primary placeholder-text-secondary 
                           focus:outline-none focus:border-gradient-strong/50 focus:bg-white/10 
                           transition-all duration-200"
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 
                             w-6 h-6 rounded-full bg-white/10 flex items-center justify-center
                             hover:bg-white/20 transition-colors duration-200"
                  >
                    <X size={14} className="text-text-secondary" />
                  </button>
                )}
              </div>
            </div>
          </RevealOnScroll>

          {/* Gender Filter Toggles */}
          <RevealOnScroll direction="up" delay={0.2}>
            <div className="grid grid-cols-5 gap-2">
              {genderFilters.map((filterOption) => (
                <motion.button
                  key={filterOption.type}
                  onClick={() => handleGenderFilterChange(filterOption.type)}
                  className={`w-full px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
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
              ))}
            </div>
          </RevealOnScroll>
          
          {/* Search Results */}
          {query ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-text-primary">
                  {isSearching ? 'Searching...' : `Results for "${query}"`}
                </h2>
                {!isSearching && searchResults.length > 0 && (
                  <span className="text-sm text-text-secondary">
                    {searchResults.length} found
                  </span>
                )}
              </div>
              
              {isSearching ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-gradient-strong border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <RevealOnScroll direction="up">
                  <div className="text-center py-8">
                    <Search size={48} className="text-text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      No results found
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Try searching for something else
                    </p>
                  </div>
                </RevealOnScroll>
              ) : (
                <StaggerWrapper className="space-y-3">
                  {searchResults.map((track, index) => (
                    <StaggerItem key={track.id}>
                      <AudioCard track={track} index={index} />
                    </StaggerItem>
                  ))}
                </StaggerWrapper>
              )}
            </div>
          ) : (
            /* Empty State - Show Tags */
            <div className="space-y-6">
              {/* Tags Section */}
              <RevealOnScroll direction="up">
                <div>
                  <h2 className="text-lg font-medium text-text-primary mb-4">
                    Popular Tags
                  </h2>
                  
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                 text-text-primary hover:bg-white/10 hover:border-gradient-strong/50 
                                 transition-all duration-200"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  
                  {allTags.length > visibleTags.length && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={loadMoreTags}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary/10 
                                 border border-gradient-primary/20 rounded-lg text-gradient-strong 
                                 hover:bg-gradient-primary/20 transition-all duration-200 mx-auto"
                      >
                        <Plus size={16} />
                        <span>Load more tags</span>
                      </button>
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};