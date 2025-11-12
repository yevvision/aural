import { Play, Pause, Heart, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { useUserStore } from '../../stores/userStore';
import { useDatabase } from '../../hooks/useDatabase';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Body } from '../ui/Typography';
import { DynamicPlayIcon } from '../ui/DynamicPlayIcon';
import { useEffect, useState, useRef } from 'react';

interface MiniPlayerProps {
  displayMode?: 'inline' | 'fixed';
}

// Mini-Player with glassmorphism design and enhanced animations
export const MiniPlayer = ({ displayMode = 'fixed' }: MiniPlayerProps) => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { currentTrack, isPlaying, currentTime, duration, isExpanded, isLoading, setCurrentTrack, reset } = usePlayerStore();
  const { tracks, toggleLike, toggleBookmark } = useDatabase(currentUser?.id);
  const { toggle, seek } = useAudioPlayer();
  
  // Find the current track in the feed store to get the latest like state
  const feedTrack = tracks.find(track => track.id === currentTrack?.id);
  const updatedCurrentTrack = feedTrack ? { ...currentTrack, ...feedTrack } : currentTrack;
  
  // Local state for progress and UI
  const [progressWidth, setProgressWidth] = useState(0);
  const [likeClicked, setLikeClicked] = useState(false);
  const [bookmarkClicked, setBookmarkClicked] = useState(false);
  
  const progressInterval = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const autoCloseTimeout = useRef<number | null>(null);
  
  
  // Calculate progress percentage
  const progressPercent = duration && duration > 0 && typeof currentTime === 'number' 
    ? Math.min(100, (currentTime / duration) * 100) 
    : 0;

  // Update progress bar width and duration display
  useEffect(() => {
    // Clear any existing interval
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
    }
    
    
    // Always update progress immediately based on store values first
    setProgressWidth(progressPercent);
    
    // Start progress update interval when playing
    if (isPlaying) {
      let startTime = currentTime || 0;
      const trackDuration = updatedCurrentTrack?.duration || 0;
      const startTimestamp = Date.now();
      
      // Update progress every 33ms for smooth animation (30fps)
      progressInterval.current = window.setInterval(() => {
        // Calculate elapsed time since interval started
        const elapsed = (Date.now() - startTimestamp) / 1000;
        const estimatedPosition = startTime + elapsed;
        
        // Update progress width
        if (trackDuration > 0) {
          const percent = Math.min(100, (estimatedPosition / trackDuration) * 100);
          setProgressWidth(percent);
        }
      }, 33);
    }
    // When paused, the progress bar should maintain its current position
    // The initial update above already sets the correct position
    
    // Cleanup interval on unmount or when play state changes
    return () => {
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentTime, duration, updatedCurrentTrack, tracks, progressPercent]);

  // Debug logging for progress updates
  useEffect(() => {
    console.log('🎵 MiniPlayer Progress Debug:', {
      isPlaying,
      currentTime,
      duration,
      progressPercent,
      progressWidth
    });
  }, [isPlaying, currentTime, duration, progressPercent, progressWidth]);

  // Auto-close after 30 seconds when audio is finished
  useEffect(() => {
    // Clear any existing timeout
    if (autoCloseTimeout.current) {
      window.clearTimeout(autoCloseTimeout.current);
      autoCloseTimeout.current = null;
    }

    // Check if audio is finished (duration reached and not playing)
    const isAudioFinished = duration && currentTime && duration > 0 && currentTime >= duration && !isPlaying;
    
    if (isAudioFinished) {
      console.log('🎵 Audio finished, starting 30-second auto-close timer');
      // Set timeout to close player after 30 seconds
      autoCloseTimeout.current = window.setTimeout(() => {
        console.log('🎵 Auto-closing player after 30 seconds');
        reset(); // This will stop audio and clear the current track
      }, 30000); // 30 seconds
    }

    // Cleanup timeout on unmount or when conditions change
    return () => {
      if (autoCloseTimeout.current) {
        window.clearTimeout(autoCloseTimeout.current);
        autoCloseTimeout.current = null;
      }
    };
  }, [duration, currentTime, isPlaying, reset]);

  if (!updatedCurrentTrack || isExpanded) return null;

  const handleExpand = () => {
    navigate(`/player/${updatedCurrentTrack.id}`);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!updatedCurrentTrack?.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * updatedCurrentTrack.duration;
    
    // Update local state immediately for responsive feel
    setProgressWidth(percentage * 100);
    seek(newTime);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Like button clicked
    
    // Set like animation state
    setLikeClicked(true);
    
    // Update like in central database
    const success = currentUser?.id ? toggleLike(updatedCurrentTrack.id, currentUser.id) : false;
    // Like result processed
    
    // Keep the animation state for a short duration
    setTimeout(() => setLikeClicked(false), 300);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Bookmark button clicked
    
    // Set bookmark animation state
    setBookmarkClicked(true);
    
    // Update bookmark in central database
    const success = currentUser?.id ? toggleBookmark(updatedCurrentTrack.id, currentUser.id) : false;
    // Bookmark result processed
    
    // Keep the animation state for a short duration
    setTimeout(() => setBookmarkClicked(false), 300);
  };


  // Calculate thumb position based on progress width
  const thumbPosition = `calc(${progressWidth}% - 0px)`;

  return (
    <motion.div
      initial={displayMode === 'fixed' ? { y: 100, opacity: 0 } : {}}
      animate={displayMode === 'fixed' ? { y: 0, opacity: 1 } : {}}
      exit={displayMode === 'fixed' ? { y: 100, opacity: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={displayMode === 'inline' 
        ? "rounded-lg border border-transparent bg-transparent backdrop-blur-none p-2" 
        : "border-none rounded-none border-t border-transparent safe-area-bottom bg-transparent backdrop-blur-none pb-2"
      }
    >
      {/* Progress bar with gradient line instead of circular thumb */}
      <div className={displayMode === 'inline' ? 'pt-2 pb-1' : 'px-4 pt-4 pb-3'}>
        <div 
          ref={progressBarRef}
          className="w-full h-0.5 bg-white/30 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
        >
          {/* Progress fill - red color that accumulates from left to right */}
          <div 
            className="h-full bg-red-500 rounded-full transition-all duration-100"
            style={{ width: `${Math.max(0, progressWidth)}%` }}
          />
          
          {/* Loading animation overlay - subtle shimmer effect */}
          {isLoading && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 h-full w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-bounce" 
                   style={{ 
                     animation: 'shimmer 1.5s ease-in-out infinite',
                     animationDelay: '0.2s'
                   }}></div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        {/* Play/Pause button */}
        <motion.button
          onClick={toggle}
          className="flex items-center justify-center flex-shrink-0 relative"
          style={{ marginLeft: '10px', width: '37px', height: '37px' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <DynamicPlayIcon
            isCurrentTrack={true}
            isPlaying={isPlaying}
            isFinished={false}
            className="w-[37px] h-[37px] text-white"
            variant="white-outline"
          />
        </motion.button>

        {/* Track info with enhanced typography - only in fixed mode */}
        {displayMode === 'fixed' && (
          <div className="flex-1 min-w-0 mx-4 overflow-hidden">
            <div className="whitespace-nowrap">
              <button
                onClick={handleExpand}
                className="text-white text-sm font-medium truncate cursor-pointer hover:text-gray-300 transition-colors text-left w-full"
                aria-label={`Open ${updatedCurrentTrack.title} details`}
              >
                {updatedCurrentTrack.title}
              </button>
            </div>
            <div className="flex items-center space-x-3 text-text-secondary">
              <span className="text-xs text-gray-400">{updatedCurrentTrack.user.username}</span>
            </div>
          </div>
        )}

        {/* Controls on right */}
        <div className="flex items-center space-x-2">
          {/* Like button with enhanced visual feedback */}
          <motion.button
            onClick={handleLike}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              updatedCurrentTrack.isLiked
                ? 'border border-red-500 bg-red-500/20' 
                : 'border border-white hover:border-red-400'
            }`}
            style={{ aspectRatio: '1/1', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={updatedCurrentTrack.isLiked ? 'Unlike' : 'Like'}
            title={updatedCurrentTrack.isLiked ? 'Unlike' : 'Like'}
          >
            <motion.div
              animate={likeClicked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart 
                size={14} 
                className={`transition-all duration-200 ${
                  updatedCurrentTrack.isLiked 
                    ? "fill-red-500 text-red-500" 
                    : "text-white hover:text-red-400"
                }`}
                strokeWidth={1.5}
              />
            </motion.div>
          </motion.button>

          {/* Bookmark button with enhanced visual feedback */}
          <motion.button
            onClick={handleBookmark}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              updatedCurrentTrack.isBookmarked
                ? 'border border-yellow-500 bg-yellow-500/20' 
                : 'border border-white hover:border-yellow-400'
            }`}
            style={{ aspectRatio: '1/1', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={updatedCurrentTrack.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            title={updatedCurrentTrack.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <motion.div
              animate={bookmarkClicked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Bookmark 
                size={14} 
                className={`transition-all duration-200 ${
                  updatedCurrentTrack.isBookmarked 
                    ? "fill-yellow-500 text-yellow-500" 
                    : "text-white hover:text-yellow-400"
                }`}
                strokeWidth={1.5}
              />
            </motion.div>
          </motion.button>

          {/* Expand button */}
          <motion.button
            onClick={handleExpand}
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
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </motion.button>

        </div>
      </div>
    </motion.div>
  );
};