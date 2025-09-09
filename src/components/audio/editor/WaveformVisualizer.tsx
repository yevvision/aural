import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WaveformVisualizer({
  blob,
  onSelectionChange,
  onDurationChange,
  onAddSegment,
  className,
}: {
  blob: Blob | null;
  onSelectionChange: (sel: { start: number; end: number } | null) => void;
  onDurationChange?: (duration: number) => void;
  onAddSegment?: () => void;
  className?: string;
}) {
  console.log('WaveformVisualizer: Received blob:', {
    size: blob?.size,
    type: blob?.type,
    hasBlob: !!blob
  });
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load audio and generate waveform
  useEffect(() => {
    if (!blob) return;
    
    console.log('WaveformVisualizer: Loading audio and generating waveform...');
    
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    
    const handleLoadedMetadata = async () => {
      console.log('WaveformVisualizer: Audio loaded, duration:', audio.duration);
      
      // Check if duration is valid
      if (!isFinite(audio.duration) || audio.duration <= 0) {
        console.error('WaveformVisualizer: Invalid audio duration:', audio.duration);
        // Try to get duration from AudioContext instead
        try {
          // Create AudioContext only once and reuse
          let audioContext = window.audioContext;
          if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            window.audioContext = audioContext;
          }
          
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const validDuration = audioBuffer.duration;
          
          console.log('WaveformVisualizer: Using AudioContext duration:', validDuration);
          setDuration(validDuration);
          
          // Use setTimeout to avoid infinite loops
          setTimeout(() => {
            if (onDurationChange) {
              onDurationChange(validDuration);
            }
          }, 0);
          
          // Generate waveform data
          const channelData = audioBuffer.getChannelData(0);
          const samples = 200; // Number of bars in waveform
          const blockSize = Math.floor(channelData.length / samples);
          const waveform = [];
          
          for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(channelData[i * blockSize + j]);
            }
            waveform.push(sum / blockSize);
          }
          
          setWaveformData(waveform);
    setIsReady(true);
    
          // Create initial selection covering the entire audio
          const initialSelection = { start: 0, end: validDuration };
          setSelection(initialSelection);
          setTimeout(() => {
            if (onSelectionChange) {
              onSelectionChange(initialSelection);
            }
          }, 0);
          
          console.log('WaveformVisualizer: Waveform generated with', waveform.length, 'bars');
          return;
        } catch (error) {
          console.error('WaveformVisualizer: Error with AudioContext fallback:', error);
          // Final fallback: create test data
          const testDuration = 5.0;
          setDuration(testDuration);
          setTimeout(() => {
            if (onDurationChange) {
              onDurationChange(testDuration);
            }
          }, 0);
    
          const simpleWaveform = Array.from({ length: 100 }, () => Math.random() * 0.5 + 0.1);
          setWaveformData(simpleWaveform);
          setIsReady(true);
          
          const initialSelection = { start: 0, end: testDuration };
          setSelection(initialSelection);
          setTimeout(() => {
            if (onSelectionChange) {
              onSelectionChange(initialSelection);
            }
          }, 0);
          return;
        }
      }
      
      // Normal flow with valid duration
      setDuration(audio.duration);
      
      setTimeout(() => {
        if (onDurationChange) {
          onDurationChange(audio.duration);
        }
      }, 0);
      
      // Generate waveform data
      try {
        // Create AudioContext only once and reuse
        let audioContext = window.audioContext;
        if (!audioContext) {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          window.audioContext = audioContext;
        }
        
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Generate waveform data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200; // Number of bars in waveform
        const blockSize = Math.floor(channelData.length / samples);
        const waveform = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j]);
          }
          waveform.push(sum / blockSize);
        }
        
        setWaveformData(waveform);
        setIsReady(true);
        
        // Create initial selection covering the entire audio
        const initialSelection = { start: 0, end: audio.duration };
        setSelection(initialSelection);
        setTimeout(() => {
          if (onSelectionChange) {
            onSelectionChange(initialSelection);
          }
        }, 0);
        
        console.log('WaveformVisualizer: Waveform generated with', waveform.length, 'bars');
      } catch (error) {
        console.error('WaveformVisualizer: Error generating waveform:', error);
        // Fallback: create simple waveform
        const simpleWaveform = Array.from({ length: 100 }, () => Math.random() * 0.5 + 0.1);
        setWaveformData(simpleWaveform);
        setIsReady(true);
        
        const initialSelection = { start: 0, end: audio.duration };
        setSelection(initialSelection);
        setTimeout(() => {
          if (onSelectionChange) {
            onSelectionChange(initialSelection);
          }
        }, 0);
      }
    };
    
    const handleError = (error: Event) => {
      console.error('WaveformVisualizer: Error loading audio:', error);
      URL.revokeObjectURL(url);
    };
    
    const handleCanPlay = () => {
      console.log('WaveformVisualizer: Audio can play');
      // Ensure audio is ready for playback
      audio.load();
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    
    // Force load metadata
    audio.load();
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      
      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      
      // Revoke blob URL to prevent memory leaks
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  // Play/pause functions
  const play = async () => {
    if (audioRef.current && !isPlaying) {
    console.log('WaveformVisualizer: Play clicked');
      try {
        // Ensure audio is ready
        if (audioRef.current.readyState < 2) {
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener('canplay', handleCanPlay);
              resolve(void 0);
            };
            audioRef.current?.addEventListener('canplay', handleCanPlay);
          });
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('WaveformVisualizer: Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  };

  const pause = () => {
    if (audioRef.current && isPlaying) {
    console.log('WaveformVisualizer: Pause clicked');
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playing = () => {
    return isPlaying;
  };

  // Handle audio time updates
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioRef.current]);

  // Handle waveform clicks for selection
  const handleWaveformClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !duration) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;
    
    if (!selection) {
      // Create new selection starting from click point
      const newSelection = { start: clickTime, end: Math.min(clickTime + 1, duration) };
      setSelection(newSelection);
      onSelectionChange(newSelection);
    } else {
      // Update existing selection
      const newSelection = { ...selection, start: clickTime };
      setSelection(newSelection);
      onSelectionChange(newSelection);
    }
  };

  // Render waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || !waveformData.length || !isReady) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();

    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;
    const barWidth = width / waveformData.length;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.8;
      const x = index * barWidth;
      
      // Determine color based on selection
      let color = '#4B5563'; // Default gray
      if (selection) {
        const barTime = (index / waveformData.length) * duration;
        if (barTime >= selection.start && barTime <= selection.end) {
          color = '#F97316'; // Orange for selected area
        }
      }
      
      // Current time indicator
      if (currentTime > 0) {
        const currentBar = (currentTime / duration) * waveformData.length;
        if (Math.abs(index - currentBar) < 1) {
          color = '#10B981'; // Green for current time
        }
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
    });

    // Draw selection overlay
    if (selection) {
      const startX = (selection.start / duration) * width;
      const endX = (selection.end / duration) * width;
      
      ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      // Selection borders
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
    }

    // Current time line
    if (currentTime > 0) {
      const currentX = (currentTime / duration) * width;
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height);
      ctx.stroke();
    }

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
      // Re-render after resize
      setTimeout(() => {
        // Trigger re-render by updating a dependency
        setCurrentTime(prev => prev);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [waveformData, selection, currentTime, duration, isReady]);

  // Add segment function
  const handleAddSegment = () => {
    if (selection && onAddSegment) {
      onAddSegment();
    }
  };

  return (
    <div className={className ?? ''}>
      {/* Waveform Container */}
      <div 
        ref={containerRef} 
        className="w-full h-48 rounded-xl bg-gradient-to-br from-gray-900/20 to-gray-800/20 backdrop-blur-sm border border-white/10 shadow-lg relative overflow-hidden" 
      >
        {isReady && waveformData.length > 0 ? (
          <canvas
            ref={canvasRef}
            onClick={handleWaveformClick}
            className="w-full h-full cursor-pointer"
            style={{ touchAction: 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-sm text-white/60">Audio wird geladen…</span>
            </div>
          </div>
        )}
        
        {/* Time indicators */}
        {isReady && duration > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-white/60">
            <span>0:00</span>
            <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
            </div>
        )}
        
        {/* Selection info overlay */}
        {selection && isReady && (
          <div className="absolute top-2 left-2 right-2">
            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-3 py-1">
              <div className="text-orange-300 text-xs text-center">
                Auswahl: {selection.start.toFixed(1)}s - {selection.end.toFixed(1)}s
              </div>
          </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <motion.button 
            onClick={() => (playing() ? pause() : play())} 
            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:from-orange-500/30 hover:to-orange-600/30 hover:border-orange-500/50 transition-all duration-200 touch-manipulation shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!isReady}
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {playing() ? (
              <Pause size={20} strokeWidth={1.5} />
            ) : (
              <Play size={20} strokeWidth={1.5} className="ml-0.5" />
            )}
          </motion.button>

          {/* Add Segment Button */}
          <motion.button 
            onClick={handleAddSegment} 
            className="px-4 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:from-blue-500/30 hover:to-blue-600/30 hover:border-blue-500/50 transition-all duration-200 touch-manipulation flex items-center space-x-2 shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!isReady || !selection}
            style={{ minHeight: '44px' }}
          >
            <Plus size={16} strokeWidth={1.5} />
            <span>Hinzufügen</span>
          </motion.button>
        </div>
      </div>

    </div>
  );
}
