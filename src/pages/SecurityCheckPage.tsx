import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Button } from '../components/ui/Button';
import { Heading, Body } from '../components/ui/Typography';

export const SecurityCheckPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGotIt = () => {
    navigate('/');
  };

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 pt-20 pb-24">
        <RevealOnScroll direction="up">
          <div className="true-black-card text-center">
            {/* Header */}
            <Heading level={1} className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-white mb-6">
              Security Check in Progress 🔒
            </Heading>
            
            <Body color="secondary" className="text-lg leading-relaxed text-gray-300 mb-8">
              Thanks for your upload! For security reasons, we're checking if it aligns with our community guidelines.
              <br />
              <span className="text-white font-medium">You'll be notified when it's approved.</span>
            </Body>

            {/* Action Button */}
            <Button
              onClick={handleGotIt}
              variant="primary"
              size="lg"
              fullWidth
              className="py-4 text-lg"
            >
              Got it
            </Button>
          </div>
        </RevealOnScroll>
      </div>
    </PageTransition>
  );
};
