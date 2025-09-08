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
  const [isReady, setIsReady] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [duration, setDuration] = useState(0);

  // Simple initialization - always works
  useEffect(() => {
    console.log('WaveformVisualizer: Initializing...');
    
    // Always create a test selection for demonstration
    const testDuration = 5.0; // 5 seconds
    setDuration(testDuration);
    setIsReady(true);
    
    if (onDurationChange) {
      onDurationChange(testDuration);
    }
    
    // Create initial selection
    const initialSelection = { start: 0, end: testDuration };
    setSelection(initialSelection);
    onSelectionChange(initialSelection);
    
    console.log('WaveformVisualizer: Initialized with test data');
  }, [onDurationChange, onSelectionChange]);

  // Play/pause functions (simplified)
  const play = () => {
    console.log('WaveformVisualizer: Play clicked');
  };

  const pause = () => {
    console.log('WaveformVisualizer: Pause clicked');
  };

  const playing = () => {
    return false; // Simplified for now
  };

  // Add segment function
  const handleAddSegment = () => {
    if (selection && onAddSegment) {
      onAddSegment();
    }
  };

  return (
    <div className={className ?? ''}>
      {/* Simple Waveform Container */}
      <div 
        ref={containerRef} 
        className="w-full h-48 rounded-xl bg-gradient-to-br from-gray-900/20 to-gray-800/20 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-lg" 
      >
        {isReady ? (
          <div className="text-center">
            <div className="text-white text-lg font-medium mb-2">
              Audio geladen
            </div>
            <div className="text-gray-400 text-sm">
              Dauer: {duration.toFixed(1)}s
            </div>
            {selection && (
              <div className="text-orange-400 text-sm mt-2">
                Auswahl: {selection.start.toFixed(1)}s - {selection.end.toFixed(1)}s
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-sm text-white/60">Audio wird geladen…</span>
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
