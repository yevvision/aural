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
              Checking your upload
            </Heading>
            
            <Body color="secondary" className="text-lg leading-relaxed text-gray-300 mb-8">
              Thanks for your upload!
              <br />
              For security reasons, we're checking if it aligns with our community guidelines. You'll be notified when it's approved.
            </Body>

            {/* Action Button */}
            <button
              onClick={handleGotIt}
              className="w-full px-8 py-5 sm:py-4 rounded-full border-2 border-gray-600 bg-gradient-to-r from-gray-700/30 to-gray-600/20 flex items-center justify-center space-x-3 hover:from-gray-600/40 hover:to-gray-500/30 active:from-gray-600/50 active:to-gray-500/40 transition-all duration-200 touch-manipulation shadow-lg"
              style={{ minHeight: '64px' }}
            >
              <span className="text-gray-300 text-base font-semibold">Got it</span>
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </PageTransition>
  );
};
