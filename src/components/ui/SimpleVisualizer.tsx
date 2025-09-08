import React from 'react';

interface SimpleVisualizerProps {
  isPlaying: boolean;
  bars?: number;
  height?: number;
  className?: string;
}

export const SimpleVisualizer: React.FC<SimpleVisualizerProps> = ({
  isPlaying,
  bars = 20,
  height = 40,
  className = ''
}) => {
  return (
    <div className={`flex items-end justify-center gap-1 ${className}`} style={{ height }}>
      {Array.from({ length: bars }, (_, index) => {
        const barHeight = Math.random() * height * 0.8 + height * 0.2;
        
        return (
          <div
            key={index}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              isPlaying ? 'bg-gradient-primary' : 'bg-white/20'
            }`}
            style={{ 
              height: `${barHeight}px`,
              animation: isPlaying ? `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none'
            }}
          />
        );
      })}
    </div>
  );
};