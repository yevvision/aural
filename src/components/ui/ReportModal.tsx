import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { AudioTrack, Comment } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportData: {
    type: 'comment' | 'recording' | 'description';
    targetId: string;
    targetTitle: string;
    reason?: string;
  }) => void;
  track: AudioTrack;
  comments: Comment[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  track,
  comments
}) => {
  const [reportType, setReportType] = useState<'comment' | 'recording' | 'description'>('recording');
  const [selectedCommentId, setSelectedCommentId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    let targetId = track.id;
    let targetTitle = track.title;

    if (reportType === 'comment' && selectedCommentId) {
      const selectedComment = comments.find(c => c.id === selectedCommentId);
      if (selectedComment) {
        targetId = selectedComment.id;
        targetTitle = selectedComment.content;
      }
    } else if (reportType === 'description') {
      targetId = track.id;
      targetTitle = track.description || track.title;
    }

    onSubmit({
      type: reportType,
      targetId,
      targetTitle,
      reason: reason.trim() || undefined
    });

    // Reset form
    setReportType('recording');
    setSelectedCommentId('');
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setReportType('recording');
    setSelectedCommentId('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-600 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Report inappropriate content</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              What would you like to report?
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="recording"
                  checked={reportType === 'recording'}
                  onChange={(e) => setReportType(e.target.value as 'recording')}
                  className="mr-3 text-orange-500 focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm text-white">The recording itself</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="description"
                  checked={reportType === 'description'}
                  onChange={(e) => setReportType(e.target.value as 'description')}
                  className="mr-3 text-orange-500 focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm text-white">The description</span>
              </label>
              <label className={`flex items-center ${comments.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="reportType"
                  value="comment"
                  checked={reportType === 'comment'}
                  onChange={(e) => setReportType(e.target.value as 'comment')}
                  disabled={comments.length === 0}
                  className="mr-3 text-orange-500 focus:ring-orange-500 focus:ring-2"
                />
                    <span className={`text-sm ${comments.length === 0 ? 'text-gray-500' : 'text-white'}`}>
                  A comment {comments.length === 0 && '(no comments available)'}
                </span>
              </label>
            </div>
          </div>

          {/* Comment Selection */}
          {reportType === 'comment' && (
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Select the comment to report:
              </label>
              <select
                value={selectedCommentId}
                onChange={(e) => setSelectedCommentId(e.target.value)}
                    className="w-full p-3 bg-black border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
              >
                <option value="">Choose a comment...</option>
                {comments.map((comment) => (
                  <option key={comment.id} value={comment.id}>
                    {comment.user.username}: {comment.content.length > 50 
                      ? comment.content.substring(0, 50) + '...' 
                      : comment.content}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Additional details (optional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide more details about why you're reporting this content..."
                  className="w-full p-3 bg-black border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none text-white placeholder-gray-400"
              maxLength={500}
            />
            <div className="text-xs text-gray-400 mt-1">
              {reason.length}/500 characters
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-sm font-medium text-white bg-transparent border border-white hover:bg-white hover:text-black rounded-full transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={reportType === 'comment' && !selectedCommentId}
            className="px-6 py-3 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed rounded-full transition-all duration-200"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};
