import { Clock, Heart, Trash2, User, Play, ExternalLink, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useUserStore } from '../../stores/userStore';
import { useDatabase } from '../../hooks/useDatabase';
import { useFeedStore } from '../../stores/feedStore';
import { formatDuration, sanitizeAudioTrack, sanitizeUser } from '../../utils';
import { debugAudioPlayback } from '../../utils/audioDebug';
import { audioPlaybackFixer } from '../../utils/audioPlaybackFix';
import { AudioUrlManager } from '../../services/audioUrlManager';
import { unifiedAudioManager } from '../../services/unifiedAudioManager';
import { fixAudioUrl, needsUrlFix } from '../../utils/audioUrlFix';
import { Body } from '../ui/Typography';
import { ConfirmationDialog } from '../ui';
import { DynamicPlayIcon } from '../ui/DynamicPlayIcon';
import type { AudioTrack, PlayerVisibilityContext } from '../../types';
import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

interface AudioCardProps {
  track: AudioTrack;
  index?: number;
  showDeleteButton?: boolean;
  onDelete?: (trackId: string) => void;
}

// Enhanced AudioCard with glassmorphism design and animations
// Hilfsfunktion zum Erstellen einer neuen Blob-URL für einen Track
const createNewBlobUrlForTrack = async (track: any): Promise<string | null> => {
  try {
    console.log('🔄 Creating new blob URL for track:', track.id);
    
    // Versuche den ursprünglichen Blob zu finden
    const urlInfo = AudioUrlManager.getUrlInfo(track.id);
    if (urlInfo && urlInfo.originalBlob) {
      console.log('🔍 Found original blob, creating new URL...');
      const newBlobUrl = URL.createObjectURL(urlInfo.originalBlob);
      console.log('✅ New blob URL created:', newBlobUrl);
      return newBlobUrl;
    } else {
      console.log('❌ No original blob found for track:', track.id);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating new blob URL:', error);
    return null;
  }
};

export const AudioCard = ({ track, index = 0, showDeleteButton = false, onDelete }: AudioCardProps) => {
  const { currentTrack, isPlaying, currentTime, duration, isLoading, play, pause, toggle } = useAudioPlayer();
  
  // Lokaler Loading-State nur für diese Card (verhindert UI-Flash)
  const { reset, setCurrentTrack, isFinished } = usePlayerStore(); // Add reset and setCurrentTrack functions from player store
  
  // Ensure isFinished is a boolean
  const safeIsFinished = Boolean(isFinished);
  const { currentUser } = useUserStore();
  const { toggleLike, toggleBookmark } = useDatabase(currentUser?.id); // Verwende aktuellen User für toggleLike und toggleBookmark
  
  // WICHTIG: Hole die neuesten Track-Daten aus dem feedStore, um sicherzustellen, dass Like-Updates angezeigt werden
  const feedStoreTracks = useFeedStore(state => state.tracks);
  const updatedTrackFromStore = feedStoreTracks.find(t => t.id === track.id);
  
  // Verwende den aktualisierten Track aus dem Store, falls vorhanden, sonst den ursprünglichen Prop
  const currentTrackData = updatedTrackFromStore || track;
  const navigate = useNavigate();
  const location = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const audioCardRef = useRef<HTMLDivElement>(null);
  const context = useOutletContext<PlayerVisibilityContext>();
  const visibleAudioCardIds = context?.visibleAudioCardIds || new Set();
  const setVisibleAudioCardIds = context?.setVisibleAudioCardIds || ((update: (prev: Set<string>) => Set<string>) => {});
  const expandedAudioCardId = context?.expandedAudioCardId || null;
  const setExpandedAudioCardId = context?.setExpandedAudioCardId || (() => {});
  
  // Create a unique ID for this card instance
  const cardInstanceId = useRef(`${track.id}-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Use ref to store the latest setVisibleAudioCardIds function to avoid dependency issues
  const setVisibleAudioCardIdsRef = useRef(setVisibleAudioCardIds);
  setVisibleAudioCardIdsRef.current = setVisibleAudioCardIds;

  // Sanitize track and user data
  const safeTrack = sanitizeAudioTrack(currentTrackData);
  
  // Check if this card is expanded (after safeTrack is defined)
  const isExpanded = expandedAudioCardId === safeTrack.id;
  const safeUser = sanitizeUser(currentTrackData.user);

  // Track data available

  const isCurrentTrack = currentTrack?.id === safeTrack.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;
  const isOwnTrack = currentUser?.id === safeTrack.userId || currentUser?.id === safeTrack.user?.id;
  
  // Lokaler Loading-State nur für diese Card
  const isThisCardLoading = isCurrentTrack && isLoading;

  // Format date for display
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Check if we're on a profile page using URL
  const isOnProfilePageByURL = location.pathname.startsWith('/profile');

  // Initialize Intersection Observer and handle visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisibleAudioCardIdsRef.current(prev => {
          const newSet = new Set(prev);
          if (entry.isIntersecting && isCurrentTrack) {
            // Add this card instance to the visible set
            newSet.add(cardInstanceId);
          } else if (!entry.isIntersecting && isCurrentTrack) {
            // Remove this card instance from the visible set
            newSet.delete(cardInstanceId);
          }
          return newSet;
        });
      },
      { threshold: 0.5, rootMargin: "-10px 0px" }
    );
    
    if (audioCardRef.current) {
      observer.observe(audioCardRef.current);
    }
    
    // Cleanup function to remove this card from visibility tracking when unmounted
    return () => {
      observer.disconnect();
      // Remove this card instance from visibility tracking when unmounted
      setVisibleAudioCardIdsRef.current(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardInstanceId);
        return newSet;
      });
    };
  }, [cardInstanceId, isCurrentTrack]);

  // Remove this card instance from visibility tracking when it's no longer the current track
  useEffect(() => {
    if (!isCurrentTrack) {
      setVisibleAudioCardIdsRef.current(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardInstanceId);
        return newSet;
      });
    }
  }, [isCurrentTrack, cardInstanceId]);

  const handleCardClick = async () => {
    // If already expanded, just close it without stopping audio
    if (isExpanded) {
      setExpandedAudioCardId(null);
      return;
    }
    
    // Set this card as expanded (will automatically close other expanded cards)
    setExpandedAudioCardId(safeTrack.id);
    
    // Also play the audio
    // Debug: Zeige Audio-Informationen
    console.log('🎵 AudioCard: Card clicked for track:', safeTrack.title);
    debugAudioPlayback(safeTrack);
    
    // If this is the current track and it's finished, restart it
    if (isCurrentTrack && safeIsFinished) {
      console.log('🎵 AudioCard: Restarting finished track...');
      // Reset the track to restart from beginning
      setCurrentTrack(safeTrack);
      play(safeTrack);
    } else if (isCurrentTrack) {
      // If this is the current track and it's not finished, toggle play/pause
      if (isTrackPlaying) {
        pause();
      } else {
        play(safeTrack);
      }
    } else {
      // PERFORMANCE OPTIMIZATION: Audio nur beim Klick laden!
      console.log('🎵 AudioCard: Starting audio playback...');
      
      // Setze den Track als aktuellen Track (ohne Audio zu laden)
      setCurrentTrack(safeTrack);
      
      // Audio wird erst beim tatsächlichen Play geladen
      play(safeTrack);
    }
  };

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Debug: Zeige Audio-Informationen
    console.log('🎵 AudioCard: Play button clicked for track:', safeTrack.title);
    debugAudioPlayback(safeTrack);
    
    // If this is the current track and it's finished, restart it
    if (isCurrentTrack && safeIsFinished) {
      console.log('🎵 AudioCard: Restarting finished track...');
      // Reset the track to restart from beginning
      setCurrentTrack(safeTrack);
      play(safeTrack);
    } else if (isCurrentTrack) {
      // If this is the current track and it's not finished, toggle play/pause
      if (isTrackPlaying) {
        // Use toggle instead of pause to ensure proper pause behavior
        toggle();
      } else {
        play(safeTrack);
      }
    } else {
      // PERFORMANCE OPTIMIZATION: Audio nur beim Klick laden!
      console.log('🎵 AudioCard: Starting audio playback...');
      
      // Setze den Track als aktuellen Track (ohne Audio zu laden)
      setCurrentTrack(safeTrack);
      
      // Audio wird erst beim tatsächlichen Play geladen
      play(safeTrack);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showDeleteButton) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(safeTrack.id);
    }
  };

  return (
    <>
      <motion.div
        ref={audioCardRef}
        className={`true-black-card cursor-pointer overflow-hidden relative transition-all duration-300 ${
          isExpanded ? 'pb-5' : ''
        }`}
        onClick={handleCardClick}
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          delay: index * 0.05,
          ease: "easeOut"
        }}
        whileHover={{
          y: -2,
          transition: { duration: 0.2 }
        }}
      >
        {/* Action buttons for own tracks - positioned at same height as play button */}
        {showDeleteButton && (
          <div className="absolute top-6 right-4 flex gap-2 z-30 items-center">
            {/* Player button - only show on profile page */}
            {isOnProfilePageByURL && (
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentTrack(safeTrack);
                  navigate(`/player/${safeTrack.id}`);
                }}
                className="w-9 h-9 rounded-full border border-gray-500 hover:border-gray-300 flex items-center justify-center transition-all duration-200 hover:bg-gray-500/10"
                style={{ aspectRatio: '1/1', minWidth: '36px', minHeight: '36px', maxWidth: '36px', maxHeight: '36px' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open in player"
                title="Open in player"
              >
                <ExternalLink size={16} strokeWidth={2} className="text-gray-500 hover:text-gray-300" />
              </motion.button>
            )}
            {/* Delete button */}
            <motion.button
              onClick={handleDeleteClick}
              className="w-9 h-9 rounded-full border border-gray-500 hover:border-red-400 flex items-center justify-center transition-all duration-200 hover:bg-red-500/10"
              style={{ aspectRatio: '1/1', minWidth: '36px', minHeight: '36px', maxWidth: '36px', maxHeight: '36px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Delete recording"
              title="Delete recording"
            >
              <Trash2 size={16} strokeWidth={2} className="text-gray-500 hover:text-red-400" />
            </motion.button>
          </div>
        )}
        
        {/* Top Section - Always visible (Play-Button, Title, Metadata) */}
        <div className="flex items-start space-x-6 relative z-20">
          {/* Dynamic Play Icon - Clickable in expanded state */}
          {isExpanded ? (
            <motion.button
              onClick={handlePlayClick}
              className="w-9 h-9 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isTrackPlaying ? 'Pause' : 'Play'}
              title={isTrackPlaying ? 'Pause' : 'Play'}
            >
              <DynamicPlayIcon
                isCurrentTrack={isCurrentTrack}
                isPlaying={isTrackPlaying}
                isFinished={isCurrentTrack && safeIsFinished}
                className="w-9 h-9 text-[#ff4e3a]"
              />
            </motion.button>
          ) : (
            <DynamicPlayIcon
              isCurrentTrack={isCurrentTrack}
              isPlaying={isTrackPlaying}
              isFinished={isCurrentTrack && safeIsFinished}
              className="w-9 h-9 text-[#ff4e3a]"
            />
          )}
          
          {/* Track info with unified typography */}
          <div className="flex-1 min-w-0">
            {/* Title in white with unified font size */}
            <div className="text-white text-[13px] font-normal mb-1.5 line-clamp-2 leading-tight">
              {safeTrack.title}
            </div>
            
            {/* Metadata in gray with unified font size */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[13px] font-normal text-gray-400">
              {!isOnProfilePageByURL && (
                <Link 
                  to={`/profile/${safeUser.id}`}
                  className="text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <User size={12} strokeWidth={2} />
                  <span>{safeUser.username}</span>
                </Link>
              )}
              
              <div className="flex items-center gap-1">
                <Play 
                  size={13} strokeWidth={2} 
                  className="text-gray-400"
                  fill="none"
                />
                <span className="text-gray-400">{safeTrack.plays || 0}</span>
              </div>
              
              <div 
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (currentUser?.id) {
                    console.log('❤️ AudioCard: Like clicked for track:', safeTrack.id, 'Current likes:', safeTrack.likes, 'isLiked:', safeTrack.isLiked);
                    const success = await toggleLike(safeTrack.id, currentUser.id);
                    console.log('❤️ AudioCard: Like toggle result:', success);
                    // Force re-render by updating local state
                    if (success) {
                      // Der feedStore sollte bereits aktualisiert sein, aber wir können einen kleinen Delay hinzufügen
                      setTimeout(() => {
                        console.log('❤️ AudioCard: Checking updated track after like...');
                      }, 100);
                    }
                  }
                }}
                className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer"
                title={safeTrack.isLiked ? 'Unlike' : 'Like'}
                role="button"
                tabIndex={0}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (currentUser?.id) {
                      console.log('❤️ AudioCard: Like clicked (keyboard) for track:', safeTrack.id);
                      await toggleLike(safeTrack.id, currentUser.id);
                    }
                  }
                }}
              >
                <Heart 
                  size={12} strokeWidth={2} 
                  className={`transition-all ${safeTrack.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  fill={safeTrack.isLiked ? 'currentColor' : 'none'}
                />
                <span className="text-gray-400">
                  {safeTrack.likes || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} strokeWidth={2} />
                <span className="tabular-nums">{formatDuration(safeTrack.duration)}</span>
              </div>
              
            </div>
          </div>
        </div>

        {/* Expanded View - Additional Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="relative z-20 mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Progress Bar */}
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-[#ff4e3a] rounded-full transition-all duration-100"
                  style={{ width: `${Math.max(0, (currentTime || 0) / (duration || 1)) * 100}%` }}
                />
                {/* Loading animation overlay */}
                {isThisCardLoading && duration === 0 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-[#ff4e3a]/20 to-transparent animate-pulse"></div>
                    <div className="absolute inset-0 h-full w-8 bg-gradient-to-r from-transparent via-[#ff4e3a]/40 to-transparent" 
                         style={{ 
                           animation: 'shimmer 1.5s ease-in-out infinite',
                           animationDelay: '0.2s'
                         }}></div>
                  </div>
                )}
              </div>

              {/* Bottom Section - Controls */}
              <div className="flex items-center justify-between">
                {/* Time Display */}
                <div className="text-white text-sm">
                  {formatDuration(currentTime || 0)} / {formatDuration(duration || safeTrack.duration)}
                </div>
                
                {/* Action Buttons - Same as MiniPlayer */}
                <div className="flex items-center space-x-2">
                  {/* Like button with enhanced visual feedback */}
                  <motion.button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (currentUser?.id) {
                        console.log('❤️ AudioCard (expanded): Like clicked for track:', safeTrack.id, 'Current likes:', safeTrack.likes);
                        const success = await toggleLike(safeTrack.id, currentUser.id);
                        console.log('❤️ AudioCard (expanded): Like toggle result:', success);
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      safeTrack.isLiked
                        ? 'border border-red-500 bg-red-500/20' 
                        : 'border border-white hover:border-red-400'
                    }`}
                    style={{ aspectRatio: '1/1', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={safeTrack.isLiked ? 'Unlike' : 'Like'}
                    title={safeTrack.isLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart 
                      size={14} 
                      className={`transition-all duration-200 ${
                        safeTrack.isLiked 
                          ? "fill-red-500 text-red-500" 
                          : "text-white hover:text-red-400"
                      }`}
                      strokeWidth={1.5}
                    />
                  </motion.button>

                  {/* Bookmark button with enhanced visual feedback */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentUser?.id) {
                        toggleBookmark(safeTrack.id, currentUser.id);
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      safeTrack.isBookmarked
                        ? 'border border-yellow-500 bg-yellow-500/20' 
                        : 'border border-white hover:border-yellow-400'
                    }`}
                    style={{ aspectRatio: '1/1', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={safeTrack.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    title={safeTrack.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Bookmark 
                      size={14} 
                      className={`transition-all duration-200 ${
                        safeTrack.isBookmarked 
                          ? "fill-yellow-500 text-yellow-500" 
                          : "text-white hover:text-yellow-400"
                      }`}
                      strokeWidth={1.5}
                    />
                  </motion.button>

                  {/* Expand button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTrack(safeTrack);
                      navigate(`/player/${safeTrack.id}`);
                    }}
                    className="w-8 h-8 rounded-full border border-white flex items-center justify-center"
                    style={{ aspectRatio: '1/1', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Expand player"
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>

      {/* Custom Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recording"
        message={`Do you really want to delete the recording "${safeTrack.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};