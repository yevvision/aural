import { useEffect, useRef } from 'react';

interface EnhancedAudioVisualizerProps {
  audioElement?: HTMLAudioElement | null;
  isPlaying?: boolean;
  frequencies?: number[];
  volume?: number;
  isActive?: boolean;
}

export const EnhancedAudioVisualizer = ({ 
  audioElement, 
  isPlaying, 
  frequencies = [], 
  volume = 0, 
  isActive = false 
}: EnhancedAudioVisualizerProps) => {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Escalation levels inspired by dynamic_background_6_states.html - more sensitive and brighter
  const ESCALATION_LEVELS = [
    { // Level 0: Silent - sehr subtil aber sichtbar
      mainGlow: { scale: 1.2, blur: 12, color: '#FF2B17' },
      innerGlow: { opacity: 0.1, scale: 1.2, color: '#FFF2D0' },
      halo: { opacity: 0.15, scale: 1.2, blur: 20 },
      secondaryGlow: { opacity: 0 },
      organicBlob: { opacity: 0.1, scale: 1.1, hue: 12, saturation: 85, lightness: 50 },
      wanderingBlob: { opacity: 0.05, scale: 1.5, hue: 14, saturation: 80, lightness: 45 }
    },
    { // Level 1: Low - leise Rede
      mainGlow: { scale: 2.5, blur: 30, color: '#FF2B17' },
      innerGlow: { opacity: 0.3, scale: 1.8, color: '#FFF2D0' },
      halo: { opacity: 0.5, scale: 2, blur: 40 },
      secondaryGlow: { opacity: 0.1 },
      organicBlob: { opacity: 0.4, scale: 1.5, hue: 12, saturation: 85, lightness: 50 },
      wanderingBlob: { opacity: 0.2, scale: 2, hue: 14, saturation: 80, lightness: 45 }
    },
    { // Level 2: Medium - normale Rede
      mainGlow: { scale: 4, blur: 50, color: '#FF2B17' },
      innerGlow: { opacity: 0.5, scale: 2.5, color: '#FF6A30' },
      halo: { opacity: 0.7, scale: 3, blur: 70 },
      secondaryGlow: { opacity: 0.3 },
      organicBlob: { opacity: 0.6, scale: 2, hue: 14, saturation: 80, lightness: 45 },
      wanderingBlob: { opacity: 0.4, scale: 2.5, hue: 16, saturation: 75, lightness: 42 }
    },
    { // Level 3: High - laute Rede
      mainGlow: { scale: 6, blur: 80, color: '#FF2B17' },
      innerGlow: { opacity: 0.7, scale: 3.5, color: '#FF8A50' },
      halo: { opacity: 0.9, scale: 4, blur: 120 },
      secondaryGlow: { opacity: 0.6 },
      organicBlob: { opacity: 0.8, scale: 2.8, hue: 16, saturation: 75, lightness: 42 },
      wanderingBlob: { opacity: 0.6, scale: 3, hue: 18, saturation: 70, lightness: 40 }
    },
    { // Level 4: Very High - sehr laut
      mainGlow: { scale: 8, blur: 120, color: '#FF2B17' },
      innerGlow: { opacity: 0.9, scale: 4.5, color: '#FFAA70' },
      halo: { opacity: 1, scale: 5, blur: 160 },
      secondaryGlow: { opacity: 0.8 },
      organicBlob: { opacity: 0.95, scale: 3.5, hue: 18, saturation: 70, lightness: 40 },
      wanderingBlob: { opacity: 0.8, scale: 3.5, hue: 20, saturation: 65, lightness: 35 }
    },
    { // Level 5: Extreme - maximale Intensität
      mainGlow: { scale: 12, blur: 180, color: '#FF2B17' },
      innerGlow: { opacity: 1, scale: 6, color: '#FFCC90' },
      halo: { opacity: 1, scale: 7, blur: 220 },
      secondaryGlow: { opacity: 1 },
      organicBlob: { opacity: 1, scale: 4.5, hue: 20, saturation: 65, lightness: 35 },
      wanderingBlob: { opacity: 1, scale: 4, hue: 22, saturation: 60, lightness: 30 }
    }
  ];

  // Helper functions from dynamic_background_6_states.html
  const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  
  const toRGBA = (h: number, s: number, l: number, a: number = 1) => {
    h = (h % 360 + 360) % 360;
    s = clamp(s, 0, 100);
    l = clamp(l, 0, 100);
    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
    const X = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l / 100 - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = X; b = 0; }
    else if (h < 120) { r = X; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = X; }
    else if (h < 240) { r = 0; g = X; b = c; }
    else if (h < 300) { r = X; g = 0; b = c; }
    else { r = c; g = 0; b = X; }
    return `rgba(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)},${a})`;
  };

  // Smooth noise for organic drift
  const n1 = (t: number, seed: number) => Math.sin(t * 0.9 + seed * 1.7) * 0.6 + Math.sin(t * 0.53 + seed * 3.1) * 0.4;

  // Initialize the visualizer
  const initVisualizer = () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
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

  // Reset visualizer to initial state
  const resetVisualizer = () => {
    if (!visualizerRef.current) return;
    
    const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLElement;
    const halo = visualizerRef.current.querySelector('#halo') as HTMLElement;
    const secondaryGlow = visualizerRef.current.querySelector('#secondary-glow') as HTMLElement;
    const innerGlow = visualizerRef.current.querySelector('#inner-glow') as HTMLElement;
    const organicBlob = visualizerRef.current.querySelector('#organic-blob') as HTMLElement;
    const wanderingBlob = visualizerRef.current.querySelector('#wandering-blob') as HTMLElement;
    
    if (mainGlow && halo && secondaryGlow && innerGlow && organicBlob && wanderingBlob) {
      // Apply level 0 (silent) - but with smoother transitions
      const silentState = ESCALATION_LEVELS[0];
      
      mainGlow.style.transition = 'all 2s ease-in-out';
      mainGlow.style.transform = `scale(${silentState.mainGlow.scale})`;
      mainGlow.style.filter = `blur(${silentState.mainGlow.blur}px)`;
      mainGlow.style.background = silentState.mainGlow.color;
      
      halo.style.transition = 'all 2.5s ease-in-out';
      halo.style.transform = `scale(${silentState.halo.scale})`; // Gleichmäßige Skalierung ohne Wanderung im Reset
      halo.style.filter = `blur(${silentState.halo.blur}px)`;
      halo.style.opacity = `${silentState.halo.opacity}`;
      halo.style.borderRadius = '50%'; // Gleichmäßige Kreisform
      
      innerGlow.style.transition = 'all 2s ease-in-out';
      innerGlow.style.opacity = `${silentState.innerGlow.opacity}`;
      innerGlow.style.transform = `scale(${silentState.innerGlow.scale})`;
      
      secondaryGlow.style.transition = 'all 2s ease-in-out';
      secondaryGlow.style.opacity = `${silentState.secondaryGlow.opacity}`;
      
      organicBlob.style.transition = 'all 2.5s ease-in-out';
      organicBlob.style.opacity = `${silentState.organicBlob.opacity}`;
      organicBlob.style.transform = `scale(${silentState.organicBlob.scale})`;
      
      wanderingBlob.style.transition = 'all 2.5s ease-in-out';
      wanderingBlob.style.opacity = `${silentState.wanderingBlob.opacity}`;
      wanderingBlob.style.transform = `scale(${silentState.wanderingBlob.scale})`;
    }
  };

  // Main visualization function - responsive to real-time audio data
  const visualize = () => {
    if (!visualizerRef.current) {
      return;
    }
    
    try {
      let normalizedVolume = volume;
      let audioFrequencies = frequencies;
      
      // If we have an audio element, use its data
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
      
      // Calculate frequency bands for more sophisticated analysis
      const lowFreq = audioFrequencies.slice(0, Math.floor(audioFrequencies.length * 0.3));
      const midFreq = audioFrequencies.slice(Math.floor(audioFrequencies.length * 0.3), Math.floor(audioFrequencies.length * 0.7));
      const highFreq = audioFrequencies.slice(Math.floor(audioFrequencies.length * 0.7));
      
      const lowAvg = lowFreq.length > 0 ? lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length : 0;
      const midAvg = midFreq.length > 0 ? midFreq.reduce((a, b) => a + b, 0) / midFreq.length : 0;
      const highAvg = highFreq.length > 0 ? highFreq.reduce((a, b) => a + b, 0) / highFreq.length : 0;
      
      // More sophisticated intensity calculation with frequency weighting
      const baseIntensity = normalizedVolume * 0.6 + midAvg * 0.4;
      const frequencyBoost = (lowAvg * 0.3 + highAvg * 0.7) * 0.5;
      const intensity = Math.min(baseIntensity + frequencyBoost, 1);
      
      // More sensitive level calculation - starts responding at lower volumes
      const level = Math.min(Math.floor(intensity * 8), 5);
      const levelConfig = ESCALATION_LEVELS[level];
      
      // Update visuals based on escalation level
      const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLElement;
      const halo = visualizerRef.current.querySelector('#halo') as HTMLElement;
      const secondaryGlow = visualizerRef.current.querySelector('#secondary-glow') as HTMLElement;
      const innerGlow = visualizerRef.current.querySelector('#inner-glow') as HTMLElement;
      const organicBlob = visualizerRef.current.querySelector('#organic-blob') as HTMLElement;
      const wanderingBlob = visualizerRef.current.querySelector('#wandering-blob') as HTMLElement;
      
      if (mainGlow && halo && secondaryGlow && innerGlow && organicBlob && wanderingBlob) {
        // Organic drift amplitude - more pronounced
        const driftAmp = 0.02;
        const time = Date.now();
        const ox = driftAmp * n1(time * 0.0007, 3.7 + levelConfig.organicBlob.hue * 0.1);
        const oy = driftAmp * n1(time * 0.0009, -1.2 + levelConfig.organicBlob.saturation * 0.1);
        
        // Wandering blob position - moves around the center
        const wanderRadius = 40 + intensity * 30;
        const wanderX = Math.sin(time * 0.001) * wanderRadius + Math.cos(time * 0.0008) * wanderRadius * 0.5;
        const wanderY = Math.cos(time * 0.0012) * wanderRadius + Math.sin(time * 0.0009) * wanderRadius * 0.5;
        
        // Morph shape based on intensity with organic movement
        const morphFactor = intensity * 20;
        const distortion = Math.sin(time * 0.003) * morphFactor;
        
        // Apply level configurations with fast transitions and organic shapes
        const organicDistortion1 = Math.sin(time * 0.002) * morphFactor * 0.8;
        const organicDistortion2 = Math.cos(time * 0.0015) * morphFactor * 0.6;
        const organicDistortion3 = Math.sin(time * 0.003) * morphFactor * 0.4;
        const organicDistortion4 = Math.cos(time * 0.0018) * morphFactor * 0.5;
        
        mainGlow.style.transition = 'all 0.1s ease-out';
        mainGlow.style.borderRadius = `${60 + organicDistortion1}% ${40 - organicDistortion2}% ${70 + organicDistortion3}% ${30 - organicDistortion1}% / ${50 + organicDistortion2}% ${60 - organicDistortion3}% ${40 + organicDistortion1}% ${50 - organicDistortion2}%`;
        mainGlow.style.transform = `scale(${levelConfig.mainGlow.scale}) rotate(${distortion}deg)`;
        mainGlow.style.filter = `blur(${levelConfig.mainGlow.blur}px)`;
        mainGlow.style.background = levelConfig.mainGlow.color;
        
        // Kontinuierliche Wanderung auch während der aktiven Visualisierung
        const activeWanderRadius = 6; // Noch kleinere Amplitude während der Aufnahme
        const activeHaloTime = time * 0.0004; // Langsamere Bewegung während der Aufnahme
        const activeWanderX = Math.sin(activeHaloTime) * activeWanderRadius;
        const activeWanderY = Math.cos(activeHaloTime * 0.8) * activeWanderRadius; // Leicht unterschiedliche Geschwindigkeit
        
        // Kombiniere die aktive Skalierung mit der wandernden Bewegung
        const combinedScale = levelConfig.halo.scale * (1 + 0.1 * Math.sin(activeHaloTime * 0.3)); // Dezente Größenvariation
        
        halo.style.transition = 'all 0.1s ease-out';
        halo.style.borderRadius = '50%'; // Gleichmäßige Kreisform für gleichmäßiges Ausschwenken
        halo.style.transform = `scale(${combinedScale}) translate(${activeWanderX}px, ${activeWanderY}px)`; // Wanderung + kombinierte Skalierung
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
          secondaryGlow.style.borderRadius = `${50 + organicDistortion3}% ${30 - organicDistortion1}% ${70 + organicDistortion2}% ${40 - organicDistortion3}% / ${60 + organicDistortion1}% ${50 - organicDistortion2}% ${40 + organicDistortion3}% ${70 - organicDistortion1}%`;
        }
        
        // Organic blob with dynamic background style
        organicBlob.style.transition = 'all 0.1s ease-out';
        organicBlob.style.opacity = `${levelConfig.organicBlob.opacity}`;
        organicBlob.style.transform = `scale(${levelConfig.organicBlob.scale}) translate(${ox * 100}px, ${oy * 100}px)`;
        
        // Create radial gradient like in dynamic_background_6_states.html
        const blobConfig = levelConfig.organicBlob;
        const gradient = `radial-gradient(circle, 
          ${toRGBA(blobConfig.hue, blobConfig.saturation, clamp(blobConfig.lightness + 7, 0, 100), blobConfig.opacity * 0.95)} 0%,
          ${toRGBA(blobConfig.hue, blobConfig.saturation, clamp(blobConfig.lightness + 2, 0, 100), blobConfig.opacity * 0.90)} 25%,
          ${toRGBA(blobConfig.hue, blobConfig.saturation, clamp(blobConfig.lightness - 18, 0, 100), 0)} 100%
        )`;
        organicBlob.style.background = gradient;
        organicBlob.style.borderRadius = `${60 + organicDistortion1}% ${40 - organicDistortion2}% ${80 + organicDistortion3}% ${20 - organicDistortion1}% / ${30 + organicDistortion2}% ${70 - organicDistortion3}% ${50 + organicDistortion1}% ${60 - organicDistortion2}%`;
        
        // Wandering blob - moves around the center
        wanderingBlob.style.transition = 'all 0.1s ease-out';
        wanderingBlob.style.opacity = `${levelConfig.wanderingBlob.opacity}`;
        wanderingBlob.style.transform = `scale(${levelConfig.wanderingBlob.scale}) translate(${wanderX}px, ${wanderY}px)`;
        
        // Create gradient for wandering blob
        const wanderConfig = levelConfig.wanderingBlob;
        const wanderGradient = `radial-gradient(circle, 
          ${toRGBA(wanderConfig.hue, wanderConfig.saturation, clamp(wanderConfig.lightness + 7, 0, 100), wanderConfig.opacity * 0.95)} 0%,
          ${toRGBA(wanderConfig.hue, wanderConfig.saturation, clamp(wanderConfig.lightness + 2, 0, 100), wanderConfig.opacity * 0.90)} 25%,
          ${toRGBA(wanderConfig.hue, wanderConfig.saturation, clamp(wanderConfig.lightness - 18, 0, 100), 0)} 100%
        )`;
        wanderingBlob.style.background = wanderGradient;
        wanderingBlob.style.borderRadius = `${70 + organicDistortion4}% ${30 - organicDistortion1}% ${60 + organicDistortion2}% ${40 - organicDistortion3}% / ${40 + organicDistortion1}% ${70 - organicDistortion4}% ${30 + organicDistortion2}% ${60 - organicDistortion1}%`;
      }
    } catch (error) {
      console.error('Error in visualization:', error);
    }
    
    animationRef.current = requestAnimationFrame(visualize);
  };

  // Idle animation when no sound - static position, no movement
  const idleAnimation = () => {
    if (!visualizerRef.current) return;
    
    const mainGlow = visualizerRef.current.querySelector('#main-glow') as HTMLDivElement;
    const halo = visualizerRef.current.querySelector('#halo') as HTMLDivElement;
    const innerGlow = visualizerRef.current.querySelector('#inner-glow') as HTMLDivElement;
    const organicBlob = visualizerRef.current.querySelector('#organic-blob') as HTMLDivElement;
    const wanderingBlob = visualizerRef.current.querySelector('#wandering-blob') as HTMLDivElement;
    const rotatingBubble = visualizerRef.current.querySelector('#rotating-bubble') as HTMLDivElement;
    
    if (mainGlow && halo && innerGlow && organicBlob && wanderingBlob && rotatingBubble) {
      // Static idle state - no movement, just subtle opacity changes
      const progress = (Date.now() % 10000) / 10000; // 10 second cycle for slower animation
      const time = Date.now();
      
      // Keep main glow at scale 1 (no movement) - brighter idle state
      mainGlow.style.transition = 'opacity 6s ease-in-out';
      mainGlow.style.transform = 'scale(1)'; // Fixed: no drift
      mainGlow.style.opacity = `${0.6 + 0.2 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2))}`;
      
      // Halo effect - kontinuierliche, dezente Wanderung in alle Richtungen
      const haloTime = time * 0.0003; // Viel langsamere Bewegung (0.0003 statt 0.0008)
      
      // Kontinuierliche Wanderung in alle Richtungen mit verschiedenen Geschwindigkeiten
      const wanderRadius = 12; // Kleine Bewegungsamplitude für dezente Bewegung
      const wanderX = Math.sin(haloTime) * wanderRadius;
      const wanderY = Math.cos(haloTime * 0.7) * wanderRadius; // Leicht unterschiedliche Geschwindigkeit für organische Bewegung
      
      // Dezente Größenvariation - wird kleiner und größer
      const scaleVariation = 1.1 + 0.15 * Math.sin(haloTime * 0.5); // Langsamere Größenänderung
      const haloOpacity = 0.4 + 0.1 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
      
      halo.style.transition = 'all 8s ease-in-out'; // Noch langsamere Übergänge für sehr dezente Bewegung
      halo.style.transform = `scale(${scaleVariation}) translate(${wanderX}px, ${wanderY}px)`; // Wanderung + Größenvariation
      halo.style.opacity = `${haloOpacity}`;
      
      innerGlow.style.transition = 'opacity 5s ease-in-out';
      innerGlow.style.transform = 'scale(1)'; // Fixed: no drift
      innerGlow.style.opacity = `${0.3 + 0.1 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2))}`;
      
      organicBlob.style.transition = 'opacity 7s ease-in-out';
      organicBlob.style.transform = 'scale(1)'; // Fixed: no drift
      organicBlob.style.opacity = `${0.2 + 0.1 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2))}`;
      
      wanderingBlob.style.transition = 'opacity 9s ease-in-out';
      wanderingBlob.style.transform = 'scale(1)'; // Fixed: no drift
      wanderingBlob.style.opacity = `${0.15 + 0.05 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2))}`;
      
      // Rotating bubble - moves around the center and pulsates
      const rotationRadius = 60 + 20 * Math.sin(time * 0.001); // Pulsating radius
      const rotationSpeed = 0.002; // Faster rotation
      const rotationX = Math.cos(time * rotationSpeed) * rotationRadius;
      const rotationY = Math.sin(time * rotationSpeed) * rotationRadius;
      const pulseScale = 1 + 0.3 * Math.sin(time * 0.003); // Pulsation
      
      rotatingBubble.style.transition = 'all 0.1s ease-out';
      rotatingBubble.style.transform = `scale(${pulseScale}) translate(${rotationX}px, ${rotationY}px)`;
      rotatingBubble.style.opacity = `${0.3 + 0.2 * Math.sin(time * 0.002)}`; // Gentle pulsing opacity
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
    } else if (isActive && (frequencies.length > 0 || volume > 0)) {
      // Use real-time data from recording
      visualize();
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
  }, [audioElement, isPlaying, frequencies, volume, isActive]);

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
          top: 'calc(50% + 25px)',
          left: 'calc(50% + 25px)',
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        <div id="main-glow" className="glow-core"></div>
        <div id="halo" className="glow-core"></div>
        <div id="secondary-glow" className="glow-core"></div>
        <div id="inner-glow" className="inner-glow"></div>
        <div id="organic-blob" className="organic-blob"></div>
        <div id="wandering-blob" className="wandering-blob"></div>
        <div id="rotating-bubble" className="rotating-bubble"></div>
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
          width: 50px;
          height: 50px;
          background: radial-gradient(circle, #FF6A30 0%, #FF2B17 70%, rgba(255, 43, 23, 0.1) 100%);
          box-shadow: 0 0 40px 20px #FF2B17;
          border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
          opacity: 0.8;
        }

        #halo {
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, #FF6A30 0%, #FF3A20 50%, rgba(255, 58, 32, 0.1) 100%);
          box-shadow: 0 0 80px 40px #FF6A30;
          opacity: 0.5;
          border-radius: 50%; /* Gleichmäßige Kreisform für gleichmäßiges Ausschwenken in alle Richtungen */
        }

        #secondary-glow {
          width: 35px;
          height: 35px;
          background: radial-gradient(circle, #FF8A50 0%, #E03A2A 60%, rgba(224, 58, 42, 0.1) 100%);
          box-shadow: 0 0 30px 15px #FF6A30;
          opacity: 0;
          border-radius: 50% 30% 70% 40% / 60% 50% 40% 70%;
        }

        .inner-glow {
          position: absolute;
          width: 25px;
          height: 25px;
          background: radial-gradient(circle, #FFF2D0 0%, #FF6A30 50%, rgba(255, 106, 48, 0.1) 100%);
          filter: blur(6px);
          mix-blend-mode: screen;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.3;
          border-radius: 40% 60% 30% 70% / 70% 40% 60% 30%;
        }

        .organic-blob {
          position: absolute;
          width: 100px;
          height: 100px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.2;
          filter: blur(15px);
          mix-blend-mode: screen;
          border-radius: 60% 40% 80% 20% / 30% 70% 50% 60%;
        }

        .wandering-blob {
          position: absolute;
          width: 80px;
          height: 80px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.1;
          filter: blur(20px);
          mix-blend-mode: screen;
          border-radius: 70% 30% 60% 40% / 40% 70% 30% 60%;
        }
      `}</style>
    </div>
  );
};
