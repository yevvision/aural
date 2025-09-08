import { useEffect, useRef } from 'react';

interface AudioFileVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export const AudioFileVisualizer = ({ audioElement, isPlaying }: AudioFileVisualizerProps) => {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  // Escalation levels for the visualizer
  const ESCALATION_LEVELS = [
    { // Level 0: Silent
      mainGlow: { scale: 1, blur: 8, color: 'transparent' },
      innerGlow: { opacity: 0, scale: 1, color: '#FFF2D0' },
      halo: { opacity: 0.1, scale: 1, blur: 15 },
      secondaryGlow: { opacity: 0 },
      particles: { opacity: 0 },
      spikes: { opacity: 0 }
    },
    { // Level 1: Low
      mainGlow: { scale: 2, blur: 25, color: '#FF2B17' },
      innerGlow: { opacity: 0.2, scale: 1.5, color: '#FFF2D0' },
      halo: { opacity: 0.4, scale: 1.5, blur: 30 },
      secondaryGlow: { opacity: 0 },
      particles: { opacity: 0.3 },
      spikes: { opacity: 0.1 }
    },
    { // Level 2: Medium
      mainGlow: { scale: 5, blur: 45, color: '#FF2B17' },
      innerGlow: { opacity: 0.4, scale: 3, color: '#FFF2D0' },
      halo: { opacity: 0.7, scale: 3, blur: 60 },
      secondaryGlow: { opacity: 0.3 },
      particles: { opacity: 0.5 },
      spikes: { opacity: 0.3 }
    },
    { // Level 3: High
      mainGlow: { scale: 7, blur: 60, color: '#FF2B17' },
      innerGlow: { opacity: 0.6, scale: 4, color: '#FFF2D0' },
      halo: { opacity: 0.9, scale: 4, blur: 100 },
      secondaryGlow: { opacity: 0.6 },
      particles: { opacity: 0.7 },
      spikes: { opacity: 0.6 }
    },
    { // Level 4: Very High
      mainGlow: { scale: 9, blur: 100, color: '#FF2B17' },
      innerGlow: { opacity: 0.8, scale: 5, color: '#FFFFFF' },
      halo: { opacity: 1, scale: 5, blur: 140 },
      secondaryGlow: { opacity: 0.8 },
      particles: { opacity: 0.9 },
      spikes: { opacity: 0.8 }
    },
    { // Level 5: Extreme
      mainGlow: { scale: 12, blur: 150, color: '#FFFFFF' },
      innerGlow: { opacity: 1, scale: 6, color: '#FFFFFF' },
      halo: { opacity: 1, scale: 7, blur: 200 },
      secondaryGlow: { opacity: 1 },
      particles: { opacity: 1 },
      spikes: { opacity: 1 }
    }
  ];

  // Initialize the visualizer
  const initVisualizer = () => {
    if (isInitializedRef.current) return;
    
    if (!visualizerRef.current) return;
    
    // Create particles
    particlesRef.current = [];
    for (let i = 0; i < 30; i++) {
      createParticle();
    }
    
    isInitializedRef.current = true;
  };

  // Create floating particles
  const createParticle = () => {
    if (!visualizerRef.current) return;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    // Particle size between 2-5px
    const size = Math.floor(Math.random() * 4) + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    visualizerRef.current.appendChild(particle);
    
    particlesRef.current.push(particle);
    
    // Random initial position - extended range
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 180 + 40; // Extended distance
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    particle.style.transform = `translate(${x}px, ${y}px)`;
  };

  // Reset visualizer to initial state
  const resetVisualizer = () => {
    if (!visualizerRef.current) return;
    
    const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLElement;
    const halo = visualizerRef.current.querySelector('#halo') as HTMLElement;
    const secondaryGlow = visualizerRef.current.querySelector('#secondary-glow') as HTMLElement;
    const innerGlow = visualizerRef.current.querySelector('#inner-glow') as HTMLElement;
    
    if (mainGlow && halo && secondaryGlow && innerGlow) {
      // Apply level 0 (silent)
      const silentState = ESCALATION_LEVELS[0];
      
      mainGlow.style.transition = 'all 0.5s ease-out';
      mainGlow.style.transform = `scale(${silentState.mainGlow.scale})`;
      mainGlow.style.filter = `blur(${silentState.mainGlow.blur}px)`;
      mainGlow.style.background = 'transparent'; // Explicitly set to transparent
      
      halo.style.transition = 'all 0.5s ease-out';
      halo.style.transform = `scale(${silentState.halo.scale})`;
      halo.style.filter = `blur(${silentState.halo.blur}px)`;
      halo.style.opacity = `${silentState.halo.opacity}`;
      
      innerGlow.style.transition = 'all 0.5s ease-out';
      innerGlow.style.opacity = `${silentState.innerGlow.opacity}`;
      innerGlow.style.transform = `scale(${silentState.innerGlow.scale})`;
      
      secondaryGlow.style.transition = 'all 0.5s ease-out';
      secondaryGlow.style.opacity = `${silentState.secondaryGlow.opacity}`;
      
      // Reset particles
      particlesRef.current.forEach(particle => {
        particle.style.opacity = '0';
      });
    }
  };

