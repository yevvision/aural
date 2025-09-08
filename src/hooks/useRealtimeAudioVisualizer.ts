import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioVisualizerData {
  frequencies: number[];
  volume: number;
  isActive: boolean;
}

interface UseRealtimeAudioVisualizerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  updateInterval?: number;
}

export const useRealtimeAudioVisualizer = (options: UseRealtimeAudioVisualizerOptions = {}) => {
  const {
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    minDecibels = -90,
    maxDecibels = -10,
    updateInterval = 100
  } = options;

  const [visualizerData, setVisualizerData] = useState<AudioVisualizerData>({
    frequencies: Array(fftSize / 2).fill(0),
    volume: 0,
    isActive: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);

  // Initialize audio context and analyzer
  const initializeAnalyzer = useCallback(async (stream: MediaStream) => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyzer node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothingTimeConstant;
      analyserRef.current.minDecibels = minDecibels;
      analyserRef.current.maxDecibels = maxDecibels;

      // Create source from stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  }, [fftSize, smoothingTimeConstant, minDecibels, maxDecibels]);

  // Start analyzing audio
  const startAnalyzing = useCallback((stream: MediaStream) => {
    const analyzer = async () => {
      const initialized = await initializeAnalyzer(stream);
      if (!initialized || !analyserRef.current) return;

      isAnalyzingRef.current = true;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualization = () => {
        if (!isAnalyzingRef.current || !analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate volume (RMS)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const volume = rms / 255; // Normalize to 0-1

        // Convert to frequencies array
        const frequencies = Array.from(dataArray).map(value => value / 255);

        // Determine if audio is active (speaking/playing)
        const isActive = volume > 0.01; // Threshold for detecting audio activity

        setVisualizerData({
          frequencies,
          volume,
          isActive
        });

        // Continue animation
        animationRef.current = requestAnimationFrame(updateVisualization);
      };

      updateVisualization();
    };

    analyzer();
  }, [initializeAnalyzer]);

  // Stop analyzing
  const stopAnalyzing = useCallback(() => {
    isAnalyzingRef.current = false;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    // Reset data
    setVisualizerData({
      frequencies: Array(fftSize / 2).fill(0),
      volume: 0,
      isActive: false
    });
  }, [fftSize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalyzing();
    };
  }, [stopAnalyzing]);

  return {
    visualizerData,
    startAnalyzing,
    stopAnalyzing,
    isAnalyzing: isAnalyzingRef.current
  };
};

// Helper hook for playback visualization (simulated from audio element)
export const usePlaybackVisualizer = (audioElement: HTMLAudioElement | null, isPlaying: boolean) => {
  const [visualizerData, setVisualizerData] = useState<AudioVisualizerData>({
    frequencies: Array(128).fill(0),
    volume: 0,
    isActive: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const initializePlaybackAnalyzer = useCallback(async () => {
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
      await audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (!audioElement) return false;

    try {
      console.log('Initializing playback analyzer for audio element:', audioElement);
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context created:', audioContextRef.current.state);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      console.log('Analyser created:', analyserRef.current);

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      console.log('Connections established');

      return true;
    } catch (error) {
      console.error('Failed to initialize playback analyzer:', error);
      return false;
    }
  }, [audioElement]);

  useEffect(() => {
    // Clear any existing animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    const updateVisualization = () => {
      if (!isPlaying || !audioElement || !analyserRef.current) {
        // If not playing or no audio element/analyser, set inactive state
        setVisualizerData({
          frequencies: Array(128).fill(0),
          volume: 0,
          isActive: false
        });
        return;
      }

      try {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Debug log to see if we're getting data
        console.log('Audio data:', {
          bufferLength,
          firstFewValues: dataArray.slice(0, 5),
          allZero: dataArray.every(val => val === 0)
        });

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const volume = rms / 255;

        const frequencies = Array.from(dataArray).map(value => value / 255);
        const isActive = volume > 0.01;

        // Debug log to see visualization data
        console.log('Visualization data:', { volume, isActive, firstFewFrequencies: frequencies.slice(0, 5) });

        setVisualizerData({
          frequencies,
          volume,
          isActive
        });
      } catch (error) {
        console.error('Error getting frequency data:', error);
      }

      animationRef.current = requestAnimationFrame(updateVisualization);
    };

    if (isPlaying && audioElement) {
      // Reset visualization data when starting playback
      setVisualizerData({
        frequencies: Array(128).fill(0),
        volume: 0,
        isActive: false
      });
      
      // Initialize analyzer and start visualization loop
      initializePlaybackAnalyzer().then(initialized => {
        if (initialized && analyserRef.current) {
          // Start the visualization loop
          animationRef.current = requestAnimationFrame(updateVisualization);
        } else {
          // If initialization failed, set inactive state
          setVisualizerData({
            frequencies: Array(128).fill(0),
            volume: 0,
            isActive: false
          });
        }
      });
    } else {
      // Not playing, set inactive state
      setVisualizerData({
        frequencies: Array(128).fill(0),
        volume: 0,
        isActive: false
      });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, audioElement, initializePlaybackAnalyzer]);

  return visualizerData;
};