import { Play, Pause, Heart, Clock, Bookmark, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { useUserStore } from '../../stores/userStore';
import { useDatabase } from '../../hooks/useDatabase';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Body } from '../ui/Typography';
import { useEffect, useState, useRef } from 'react';

interface MiniPlayerProps {
  displayMode?: 'inline' | 'fixed';
}

// Mini-Player with glassmorphism design and enhanced animations
export const MiniPlayer = ({ displayMode = 'fixed' }: MiniPlayerProps) => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { currentTrack, isPlaying, currentTime, duration, isExpanded, setCurrentTrack, reset } = usePlayerStore();
  const { tracks, toggleLike, toggleBookmark } = useDatabase(currentUser?.id);
  const { toggle, seek } = useAudioPlayer();
  
  // Find the current track in the feed store to get the latest like state
  const feedTrack = tracks.find(track => track.id === currentTrack?.id);
  const updatedCurrentTrack = feedTrack ? { ...currentTrack, ...feedTrack } : currentTrack;
  
  // Local state for progress and UI
  const [progressWidth, setProgressWidth] = useState(0);
  const [displayDuration, setDisplayDuration] = useState('0:00');
  const [likeClicked, setLikeClicked] = useState(false);
  const [bookmarkClicked, setBookmarkClicked] = useState(false);
  
  const progressInterval = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Format duration to MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
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
    
    // Set initial duration display
    if (updatedCurrentTrack?.duration) {
      setDisplayDuration(formatTime(updatedCurrentTrack.duration));
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

  const handleClose = () => {
    console.log('❌ MiniPlayer: Close button clicked');
    reset(); // This will stop audio and clear the current track
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
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        {/* Play/Pause button */}
        <motion.button
          onClick={toggle}
          className={`w-8 h-8 rounded-full border border-white flex items-center justify-center 
                   text-white flex-shrink-0 relative overflow-hidden`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={14} className="text-white" strokeWidth={1.5} />
          ) : (
            <Play size={14} className="text-white ml-0.5" strokeWidth={1.5} />
          )}
        </motion.button>

        {/* Track info with enhanced typography - only in fixed mode */}
        {displayMode === 'fixed' && (
          <div className="flex-1 min-w-0 mx-4 overflow-hidden">
            <div className="whitespace-nowrap">
              <div className="text-white text-sm font-medium truncate">
                {updatedCurrentTrack.title}
              </div>
            </div>
            <div className="flex items-center space-x-3 text-text-secondary">
              <span className="text-xs text-gray-400">{updatedCurrentTrack.user.username}</span>
              <div className="flex items-center space-x-1">
                <Heart size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">{updatedCurrentTrack.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">{displayDuration}</span>
              </div>
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

          {/* Close button */}
          <motion.button
            onClick={handleClose}
            className="w-8 h-8 rounded-full border border-white flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Close player"
          >
            <X size={14} className="text-white" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};