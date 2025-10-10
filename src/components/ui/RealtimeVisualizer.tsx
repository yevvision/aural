import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface RealtimeVisualizerProps {
  frequencies: number[];
  volume: number;
  isActive: boolean;
  bars?: number;
  height?: number;
  className?: string;
  style?: 'bars' | 'circular' | 'waveform' | 'voice';
  showVolumeIndicator?: boolean;
}

export const RealtimeVisualizer: React.FC<RealtimeVisualizerProps> = ({
  frequencies,
  volume,
  isActive,
  bars = 20,
  height = 60,
  className,
  style = 'bars',
  showVolumeIndicator = false
}) => {
  // Downsample frequencies to match desired number of bars
  const downsampledFrequencies = React.useMemo(() => {
    if (frequencies.length === 0) {
      return Array(bars).fill(0.3); // Default to 0.3 for visibility
    }
    
    const chunkSize = Math.floor(frequencies.length / bars);
    const result = Array.from({ length: bars }, (_, i) => {
      const start = i * chunkSize;
      const end = start + chunkSize;
      const chunk = frequencies.slice(start, end);
      return chunk.reduce((sum, val) => sum + val, 0) / chunk.length;
    });
    return result;
  }, [frequencies, bars]);

  if (style === 'circular') {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <div className="relative w-20 h-20">
          {/* Center dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: isActive ? [1, 1.2, 1] : 1
            }}
            transition={{
              duration: 0.6,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <div className="w-3 h-3 bg-gradient-primary rounded-full" />
          </motion.div>

          {/* Circular bars */}
          {downsampledFrequencies.map((amplitude, index) => {
            const angle = (index * 360) / bars;
            const barHeight = Math.max(amplitude * 15, 2);
            
            return (
              <motion.div
                key={index}
                className="absolute w-1 bg-gradient-primary rounded-full origin-bottom"
                style={{
                  height: barHeight,
                  left: '50%',
                  top: '50%',
                  transformOrigin: '50% 100%',
                  transform: `translateX(-50%) translateY(-50%) rotate(${angle}deg) translateY(-40px)`
                }}
                animate={{
                  height: isActive ? [barHeight, barHeight * (1 + amplitude), barHeight] : barHeight,
                  opacity: isActive ? [0.7, 1, 0.7] : 0.5
                }}
                transition={{
                  duration: 0.3,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut",
                  delay: index * 0.02
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (style === 'voice') {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        {/* Voice activity rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute border-2 border-gradient-strong rounded-full"
            style={{
              width: `${ring * 30}px`,
              height: `${ring * 30}px`
            }}
            animate={isActive ? {
              scale: [1, 1 + (volume * 0.5), 1],
              opacity: [0.6, 0.2, 0.6]
            } : {}}
            transition={{
              duration: 1 + ring * 0.2,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut",
              delay: ring * 0.1
            }}
          />
        ))}
        
        {/* Center microphone indicator */}
        <motion.div
          className="relative z-10 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center"
          animate={{
            scale: isActive ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 0.6,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <div className="w-3 h-3 bg-white rounded-full" />
        </motion.div>

        {showVolumeIndicator && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-primary rounded-full"
                style={{ width: `${volume * 100}%` }}
                animate={{
                  opacity: isActive ? [0.8, 1, 0.8] : 0.3
                }}
                transition={{
                  duration: 0.3,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (style === 'waveform') {
    return (
      <div className={cn('flex items-center justify-center gap-1', className)} style={{ height }}>
        {downsampledFrequencies.map((amplitude, index) => {
          const barHeight = Math.max(amplitude * height, 4);
          
          return (
            <motion.div
              key={index}
              className="w-1 bg-gradient-primary rounded-full"
              style={{ height: barHeight }}
              animate={{
                height: isActive ? [barHeight, barHeight * (1 + amplitude * 0.5), barHeight] : barHeight,
                opacity: isActive ? [0.7, 1, 0.7] : 0.4
              }}
              transition={{
                duration: 0.1 + Math.random() * 0.2,
                repeat: isActive ? Infinity : 0,
                ease: "easeInOut",
                delay: index * 0.01
              }}
            />
          );
        })}
      </div>
    );
  }

  // Default bars style
  return (
    <div className={cn('flex items-end justify-center gap-1', className)} style={{ height }}>
      {downsampledFrequencies.map((amplitude, index) => {
        const barHeight = Math.max(amplitude * height, 8); // Minimum height of 8px
        
        return (
          <motion.div
            key={index}
            className="w-1.5 bg-gradient-primary rounded-full"
            style={{ height: barHeight }}
            animate={{
              height: isActive ? [barHeight, barHeight * (1 + amplitude), barHeight] : barHeight,
              scaleY: isActive ? [1, 1.2, 1] : 1
            }}
            transition={{
              duration: 0.2 + Math.random() * 0.3,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut",
              delay: index * 0.02
            }}
          />
        );
      })}
      
      {showVolumeIndicator && (
        <div className="ml-3 flex flex-col items-center">
          <div className="w-1 h-12 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="w-full bg-gradient-primary rounded-full"
              style={{ 
                height: `${volume * 100}%`,
                transformOrigin: 'bottom'
              }}
              animate={{
                opacity: isActive ? [0.8, 1, 0.8] : 0.3
              }}
              transition={{
                duration: 0.3,
                repeat: isActive ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
          </div>
          <span className="text-xs text-text-secondary mt-1">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};