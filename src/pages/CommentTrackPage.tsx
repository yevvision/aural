import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Play, MessageCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFeedStore } from '../stores/feedStore';
import { usePlayerStore } from '../stores/playerStore';
import { CommentForm } from '../components/comments/CommentForm';
import { CommentList } from '../components/comments/CommentList';
import { Button } from '../components/ui/Button';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body, Caption } from '../components/ui/Typography';
import { sanitizeAudioTrack } from '../utils';
import type { AudioTrack } from '../types';

export const CommentTrackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('trackId');
  
  const { tracks } = useFeedStore();
  const { setCurrentTrack } = usePlayerStore();
  
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);

  // Load specific track if trackId is provided
  useEffect(() => {
    if (trackId) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        setSelectedTrack(sanitizeAudioTrack(track));
      }
    }
  }, [trackId, tracks]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleTrackClick = () => {
    if (selectedTrack) {
      setCurrentTrack(selectedTrack);
      navigate(`/player/${selectedTrack.id}`);
    }
  };

  const handleCommentSubmit = () => {
    // Refresh the track to show the new comment
    if (trackId) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        setSelectedTrack(sanitizeAudioTrack(track));
      }
    }
  };

  if (!selectedTrack) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <div className="true-black-card text-center">
            <h2 className="text-lg font-medium text-text-primary mb-2">Track not found</h2>
            <Button onClick={handleBack}>Go back</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <RevealOnScroll direction="up">
            <div className="true-black-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={handleBack}
                    className="w-10 h-10 p-0"
                  >
                    <ArrowLeft size={18} />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-text-primary">Kommentar schreiben</h1>
                    <p className="text-text-secondary text-sm">
                      Zu "{selectedTrack.title}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Track Info */}
          <RevealOnScroll direction="up" delay={0.1}>
            <div 
              className="true-black-card cursor-pointer"
              onClick={handleTrackClick}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-primary truncate">{selectedTrack.title}</h3>
                  <p className="text-sm text-text-secondary">{selectedTrack.user.username}</p>
                </div>
                <Button
                  variant="glass"
                  size="sm"
                  className="w-10 h-10 p-0"
                  aria-label="Play track"
                >
                  <Play size={16} className="text-text-secondary ml-0.5" />
                </Button>
              </div>
            </div>
          </RevealOnScroll>

          {/* Existing Comments Section */}
          <RevealOnScroll direction="up" delay={0.2}>
            <div className="true-black-card">
              <div className="flex items-center justify-between mb-4">
                <Heading level={3} className="text-lg font-medium text-text-primary">
                  Kommentare ({selectedTrack.comments?.length || 0})
                </Heading>
              </div>
              
              {selectedTrack.comments && selectedTrack.comments.length > 0 ? (
                <CommentList comments={selectedTrack.comments || []} />
              ) : null}
            </div>
          </RevealOnScroll>

          {/* Comment Form */}
          <RevealOnScroll direction="up" delay={0.3}>
            <div className="true-black-card">
              <CommentForm 
                track={selectedTrack} 
                onCommentSubmit={handleCommentSubmit}
              />
            </div>
          </RevealOnScroll>
        </motion.div>
      </div>
    </PageTransition>
  );
};