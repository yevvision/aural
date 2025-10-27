import React, { useEffect, useRef, useState, useCallback } from 'react';

interface UnicornAudioVisualizerProps {
  frequencies?: number[];
  volume?: number;
  isActive?: boolean;
  audioElement?: HTMLAudioElement | null;
  isPlaying?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

// UnicornStudio types are now defined globally in vite-env.d.ts

export const UnicornAudioVisualizerAdvanced: React.FC<UnicornAudioVisualizerProps> = ({
  frequencies = [],
  volume = 0,
  isActive = false,
  audioElement,
  isPlaying = false,
  className = '',
  size = 'medium'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [unicornScenes, setUnicornScenes] = useState<any>(null);
  const [isUnicornReady, setIsUnicornReady] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { width: '200px', height: '200px' },
    medium: { width: '400px', height: '400px' },
    large: { width: '600px', height: '600px' }
  };

  // Initialize Unicorn Studio with audio integration
  const initializeUnicornStudio = useCallback(async () => {
    if ((window as any).UnicornStudio && !isInitialized.current) {
      try {
        console.log('[Unicorn Audio Visualizer Advanced] Initializing Unicorn Studio...');
        isInitialized.current = true;
        
        const scenes = await window.UnicornStudio.init();
        setUnicornScenes(scenes);
        setIsUnicornReady(true);
        console.log('[Unicorn Audio Visualizer Advanced] Unicorn Studio initialized:', scenes);
        return scenes;
      } catch (error) {
        console.error('[Unicorn Audio Visualizer Advanced] Initialization error:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Initialize audio analyzer
  const initializeAudioAnalyzer = useCallback(async () => {
    if (!audioElement) return false;
    
    try {
      // Clean up existing analyzer
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      
      if (audioContextRef.current) {
        await audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      // Create new audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512; // Higher resolution for better frequency analysis
      analyserRef.current.smoothingTimeConstant = 0.7; // More responsive
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      // Create source from audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      return true;
    } catch (error) {
      console.error('[Unicorn Audio Visualizer Advanced] Failed to initialize audio analyzer:', error);
      return false;
    }
  }, [audioElement]);

  // Get comprehensive audio data
  const getAudioData = useCallback(() => {
    let normalizedVolume = volume;
    let audioFrequencies = frequencies;

    if (analyserRef.current && audioElement) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      normalizedVolume = rms / 255;
      audioFrequencies = Array.from(dataArray).map(value => value / 255);
    }

    // Calculate frequency bands
    const lowFreq = audioFrequencies.slice(0, Math.floor(audioFrequencies.length * 0.25));
    const midFreq = audioFrequencies.slice(Math.floor(audioFrequencies.length * 0.25), Math.floor(audioFrequencies.length * 0.75));
    const highFreq = audioFrequencies.slice(Math.floor(audioFrequencies.length * 0.75));
    
    const lowAvg = lowFreq.length > 0 ? lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length : 0;
    const midAvg = midFreq.length > 0 ? midFreq.reduce((a, b) => a + b, 0) / midFreq.length : 0;
    const highAvg = highFreq.length > 0 ? highFreq.reduce((a, b) => a + b, 0) / highFreq.length : 0;

    // Calculate intensity and energy
    const baseIntensity = normalizedVolume * 0.6 + midAvg * 0.4;
    const frequencyBoost = (lowAvg * 0.3 + highAvg * 0.7) * 0.5;
    const intensity = Math.min(baseIntensity + frequencyBoost, 1);

    // Calculate energy distribution
    const totalEnergy = lowAvg + midAvg + highAvg;
    const lowEnergy = totalEnergy > 0 ? lowAvg / totalEnergy : 0;
    const midEnergy = totalEnergy > 0 ? midAvg / totalEnergy : 0;
    const highEnergy = totalEnergy > 0 ? highAvg / totalEnergy : 0;

    return {
      normalizedVolume,
      audioFrequencies,
      intensity,
      lowAvg,
      midAvg,
      highAvg,
      lowEnergy,
      midEnergy,
      highEnergy,
      totalEnergy
    };
  }, [volume, frequencies, audioElement]);

  // Apply audio data to Unicorn Studio scene
  const applyAudioToUnicorn = useCallback((audioData: ReturnType<typeof getAudioData>) => {
    if (!isUnicornReady || !containerRef.current) return;

    try {
      const {
        intensity,
        lowAvg,
        midAvg,
        highAvg,
        lowEnergy,
        midEnergy,
        highEnergy,
        normalizedVolume
      } = audioData;

      // Try to use Unicorn Studio API if available
      if (window.UnicornStudio && typeof window.UnicornStudio.setParameter === 'function') {
        // Set various parameters based on audio data for the specific animation
        // Beam effect parameters
        window.UnicornStudio.setParameter('uRadius', 0.842 + intensity * 0.5); // Beam radius
        window.UnicornStudio.setParameter('uSkew', 0.5 + intensity * 0.3); // Beam skew
        
        // Gradient Map parameters
        window.UnicornStudio.setParameter('uTime', Date.now() * 0.001 * (1 + intensity)); // Speed up with audio
        
        // Noise effect parameters
        window.UnicornStudio.setParameter('noiseStrength', intensity * 0.5); // Noise intensity
        
        // Ripple effect parameters
        window.UnicornStudio.setParameter('rippleStrength', intensity * 0.3); // Ripple strength
        window.UnicornStudio.setParameter('rippleFreq', 1.1160 + intensity * 2); // Ripple frequency
        
        // General audio parameters
        window.UnicornStudio.setParameter('audioIntensity', intensity);
        window.UnicornStudio.setParameter('audioVolume', normalizedVolume);
        window.UnicornStudio.setParameter('lowFreq', lowAvg);
        window.UnicornStudio.setParameter('midFreq', midAvg);
        window.UnicornStudio.setParameter('highFreq', highAvg);
      }

      // Fallback: Apply CSS transforms and effects
      const unicornElement = containerRef.current.querySelector('[data-us-project]') as HTMLElement;
      
      if (unicornElement) {
        // Dynamic scaling based on intensity - radial expansion from center
        const scale = 1 + intensity * 1.2; // 1.0 to 2.2 scale
        unicornElement.style.transform = `scale(${scale})`;
        
        // Brightness and saturation based on volume
        const brightness = 0.8 + intensity * 0.8; // 0.8 to 1.6 brightness
        const saturation = 1 + intensity * 2; // 1.0 to 3.0 saturation
        unicornElement.style.filter = `brightness(${brightness}) saturate(${saturation})`;
        
        // Opacity based on intensity
        const opacity = 0.6 + intensity * 0.4; // 0.6 to 1.0 opacity
        unicornElement.style.opacity = `${opacity}`;
        
        // Color shift based on frequency bands - more subtle
        const hueShift = lowAvg * 60 - highAvg * 30; // -30 to 60 degrees
        unicornElement.style.filter += ` hue-rotate(${hueShift}deg)`;
        
        // Blur effect based on high frequencies - more subtle
        const blur = highAvg * 1.5; // 0-1.5px blur
        unicornElement.style.filter += ` blur(${blur}px)`;
        
        // Contrast based on mid frequencies
        const contrast = 1 + midAvg * 0.3; // 1.0 to 1.3 contrast
        unicornElement.style.filter += ` contrast(${contrast})`;
        
        // Ensure it stays centered - no translation
        unicornElement.style.transformOrigin = 'center center';
      }

      // Apply additional visual effects only when there's significant audio
      if (intensity > 0.05) {
        const overlay = containerRef.current.querySelector('.audio-overlay') as HTMLElement;
        if (overlay) {
          // Radial gradient centered - no movement
          const gradient = `radial-gradient(circle at center, 
            rgba(255, 43, 23, ${lowAvg * 0.4}) 0%, 
            rgba(255, 106, 48, ${midAvg * 0.3}) 30%, 
            rgba(255, 170, 112, ${highAvg * 0.2}) 60%, 
            transparent 100%)`;
          
          overlay.style.background = gradient;
          overlay.style.opacity = `${intensity * 0.6}`;
          overlay.style.transform = `scale(${1 + intensity * 0.2})`;
          overlay.style.transformOrigin = 'center center';
        }
      } else {
        // Hide overlay when no significant audio
        const overlay = containerRef.current.querySelector('.audio-overlay') as HTMLElement;
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.transform = 'scale(1)';
        }
      }

      console.log('[Unicorn Audio Visualizer Advanced] Applied audio data:', {
        intensity: intensity.toFixed(3),
        volume: normalizedVolume.toFixed(3),
        lowAvg: lowAvg.toFixed(3),
        midAvg: midAvg.toFixed(3),
        highAvg: highAvg.toFixed(3)
      });
    } catch (error) {
      console.error('[Unicorn Audio Visualizer Advanced] Error applying audio to Unicorn:', error);
    }
  }, [isUnicornReady]);

  // Animation loop - only when audio is active
  const animate = useCallback(() => {
    if (isActive || isPlaying) {
      const audioData = getAudioData();
      // Only animate if there's actual audio activity
      if (audioData.intensity > 0.01 || audioData.normalizedVolume > 0.01) {
        applyAudioToUnicorn(audioData);
      } else {
        // Reset to default state when no audio
        resetToDefault();
      }
    } else {
      // No audio activity, reset to default
      resetToDefault();
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isActive, isPlaying, getAudioData, applyAudioToUnicorn]);

  // Reset to default state
  const resetToDefault = useCallback(() => {
    if (!containerRef.current) return;
    
    const unicornElement = containerRef.current.querySelector('[data-us-project]') as HTMLElement;
    if (unicornElement) {
      unicornElement.style.transform = 'scale(1)';
      unicornElement.style.filter = 'brightness(0.8) saturate(1) hue-rotate(0deg) blur(0px) contrast(1)';
      unicornElement.style.opacity = '0.6';
      unicornElement.style.transformOrigin = 'center center';
    }
    
    const overlay = containerRef.current.querySelector('.audio-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(1)';
      overlay.style.transformOrigin = 'center center';
    }
  }, []);

  // Load Unicorn Studio script
  useEffect(() => {
    const loadUnicornStudio = async () => {
      if (window.UnicornStudio) {
        await initializeUnicornStudio();
        return;
      }

      // Load the script if not already loaded
      const existingScript = document.querySelector('script[src="/unicornStudio.umd.js"]');
      if (existingScript) {
        // Script exists, wait for it to load
        const checkUnicornStudio = () => {
          if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
            initializeUnicornStudio();
          } else {
            setTimeout(checkUnicornStudio, 100);
          }
        };
        checkUnicornStudio();
        return;
      }

      // Load UnicornStudio script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '/unicornStudio.umd.js';
      script.onload = async () => {
        const checkUnicornStudio = () => {
          if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
            initializeUnicornStudio();
          } else {
            setTimeout(checkUnicornStudio, 100);
          }
        };
        checkUnicornStudio();
      };
      script.onerror = () => {
        console.warn('[Unicorn Audio Visualizer Advanced] Failed to load UnicornStudio script');
      };
      
      document.head.appendChild(script);
    };

    loadUnicornStudio();
  }, [initializeUnicornStudio]);

  // Handle audio element changes
  useEffect(() => {
    if (isPlaying && audioElement) {
      initializeAudioAnalyzer();
    }
  }, [audioElement, isPlaying, initializeAudioAnalyzer]);

  // Start/stop animation
  useEffect(() => {
    if (isUnicornReady) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      resetToDefault();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isUnicornReady, animate, resetToDefault]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`unicorn-audio-visualizer-advanced ${className}`}
      style={{
        position: 'relative',
        width: sizeConfig[size].width,
        height: sizeConfig[size].height,
        overflow: 'hidden',
        margin: '0 auto'
      }}
    >
      {/* Unicorn Studio Canvas - Audio Visualizer with specific animation */}
      <div
        data-us-project="lbkncvMlEHU6OuLb2UyF"
        data-us-scale="1"
        data-us-dpi="1.5"
        data-us-lazyload="true"
        data-us-production="true"
        data-us-fps="60"
        data-us-alttext="Audio Visualizer Unicorn Szene"
        data-us-arialabel="Interaktive 3D Audio Visualizer mit Unicorn Studio"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          transition: 'all 0.1s ease-out'
        }}
      />
      
      {/* Audio-reactive overlay effects */}
      <div
        className="audio-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
          transition: 'all 0.1s ease-out'
        }}
      />
      
      
      <style>{`
        .unicorn-audio-visualizer-advanced {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .audio-overlay {
          transition: all 0.1s ease-out;
          border-radius: 50%;
        }
        
        /* Ensure Unicorn Studio element stays centered and radial */
        .unicorn-audio-visualizer-advanced [data-us-project] {
          transform-origin: center center !important;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default UnicornAudioVisualizerAdvanced;
