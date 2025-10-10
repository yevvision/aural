import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

// Waveform Visualizer Component
interface WaveformVisualizerProps {
  isPlaying?: boolean;
  progress?: number;
  bars?: number;
  height?: number;
  className?: string;
  interactive?: boolean;
  onSeek?: (position: number) => void;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying = false,
  progress = 0,
  bars = 50,
  height = 40,
  className,
  interactive = false,
  onSeek
}) => {
  const waveformData = React.useMemo(() => {
    return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
  }, [bars]);

  const handleClick = (e: React.MouseEvent, index: number) => {
    if (interactive && onSeek) {
      const position = index / bars;
      onSeek(position);
    }
  };

  return (
    <div 
      className={cn('flex items-end justify-center gap-1 py-2', className)}
      style={{ height: height + 16 }}
    >
      {waveformData.map((amplitude, index) => {
        const isActive = isPlaying && (index / bars) <= progress;
        const barHeight = amplitude * height;
        
        return (
          <motion.div
            key={index}
            className={cn(
              'w-1 rounded-full cursor-pointer transition-colors duration-200',
              isActive 
                ? 'bg-gradient-primary shadow-sm' 
                : 'bg-white/30 hover:bg-white/50'
            )}
            style={{ height: barHeight }}
            animate={isPlaying && isActive ? {
              height: [
                barHeight,
                barHeight * (0.8 + Math.random() * 0.4),
                barHeight
              ],
              opacity: [0.8, 1, 0.8]
            } : {}}
            transition={{
              duration: 0.8 + Math.random() * 0.4,
              repeat: isPlaying && isActive ? Infinity : 0,
              ease: "easeInOut",
              delay: index * 0.02
            }}
            whileHover={interactive ? { 
              height: barHeight * 1.2,
              transition: { duration: 0.1 }
            } : {}}
            onClick={(e) => handleClick(e, index)}
          />
        );
      })}
    </div>
  );
};

// Circular Audio Visualizer
interface CircularVisualizerProps {
  isPlaying?: boolean;
  size?: number;
  className?: string;
  bars?: number;
}

