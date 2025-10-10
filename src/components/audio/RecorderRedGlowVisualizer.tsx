import { useEffect, useRef } from 'react';

interface RecorderRedGlowVisualizerProps {
  frequencies: number[];
  volume: number;
  isActive: boolean;
}

export const RecorderRedGlowVisualizer = ({ 
  frequencies, 
  volume, 
  isActive 
}: RecorderRedGlowVisualizerProps) => {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  // Escalation levels for the visualizer (matching the HTML example)
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
    for (let i = 0; i < 20; i++) {
      createParticle();
    }
    
    isInitializedRef.current = true;
  };

  // Create floating particles
  const createParticle = () => {
    if (!visualizerRef.current) return;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    // Particle size between 2-4px
    const size = Math.floor(Math.random() * 3) + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    visualizerRef.current.appendChild(particle);
    
    particlesRef.current.push(particle);
    
    // Random initial position
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 100 + 20;
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
      mainGlow.style.background = 'transparent';
      
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
      // Random movement for each particle
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100 + 20;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      // Random duration for more dynamic movement
      const duration = Math.random() * 2000 + 1000;
      
      // Animate with CSS transitions for smoother movement
      particle.style.transition = `transform ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`;
      particle.style.transform = `translate(${x}px, ${y}px)`;
      particle.style.opacity = `${Math.random() * 0.7}`;
    });
  };

  // Main visualization function - responsive to real-time audio data
  const visualize = () => {
    if (!visualizerRef.current) {
      return;
    }
    
    // Calculate visualization intensity based on volume and frequencies
    const normalizedVolume = volume;
    
    // Calculate average frequency for more dynamic visualization
    let sum = 0;
    for (let i = 0; i < frequencies.length; i++) {
      sum += frequencies[i];
    }
    const averageFrequency = sum / frequencies.length;
    
    // Mix volume with frequency data for more dynamic visualization
    // Increased sensitivity by 30%: stronger amplification of input values
    const amplifiedVolume = Math.min(normalizedVolume * 1.95, 1); // Increased by 30%: 1.5 * 1.3 = 1.95
    const amplifiedFrequency = Math.min(averageFrequency * 1.56, 1); // Increased by 30%: 1.2 * 1.3 = 1.56
    const intensity = amplifiedVolume * 0.8 + amplifiedFrequency * 0.2;
    
    // Determine escalation level (0-5) with increased sensitivity
    // Use a more responsive scaling function
    const scaledIntensity = Math.pow(intensity, 0.75); // More aggressive power curve (0.75 instead of 0.8)
    const level = Math.min(Math.floor(scaledIntensity * 6.5), 5); // Increased multiplier by 30%: 5 * 1.3 = 6.5
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
      if (isActive && Date.now() % 200 < 50) {
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
    };
  }, []);

  // Handle visualization updates
  useEffect(() => {
    // Cancel any existing animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const animate = () => {
      if (isActive) {
        // Visualize based on real-time audio data
        visualize();
      } else {
        // Run idle animation when not active
        idleAnimation();
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequencies, volume, isActive]);

  return (
    <div 
      ref={visualizerRef} 
      id="visualizer"
      className="relative flex justify-center items-center overflow-visible pointer-events-none w-full h-[60px]"
    >
      <div 
        id="visualizer-container"
        className="absolute"
        style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '60px',
          height: '60px',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
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
          height: 60px;
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
          width: 20px;
          height: 20px;
          background: #FFF2D0;
          box-shadow: 0 0 15px 8px #FF2B17;
          border-radius: 50%;
        }

        #halo {
          width: 40px;
          height: 40px;
          background: #FF3A20;
          box-shadow: 0 0 30px 15px #FF6A30;
          opacity: 0.3;
          border-radius: 50%;
        }

        #secondary-glow {
          width: 15px;
          height: 15px;
          background: #E03A2A;
          box-shadow: 0 0 10px 5px #FF6A30;
          opacity: 0;
          border-radius: 50%;
        }

        .inner-glow {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #FFF2D0;
          border-radius: 50%;
          filter: blur(4px);
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