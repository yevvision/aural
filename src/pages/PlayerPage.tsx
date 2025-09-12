import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, MessageCircle, Bookmark, Share, Send, Flag } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { useDatabase } from '../hooks/useDatabase';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getGlobalAudio } from '../hooks/useGlobalAudioManager';
import { formatDuration } from '../utils';
import { EnhancedAudioVisualizer } from '../components/audio/EnhancedAudioVisualizer';
import { ReportModal } from '../components/ui/ReportModal';

export const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, currentTime, duration, expand, collapse, setCurrentTrack } = usePlayerStore();
  const { tracks, toggleLike, toggleBookmark, addCommentToTrack, addReport, toggleCommentLike, isCommentLikedByUser, getCommentLikeCount } = useDatabase('user-1');
  const { toggle, seek } = useAudioPlayer();
  
  // Get the global audio element for visualization
  const globalAudio = getGlobalAudio();
  
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

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
    console.log('❤️ PlayerPage: Like button clicked for track:', track.id);
    const success = toggleLike(track.id, 'user-1');
    console.log('❤️ PlayerPage: Like result:', success);
  };

  const handleComment = () => {
    // Navigate to comments page
    navigate(`/comments`);
  };

  const handleAddComment = () => {
    if (commentText.trim() && track) {
      const newComment = {
        id: `comment-${Date.now()}`,
        content: commentText.trim(),
        user: { id: 'user-1', username: 'yevvo', email: 'yevvo@example.com' },
        createdAt: new Date(),
        likes: 0,
        isLiked: false
      };
      console.log('💬 PlayerPage: Adding comment to track:', track.id);
      const success = addCommentToTrack(track.id, newComment);
      console.log('💬 PlayerPage: Comment result:', success);
      if (success) {
        setCommentText('');
      }
    }
  };

  const handleBookmark = () => {
    console.log('🔖 PlayerPage: Bookmark button clicked for track:', track.id);
    const success = toggleBookmark(track.id, 'user-1');
    console.log('🔖 PlayerPage: Bookmark result:', success);
  };

  // Handle comment like interaction
  const handleCommentLike = (commentId: string) => {
    console.log('Comment like clicked:', commentId);
    const success = toggleCommentLike(commentId, 'user-1');
    if (success) {
      console.log('Comment like toggled successfully');
    } else {
      console.error('Failed to toggle comment like');
    }
  };

  const handleReportSubmit = (reportData: {
    type: 'comment' | 'recording' | 'description';
    targetId: string;
    targetTitle: string;
    reason?: string;
  }) => {
    console.log('Report submitted:', reportData);
    
    const newReport = {
      id: `report-${Date.now()}`,
      type: reportData.type,
      targetId: reportData.targetId,
      targetTitle: reportData.targetTitle,
      reporterId: 'user-1',
      reporterUsername: 'yevvo',
      reason: reportData.reason,
      status: 'pending' as const,
      createdAt: new Date()
    };
    
    const success = addReport(newReport);
    if (success) {
      alert('Report submitted successfully. Thank you for helping keep our community safe.');
    } else {
      alert('Failed to submit report. Please try again.');
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
  const comments = track.comments || [];

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
                className="border border-gray-500 px-4 py-1.5 text-gray-400 text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ));
          })()}
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
            className={`w-[56px] h-[56px] rounded-full border border-gray-500 flex items-center justify-center transition-all duration-200 hover:scale-105 ${
              track.isLiked 
                ? "border-red-500 bg-red-500/20" 
                : "hover:border-red-400"
            }`}
            title={track.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart 
              size={24} 
              className={`transition-all duration-200 ${
                track.isLiked 
                  ? "fill-red-500 text-red-500" 
                  : "text-gray-400 hover:text-red-400"
              }`}
              strokeWidth={1.5}
            />
          </button>
          
          <button
            onClick={handleBookmark}
            className={`w-[56px] h-[56px] rounded-full border border-gray-500 flex items-center justify-center transition-all duration-200 hover:scale-105 ${
              track.isBookmarked 
                ? "border-yellow-500 bg-yellow-500/20" 
                : "hover:border-yellow-400"
            }`}
            title={track.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark 
              size={24} 
              className={`transition-all duration-200 ${
                track.isBookmarked 
                  ? "fill-yellow-500 text-yellow-500" 
                  : "text-gray-400 hover:text-yellow-400"
              }`}
              strokeWidth={1.5}
            />
          </button>
        </div>
        
        {/* Comments section - visible when scrolling */}
        <div className="mt-4">
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const isLiked = isCommentLikedByUser(comment.id, 'user-1');
                const likeCount = getCommentLikeCount(comment.id);
                
                return (
                  <div key={comment.id} className="border-b border-gray-800 pb-4">
                    <div className="flex items-center mb-2">
                      <span className="text-white text-sm font-medium">{comment.user.username}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.content}</p>
                    <div className="flex items-center mt-2">
                      <button 
                        onClick={() => handleCommentLike(comment.id)}
                        className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Heart 
                          size={14} 
                          className={isLiked ? "fill-red-500 text-red-500" : ""} 
                          strokeWidth={1.5} 
                        />
                        {likeCount > 0 && (
                          <span className="text-xs">{likeCount}</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-600 text-xs mt-1">Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Report Link - centered at bottom */}
        <div className="mt-8 pt-6">
          <div className="text-center">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 text-sm transition-colors mx-auto"
            >
              <Flag size={14} strokeWidth={1.5} />
              <span>Report inappropriate content</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        track={track}
        comments={comments}
      />
    </div>
  );
};