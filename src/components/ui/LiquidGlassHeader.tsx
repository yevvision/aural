import React from 'react';
import { LiquidGlassEffect } from './LiquidGlassEffect';

interface LiquidGlassHeaderProps {
  children?: React.ReactNode;
  className?: string;
  intensity?: number;
  chromaticDispersion?: number;
  mouseTracking?: boolean;
  borderRadius?: number;
  backgroundBlur?: number;
}

export const LiquidGlassHeader: React.FC<LiquidGlassHeaderProps> = ({ 
  children, 
  className = '',
  intensity = 0.03,
  chromaticDispersion = 0.012,
  mouseTracking = true,
  borderRadius = 20,
  backgroundBlur = 25
}) => {
  return (
    <LiquidGlassEffect
      className={className}
      intensity={intensity}
      chromaticDispersion={chromaticDispersion}
      mouseTracking={mouseTracking}
      borderRadius={borderRadius}
      backgroundBlur={backgroundBlur}
    >
      {children}
    </LiquidGlassEffect>
  );
};
