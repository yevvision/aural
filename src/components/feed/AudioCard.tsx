import { Clock, Heart, MessageCircle, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useUserStore } from '../../stores/userStore';
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
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const audioCardRef = useRef<HTMLDivElement>(null);
  const context = useOutletContext<PlayerVisibilityContext>();
  const visibleAudioCardIds = context?.visibleAudioCardIds || new Set();
  const setVisibleAudioCardIds = context?.setVisibleAudioCardIds || ((update: (prev: Set<string>) => Set<string>) => {});
  
  // Create a unique ID for this card instance
  const cardInstanceId = useRef(`${track.id}-${Math.random().toString(36).substr(2, 9)}`).current;

  // Sanitize track and user data
  const safeTrack = sanitizeAudioTrack(track);
  const safeUser = sanitizeUser(track.user);

  const isCurrentTrack = currentTrack?.id === safeTrack.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;
  const isOwnTrack = myTracks.some(t => t.id === safeTrack.id);

  // Initialize Intersection Observer and handle visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisibleAudioCardIds(prev => {
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
    
    // When this track becomes the current track, immediately add it to visible set
    if (isCurrentTrack) {
      setVisibleAudioCardIds(prev => {
        const newSet = new Set(prev);
        newSet.add(safeTrack.id);
        return newSet;
      });
    }
    
    // Cleanup function to remove this card from visibility tracking when unmounted
    return () => {
      observer.disconnect();
      if (isCurrentTrack) {
        setVisibleAudioCardIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(safeTrack.id);
          return newSet;
        });
      }
    };
  }, [isCurrentTrack, safeTrack.id, setVisibleAudioCardIds]);

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
      setVisibleAudioCardIds(prev => {
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
            aria-label="Aufnahme löschen"
          >
            <Trash2 size={16} />
          </button>
        )}
        
        <div className="flex items-start space-x-4 relative z-20">
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
                className="hover:text-gradient-strong transition-colors flex items-center space-x-1"
                onClick={(e) => e.stopPropagation()}
              >
                <User size={12} />
                <span>{safeUser.username}</span>
              </Link>
              
              <div className="flex items-center space-x-1">
                <Heart size={12} />
                <span>{safeTrack.likes}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <MessageCircle size={12} />
                <span>{safeTrack.commentsCount || 0}</span>
              </div>
              
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
        title="Aufnahme löschen"
        message={`Möchtest du die Aufnahme "${safeTrack.title}" wirklich löschen?`}
        confirmText="Löschen"
        cancelText="Abbrechen"
      />
    </>
  );
};