  // Animate particles with more frequent movement
  const animateParticles = () => {
    particlesRef.current.forEach(particle => {
      // Random movement for each particle - extended range
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 180 + 40; // Extended distance
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      // Random duration for more dynamic movement
      const duration = Math.random() * 2000 + 1000;
      
      // Animate with CSS transitions for smoother movement
      particle.style.transition = `transform ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`;
      particle.style.transform = `translate(${x}px, ${y}px)`;
      particle.style.opacity = `${Math.random() * 0.7}`; // Increased opacity
    });
  };

  // Initialize audio analyzer for the audio element
  const initializeAudioAnalyzer = () => {
    if (!audioElement || !visualizerRef.current) return false;
    
    try {
      // Clean up any existing analyzer
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Create source from audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  };

  // Main visualization function - responsive to real-time audio data
  const visualize = () => {
    if (!visualizerRef.current || !analyserRef.current) {
      return;
    }
    
    try {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedVolume = rms / 255;

      // Convert to frequencies array
      const frequencies = Array.from(dataArray).map(value => value / 255);
      
      // Calculate average frequency for more dynamic visualization
      let sumFreq = 0;
      for (let i = 0; i < frequencies.length; i++) {
        sumFreq += frequencies[i];
      }
      const averageFrequency = sumFreq / frequencies.length;
      
      // Mix volume with frequency data for more dynamic visualization
      const intensity = normalizedVolume * 0.7 + averageFrequency * 0.3;
      
      // Determine escalation level (0-5) with appropriate sensitivity
      const level = Math.min(Math.floor(intensity * 7), 5);
      const levelConfig = ESCALATION_LEVELS[level];
      
      // Update visuals based on escalation level
      const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLElement;
      const halo = visualizerRef.current.querySelector('#halo') as HTMLElement;
      const secondaryGlow = visualizerRef.current.querySelector('#secondary-glow') as HTMLElement;
      const innerGlow = visualizerRef.current.querySelector('#inner-glow') as HTMLElement;
      
      if (mainGlow && halo && secondaryGlow && innerGlow) {
        // Morph shape based on intensity with frequent changes
        const morphFactor = intensity * 15;
        const distortion = Math.sin(Date.now() * 0.003) * morphFactor;
        
        // Apply level configurations with fast transitions
        mainGlow.style.transition = 'all 0.1s ease-out';
        mainGlow.style.borderRadius = `${50 + distortion}% ${50 - distortion}% ${50 + distortion}% ${50 - distortion}%`;
        mainGlow.style.transform = `scale(${levelConfig.mainGlow.scale}) rotate(${distortion}deg)`;
        mainGlow.style.filter = `blur(${levelConfig.mainGlow.blur}px)`;
        mainGlow.style.background = levelConfig.mainGlow.color;
        
        halo.style.transition = 'all 0.1s ease-out';
        halo.style.borderRadius = `${50 + distortion}% ${50 - distortion}% ${50 + distortion}% ${50 - distortion}%`;
        halo.style.transform = `scale(${levelConfig.halo.scale}) rotate(${-distortion * 0.5}deg)`;
        halo.style.filter = `blur(${levelConfig.halo.blur}px)`;
        halo.style.opacity = `${levelConfig.halo.opacity}`;
        
        // Inner glow gets brighter and whiter with intensity
        innerGlow.style.transition = 'all 0.1s ease-out';
        innerGlow.style.opacity = `${levelConfig.innerGlow.opacity}`;
        innerGlow.style.transform = `scale(${levelConfig.innerGlow.scale})`;
        innerGlow.style.background = levelConfig.innerGlow.color;
        innerGlow.style.boxShadow = `0 0 ${10 + intensity * 50}px ${5 + intensity * 25}px ${levelConfig.innerGlow.color}`;
        
        // Secondary glow appears with higher intensities
        secondaryGlow.style.transition = 'all 0.1s ease-out';
        secondaryGlow.style.opacity = `${levelConfig.secondaryGlow.opacity}`;
        if (levelConfig.secondaryGlow.opacity > 0) {
          secondaryGlow.style.transform = `scale(${1 + (intensity - 0.3) * 4}) rotate(${distortion * 0.3}deg)`;
          secondaryGlow.style.borderRadius = `${50 + distortion}% ${50 - distortion}% ${50 + distortion}% ${50 - distortion}%`;
        }
        
        // Animate particles for more dynamic effect
        if (isPlaying && Date.now() % 200 < 50) {
          animateParticles();
        }
        
        // Particles react to different frequencies and intensity levels
        particlesRef.current.forEach((particle, i) => {
          const freqIndex = i % frequencies.length;
          const particleScale = frequencies[freqIndex];
          
          if (particleScale > 0.1) {
            particle.style.transition = 'all 0.2s ease-out';
            particle.style.opacity = `${levelConfig.particles.opacity * particleScale}`;
            particle.style.transform = `scale(${1 + particleScale * intensity * 5})`;
            particle.style.background = level >= 5 ? '#FFFFFF' : '#FF6A30';
          } else {
            particle.style.opacity = '0';
          }
        });
      }
    } catch (error) {
      console.error('Error in visualization:', error);
    }
    
    animationRef.current = requestAnimationFrame(visualize);
  };

  // Idle animation when no sound
  const idleAnimation = () => {
    if (!visualizerRef.current) return;
    
    const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLDivElement;
    const halo = visualizerRef.current.querySelector('#halo') as HTMLDivElement;
    const innerGlow = visualizerRef.current.querySelector('#inner-glow') as HTMLDivElement;
    
    if (mainGlow && halo && innerGlow) {
      // Simple idle animation with CSS transitions
      const progress = (Date.now() % 6000) / 6000; // 6 second cycle
      const scale = 0.8 + 0.4 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
      
      mainGlow.style.transition = 'transform 3s ease-in-out';
      mainGlow.style.transform = `scale(${scale})`;
      
      halo.style.transition = 'opacity 5s ease-in-out';
      halo.style.opacity = `${0.2 + 0.2 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2))}`;
      
      innerGlow.style.transition = 'opacity 2s ease-in-out';
      innerGlow.style.opacity = `${0.3 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2))}`;
    }
  };

  // Setup and cleanup
  useEffect(() => {
    initVisualizer();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Clean up audio context
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  // Handle audio element and playback state changes
  useEffect(() => {
    // Cancel any existing animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (isPlaying && audioElement) {
      // Initialize audio analyzer
      const initialized = initializeAudioAnalyzer();
      if (initialized) {
        // Start visualization
        visualize();
      } else {
        // If initialization failed, run idle animation
        idleAnimation();
        animationRef.current = requestAnimationFrame(() => {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          idleAnimation();
        });
      }
    } else {
      // Reset to initial state
      resetVisualizer();
      
      // Run idle animation when not playing
      idleAnimation();
      animationRef.current = requestAnimationFrame(() => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        idleAnimation();
      });
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isPlaying]);

  return (
    <div 
      ref={visualizerRef} 
      id="visualizer"
      className="absolute inset-0 flex justify-center items-center overflow-visible pointer-events-none"
      style={{ 
        position: 'absolute',
        width: '500vw',
        height: '500vw',
        left: '-250vw',
        top: '-250vw',
        zIndex: -1
      }}
    >
      <div 
        id="visualizer-container"
        className="absolute"
        style={{ 
          position: 'absolute',
          top: 'calc(50% - 15px)',  // Shifted up by 15px
          left: 'calc(50% - 15px)', // Shifted left by 15px
          width: '200px',  // Reduced by 50% from 400px
          height: '200px', // Reduced by 50% from 400px
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        <div id="main-glow" className="glow-core"></div>
        <div id="halo" className="glow-core"></div>
        <div id="secondary-glow" className="glow-core"></div>
        <div id="inner-glow" className="inner-glow"></div>
      </div>
      
      <style>{`
        #visualizer {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
          pointer-events: none;
        }

        .glow-core {
          position: absolute;
          filter: blur(8px);
          mix-blend-mode: screen;
          transition: all 0.1s ease-out;
          will-change: transform, border-radius;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        #main-glow {
          width: 40px;
          height: 40px;
          background: #FFF2D0;
          box-shadow: 0 0 30px 15px #FF2B17;
          border-radius: 50%;
        }

        #halo {
          width: 100px;
          height: 100px;
          background: #FF3A20;
          box-shadow: 0 0 60px 30px #FF6A30;
          opacity: 0.3;
          border-radius: 50%;
        }

        #secondary-glow {
          width: 25px;
          height: 25px;
          background: #E03A2A;
          box-shadow: 0 0 20px 10px #FF6A30;
          opacity: 0;
          border-radius: 50%;
        }

        .inner-glow {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #FFF2D0;
          border-radius: 50%;
          filter: blur(8px);
          mix-blend-mode: screen;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: #FF6A30;
          filter: blur(1px);
          mix-blend-mode: screen;
          opacity: 0;
          width: 2px;
          height: 2px;
        }
      `}</style>
    </div>
  );
};