import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, MessageCircle, Bookmark, Share, Send, Flag, User, Calendar } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { useUserStore } from '../stores/userStore';
import { useDatabase } from '../hooks/useDatabase';
import { useFeedStore } from '../stores/feedStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getGlobalAudio } from '../hooks/useGlobalAudioManager';
import { formatDuration } from '../utils';
import { EnhancedAudioVisualizer } from '../components/audio/EnhancedAudioVisualizer';
import { UnicornBeamAudioVisualizer } from '../components/audio/UnicornBeamAudioVisualizer';
import { DynamicPlayIcon } from '../components/ui/DynamicPlayIcon';
import { VoidOfSoundIcon } from '../components/icons/VoidOfSoundIcon';
import type { Comment as CommentType } from '../types';

// Separate Komponente für Kommentare (damit Hooks korrekt verwendet werden können)
const CommentItem = ({ 
  comment, 
  onLike, 
  isCommentLikedByUser, 
  getCommentLikeCount 
}: { 
  comment: CommentType; 
  onLike: (commentId: string) => void;
  isCommentLikedByUser: (commentId: string, userId: string) => Promise<boolean>;
  getCommentLikeCount: (commentId: string) => Promise<number>;
}) => {
  const { currentUser } = useUserStore();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  useEffect(() => {
    const loadCommentData = async () => {
      try {
        const userId = currentUser?.id || 'user-1';
        const [liked, count] = await Promise.all([
          isCommentLikedByUser(comment.id, userId),
          getCommentLikeCount(comment.id)
        ]);
        setIsLiked(liked);
        setLikeCount(count);
      } catch (error) {
        console.error('Error loading comment data:', error);
      }
    };
    loadCommentData();
  }, [comment.id, currentUser?.id, isCommentLikedByUser, getCommentLikeCount]);
  
  return (
    <div className="border-b border-gray-800 pb-4">
      <div className="flex items-center mb-2">
        <span className="text-[#ff4e3a] text-sm font-medium">{comment.user.username}</span>
        <span className="text-gray-500 text-xs ml-2">
          {new Date(comment.createdAt).toLocaleDateString('de-DE')}
        </span>
      </div>
      <p className="text-gray-300 text-sm">{comment.content}</p>
      <div className="flex items-center mt-2">
        <button 
          onClick={() => onLike(comment.id)}
          className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
        >
          <Heart 
            size={14} strokeWidth={2} 
            className={isLiked ? "fill-red-500 text-red-500" : ""} 
          />
          {likeCount > 0 && (
            <span className="text-xs">{likeCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { currentTrack, isPlaying, currentTime, duration, expand, collapse, setCurrentTrack } = usePlayerStore();
  const { tracks, toggleLike, toggleBookmark, addCommentToTrack, addReport, toggleCommentLike, isCommentLikedByUser, getCommentLikeCount, comments } = useDatabase(currentUser?.id);
  const feedStoreTracks = useFeedStore((state) => state.tracks); // WICHTIG: Hole tracks aus feedStore für aktuelle Like-Daten
  const { toggle, seek } = useAudioPlayer();
  
  const [commentText, setCommentText] = useState('');
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const playButtonRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ centerX: 50, centerY: 50 });

  // Find the track by ID - WICHTIG: Prüfe zuerst feedStore für aktuelle Like-Daten!
  const track = useMemo(() => {
    if (!id) return currentTrack;
    
    // WICHTIG: Prüfe zuerst feedStore, da dort die aktuellen Like-Daten nach toggleLike sind
    const feedTrack = feedStoreTracks.find(t => t.id === id);
    if (feedTrack) return feedTrack;
    
    // Dann prüfe tracks von useDatabase
    const foundTrack = tracks.find(t => t.id === id);
    if (foundTrack) return foundTrack;
    
    // Wenn nicht gefunden und wir einen current track haben, prüfe ob es passt
    if (currentTrack && currentTrack.id === id) return currentTrack;
    
    // Wenn wir immer noch keinen track haben, return null um "nicht gefunden" zu zeigen
    return null;
  }, [id, tracks, feedStoreTracks, currentTrack]);

  // Calculate isTrackPlaying for the visualizer
  const isCurrentTrack = currentTrack?.id === track?.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  // Get the global audio element for visualization
  const globalAudio = getGlobalAudio();

  // Simuliere pulsierendes Feedback basierend auf isPlaying
  useEffect(() => {
    if (!isTrackPlaying) {
      setPulseIntensity(0);
      return;
    }

    let animationFrameId: number;
    let startTime = Date.now();

    const updatePulse = () => {
      const elapsed = Date.now() - startTime;
      // Sinus-Welle für kontinuierliches Pulsieren (0.5 Hz = 2 Sekunden pro Zyklus)
      const intensity = 0.3 + 0.3 * Math.sin(elapsed / 1000 * Math.PI);
      setPulseIntensity(intensity);
      animationFrameId = requestAnimationFrame(updatePulse);
    };

    updatePulse();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isTrackPlaying]);

  // Berechne die Position des Play-Buttons
  const updateButtonPosition = () => {
    if (playButtonRef.current) {
      const rect = playButtonRef.current.getBoundingClientRect();
      const centerX = ((rect.left + rect.right) / 2 / window.innerWidth) * 100;
      const centerY = ((rect.top + rect.bottom) / 2 / window.innerHeight) * 100;
      setButtonPosition({ centerX, centerY });
    }
  };

  useEffect(() => {
    updateButtonPosition();
    
    // Update position on scroll and resize
    window.addEventListener('scroll', updateButtonPosition, true);
    window.addEventListener('resize', updateButtonPosition);
    
    return () => {
      window.removeEventListener('scroll', updateButtonPosition, true);
      window.removeEventListener('resize', updateButtonPosition);
    };
  }, [isTrackPlaying]);

  useEffect(() => {
    expand();
    return () => collapse();
  }, [expand, collapse]);

  // When we have a track but no current track is set, set it as the current track
  useEffect(() => {
    if (track && (!currentTrack || currentTrack.id !== track.id)) {
      setCurrentTrack(track);
    }
  }, [track, currentTrack, setCurrentTrack]);
  
  if (!track) {
    // Falls kein Track gefunden wird (z. B. direkt nach Redirect), sofort zur Startseite umleiten
    useEffect(() => {
      navigate('/');
    }, [navigate]);
    return null;
  }

  // Fix for Infinity:NaN issue - ensure we have valid numbers
  const safeCurrentTime = isFinite(currentTime) && !isNaN(currentTime) ? currentTime : 0;
  const safeDuration = isFinite(duration) && !isNaN(duration) ? duration : 0;
  // Ensure progress is always between 0 and 100
  const progress = safeDuration > 0 ? Math.min(100, Math.max(0, (safeCurrentTime / safeDuration) * 100)) : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!safeDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * safeDuration;
    
    seek(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(0, safeCurrentTime - 15);
    seek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(safeDuration, safeCurrentTime + 15);
    seek(newTime);
  };

  const handleLike = async () => {
    if (!track || !currentUser?.id) return;
    
    console.log('❤️ PlayerPage: Like button clicked for track:', track.id);
    const success = await toggleLike(track.id, currentUser.id);
    console.log('❤️ PlayerPage: Like result:', success);
    
    if (success) {
      // WICHTIG: Aktualisiere den Track-State nach dem Like
      // Hole den aktualisierten Track aus dem feedStore
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        const feedStore = useFeedStore.getState();
        const updatedTrack = feedStore.tracks.find(t => t.id === track.id);
        
        if (updatedTrack) {
          // Aktualisiere currentTrack im playerStore, falls es derselbe Track ist
          if (currentTrack?.id === track.id) {
            setCurrentTrack(updatedTrack);
          }
          
          // Aktualisiere auch den feedStore für tracks von useDatabase
          // Der useMemo für 'track' wird automatisch neu berechnet wenn tracks sich ändert
          // Aber wir müssen sicherstellen, dass tracks aktualisiert wird
          // Das wird über den feedStore gemacht, aber tracks von useDatabase muss auch aktualisiert werden
          console.log('✅ PlayerPage: Track nach Like aktualisiert:', {
            trackId: updatedTrack.id,
            likes: updatedTrack.likes,
            isLiked: updatedTrack.isLiked
          });
        } else {
          console.warn('⚠️ PlayerPage: Aktualisierter Track nicht im feedStore gefunden');
        }
      } catch (error) {
        console.error('❌ PlayerPage: Fehler beim Aktualisieren des Tracks:', error);
      }
    }
  };

  const handleComment = () => {
    // Navigate to comments page
    navigate(`/comments`);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !track || !currentUser) return;
    
    const newComment = {
      id: `comment-${Date.now()}`,
      trackId: track.id, // WICHTIG: trackId für Server-Speicherung!
      content: commentText.trim(),
      user: currentUser,
      createdAt: new Date(),
      likes: 0,
      isLiked: false
    };
    console.log('💬 PlayerPage: Adding comment to track:', track.id);
    const success = await addCommentToTrack(track.id, newComment);
    console.log('💬 PlayerPage: Comment result:', success);
    
    if (success) {
      setCommentText('');
      
      // WICHTIG: Aktualisiere den Track-State nach dem Hinzufügen des Kommentars
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        const feedStore = useFeedStore.getState();
        const updatedTrack = feedStore.tracks.find(t => t.id === track.id);
        
        if (updatedTrack) {
          // Aktualisiere currentTrack im playerStore, falls es derselbe Track ist
          if (currentTrack?.id === track.id) {
            setCurrentTrack(updatedTrack);
          }
          
          console.log('✅ PlayerPage: Track nach Kommentar aktualisiert:', {
            trackId: updatedTrack.id,
            commentsCount: updatedTrack.commentsCount || (updatedTrack.comments?.length || 0)
          });
        } else {
          // Fallback: Lade Track direkt aus der Datenbank
          const { DatabaseService } = await import('../services/databaseService');
          const allTracks = DatabaseService.getTracks(currentUser.id);
          const dbTrack = allTracks.find(t => t.id === track.id);
          if (dbTrack && currentTrack?.id === track.id) {
            setCurrentTrack(dbTrack);
          }
        }
      } catch (error) {
        console.error('❌ PlayerPage: Fehler beim Aktualisieren des Tracks nach Kommentar:', error);
      }
    }
  };

  const handleBookmark = async () => {
    if (!track || !currentUser?.id) return;
    
    console.log('🔖 PlayerPage: Bookmark button clicked for track:', track.id);
    const success = await toggleBookmark(track.id, currentUser.id);
    console.log('🔖 PlayerPage: Bookmark result:', success);
    
    if (success) {
      // WICHTIG: Aktualisiere den Track-State nach dem Bookmark
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        const feedStore = useFeedStore.getState();
        const updatedTrack = feedStore.tracks.find(t => t.id === track.id);
        
        if (updatedTrack) {
          // Aktualisiere currentTrack im playerStore, falls es derselbe Track ist
          if (currentTrack?.id === track.id) {
            setCurrentTrack(updatedTrack);
          }
          
          console.log('✅ PlayerPage: Track nach Bookmark aktualisiert:', {
            trackId: updatedTrack.id,
            isBookmarked: updatedTrack.isBookmarked
          });
        }
      } catch (error) {
        console.error('❌ PlayerPage: Fehler beim Aktualisieren des Tracks:', error);
      }
    }
  };

  // Handle comment like interaction
  const handleCommentLike = (commentId: string) => {
    console.log('Comment like clicked:', commentId);
    const success = currentUser?.id ? toggleCommentLike(commentId, currentUser.id) : false;
    if (success) {
      console.log('Comment like toggled successfully');
    } else {
      console.error('Failed to toggle comment like');
    }
  };


  // Handle play button click with better error handling
  const handlePlayClick = () => {
    // Ensure we have a track before trying to play
    if (track) {
      console.log('Attempting to play track:', track.title);
      console.log('Track URL:', track.url);
      console.log('Current track in store:', currentTrack?.title);
      console.log('Is playing:', isPlaying);
      console.log('Global audio readyState:', globalAudio?.readyState);
      console.log('Global audio networkState:', globalAudio?.networkState);
      
      // Toggle play state
      toggle();
    } else {
      console.log('No track available to play');
    }
  };

  // Get track comments - only show real comments, no sample comments
  // Get comments for this track from the database
  // WICHTIG: Kommentare kommen aus track.comments, nicht aus der separaten comments Liste!
  // track.comments ist die Quelle der Wahrheit, da Kommentare direkt in Tracks gespeichert werden
  const trackComments = track?.comments && Array.isArray(track.comments) 
    ? track.comments 
    : comments.filter(comment => comment.trackId === track?.id);
  
  console.log('💬 PlayerPage: Track-Kommentare:', {
    trackId: track?.id,
    fromTrackComments: track?.comments?.length || 0,
    fromCommentsList: comments.filter(c => c.trackId === track?.id).length,
    finalCount: trackComments.length
  });

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-transparent">
      {/* Radialer Audio-Feedback beim Abspielen */}
      {isTrackPlaying && (
        <>
            {/* Hintergrund-Rötung - pulsierend - sehr schwach */}
            <div
              className="fixed pointer-events-none"
              style={{
                zIndex: 1,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: `rgba(220, 50, 40, ${0.02 + pulseIntensity * 0.05})`,
                mixBlendMode: 'screen',
                transition: 'background-color 0.06s linear',
              }}
            />
            
            {/* Radialer Verlauf - pulsierend - sehr schwach */}
            <div
              className="fixed pointer-events-none"
              style={{
                zIndex: 5,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                mixBlendMode: 'screen',
                background: `radial-gradient(circle at ${buttonPosition.centerX}% ${buttonPosition.centerY}%, 
                  rgba(220, 50, 40, ${0.08 + pulseIntensity * 0.1}) 0%,
                  rgba(180, 30, 25, ${0.06 + pulseIntensity * 0.08}) ${10 + pulseIntensity * 25}%,
                  rgba(150, 20, 15, ${0.04 + pulseIntensity * 0.06}) ${20 + pulseIntensity * 40}%,
                  rgba(120, 15, 10, ${0.02 + pulseIntensity * 0.04}) ${30 + pulseIntensity * 50}%,
                  transparent ${Math.min(50 + pulseIntensity * 50, 100)}%
                )`,
                transition: 'background 0.06s linear',
              }}
            />
        </>
      )}
      
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col"> {/* Adjusted padding and height */}
        {/* Username and statistics line */}
        <div className="flex items-center space-x-2 mb-4">
          <button 
            onClick={() => navigate(`/profile/${track.user?.username || 'unknown'}`)}
            className="flex items-center space-x-1 text-gray-400 text-xs hover:text-white transition-colors cursor-pointer"
          >
            <User size={12} strokeWidth={2} />
            <span>{track.user?.username || 'Unknown'}</span>
          </button>
          <div className="flex items-center space-x-1">
            <Play 
              size={14} strokeWidth={2} 
              className="text-gray-400"
              fill="none"
            />
            <span className="text-gray-400 text-xs">{track.plays || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart 
              size={14} strokeWidth={2} 
              className="text-gray-400"
              fill="none"
            />
            <span className="text-gray-400 text-xs">{track.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-gray-400 text-xs">{track.commentsCount || trackComments.length}</span>
          </div>
          {track.createdAt && (
            <div className="flex items-center space-x-1">
              <Calendar size={14} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-gray-400 text-xs">
                {new Date(track.createdAt).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Title - large and white */}
        <h1 className="text-white text-3xl font-normal leading-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {track.title}
        </h1>

        {/* Description - gray and smaller */}
        <p className="text-gray-400 mb-6 leading-snug text-xs">
          {track.description || "Intimate whispers sharing personal thoughts and desires"}
        </p>

        {/* Tags - flexible height */}
        <div className="flex flex-wrap gap-2 mb-10">
          {(() => {
            const tags = track.tags || ['Soft', 'Female', 'Toy', 'Whisper', 'Intimate'];
            const genderTags = ['Female', 'Male', 'Couple', 'Diverse'];
            
            // Find gender tag and move it to the front
            const genderTag = tags.find(tag => genderTags.includes(tag));
            const otherTags = tags.filter(tag => !genderTags.includes(tag));
            
            // Sort tags: gender first, then others
            const sortedTags = genderTag ? [genderTag, ...otherTags] : otherTags;
            
            return sortedTags.map((tag, index) => (
              <span
                key={index}
                className="bg-[#0f0f0f] border-none px-4 py-1.5 text-gray-400 text-xs font-medium rounded-full flex items-center gap-1"
              >
                <span className="text-gray-500">#</span>
                {tag}
              </span>
            ));
          })()}
        </div>

        {/* Play button with skip buttons centered vertically in page */}
        <div className="flex justify-between items-center my-16 relative">
          {/* Skip backward button */}
          <button
            onClick={handleSkipBackward}
            className="flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="15 Sekunden zurück"
            title="15 Sekunden zurück"
          >
            <svg width="36" height="36" viewBox="0 0 90.675 81.032" className="text-white">
              <g>
                <path style={{fill:"none",stroke:"white",strokeWidth:"2.5",strokeMiterlimit:"10"}} d="M50.166,78.872c21.184,0,38.356-17.173,38.356-38.356
                  S71.35,2.16,50.166,2.16s-38.356,17.173-38.356,38.356"/>
                <polyline style={{fill:"none",stroke:"white",strokeWidth:"2.5",strokeMiterlimit:"10"}} points="1.306,27.653 11.809,40.569 24.726,30.066"/>
                <text x="48.338" y="50" textAnchor="middle" fontSize="29" fill="white" fontFamily="monospace" fontWeight="400" stroke="white" strokeWidth="0.5">15</text>
              </g>
            </svg>
          </button>
          
          {/* Play button with visualizer - like on Record page */}
          <div ref={playButtonRef} className="relative flex items-center justify-center">
            {/* Unicorn Beam Audio Visualizer as container */}
            <UnicornBeamAudioVisualizer
              frequencies={[]}
              volume={0}
              isActive={isTrackPlaying}
              size="medium"
              className="relative"
            />
            
            {/* Play Button - positioned over the visualizer */}
            <button
              onClick={handlePlayClick}
              className="absolute z-10 rounded-full bg-transparent backdrop-blur-sm flex items-center justify-center shadow-voice overflow-visible"
              aria-label={isTrackPlaying ? 'Pause' : 'Play'}
              style={{
                width: '100px',
                height: '100px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                aspectRatio: '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0,
                padding: 0
              }}
            >
              <DynamicPlayIcon
                isCurrentTrack={isCurrentTrack}
                isPlaying={isTrackPlaying}
                isFinished={false}
                variant="white-outline-thin"
              />
            </button>
          </div>
          
          {/* Skip forward button */}
          <button
            onClick={handleSkipForward}
            className="flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="15 Sekunden vor"
            title="15 Sekunden vor"
          >
            <svg width="36" height="36" viewBox="0 0 90.675 81.032" className="text-white">
              <g>
                <path style={{fill:"none",stroke:"white",strokeWidth:"2.5",strokeMiterlimit:"10"}} d="M40.509,78.872c-21.184,0-38.356-17.173-38.356-38.356
                  S19.326,2.16,40.509,2.16s38.356,17.173,38.356,38.356"/>
                <polyline style={{fill:"none",stroke:"white",strokeWidth:"2.5",strokeMiterlimit:"10"}} points="89.369,27.653 78.866,40.569 65.949,30.066"/>
                <text x="42.338" y="50" textAnchor="middle" fontSize="29" fill="white" fontFamily="monospace" fontWeight="400" stroke="white" strokeWidth="0.5">15</text>
              </g>
            </svg>
          </button>
        </div>
        
        {/* Progress Bar with time displays - 10px above comments/buttons */}
        <div className="mt-8 mb-2.5 px-6 -mx-6">
          <div className="flex items-center gap-[15px]">
            {/* Left time display */}
            <span className="text-gray-400 text-xs font-mono min-w-[40px] text-left">
              {formatDuration(safeCurrentTime)}
            </span>
            
            {/* Progress bar */}
            <div 
              className="h-0.5 bg-gray-700 rounded-full cursor-pointer hover:h-1 transition-all duration-200"
              onClick={handleProgressClick}
              title={`${formatDuration(safeCurrentTime)} / ${formatDuration(safeDuration)}`}
              style={{ width: 'calc(100% - 110px)' }}
            >
              <div 
                className="h-full bg-[#ff4e3a] rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Right time display */}
            <span className="text-gray-400 text-xs font-mono min-w-[40px] text-right">
              {formatDuration(safeDuration)}
            </span>
          </div>
        </div>
        
        {/* Comment input and action buttons at the bottom of content */}
        <div className="mt-4 py-4 px-6 flex items-center gap-[15px] bg-transparent backdrop-blur-sm -mx-6" style={{ marginTop: '7.5px' }}>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="comment …"
              className="w-full h-10 px-4 bg-transparent border rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-[#ff4e3a] focus:bg-[#ff4e3a]/5 transition-all duration-200 border-white"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddComment();
                }
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="absolute right-[5px] top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
          
          {/* Button group with minimal spacing */}
          <div className="flex items-center gap-3">
            {/* Like button with enhanced visual feedback */}
            <motion.button
              onClick={handleLike}
              className={`h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                track.isLiked
                  ? 'border border-red-500 bg-red-500/20' 
                  : 'border border-white hover:border-red-400'
              }`}
              style={{ aspectRatio: '1/1', minWidth: '40px', minHeight: '40px', maxWidth: '40px', maxHeight: '40px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={track.isLiked ? 'Unlike' : 'Like'}
              title={track.isLiked ? 'Unlike' : 'Like'}
            >
              <Heart 
                size={14} 
                className={`transition-all duration-200 ${
                  track.isLiked 
                    ? "fill-red-500 text-red-500" 
                    : "text-white hover:text-red-400"
                }`}
                strokeWidth={1.5}
              />
            </motion.button>

            {/* Bookmark button with enhanced visual feedback */}
            <motion.button
              onClick={handleBookmark}
              className={`h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                track.isBookmarked
                  ? 'border border-yellow-500 bg-yellow-500/20' 
                  : 'border border-white hover:border-yellow-400'
              }`}
              style={{ aspectRatio: '1/1', minWidth: '40px', minHeight: '40px', maxWidth: '40px', maxHeight: '40px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={track.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              title={track.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark 
                size={14} 
                className={`transition-all duration-200 ${
                  track.isBookmarked 
                    ? "fill-yellow-500 text-yellow-500" 
                    : "text-white hover:text-yellow-400"
                }`}
                strokeWidth={1.5}
              />
            </motion.button>
          </div>
        </div>
        
        {/* Comments section - visible when scrolling */}
        <div className="mt-4">
          {trackComments.length > 0 ? (
            <div className="space-y-4">
              {trackComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleCommentLike}
                  isCommentLikedByUser={isCommentLikedByUser}
                  getCommentLikeCount={getCommentLikeCount}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-12">
              <VoidOfSoundIcon size={32} color="#6b7280" />
              <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Report Link - centered at bottom */}
        <div className="mt-8 pt-6 px-6 -mx-6">
          <div className="true-black-card px-6 py-4 text-center">
            <button
              onClick={() => navigate('/report', { 
                state: { 
                  trackInfo: track, 
                  trackId: track.id 
                } 
              })}
              className="flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 text-sm transition-colors mx-auto"
            >
              <Flag size={14} strokeWidth={1.5} />
              <span className="underline">Report inappropriate content</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};