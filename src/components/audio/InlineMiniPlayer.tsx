import { Play, Pause, ChevronUp, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useFeedStore } from '../../stores/feedStore';
import type { AudioTrack } from '../../types';
import { useEffect, useState, useRef } from 'react';

interface InlineMiniPlayerProps {
  track: AudioTrack;
}

export const InlineMiniPlayer = ({ track }: InlineMiniPlayerProps) => {
  const navigate = useNavigate();
  const { isPlaying, currentTime, duration, toggle, seek } = useAudioPlayer();
  const { tracks, toggleLike } = useFeedStore();
  
  // Find the current track in the feed store to get the latest like state
  const feedTrack = tracks.find(t => t.id === track.id);
  const updatedTrack = feedTrack ? { ...track, ...feedTrack } : track;
  
  // Local state for progress and UI
  const [progressWidth, setProgressWidth] = useState(0);
  const [likeClicked, setLikeClicked] = useState(false);
  
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
      const trackDuration = updatedTrack?.duration || 0;
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
    if (!updatedTrack?.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * updatedTrack.duration;
    
    // Update local state immediately for responsive feel
    setProgressWidth(percentage * 100);
    seek(newTime);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set like animation state
    setLikeClicked(true);
    
    // Update like in store
    toggleLike(updatedTrack.id);
    
    // Keep the animation state for a short duration
    setTimeout(() => setLikeClicked(false), 300);
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
          <span>{formatTime(updatedTrack?.duration || 0)}</span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              updatedTrack.isLiked 
                ? 'border border-orange-500 bg-orange-500/20' 
                : 'border border-white'
            }`}
            aria-label={updatedTrack.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart 
              size={14} 
              className={updatedTrack.isLiked ? "fill-orange-500 text-orange-500" : "text-white"} 
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
            <ChevronUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};