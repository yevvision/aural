import React, { useEffect, useRef, useState, useCallback } from 'react';

interface UnicornBeamAudioVisualizerProps {
  frequencies?: number[];
  volume?: number;
  isActive?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

// TypeScript declaration for UnicornStudio
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => Promise<any>;
      destroy: () => void;
      setParameter?: (parameter: string, value: any) => void;
      setAnimationSpeed?: (speed: number) => void;
      setColor?: (color: string) => void;
      setIntensity?: (intensity: number) => void;
    };
    unicornScenes?: any;
  }
}

export const UnicornBeamAudioVisualizer: React.FC<UnicornBeamAudioVisualizerProps> = ({
  frequencies = [],
  volume = 0,
  isActive = false,
  className = '',
  size = 'medium'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const [unicornScenes, setUnicornScenes] = useState<any>(null);
  const [isUnicornReady, setIsUnicornReady] = useState(false);

  // Size configurations - 30% größer als ursprünglich (260px statt 200px)
  const sizeConfig = {
    small: { width: '260px', height: '260px' },
    medium: { width: '260px', height: '260px' },
    large: { width: '260px', height: '260px' }
  };

  // Initialize Unicorn Studio
  const initializeUnicornStudio = useCallback(async () => {
    if (window.UnicornStudio && !isInitialized.current) {
      try {
        console.log('[Unicorn Beam Audio Visualizer] Initializing Unicorn Studio...');
        isInitialized.current = true;
        
        const scenes = await window.UnicornStudio.init();
        setUnicornScenes(scenes);
        setIsUnicornReady(true);
        console.log('[Unicorn Beam Audio Visualizer] Unicorn Studio initialized:', scenes);
        return scenes;
      } catch (error) {
        console.error('[Unicorn Beam Audio Visualizer] Initialization error:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Calculate audio intensity based on frequencies and volume
  const calculateIntensity = useCallback(() => {
    const normalizedVolume = volume;
    const audioFrequencies = frequencies;

    // Calculate frequency bands
    const lowFreq = audioFrequencies.slice(0, Math.floor(audioFrequencies.length * 0.25));
    const midFreq = audioFrequencies.slice(Math.floor(audioFrequencies.length * 0.25), Math.floor(audioFrequencies.length * 0.75));
    const highFreq = audioFrequencies.slice(Math.floor(audioFrequencies.length * 0.75));
    
    const lowAvg = lowFreq.length > 0 ? lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length : 0;
    const midAvg = midFreq.length > 0 ? midFreq.reduce((a, b) => a + b, 0) / midFreq.length : 0;
    const highAvg = highFreq.length > 0 ? highFreq.reduce((a, b) => a + b, 0) / highFreq.length : 0;

    // Calculate intensity based on Optik-Beschreibung
    const intensity = normalizedVolume * 0.8 + midAvg * 0.6;
    const frequencyBoost = (lowAvg * 0.4 + highAvg * 0.8) * 0.7;
    const finalIntensity = Math.min(intensity + frequencyBoost, 1);

    return {
      intensity: finalIntensity,
      normalizedVolume,
      lowAvg,
      midAvg,
      highAvg
    };
  }, [volume, frequencies]);

  // Apply audio data to Unicorn Studio scene
  const applyAudioToUnicorn = useCallback((audioData: ReturnType<typeof calculateIntensity>) => {
    if (!isUnicornReady || !containerRef.current) return;

    try {
      const { intensity, normalizedVolume, lowAvg, midAvg, highAvg } = audioData;

      // Try to use Unicorn Studio API if available
      if (window.UnicornStudio && typeof window.UnicornStudio.setParameter === 'function') {
        // Set various parameters based on audio data
        window.UnicornStudio.setParameter('uRadius', 0.842 + intensity * 0.5);
        window.UnicornStudio.setParameter('uSkew', 0.5 + intensity * 0.3);
        window.UnicornStudio.setParameter('uTime', Date.now() * 0.001 * (1 + intensity));
        window.UnicornStudio.setParameter('noiseStrength', intensity * 0.5);
        window.UnicornStudio.setParameter('rippleStrength', intensity * 0.3);
        window.UnicornStudio.setParameter('rippleFreq', 1.1160 + intensity * 2);
        window.UnicornStudio.setParameter('audioIntensity', intensity);
        window.UnicornStudio.setParameter('audioVolume', normalizedVolume);
        window.UnicornStudio.setParameter('lowFreq', lowAvg);
        window.UnicornStudio.setParameter('midFreq', midAvg);
        window.UnicornStudio.setParameter('highFreq', highAvg);
      }

      // Apply CSS transforms and effects
      const unicornElement = containerRef.current.querySelector('[data-us-project]') as HTMLElement;
      
      if (unicornElement) {
        // KEINE Skalierung mehr - feste Größe
        unicornElement.style.transform = `translate(-50%, -50%) scale(1)`;
        
        // KEINE Audio-reaktiven Farbänderungen - feste Werte
        unicornElement.style.filter = `brightness(1.0) saturate(1) hue-rotate(0deg) blur(0px) contrast(1)`;
        
        // Volle Opacity - nicht mehr verdunkelt
        const opacity = 1.0; // Immer volle Opacity
        unicornElement.style.opacity = `${opacity}`;
      }

      // KEINE Container-Skalierung mehr - feste Größe
      containerRef.current.style.transform = 'scale(1)';

      // KEINE Audio overlay effects mehr - Overlay bleibt unsichtbar
      const overlay = containerRef.current.querySelector('.audio-overlay') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transform = 'scale(1)';
        overlay.style.background = 'transparent';
      }

      console.log('[Unicorn Beam Audio Visualizer] Applied audio data:', {
        intensity: intensity.toFixed(3),
        volume: normalizedVolume.toFixed(3),
        lowAvg: lowAvg.toFixed(3),
        midAvg: midAvg.toFixed(3),
        highAvg: highAvg.toFixed(3)
      });
    } catch (error) {
      console.error('[Unicorn Beam Audio Visualizer] Error applying audio to Unicorn:', error);
    }
  }, [isUnicornReady]);

  // Animation loop
  const animate = useCallback(() => {
    if (isActive) {
      const audioData = calculateIntensity();
      // Only animate if there's actual audio activity (intensity > 0.01)
      if (audioData.intensity > 0.01) {
        applyAudioToUnicorn(audioData);
      } else {
        // Reset to default state when no audio
        resetToDefault();
      }
    } else {
      // No audio activity, reset to default
      resetToDefault();
    }
    
    requestAnimationFrame(animate);
  }, [isActive, calculateIntensity, applyAudioToUnicorn]);

  // Reset to default state
  const resetToDefault = useCallback(() => {
    if (!containerRef.current) return;
    
    // Reset container scale
    containerRef.current.style.transform = 'scale(1)';
    
    // Reset Unicorn element - feste Werte ohne Audio-Reaktion
    const unicornElement = containerRef.current.querySelector('[data-us-project]') as HTMLElement;
    if (unicornElement) {
      unicornElement.style.transform = 'translate(-50%, -50%) scale(1)';
      unicornElement.style.filter = 'brightness(1.0) saturate(1) hue-rotate(0deg) blur(0px) contrast(1)';
      unicornElement.style.opacity = '1.0'; // Volle Opacity
    }
    
    // Reset overlay - bleibt unsichtbar
    const overlay = containerRef.current.querySelector('.audio-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(1)';
      overlay.style.background = 'transparent';
    }
  }, []);

  // Load Unicorn Studio script - robuste Version
  useEffect(() => {
    const loadUnicornStudio = async () => {
      // Prüfe ob Unicorn Studio bereits verfügbar ist
      if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
        try {
          await initializeUnicornStudio();
          return;
        } catch (error) {
          console.error('[Unicorn Beam Audio Visualizer] Initialization error:', error);
        }
      }

      // Prüfe ob Script bereits geladen ist
      const existingScript = document.querySelector('script[src="/unicornStudio.umd.js"]');
      if (existingScript) {
        // Script existiert, warte auf Initialisierung
        const checkUnicornStudio = () => {
          if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
            initializeUnicornStudio();
          } else {
            setTimeout(checkUnicornStudio, 50);
          }
        };
        checkUnicornStudio();
        return;
      }

      // Lade UnicornStudio Script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '/unicornStudio.umd.js';
      script.async = true;
      script.onload = async () => {
        // Warte kurz, damit das Script vollständig geladen ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const checkUnicornStudio = () => {
          if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
            initializeUnicornStudio();
          } else {
            setTimeout(checkUnicornStudio, 50);
          }
        };
        checkUnicornStudio();
      };
      script.onerror = () => {
        console.warn('[Unicorn Beam Audio Visualizer] Failed to load UnicornStudio script');
        setIsUnicornReady(true);
      };
      
      document.head.appendChild(script);
    };

    // Sofortige Initialisierung
    loadUnicornStudio();
    
    // Fallback: Nach 1 Sekunde isUnicornReady auf true setzen
    const fallbackTimer = setTimeout(() => {
      if (!isUnicornReady) {
        console.warn('[Unicorn Beam Audio Visualizer] Fallback: Setting isUnicornReady to true');
        setIsUnicornReady(true);
      }
    }, 1000);

    return () => clearTimeout(fallbackTimer);
  }, [initializeUnicornStudio, isUnicornReady]);

  // Start/stop animation
  useEffect(() => {
    if (isUnicornReady) {
      animate();
    } else {
      resetToDefault();
    }
  }, [isUnicornReady, animate, resetToDefault]);

  // Sofortige Initialisierung - auch ohne Unicorn Studio
  useEffect(() => {
    // Setze isUnicornReady sofort auf true für sofortige Sichtbarkeit
    setIsUnicornReady(true);
    
    // Versuche Unicorn Studio zu laden
    const loadUnicornStudio = async () => {
      // Warte kurz, damit das DOM-Element gerendert ist
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
        try {
          const scenes = await window.UnicornStudio.init();
          setUnicornScenes(scenes);
          console.log('[Unicorn Beam Audio Visualizer] Unicorn Studio initialized:', scenes);
        } catch (error) {
          console.error('[Unicorn Beam Audio Visualizer] Initialization error:', error);
        }
      } else {
        // Unicorn Studio nicht verfügbar, aber Animation trotzdem sichtbar machen
        console.log('[Unicorn Beam Audio Visualizer] Unicorn Studio not available, using fallback');
      }
    };
    
    loadUnicornStudio();
  }, []);

  // Zusätzlicher Effect für Navigation - stelle sicher, dass Animation sichtbar ist
  useEffect(() => {
    // Bei jedem Mount/Update der Komponente sicherstellen, dass Animation sichtbar ist
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const unicornElement = containerRef.current.querySelector('[data-us-project]') as HTMLElement;
        if (unicornElement) {
          // Stelle sicher, dass das Element sichtbar ist
          unicornElement.style.opacity = '1.0';
          unicornElement.style.transform = 'translate(-50%, -50%) scale(1)';
          unicornElement.style.filter = 'brightness(1.0) saturate(1) hue-rotate(0deg) blur(0px) contrast(1)';
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  });

  // Force Unicorn Studio to initialize on component mount
  useEffect(() => {
    const forceInitialize = () => {
      // Force Unicorn Studio to initialize by triggering a custom event
      if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
        window.UnicornStudio.init().then((scenes) => {
          setUnicornScenes(scenes);
          setIsUnicornReady(true);
          console.log('[Unicorn Beam Audio Visualizer] Force initialized:', scenes);
        }).catch((error) => {
          console.error('[Unicorn Beam Audio Visualizer] Force initialization error:', error);
          setIsUnicornReady(true);
        });
      } else {
        // If Unicorn Studio is not available, set ready anyway
        setIsUnicornReady(true);
      }
    };

    // Try to initialize immediately
    forceInitialize();

    // Also try after a short delay
    const delayTimer = setTimeout(forceInitialize, 200);

    return () => clearTimeout(delayTimer);
  }, []);

  // Additional effect to force visibility on every render
  useEffect(() => {
    const forceVisibility = () => {
      if (containerRef.current) {
        const unicornElement = containerRef.current.querySelector('[data-us-project]') as HTMLElement;
        if (unicornElement) {
          // Force visibility with multiple approaches - feste Werte ohne Audio-Reaktion
          unicornElement.style.opacity = '1.0';
          unicornElement.style.visibility = 'visible';
          unicornElement.style.display = 'block';
          unicornElement.style.transform = 'translate(-50%, -50%) scale(1)';
          unicornElement.style.filter = 'brightness(1.0) saturate(1) hue-rotate(0deg) blur(0px) contrast(1)';
          
          // Also force all child elements to be visible
          const childElements = unicornElement.querySelectorAll('*');
          childElements.forEach((child) => {
            (child as HTMLElement).style.opacity = '1.0';
            (child as HTMLElement).style.visibility = 'visible';
            (child as HTMLElement).style.display = 'block';
          });
        }
      }
    };

    // Force visibility immediately
    forceVisibility();

    // Also force visibility after a short delay
    const timer = setTimeout(forceVisibility, 100);

    return () => clearTimeout(timer);
  });

  return (
    <div 
      ref={containerRef}
      className={`unicorn-beam-audio-visualizer ${className}`}
      style={{
        position: 'relative',
        width: sizeConfig[size].width,
        height: sizeConfig[size].height,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        // Ensure perfect circle clipping
        clipPath: 'circle(50%)',
        // Smooth transitions for container scaling
        transition: 'transform 0.1s ease-out',
        // Ensure it fits well as button background
        minWidth: '100px',
        minHeight: '100px'
      }}
    >
      {/* Unicorn Studio Canvas - Audio Visualizer */}
      <div
        ref={(el) => {
          if (el) {
            // Force immediate visibility - feste Werte ohne Audio-Reaktion
            el.style.opacity = '1.0';
            el.style.transform = 'translate(-50%, -50%) scale(1)';
            el.style.filter = 'brightness(1.0) saturate(1) hue-rotate(0deg) blur(0px) contrast(1)';
          }
        }}
        data-us-project="lbkncvMlEHU6OuLb2UyF"
        data-us-scale="1"
        data-us-dpi="1.5"
        data-us-lazyload="false"
        data-us-production="true"
        data-us-fps="60"
        data-us-alttext="Audio Visualizer Unicorn Szene"
        data-us-arialabel="Interaktive 3D Audio Visualizer mit Unicorn Studio"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          transformOrigin: 'center center',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 1,
          opacity: '1.0',
          // WICHTIG: Diese transition: none !important; Einstellung beibehalten
          transition: 'none !important'
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
          borderRadius: '50%',
          overflow: 'hidden',
          // Audio Overlay Transition wie in Optik-Beschreibung
          transition: 'all 0.1s ease-out'
        }}
      />
      
      <style>{`
        .unicorn-beam-audio-visualizer {
          position: relative;
          width: 260px;
          height: 260px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          /* Ensure perfect circle clipping */
          clip-path: circle(50%);
        }

        .audio-overlay {
          transition: all 0.1s ease-out;
          border-radius: 50%;
          overflow: hidden;
        }

        /* Force Unicorn Studio element to stay centered and clipped */
        .unicorn-beam-audio-visualizer [data-us-project] {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          transform-origin: center center !important;
          width: 260px !important;
          height: 260px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
          z-index: 1 !important;
          opacity: 1.0 !important;
          transition: none !important;
          visibility: visible !important;
          display: block !important;
        }

        /* Force all child elements to be visible */
        .unicorn-beam-audio-visualizer [data-us-project] * {
          opacity: 1.0 !important;
          visibility: visible !important;
          display: block !important;
        }

        /* Ensure all child elements are clipped to circle */
        .unicorn-beam-audio-visualizer * {
          border-radius: 50%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default UnicornBeamAudioVisualizer;
