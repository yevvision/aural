import { useEffect, useRef } from 'react';
import type { AudioTrack } from '../../types';

interface RedGlowVisualizerProps {
  track: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  frequencies?: number[];
  volume?: number;
  isActive?: boolean;
}

export const RedGlowVisualizer = ({ track, isPlaying, currentTime, duration, frequencies, volume, isActive }: RedGlowVisualizerProps) => {
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

  // Main visualization loop - more responsive to sound changes
  const visualize = () => {
    if (!visualizerRef.current || !isPlaying || (duration > 0 && currentTime >= duration)) {
      // Stop visualization
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      
      // Reset to initial state if not playing or track ended
      if (!isPlaying || (duration > 0 && currentTime >= duration)) {
        resetVisualizer();
      }
      
      return;
    }
    
    // Use real audio data if available, otherwise fall back to simulated data
    let audioData: number[];
    let normalizedVolume: number;
    let isAudioActive: boolean;
    
    if (frequencies && volume !== undefined && isActive !== undefined) {
      // Use real audio data
      audioData = frequencies;
      normalizedVolume = volume;
      isAudioActive = isActive;
    } else {
      // Fall back to simulated data
      const progress = duration > 0 ? currentTime / duration : 0;
      
      // Create more dynamic simulated audio data for frequent up/down movements
      const simulatedData = new Uint8Array(16);
      for (let i = 0; i < simulatedData.length; i++) {
        // Create rapid variation based on time for frequent movements
        const variation = Math.sin(Date.now() * 0.005 + i * 0.3) * 0.5 + 0.5;
        // Mix progress with rapid variation for more dynamic visualization
        simulatedData[i] = Math.floor((progress * 0.2 + variation * 0.8) * 255);
      }
      
      audioData = Array.from(simulatedData).map(value => value / 255);
      
      // Calculate average "volume" from simulated data
      let sum = 0;
      for (let i = 0; i < simulatedData.length; i++) {
        sum += simulatedData[i];
      }
      const average = sum / simulatedData.length;
      normalizedVolume = average / 255;
      isAudioActive = isPlaying && normalizedVolume > 0.01;
    }
    
    // Calculate average frequency for more dynamic visualization
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i];
    }
    const averageFrequency = sum / audioData.length;
    
    // Mix volume with frequency data for more dynamic visualization
    const intensity = normalizedVolume * 0.7 + averageFrequency * 0.3;
    
    // Determine escalation level (0-5) with more sensitivity
    const level = Math.min(Math.floor(intensity * 7), 5); // More sensitive scaling
    const levelConfig = ESCALATION_LEVELS[level];
    
    // Update visuals based on escalation level
    const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLElement;
    const halo = visualizerRef.current.querySelector('#halo') as HTMLElement;
    const secondaryGlow = visualizerRef.current.querySelector('#secondary-glow') as HTMLElement;
    const innerGlow = visualizerRef.current.querySelector('#inner-glow') as HTMLElement;
    
    if (mainGlow && halo && secondaryGlow && innerGlow) {
      // Morph shape based on intensity with frequent changes
      const morphFactor = intensity * 20; // Increased morph factor
      const distortion = Math.sin(Date.now() * 0.005) * morphFactor; // Faster morphing
      
      // Apply level configurations with faster transitions
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
      if (isAudioActive && Date.now() % 200 < 50) { // Animate particles more frequently
        animateParticles();
      }
      
      // Particles react to different frequencies and intensity levels
      particlesRef.current.forEach((particle, i) => {
        const freqIndex = i % audioData.length;
        const particleScale = audioData[freqIndex];
        
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
    
    animationRef.current = requestAnimationFrame(visualize);
  };

  // Idle animation when no sound
  const idleAnimation = () => {
    if (!visualizerRef.current || isPlaying) return;
    
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
      
      // Only continue idle animation if not playing
      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(idleAnimation);
      }
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

  // Handle playback state changes
  useEffect(() => {
    // If we have real audio data, trigger visualization on data changes
    if (frequencies && volume !== undefined && isActive !== undefined) {
      // Cancel any existing animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Trigger visualization with real data
      visualize();
    } else if (isPlaying && currentTime < duration) {
      // Cancel any existing animation frame before starting new one
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      visualize();
    } else {
      // Cancel any existing animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // If track ended or not playing, reset to initial state
      if ((duration > 0 && currentTime >= duration) || !isPlaying) {
        resetVisualizer();
      }
      
      // Only run idle animation if not playing
      if (!isPlaying) {
        idleAnimation();
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, frequencies, volume, isActive]);

  // Track playback completion
  useEffect(() => {
    // Reset visualizer when track finishes playing
    if (duration > 0 && currentTime >= duration) {
      resetVisualizer();
    }
  }, [currentTime, duration]);

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
    </div>
  );
};