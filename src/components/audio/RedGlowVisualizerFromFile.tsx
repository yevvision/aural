import { useEffect, useRef } from 'react';

interface RedGlowVisualizerFromFileProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export const RedGlowVisualizerFromFile = ({ 
  audioElement, 
  isPlaying 
}: RedGlowVisualizerFromFileProps) => {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

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
      analyserRef.current.fftSize = 32; // Match the HTML example
      
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

  // Create floating particles
  const createParticle = () => {
    if (!visualizerRef.current) return;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 8 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    visualizerRef.current.appendChild(particle);
    
    particlesRef.current.push(particle);
    
    // Random initial position
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 60 + 20;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    particle.style.transform = `translate(${x}px, ${y}px)`;
    
    return particle;
  };

  // Animate particles
  const animateParticle = (particle: HTMLDivElement) => {
    const duration = Math.random() * 5000 + 3000;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 60 + 20;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    // Simple animation without anime.js
    particle.style.transition = `all ${duration}ms ease-in-out`;
    particle.style.transform = `translate(${x}px, ${y}px)`;
    particle.style.opacity = `${Math.random() * 0.4}`;
    
    // Schedule next animation
    setTimeout(() => {
      if (isPlaying) {
        animateParticle(particle);
      }
    }, duration);
  };

  // Initialize visualizer
  const initVisualizer = () => {
    if (!visualizerRef.current) return;
    
    // Clear existing particles
    particlesRef.current.forEach(particle => particle.remove());
    particlesRef.current = [];
    
    // Create particles
    for (let i = 0; i < 20; i++) {
      const particle = createParticle();
      if (particle) {
        // Start animation for each particle
        setTimeout(() => animateParticle(particle), i * 100);
      }
    }
  };

  // Main visualization loop
  const visualize = () => {
    if (!analyserRef.current || !visualizerRef.current || !isPlaying) {
      return;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const normalized = average / 255;
    
    // Update visuals based on audio
    const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLElement;
    const halo = visualizerRef.current.querySelector('#halo') as HTMLElement;
    const secondaryGlow = visualizerRef.current.querySelector('#secondary-glow') as HTMLElement;
    const particles = visualizerRef.current.querySelectorAll('.particle');
    
    if (mainGlow && halo && secondaryGlow) {
      // Morph shape based on volume
      const morphFactor = normalized * 10;
      const distortion = Math.sin(Date.now() * 0.01) * morphFactor;
      
      mainGlow.style.borderRadius = `${50 + distortion}% ${50 - distortion}% ${50 + distortion}% ${50 - distortion}%`;
      mainGlow.style.transform = `scale(${1 + normalized * 2}) rotate(${distortion}deg)`;
      mainGlow.style.filter = `blur(${8 + normalized * 30}px)`;
      
      halo.style.borderRadius = `${50 + distortion}% ${50 - distortion}% ${50 + distortion}% ${50 - distortion}%`;
      halo.style.transform = `scale(${1 + normalized * 1.5}) rotate(${-distortion * 0.5}deg)`;
      halo.style.filter = `blur(${15 + normalized * 60}px)`;
      halo.style.opacity = `${0.3 + normalized * 0.7}`;
      
      // Secondary glow appears with higher volumes
      if (normalized > 0.3) {
        secondaryGlow.style.opacity = `${(normalized - 0.3) * 1.5}`;
        secondaryGlow.style.transform = `scale(${1 + (normalized - 0.3) * 3}) rotate(${distortion * 0.3}deg)`;
        secondaryGlow.style.borderRadius = `${50 + distortion}% ${50 - distortion}% ${50 + distortion}% ${50 - distortion}%`;
      } else {
        secondaryGlow.style.opacity = '0';
      }
      
      // Particles react to different frequencies
      particles.forEach((particle, i) => {
        const freqIndex = i % dataArray.length;
        const particleScale = dataArray[freqIndex] / 255;
        
        if (particleScale > 0.1) {
          (particle as HTMLElement).style.opacity = `${particleScale * 0.8}`;
          (particle as HTMLElement).style.transform = `scale(${1 + particleScale * 3})`;
        } else {
          (particle as HTMLElement).style.opacity = '0';
        }
      });
    }
    
    animationRef.current = requestAnimationFrame(visualize);
  };

  // Idle animation when no sound
  const idleAnimation = () => {
    if (!visualizerRef.current) return;
    
    const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLElement;
    const halo = visualizerRef.current.querySelector('#halo') as HTMLElement;
    
    if (mainGlow && halo) {
      // Simple idle animation with CSS transitions
      const progress = (Date.now() % 6000) / 6000; // 6 second cycle
      const scale = 0.8 + 0.4 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
      
      mainGlow.style.transition = 'transform 3s ease-in-out';
      mainGlow.style.transform = `scale(${scale})`;
      
      halo.style.transition = 'opacity 5s ease-in-out';
      halo.style.opacity = `${0.2 + 0.2 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2))}`;
    }
  };

  // Setup and cleanup
  useEffect(() => {
    // Initialize visualizer
    initVisualizer();
    
    return () => {
      // Clean up animation frame
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
      
      // Clean up particles
      particlesRef.current.forEach(particle => particle.remove());
      particlesRef.current = [];
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
      }
    } else {
      // Run idle animation when not playing
      idleAnimation();
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
      className="relative flex justify-center items-center overflow-visible pointer-events-none w-full h-[60px]"
    >
      <div id="main-glow" className="glow-core"></div>
      <div id="halo" className="glow-core"></div>
      <div id="secondary-glow" className="glow-core"></div>
      
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
          left: calc(50% - 20px);
          top: calc(50% - 20px);
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
        
        .particle {
          position: absolute;
          border-radius: 50%;
          background: #FF6A30;
          filter: blur(1px);
          mix-blend-mode: screen;
          opacity: 0;
          width: 1px;
          height: 1px;
        }
      `}</style>
    </div>
  );
};