import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, X, User, Heart, MessageCircle, Bookmark, Filter, Mic } from 'lucide-react';
import { AudioCard } from '../components/feed/AudioCard';
import { useFeedStore } from '../stores/feedStore';
import { useUserStore } from '../stores/userStore';
import { useDatabaseSync } from '../hooks/useDatabaseSync';
import { Button } from '../components/ui/Button';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';

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

type SearchFilter = 'all' | 'audio' | 'users' | 'tags';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { getTracksSorted } = useDatabaseSync();
  
  useEffect(() => {
    // Always load tracks from database to ensure we have the latest data
    console.log('SearchPage: Loading tracks from database...');
    const dbTracks = getTracksSorted('createdAt', 'desc');
    console.log('SearchPage: Loaded tracks:', dbTracks.length);
    useFeedStore.getState().setTracks(dbTracks);
  }, [getTracksSorted]);
  
  const debouncedSearch = debounce((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      // WICHTIG: Verwende Datenbank-Tracks für Konsistenz
      const dbTracks = getTracksSorted('createdAt', 'desc');
      
      let results = dbTracks.filter(track => {
        const matchesQuery = 
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (track.tags && track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        
        if (activeFilter === 'all') return matchesQuery;
        if (activeFilter === 'audio') return matchesQuery && track.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeFilter === 'users') return matchesQuery && track.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeFilter === 'tags') return matchesQuery && track.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
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
  
  const filters: { key: SearchFilter; label: string; icon?: any }[] = [
    { key: 'all', label: 'All' },
    { key: 'audio', label: 'Audio', icon: Mic },
    { key: 'users', label: 'Users', icon: User },
    { key: 'tags', label: 'Tags' },
  ];
  
  const trendingSearches = ['ASMR', 'Soft', 'Whisper', 'Female', 'Male', 'Gentle'];
  const recentSearches = ['morning voice', 'bedtime story', 'voice note'];
  
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
            <div className="true-black-card text-center">
              <h1 className="text-2xl font-bold text-text-primary mb-2">Search</h1>
              <p className="text-text-secondary">Discover voices and sounds</p>
            </div>
          </RevealOnScroll>
          
          {/* Search Input */}
          <RevealOnScroll direction="up" delay={0.1}>
            <div className="true-black-card space-y-3">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for audio, users, tags..."
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg 
                           text-text-primary placeholder-text-secondary 
                           focus:outline-none focus:border-accent-violet/50 focus:bg-white/10 
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
              
              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/5 rounded-lg 
                           text-text-secondary hover:text-text-primary hover:bg-white/10 
                           transition-all duration-200"
                >
                  <Filter size={16} />
                  <span className="text-sm">Filters</span>
                </button>
                {activeFilter !== 'all' && (
                  <span className="text-xs text-gradient-strong">
                    Filtering by {activeFilter}
                  </span>
                )}
              </div>
              
              {/* Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  {filters.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveFilter(key);
                        if (query) debouncedSearch(query);
                      }}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                        activeFilter === key
                          ? 'bg-gradient-primary text-white'
                          : 'bg-white/10 text-text-secondary hover:bg-white/20 hover:text-text-primary'
                      }`}
                    >
                      {Icon && <Icon size={14} />}
                      <span>{label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
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
                  <div className="true-black-card text-center py-8">
                    <Search size={48} className="text-text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      No results found
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Try searching for something else or adjust your filters
                    </p>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="text-accent-blue hover:text-accent-turquoise transition-colors duration-200"
                    >
                      Clear filters
                    </button>
                  </div>
                </RevealOnScroll>
              ) : (
                <StaggerWrapper className="space-y-2">
                  {searchResults.map((track, index) => (
                    <StaggerItem key={track.id}>
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
              )}

            </div>
          ) : (
            /* Empty State - Trending & Recent */
            <div className="space-y-6">
              {/* Trending Searches */}
              <RevealOnScroll direction="up">
                <div className="true-black-card">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp size={20} className="text-accent-red" />
                    <h2 className="text-lg font-medium text-text-primary">
                      Trending
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="px-3 py-2 bg-gradient-to-r from-accent-red/10 to-accent-violet/10 
                                 border border-accent-red/20 rounded-lg text-text-primary 
                                 hover:from-accent-red/20 hover:to-accent-violet/20 
                                 hover:border-accent-red/40 transition-all duration-200"
                      >
                        #{search}
                      </button>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
              
              {/* Recent Searches */}
              <RevealOnScroll direction="up" delay={0.1}>
                <div className="true-black-card">
                  <h2 className="text-lg font-medium text-text-primary mb-4">
                    Recent
                  </h2>
                  
                  <div className="space-y-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="w-full flex items-center space-x-3 p-3 bg-white/5 rounded-lg 
                                 text-left hover:bg-white/10 transition-all duration-200"
                      >
                        <Search size={16} className="text-text-secondary" />
                        <span className="text-text-primary">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
              
              {/* Coming Soon */}
              <RevealOnScroll direction="up" delay={0.2}>
                <div className="true-black-card text-center py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Enhanced Search Coming Soon
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Advanced filters, voice search, and more discovery features
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};