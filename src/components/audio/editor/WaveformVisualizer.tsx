import { useEffect, useRef, useState } from 'react';
import { useWaveformEditor } from '../../../hooks/useWaveformEditor';
import { Play, Pause, Plus } from 'lucide-react';
import MobileZoomControls from './MobileZoomControls';

export default function WaveformVisualizer({
  blob,
  onSelectionChange,
  onDurationChange,
  onAddSegment,
  onRegionsChange,
  onRemoveRegionReady,
  className,
}: {
  blob: Blob | null;
  onSelectionChange: (sel: { start: number; end: number } | null) => void;
  onDurationChange?: (duration: number) => void;
  onAddSegment?: () => void;
  onRegionsChange?: (regions: { start: number; end: number; id: string }[]) => void;
  onRemoveRegionReady?: (removeFn: (start: number, end: number) => void) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`🔍 WaveformVisualizer: ${logMessage}`, data || '');
    setDebugInfo(prev => [...prev.slice(-9), logMessage]); // Keep last 10 logs
  };
  
  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // Slightly longer vibration for button interactions
    }
  };
  
  const { selection, addOrReplaceRegion, addNewRegion, removeRegion, allRegions, isReady, zoom, play, pause, playing, duration } =
    useWaveformEditor({ container: containerRef.current, audioBlob: blob, height: 120, barWidth: 2 });

  // Log component state changes
  useEffect(() => {
    addDebugLog('Component mounted/updated', {
      blob: blob ? { size: blob.size, type: blob.type } : null,
      container: containerRef.current ? 'available' : 'null',
      isReady,
      duration
    });
  }, [blob, isReady, duration]);

  useEffect(() => { onSelectionChange(selection); }, [selection]); // Remove onSelectionChange from dependencies to prevent infinite loop
  
  useEffect(() => {
    if (duration > 0 && onDurationChange) {
      onDurationChange(duration);
    }
  }, [duration]); // Remove onDurationChange from dependencies to prevent infinite loop

  useEffect(() => {
    if (onRegionsChange) {
      onRegionsChange(allRegions);
    }
  }, [allRegions]); // Remove onRegionsChange from dependencies to prevent infinite loop

  useEffect(() => {
    if (onRemoveRegionReady && removeRegion) {
      onRemoveRegionReady(removeRegion);
    }
  }, [removeRegion]); // Remove onRemoveRegionReady from dependencies to prevent infinite loop

  // Error boundary effect with better error handling
  useEffect(() => {
    if (blob && !isReady) {
      addDebugLog('Starting timeout for waveform loading', { blobSize: blob.size, blobType: blob.type });
      const timeout = setTimeout(() => {
        if (!isReady) {
          addDebugLog('TIMEOUT: Waveform failed to load within 20 seconds', { isReady, duration });
          setError('Wellenform konnte nicht geladen werden. Bitte versuchen Sie es erneut.');
        }
      }, 20000); // 20 second timeout for audio processing
      
      return () => {
        addDebugLog('Clearing timeout (component unmounting or isReady changed)');
        clearTimeout(timeout);
      };
    }
  }, [blob, isReady]);

  // Remove duplicate audio validation - let useWaveformEditor handle it
  // The validation is already done in useWaveformEditor, so we don't need to duplicate it here

  if (error) {
    return (
      <div className={className ?? ''}>
        <div className="w-full h-28 rounded bg-red-900/20 border border-red-500/30 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            
            {/* Debug Information */}
            {debugInfo.length > 0 && (
              <div className="mb-3 p-2 bg-black/50 rounded text-xs text-gray-300 max-h-20 overflow-y-auto">
                <p className="text-gray-400 mb-1">Debug Log:</p>
                {debugInfo.map((log, index) => (
                  <div key={index} className="text-xs text-gray-400">{log}</div>
                ))}
              </div>
            )}
            
            <div className="space-y-2">
              <button 
                onClick={() => {
                  addDebugLog('Retry button clicked');
                  setError(null);
                  // Retry by recreating the component
                  window.location.reload();
                }}
                className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 mr-2"
              >
                Erneut versuchen
              </button>
              <button 
                onClick={() => {
                  addDebugLog('New recording button clicked');
                  // Navigate back to recorder
                  window.location.href = '/recorder';
                }}
                className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
              >
                Neu aufnehmen
              </button>
            </div>
            <p className="text-red-300 text-xs mt-2">
              Tipp: Versuchen Sie eine kürzere Aufnahme oder warten Sie einen Moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? ''}>
      {/* Mobile-optimized waveform container with better touch support */}
      <div 
        ref={containerRef} 
        className="w-full h-32 sm:h-28 rounded bg-neutral-800 touch-pan-x touch-pan-y select-none"
        style={{ 
          touchAction: 'pan-x pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      />
      
      {/* Mobile-optimized control buttons with larger touch targets */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <button 
          onClick={() => {
            triggerHaptic();
            playing() ? pause() : play();
          }} 
          className="w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-transparent flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all duration-200 touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          {playing() ? (
            <Pause size={22} className="text-white" strokeWidth={1.5} />
          ) : (
            <Play size={22} className="text-white" strokeWidth={1.5} />
          )}
        </button>
        
        <button 
          onClick={() => {
            triggerHaptic();
            addNewRegion(0);
          }} 
          className="px-6 py-4 sm:py-3 rounded-full border border-orange-500 bg-orange-500/20 flex items-center space-x-2 hover:bg-orange-500/30 active:bg-orange-500/40 transition-all duration-200 touch-manipulation"
          style={{ minHeight: '44px' }}
        >
          <Plus size={18} className="text-orange-500" strokeWidth={1.5} />
          <span className="text-orange-500 text-sm font-medium">New Area</span>
        </button>
        
        {!isReady && <span className="text-sm opacity-70">lädt…</span>}
      </div>

      {/* Mobile-optimized help text */}
      {isReady && !selection && (
        <div className="mt-3 text-center px-4">
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            💡 Drag over the waveform or tap "New Area" to select a region
          </p>
        </div>
      )}

      {/* Mobile Zoom Controls */}
      {isReady && (
        <MobileZoomControls
          onZoomIn={() => zoom(160)} // 2x zoom
          onZoomOut={() => zoom(40)}  // 0.5x zoom
          onReset={() => zoom(80)}    // Reset to default
          disabled={!isReady}
        />
      )}
    </div>
  );
}