export const CircularVisualizer: React.FC<CircularVisualizerProps> = ({
  isPlaying = false,
  size = 120,
  className,
  bars = 24
}) => {
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div 
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0">
        {Array.from({ length: bars }).map((_, index) => {
          const angle = (index * 360) / bars;
          const amplitude = Math.random() * 0.6 + 0.4;
          const length = isPlaying ? amplitude * 15 + 5 : 8;
          
          const x1 = centerX + Math.cos((angle * Math.PI) / 180) * radius;
          const y1 = centerY + Math.sin((angle * Math.PI) / 180) * radius;
          const x2 = centerX + Math.cos((angle * Math.PI) / 180) * (radius + length);
          const y2 = centerY + Math.sin((angle * Math.PI) / 180) * (radius + length);

          return (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              animate={isPlaying ? {
                x2: [
                  centerX + Math.cos((angle * Math.PI) / 180) * (radius + length),
                  centerX + Math.cos((angle * Math.PI) / 180) * (radius + length * (0.5 + Math.random() * 0.5)),
                  centerX + Math.cos((angle * Math.PI) / 180) * (radius + length)
                ],
                y2: [
                  centerY + Math.sin((angle * Math.PI) / 180) * (radius + length),
                  centerY + Math.sin((angle * Math.PI) / 180) * (radius + length * (0.5 + Math.random() * 0.5)),
                  centerY + Math.sin((angle * Math.PI) / 180) * (radius + length)
                ]
              } : {}}
              transition={{
                duration: 0.8 + Math.random() * 0.4,
                repeat: isPlaying ? Infinity : 0,
                ease: "easeInOut",
                delay: index * 0.05
              }}
            />
          );
        })}
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6A3A" />
            <stop offset="100%" stopColor="#E6452F" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Spectrum Analyzer
interface SpectrumAnalyzerProps {
  isPlaying?: boolean;
  bars?: number;
  className?: string;
  variant?: 'linear' | 'radial';
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  isPlaying = false,
  bars = 32,
  className,
  variant = 'linear'
}) => {
  const frequencies = React.useMemo(() => {
    return Array.from({ length: bars }, (_, i) => ({
      frequency: Math.random() * 0.8 + 0.2,
      phase: Math.random() * Math.PI * 2
    }));
  }, [bars]);

  if (variant === 'radial') {
    return (
      <div className={cn('relative w-32 h-32', className)}>
        {frequencies.map((freq, index) => {
          const angle = (index * 360) / bars;
          const length = isPlaying ? freq.frequency * 20 + 8 : 8;
          
          return (
            <motion.div
              key={index}
              className="absolute w-1 bg-gradient-primary rounded-full origin-bottom"
              style={{
                height: length,
                left: '50%',
                bottom: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) rotate(${angle}deg)`
              }}
              animate={isPlaying ? {
                height: [
                  length,
                  length * (0.5 + Math.sin(Date.now() * 0.01 + freq.phase) * 0.5),
                  length
                ]
              } : {}}
              transition={{
                duration: 0.1,
                repeat: isPlaying ? Infinity : 0,
                ease: "linear"
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-end justify-center gap-1 h-16', className)}>
      {frequencies.map((freq, index) => {
        const height = isPlaying ? freq.frequency * 48 + 8 : 8;
        
        return (
          <motion.div
            key={index}
            className="w-1 bg-gradient-primary rounded-full"
            style={{ height }}
            animate={isPlaying ? {
              height: [
                height,
                height * (0.3 + Math.sin(Date.now() * 0.015 + freq.phase) * 0.7),
                height
              ]
            } : {}}
            transition={{
              duration: 0.1,
              repeat: isPlaying ? Infinity : 0,
              ease: "linear"
            }}
          />
        );
      })}
    </div>
  );
};

// Voice Activity Indicator
interface VoiceActivityProps {
  isActive?: boolean;
  intensity?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceActivity: React.FC<VoiceActivityProps> = ({
  isActive = false,
  intensity = 0.5,
  size = 'md',
  className
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizes[size], className)}>
      {/* Center dot */}
      <motion.div
        className="w-2 h-2 bg-gradient-primary rounded-full"
        animate={isActive ? {
          scale: [1, 1.5, 1],
          opacity: [0.8, 1, 0.8]
        } : {}}
        transition={{
          duration: 0.6,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Outer rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute border-2 border-gradient-strong/30 rounded-full"
          style={{
            width: `${ring * 100}%`,
            height: `${ring * 100}%`
          }}
          animate={isActive ? {
            scale: [1, 1 + (intensity * 0.3), 1],
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
    </div>
  );
};

// Audio Progress Ring
interface AudioProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const AudioProgressRing: React.FC<AudioProgressRingProps> = ({
  progress,
  size = 64,
  strokeWidth = 4,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
        
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6A3A" />
            <stop offset="100%" stopColor="#E6452F" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Equalizer Bars
interface EqualizerProps {
  isPlaying?: boolean;
  bars?: number;
  className?: string;
  style?: 'classic' | 'modern' | 'minimal';
}

export const Equalizer: React.FC<EqualizerProps> = ({
  isPlaying = false,
  bars = 5,
  className,
  style = 'modern'
}) => {
  const baseHeights = React.useMemo(() => {
    return Array.from({ length: bars }, () => Math.random() * 0.7 + 0.3);
  }, [bars]);

  const styleVariants = {
    classic: 'w-1 bg-gradient-primary rounded-sm',
    modern: 'w-1.5 bg-gradient-primary rounded-full',
    minimal: 'w-0.5 bg-gradient-primary rounded-full'
  };

  return (
    <div className={cn('flex items-end justify-center gap-1 h-6', className)}>
      {baseHeights.map((baseHeight, index) => (
        <motion.div
          key={index}
          className={styleVariants[style]}
          animate={isPlaying ? {
            height: [
              baseHeight * 24,
              (baseHeight + Math.random() * 0.5) * 24,
              baseHeight * 24
            ]
          } : {
            height: baseHeight * 24
          }}
          transition={{
            duration: 0.4 + Math.random() * 0.3,
            repeat: isPlaying ? Infinity : 0,
            ease: "easeInOut",
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
};