import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Send, X } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useDatabase } from '../hooks/useDatabase';
import { useBackNavigation } from '../components/layout/AppLayout';
import { AudioCard } from '../components/feed/AudioCard';

// Custom Radio Button Component
const CustomRadioButton = ({ 
  value, 
  checked, 
  onChange, 
  label, 
  name 
}: {
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  name: string;
}) => {
  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <div className="relative">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <div 
          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            checked 
              ? 'border-[#ff4e3a] bg-[#ff4e3a]' 
              : 'border-gray-600 bg-gray-700 hover:border-[#ff4e3a]'
          }`}
        >
          {checked && (
            <div className="w-full h-full rounded-full bg-white scale-50 transition-transform duration-200"></div>
          )}
        </div>
      </div>
      <span className="text-white">{label}</span>
    </label>
  );
};

export const ReportPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUserStore();
  const { addReport } = useDatabase(currentUser?.id);
  const { setShowBackButton } = useBackNavigation();
  
  // Get track info from location state
  const trackInfo = location.state?.trackInfo;
  const trackId = location.state?.trackId;
  
  const [reportType, setReportType] = useState<'recording' | 'description' | 'comment'>('recording');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show back button in navigation
  useEffect(() => {
    setShowBackButton(true);
    return () => setShowBackButton(false);
  }, [setShowBackButton]);

  // Redirect if no track info
  useEffect(() => {
    if (!trackInfo && !trackId) {
      navigate('/');
    }
  }, [trackInfo, trackId, navigate]);

  const handleSubmit = async () => {
    if (!trackId || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      const reportData = {
        type: reportType,
        targetId: trackId,
        targetTitle: trackInfo?.title || 'Unknown Track',
        reason: reason.trim() || undefined
      };

      console.log('Report submitted:', reportData);
      
      const newReport = {
        id: `report-${Date.now()}`,
        type: reportData.type,
        targetId: reportData.targetId,
        targetTitle: reportData.targetTitle,
        reporterId: currentUser.id,
        reporterUsername: currentUser.username,
        reason: reportData.reason,
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      const success = addReport(newReport);
      
      if (success) {
        console.log('Report submitted successfully');
        // Navigate back to the track page
        navigate(`/player/${trackId}`);
      } else {
        console.error('Failed to submit report');
        alert('Fehler beim Senden des Reports. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Fehler beim Senden des Reports. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (trackId) {
      navigate(`/player/${trackId}`);
    } else {
      navigate('/');
    }
  };

  if (!trackInfo && !trackId) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col items-start text-left mb-4">
            <AlertTriangle className="w-8 h-8 mb-2" style={{ strokeWidth: 1.5, color: 'oklch(0.577 0.245 27.325)' }} />
            <h1 className="text-2xl font-semibold">Report inappropriate content</h1>
          </div>
        </div>

        {/* Track Info */}
        {trackInfo && (
          <div className="mb-8">
            <div className="report-audio-card-glow">
              <AudioCard track={trackInfo} />
            </div>
          </div>
        )}

        {/* Report Type Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">What would you like to report?</h2>
          <div className="space-y-3">
            <CustomRadioButton
              value="recording"
              checked={reportType === 'recording'}
              onChange={(value) => setReportType(value as 'recording')}
              label="The recording itself"
              name="reportType"
            />
            
            <CustomRadioButton
              value="description"
              checked={reportType === 'description'}
              onChange={(value) => setReportType(value as 'description')}
              label="The description"
              name="reportType"
            />
            
            <CustomRadioButton
              value="comment"
              checked={reportType === 'comment'}
              onChange={(value) => setReportType(value as 'comment')}
              label="A comment"
              name="reportType"
            />
          </div>
        </div>

        {/* Additional Details */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Additional details (optional)</h2>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide more details about why you're reporting this content..."
            className="w-full h-32 px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ff4e3a] focus:bg-[#ff4e3a]/5 transition-all duration-200 resize-none"
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-400 mt-2">
            {reason.length}/500 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-6 py-3 rounded-full border-2 border-gray-600 bg-gradient-to-r from-gray-700/30 to-gray-600/20 flex items-center justify-center space-x-2 hover:from-gray-600/40 hover:to-gray-500/30 active:from-gray-600/50 active:to-gray-500/40 transition-all duration-200 touch-manipulation shadow-lg"
            style={{ minHeight: '48px' }}
          >
            <X size={16} className="text-gray-300" strokeWidth={2} />
            <span className="text-gray-300 text-sm font-semibold">Cancel</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-full border-2 border-[#ff4e3a] bg-gradient-to-r from-[#ff4e3a]/30 to-[#ff4e3a]/20 flex items-center justify-center space-x-2 hover:from-[#ff4e3a]/40 hover:to-[#ff4e3a]/30 active:from-[#ff4e3a]/50 active:to-[#ff4e3a]/40 transition-all duration-200 touch-manipulation shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px' }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#ff4e3a] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[#ff4e3a] text-sm font-semibold">Submitting...</span>
              </>
            ) : (
              <>
                <Send size={16} className="text-[#ff4e3a]" strokeWidth={2} />
                <span className="text-[#ff4e3a] text-sm font-semibold">Submit Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
