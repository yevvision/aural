import { Play, Pause, Heart, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useDatabase } from '../../hooks/useDatabase';
import { useUserStore } from '../../stores/userStore';
import type { AudioTrack } from '../../types';
import { useEffect, useState, useRef } from 'react';

interface InlineMiniPlayerProps {
  track: AudioTrack;
}

export const InlineMiniPlayer = ({ track }: InlineMiniPlayerProps) => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { isPlaying, currentTime, duration, toggle, seek } = useAudioPlayer();
  const { tracks, toggleLike, toggleBookmark } = useDatabase(currentUser?.id); // Verwende zentrale Datenbank
  
  // Find the current track in the database to get the latest like state
  const feedTrack = tracks.find(t => t.id === track.id);
  const updatedTrack = feedTrack ? { ...track, ...feedTrack } : track;
  
  // Debug: Log track data
  console.log('🎵 InlineMiniPlayer: Track data:', {
    id: updatedTrack.id,
    title: updatedTrack.title,
    isLiked: updatedTrack.isLiked,
    likes: updatedTrack.likes,
    feedTrack: feedTrack ? 'found' : 'not found'
  });
  
  // Local state for progress and UI
  const [progressWidth, setProgressWidth] = useState(0);
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
  
  // Calculate progress percentage - use duration from player store first, then track
  const trackDuration = duration || updatedTrack?.duration || 0;
  const progressPercent = trackDuration > 0 && typeof currentTime === 'number' 
    ? Math.min(100, (currentTime / trackDuration) * 100) 
    : 0;

  // Update progress bar width
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
      const trackDuration = duration || updatedTrack?.duration || 0;
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
  }, [isPlaying, currentTime, duration, updatedTrack, progressPercent]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const trackDuration = duration || updatedTrack?.duration || 0;
    if (!trackDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * trackDuration;
    
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
    const success = currentUser?.id ? toggleLike(updatedTrack.id, currentUser.id) : false;
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
    const success = currentUser?.id ? toggleBookmark(updatedTrack.id, currentUser.id) : false;
    // Bookmark result processed
    
    // Keep the animation state for a short duration
    setTimeout(() => setBookmarkClicked(false), 300);
  };

  return (
    <div className="mt-4 pt-3" style={{ paddingTop: '3px' }}>
      {/* Progress bar - single progress bar as requested, half as thick and dark gray */}
      <div className="pt-2 pb-1">
        <div 
          ref={progressBarRef}
          className="w-full h-0.5 bg-gray-600 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
        >
          {/* Progress fill - orange color that accumulates from left to right */}
          <div 
            className="h-full bg-orange-500 rounded-full transition-all duration-100"
            style={{ width: `${Math.max(0, progressWidth)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        {/* Play/Pause button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className="w-8 h-8 rounded-full border border-white flex items-center justify-center"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        
        {/* Time display in the center */}
        <div className="flex-1 mx-3 flex justify-center text-xs text-white/70">
          <span>{formatTime(currentTime || 0)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration || updatedTrack?.duration || 0)}</span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
              updatedTrack.isLiked 
                ? 'border border-red-500 bg-red-500/20' 
                : 'border border-white hover:border-red-400'
            }`}
            aria-label={updatedTrack.isLiked ? 'Unlike' : 'Like'}
            title={updatedTrack.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart 
              size={14} 
              className={`transition-all duration-200 ${
                updatedTrack.isLiked 
                  ? "fill-red-500 text-red-500" 
                  : "text-white hover:text-red-400"
              }`}
            />
          </button>
          
          <button
            onClick={handleBookmark}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
              updatedTrack.isBookmarked 
                ? 'border border-yellow-500 bg-yellow-500/20' 
                : 'border border-white hover:border-yellow-400'
            }`}
            aria-label={updatedTrack.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            title={updatedTrack.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark 
              size={14} 
              className={`transition-all duration-200 ${
                updatedTrack.isBookmarked 
                  ? "fill-yellow-500 text-yellow-500" 
                  : "text-white hover:text-yellow-400"
              }`}
            />
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/player/${updatedTrack.id}`);
            }}
            className="w-8 h-8 rounded-full border border-white flex items-center justify-center"
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
          </button>
        </div>
      </div>
    </div>
  );
};