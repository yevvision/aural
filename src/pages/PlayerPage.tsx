import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, MessageCircle, Bookmark, Share, Send } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { useFeedStore } from '../stores/feedStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getGlobalAudio } from '../hooks/useGlobalAudioManager';
import { formatDuration } from '../utils';
import { EnhancedAudioVisualizer } from '../components/audio/EnhancedAudioVisualizer';

export const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, currentTime, duration, expand, collapse, setCurrentTrack } = usePlayerStore();
  const { tracks, toggleLike, toggleBookmark, addComment, toggleCommentLike } = useFeedStore();
  const { toggle, seek } = useAudioPlayer();
  
  // Get the global audio element for visualization
  const globalAudio = getGlobalAudio();
  
  const [commentText, setCommentText] = useState('');

  // Find the track by ID
  const track = useMemo(() => {
    if (!id) return currentTrack;
    
    // First try to find in the feed store tracks
    const foundTrack = tracks.find(t => t.id === id);
    if (foundTrack) return foundTrack;
    
    // If not found and we have a current track, check if it matches
    if (currentTrack && currentTrack.id === id) return currentTrack;
    
    // If we still don't have a track, return null to show the not found message
    return null;
  }, [id, tracks, currentTrack]);

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
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <div className="true-black-card text-center">
          <h2 className="text-lg font-medium text-text-primary mb-2">Track not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="text-accent-blue hover:underline"
          >
            Go back to feed
          </button>
        </div>
      </div>
    );
  }

  // Fix for Infinity:NaN issue - ensure we have valid numbers
  const safeCurrentTime = isFinite(currentTime) && !isNaN(currentTime) ? currentTime : 0;
  const safeDuration = isFinite(duration) && !isNaN(duration) ? duration : 0;
  // Ensure progress is always between 0 and 100
  const progress = safeDuration > 0 ? Math.min(100, Math.max(0, (safeCurrentTime / safeDuration) * 100)) : 0;
  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!safeDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * safeDuration;
    
    seek(newTime);
  };

  const handleLike = () => {
    toggleLike(track.id);
  };

  const handleComment = () => {
    // Navigate to comments page
    navigate(`/comments`);
  };

  const handleAddComment = () => {
    if (commentText.trim() && track) {
      addComment(track.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleBookmark = () => {
    toggleBookmark(track.id);
  };

  // Handle comment like interaction
  const handleCommentLike = (commentId: string) => {
    // Call the store function to toggle comment like
    toggleCommentLike(track.id, commentId);
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

  // Define a list of sample comments for the demo
  const sampleComments = useMemo(() => [
    { id: '1', text: 'Das klingt wunderschön!', user: { username: 'julia89', id: '123' }, likes: 3, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '2', text: 'Ich liebe deine Stimme! Mehr davon bitte.', user: { username: 'markus_h', id: '124' }, likes: 5, isLiked: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: '3', text: 'Das hat mich wirklich berührt. Danke fürs Teilen.', user: { username: 'sophie22', id: '125' }, likes: 0, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
    { id: '4', text: 'Wow, das ist so gut! Kannst du mehr in diesem Stil machen?', user: { username: 'tobias_m', id: '126' }, likes: 0, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) }
  ], []);

  // Get track comments or use sample comments if none exist
  const comments = track.comments?.length ? track.comments : sampleComments;

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-transparent">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col"> {/* Adjusted padding and height */}
        {/* Username and statistics line */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-gray-400 text-xs">{track.user?.username || 'Unknown'}</span>
          <div className="flex items-center space-x-1">
            <Heart size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-gray-400 text-xs">{track.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-gray-400 text-xs">{track.commentsCount || comments.length}</span>
          </div>
        </div>

        {/* Title - large and white */}
        <h1 className="text-white text-4xl font-bold leading-tight mb-4">
          {track.title}
        </h1>

        {/* Description - gray and smaller */}
        <p className="text-gray-400 mb-6 leading-snug text-xs">
          {track.description || "Intimate whispers sharing personal thoughts and desires"}
        </p>

        {/* Tags - flexible height */}
        <div className="flex flex-wrap gap-2 mb-10">
          {(track.tags || ['Soft', 'Female', 'Toy', 'Whisper', 'Intimate']).map((tag, index) => (
            <span
              key={index}
              className="border border-gray-500 px-4 py-1.5 text-gray-400 text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Play button with time displays centered vertically in page */}
        <div className="flex justify-between items-center my-16 relative">
          {/* Left time display */}
          <span className="text-gray-400 text-xs font-mono">
            {formatDuration(safeCurrentTime)}
          </span>
          
          {/* Play button with visualizer */}
          <div className="relative w-[100px] h-[100px]">
            {/* Enhanced Audio Visualizer positioned exactly behind the button */}
            <div className="absolute inset-0 z-0">
              <EnhancedAudioVisualizer 
                audioElement={globalAudio}
                isPlaying={isTrackPlaying}
              />
            </div>
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 rounded-full bg-transparent backdrop-blur-sm flex items-center justify-center shadow-voice overflow-visible z-10"
              aria-label={isTrackPlaying ? 'Pause' : 'Play'}
            >
              {isTrackPlaying ? (
                <Pause size={28} strokeWidth={1.5} className="text-white" />
              ) : (
                <Play size={28} strokeWidth={1.5} className="text-white ml-1" />
              )}
            </button>
          </div>
          
          {/* Right time display */}
          <span className="text-gray-400 text-xs font-mono">
            {formatDuration(safeDuration)}
          </span>
        </div>
        
        {/* Comment input and action buttons at the bottom of content */}
        <div className="mt-8 py-6 px-6 flex items-center space-x-4 bg-transparent backdrop-blur-sm -mx-6" style={{ marginTop: '40px' }}>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="..."
              className="w-full h-[56px] bg-transparent border border-gray-500 rounded-full px-4 pr-16 text-white text-sm focus:outline-none focus:border-white"
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <Send size={20} strokeWidth={1.5} />
            </button>
          </div>
          
          <button
            onClick={handleLike}
            className={`w-[56px] h-[56px] rounded-full border border-gray-500 flex items-center justify-center ${track.isLiked ? "border-orange-500 bg-orange-500/20" : ""}`}
          >
            <Heart 
              size={24} 
              className={track.isLiked ? "fill-orange-500 text-orange-500" : "text-gray-400"} 
              strokeWidth={1.5}
            />
          </button>
          
          <button
            onClick={handleBookmark}
            className={`w-[56px] h-[56px] rounded-full border border-gray-500 flex items-center justify-center ${track.isBookmarked ? "border-orange-500 bg-orange-500/20" : ""}`}
          >
            <Bookmark 
              size={24} 
              className={track.isBookmarked ? "fill-orange-500 text-orange-500" : "text-gray-400"} 
              strokeWidth={1.5}
            />
          </button>
        </div>
        
        {/* Comments section - visible when scrolling */}
        <div className="mt-4">
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-800 pb-4">
                <div className="flex items-center mb-2">
                  <span className="text-white text-sm font-medium">{comment.user.username}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{comment.text}</p>
                <div className="flex items-center mt-2">
                  <button 
                    onClick={() => handleCommentLike(comment.id)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-white"
                  >
                    <Heart size={14} className={comment.isLiked ? "fill-red-500 text-red-500" : ""} strokeWidth={1.5} />
                    {comment.likes > 0 && (
                      <span className="text-xs">{comment.likes}</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};