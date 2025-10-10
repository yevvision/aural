import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Button } from '../components/ui/Button';
import { Heading, Body } from '../components/ui/Typography';

interface UploadSuccessData {
  uploadId: string;
  title: string;
  trackId?: string;
}

export const UploadSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get upload data from navigation state
  const uploadData = location.state as UploadSuccessData;

  // Auto-redirect to audio detail page after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (uploadData?.trackId) {
        navigate(`/player/${uploadData.trackId}`);
      } else {
        navigate('/');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, uploadData]);

  const handleViewAudio = () => {
    if (uploadData?.trackId) {
      navigate(`/player/${uploadData.trackId}`);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 pt-20 pb-24">
        <RevealOnScroll direction="up">
          <div className="true-black-card text-center">
            {/* Header */}
            <Heading level={1} className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-white mb-6">
              Upload Successful! 🎉
            </Heading>
            
            <Body color="secondary" className="text-lg leading-relaxed text-gray-300 mb-8">
              Your audio has been successfully uploaded and is now live!
              <br />
              <span className="text-white font-medium">Redirecting to your audio in 3 seconds...</span>
            </Body>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleViewAudio}
                variant="primary"
                size="lg"
                fullWidth
                className="py-4 text-lg"
              >
                View Audio
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="ghost"
                size="md"
                fullWidth
              >
                Go to Home
              </Button>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </PageTransition>
  );
};
