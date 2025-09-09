import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { Body, Caption } from '../../components/ui/Typography';
import type { Comment } from '../../types';

interface CommentListProps {
  comments: Comment[];
}

export const CommentList = ({ comments }: CommentListProps) => {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {comments.map((comment, index) => (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex space-x-3 p-3 rounded-lg glass-surface border border-white/10"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Body weight="semibold" className="text-text-primary text-sm">
                {comment.user.username}
              </Body>
              <Caption color="secondary" className="text-xs">
                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'gerade eben'}
              </Caption>
            </div>
            <Body color="secondary" className="text-sm leading-relaxed break-words">
              {comment.content}
            </Body>
          </div>
        </motion.div>
      ))}
    </div>
  );
};