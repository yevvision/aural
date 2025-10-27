import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Send } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useDatabase } from '../../hooks/useDatabase';
import { Button } from '../ui/Button';
import { Panel } from '../ui/glassmorphism';
import type { AudioTrack } from '../../types';

interface CommentFormProps {
  track: AudioTrack;
  onCommentSubmit?: () => void;
  onCancel?: () => void;
}

export const CommentForm = ({ track, onCommentSubmit, onCancel }: CommentFormProps) => {
  const { currentUser } = useUserStore();
  const { addCommentToTrack } = useDatabase(currentUser?.id); // Verwende aktuellen User
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      // Erstelle neuen Kommentar
      const newComment = {
        id: `comment-${Date.now()}`,
        content: commentText.trim(),
        user: currentUser,
        createdAt: new Date(),
        likes: 0,
        isLiked: false
      };

      console.log('🎯 CommentForm: Füge Kommentar hinzu:', {
        trackId: track.id,
        trackTitle: track.title,
        comment: newComment.content.substring(0, 50)
      });

      // Füge Kommentar zur zentralen Datenbank hinzu
      const success = addCommentToTrack(track.id, newComment);
      
      if (success) {
        console.log('✅ CommentForm: Kommentar erfolgreich hinzugefügt');
        setCommentText('');
        onCommentSubmit?.();
      } else {
        console.error('❌ CommentForm: Fehler beim Hinzufügen des Kommentars');
        throw new Error('Kommentar konnte nicht hinzugefügt werden');
      }
    } catch (error) {
      console.error('❌ CommentForm: Failed to add comment:', error);
      alert('Fehler beim Hinzufügen des Kommentars. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Panel className="p-4 space-y-4">
      <div className="flex space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={track.comments && track.comments.length > 0 ? "Leave a comment..." : "Be the first to leave a comment..."}
            className="w-full bg-transparent text-text-primary placeholder-text-tertiary resize-none border-none focus:outline-none"
            rows={3}
            maxLength={500}
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-tertiary">
          {commentText.length}/500
        </span>
        <div className="flex space-x-2">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              size="sm"
            >
              Abbrechen
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!commentText.trim() || isSubmitting}
            variant="primary"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Send size={16} strokeWidth={2} />
            <span>{isSubmitting ? 'Senden...' : 'Senden'}</span>
          </Button>
        </div>
      </div>
    </Panel>
  );
};