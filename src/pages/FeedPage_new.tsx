import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Heart, Bookmark, MessageCircle, Play, Pause } from 'lucide-react';
import { useFeedStore } from '../stores/feedStore_new';
import { useUserStore } from '../stores/userStore_new';
import { AudioCard } from '../components/feed/AudioCard';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll,
  Button
} from '../components/ui';
import type { AudioTrack } from '../types';

// German specification: Feed filter types
const feedFilters = [
  { type: 'all', label: 'Alle' },
  { type: 'following', label: 'Folge ich' },
  { type: 'trending', label: 'Trending' },
  { type: 'new', label: 'Neu' },
  { type: 'bookmarked', label: 'Gespeichert' }
] as const;

export const FeedPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Neue Stores verwenden
  const { 
    tracks, 
    isLoading, 
    error, 
    currentFilter, 
    loadTracks, 
    setFilter, 
    setSearchQuery: setStoreSearchQuery,
    searchTracks,
    getTracksSorted
  } = useFeedStore();
  
  const { currentUser } = useUserStore();

  // Lade Tracks beim ersten Laden
  useEffect(() => {
    console.log('🎵 FeedPage: Lade Tracks für User:', currentUser?.id);
    loadTracks(currentUser?.id);
  }, [currentUser?.id, loadTracks]);

  // Filtere und sortiere Tracks
  const filteredTracks = (() => {
    let filtered = tracks;

    // Anwenden des aktuellen Filters
    switch (currentFilter) {
      case 'bookmarked':
        filtered = tracks.filter(track => track.isBookmarked);
        break;
      case 'trending':
        filtered = tracks.filter(track => track.likes > 5);
        break;
      case 'new':
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        filtered = tracks.filter(track => new Date(track.createdAt) > oneDayAgo);
        break;
      case 'following':
        // TODO: Implementiere Following-Logik
        filtered = tracks;
        break;
      default:
        filtered = tracks;
    }

    // Suche anwenden
    if (searchQuery.trim()) {
      filtered = searchTracks(searchQuery);
    }

    // Sortierung anwenden
    return getTracksSorted(sortBy, sortOrder);
  })();

  const handleLike = (trackId: string) => {
    if (!currentUser) return;
    console.log('❤️ FeedPage: Like Track:', trackId);
    // Der Store delegiert an die zentrale Datenbank
    useFeedStore.getState().toggleLike(trackId, currentUser.id);
  };

  const handleBookmark = (trackId: string) => {
    if (!currentUser) return;
    console.log('🔖 FeedPage: Bookmark Track:', trackId);
    // Der Store delegiert an die zentrale Datenbank
    useFeedStore.getState().toggleBookmark(trackId, currentUser.id);
  };

  const handleComment = (trackId: string, commentText: string) => {
    if (!currentUser) return;
    console.log('💬 FeedPage: Kommentar hinzufügen:', trackId, commentText.substring(0, 50));
    // Der Store delegiert an die zentrale Datenbank
    useFeedStore.getState().addComment(trackId, commentText, currentUser.id);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setStoreSearchQuery(query);
  };

  const handleFilterChange = (filter: typeof feedFilters[number]['type']) => {
    setFilter(filter);
  };

  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Fehler beim Laden</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <Button 
              onClick={() => loadTracks(currentUser?.id)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Erneut versuchen
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">Audio Feed</h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-white hover:bg-white/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Suche nach Tracks, Benutzern oder Tags..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mt-4 overflow-x-auto">
              {feedFilters.map((filter) => (
                <button
                  key={filter.type}
                  onClick={() => handleFilterChange(filter.type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    currentFilter === filter.type
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm font-medium">Sortieren nach:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white/10 border border-white/20 text-white rounded px-3 py-1 text-sm"
                  >
                    <option value="date">Datum</option>
                    <option value="likes">Likes</option>
                    <option value="title">Titel</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-white/10 border border-white/20 text-white rounded px-3 py-1 text-sm"
                  >
                    <option value="desc">Absteigend</option>
                    <option value="asc">Aufsteigend</option>
                  </select>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Lade Tracks...</p>
              </div>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'Keine Ergebnisse gefunden' : 'Noch keine Tracks'}
              </h3>
              <p className="text-gray-400">
                {searchQuery 
                  ? `Keine Tracks gefunden für "${searchQuery}"`
                  : 'Lade deine ersten Audio-Tracks hoch!'
                }
              </p>
            </div>
          ) : (
            <StaggerWrapper>
              <div className="space-y-6">
                {filteredTracks.map((track, index) => (
                  <StaggerItem key={track.id} index={index}>
                    <RevealOnScroll>
                      <AudioCard
                        track={track}
                        onLike={() => handleLike(track.id)}
                        onBookmark={() => handleBookmark(track.id)}
                        onComment={(commentText) => handleComment(track.id, commentText)}
                        currentUserId={currentUser?.id}
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                ))}
              </div>
            </StaggerWrapper>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default FeedPage;