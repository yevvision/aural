import { Clock, Heart, Trash2, User, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useUserStore } from '../../stores/userStore';
import { useDatabase } from '../../hooks/useDatabase';
import { formatDuration, sanitizeAudioTrack, sanitizeUser } from '../../utils';
import { Body } from '../ui/Typography';
import { ConfirmationDialog } from '../ui';
import { InlineMiniPlayer } from '../audio/InlineMiniPlayer';
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
export const AudioCard = ({ track, index = 0, showDeleteButton = false, onDelete }: AudioCardProps) => {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer();
  const { reset } = usePlayerStore(); // Add reset function from player store
  const { myTracks } = useUserStore();
  const { tracks, toggleLike } = useDatabase('user-1'); // Verwende aktuellen User
  
  // Hole den aktuellen Track aus der Datenbank, um sicherzustellen, dass Like/Bookmark-Status aktuell ist
  const currentTrackData = tracks.find(t => t.id === track.id) || track;
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const audioCardRef = useRef<HTMLDivElement>(null);
  const context = useOutletContext<PlayerVisibilityContext>();
  const visibleAudioCardIds = context?.visibleAudioCardIds || new Set();
  const setVisibleAudioCardIds = context?.setVisibleAudioCardIds || ((update: (prev: Set<string>) => Set<string>) => {});
  
  // Create a unique ID for this card instance
  const cardInstanceId = useRef(`${track.id}-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Use ref to store the latest setVisibleAudioCardIds function to avoid dependency issues
  const setVisibleAudioCardIdsRef = useRef(setVisibleAudioCardIds);
  setVisibleAudioCardIdsRef.current = setVisibleAudioCardIds;

  // Sanitize track and user data
  const safeTrack = sanitizeAudioTrack(currentTrackData);
  const safeUser = sanitizeUser(currentTrackData.user);

  // Debug: Log track data
  console.log('🎵 AudioCard: Track data:', {
    id: safeTrack.id,
    title: safeTrack.title,
    isLiked: safeTrack.isLiked,
    isBookmarked: safeTrack.isBookmarked,
    likes: safeTrack.likes,
    commentsCount: safeTrack.commentsCount,
    comments: safeTrack.comments?.length || 0
  });

  const isCurrentTrack = currentTrack?.id === safeTrack.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;
  const isOwnTrack = myTracks.some(t => t.id === safeTrack.id);

  // Initialize Intersection Observer and handle visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisibleAudioCardIdsRef.current(prev => {
          const newSet = new Set(prev);
          if (entry.isIntersecting && isCurrentTrack) {
            newSet.add(safeTrack.id);
          } else if (!entry.isIntersecting && isCurrentTrack) {
            newSet.delete(safeTrack.id);
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
    };
  }, [safeTrack.id, isCurrentTrack]);

  // Separate effect for handling current track visibility
  useEffect(() => {
    if (isCurrentTrack) {
      setVisibleAudioCardIdsRef.current(prev => {
        const newSet = new Set(prev);
        newSet.add(safeTrack.id);
        return newSet;
      });
    } else {
      setVisibleAudioCardIdsRef.current(prev => {
        const newSet = new Set(prev);
        newSet.delete(safeTrack.id);
        return newSet;
      });
    }
  }, [isCurrentTrack, safeTrack.id]);

  const handleCardClick = () => {
    // First click: play and open player
    // Second click: close player (regardless of play state)
    if (isCurrentTrack) {
      // If this is the current track, collapse the player
      reset(); // Clear the current track to collapse the player
    } else {
      // If not the current track, play the track
      play(safeTrack);
      
      // When starting a new track, immediately set it as visible
      setVisibleAudioCardIdsRef.current(prev => {
        const newSet = new Set(prev);
        newSet.add(safeTrack.id);
        return newSet;
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOwnTrack) {
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
        className="true-black-card cursor-pointer overflow-hidden relative"
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
        {/* Delete button for own tracks - positioned at top right corner, dark gray */}
        {showDeleteButton && isOwnTrack && (
          <button
            onClick={handleDeleteClick}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors z-30"
            aria-label="Delete recording"
          >
            <Trash2 size={16} />
          </button>
        )}
        
        <div className="flex items-start space-x-6 relative z-20">
          {/* SVG Icon */}
          <div className="flex-shrink-0 mt-1">
            <svg 
              version="1.1" 
              id="Ebene_1" 
              xmlns="http://www.w3.org/2000/svg" 
              xmlnsXlink="http://www.w3.org/1999/xlink" 
              x="0px" 
              y="0px"
              viewBox="0 0 87.733 86.526" 
              style={{["enableBackground" as any]: "new 0 0 87.733 86.526"}} 
              xmlSpace="preserve"
              className="w-9 h-9 text-orange-500"
            >
              <g>
                <g>
                  <g>
                    <circle 
                      style={{fill:"none",stroke:"#f97316",strokeWidth:"3.8739",strokeMiterlimit:"10"}} 
                      cx="43.866" 
                      cy="42.242" 
                      r="40.577"
                    />
                  </g>
                  <path 
                    style={{fill:"none",stroke:"#f97316",strokeWidth:"3.8739",strokeMiterlimit:"10"}} 
                    d="M51.459,25.293l-4.025-4.025c-4.387-4.387-11.5-4.387-15.887,0s-4.387,11.5,0,15.887l4.025,4.025l-4.025,4.025c-4.387,4.387-4.387,11.5,0,15.887s11.5,4.387,15.887,0l4.025-4.025L67.346,41.18L51.459,25.293z"
                  />
                </g>
              </g>
            </svg>
          </div>
          
          {/* Track info with unified typography */}
          <div className="flex-1 min-w-0">
            
            {/* Title in white with unified font size */}
            <div className="text-white text-sm mb-1.5 line-clamp-2 leading-tight">
              {safeTrack.title}
            </div>
            
            {/* Metadata in gray with unified font size */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-gray-400">
              <Link 
                to={`/profile/${safeUser.id}`}
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center space-x-1"
                onClick={(e) => e.stopPropagation()}
              >
                <User size={12} />
                <span>{safeUser.username}</span>
              </Link>
              
              <div className="flex items-center space-x-1">
                <Play 
                  size={13} 
                  className="text-gray-400"
                  fill="none"
                />
                <span className="text-gray-400">{safeTrack.plays || 0}</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('❤️ AudioCard: Like button clicked for track:', safeTrack.id);
                  const success = toggleLike(safeTrack.id, 'user-1');
                  console.log('❤️ AudioCard: Like result:', success);
                }}
                className="flex items-center space-x-1 hover:scale-105 transition-transform cursor-pointer"
                title={safeTrack.isLiked ? 'Unlike' : 'Like'}
              >
                <Heart 
                  size={12} 
                  className="text-gray-400 hover:text-gray-300"
                  fill="none"
                />
                <span className="text-gray-400">
                  {safeTrack.likes}
                </span>
              </button>
              
              
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span className="tabular-nums">{formatDuration(safeTrack.duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inline MiniPlayer when track is the current track (playing or paused) with smooth animation */}
        <AnimatePresence>
          {isCurrentTrack && (
            <motion.div 
              className="relative z-20"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: "easeInOut"
              }}
            >
              <InlineMiniPlayer track={safeTrack} />
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