import React from 'react';
import type { AudioTrack } from '../../types';

interface AdminCommentsModalProps {
  track: AudioTrack | null;
  isOpen: boolean;
  onClose: () => void;
  getCommentLikeCount: (commentId: string) => Promise<number>;
}

export const AdminCommentsModal: React.FC<AdminCommentsModalProps> = ({
  track,
  isOpen,
  onClose,
  getCommentLikeCount
}) => {
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Kommentare für "{track.title}"
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-96">
          {track.comments && track.comments.length > 0 ? (
            <div className="space-y-4">
              {track.comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-gray-900">{comment.user.username}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          • {(comment as any).likeCount || 0} Likes
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Keine Kommentare vorhanden.</p>
          )}
        </div>
      </div>
    </div>
  );
};