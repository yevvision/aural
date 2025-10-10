import { useEffect, useRef, useState } from 'react';
import { useWaveformEditor } from '../../../hooks/useWaveformEditor';
import { Play, Pause, Plus } from 'lucide-react';
import { ZoomSlider } from './ZoomSlider';
import { RegionList } from './RegionList';

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
  const [showFullRecordingMessage, setShowFullRecordingMessage] = useState(false);
  
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

  // Check if there's space for a new region
  const canAddNewRegion = () => {
    if (allRegions.length === 0) return true;
    
    // Calculate total coverage of all regions
    const totalCoverage = allRegions.reduce((total, region) => {
      return total + (region.end - region.start);
    }, 0);
    
    // Check if we have at least 5% of the recording unmarked
    const threshold = duration * 0.05; // 5% threshold
    return (duration - totalCoverage) > threshold;
  };

  // Handle new region creation with validation
  const handleAddNewRegion = () => {
    if (!canAddNewRegion()) {
      setShowFullRecordingMessage(true);
      triggerHaptic();
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowFullRecordingMessage(false);
      }, 3000);
      return;
    }
    
    triggerHaptic();
    addNewRegion(0);
  };
  
  const { wavesurfer, selection, addOrReplaceRegion, addNewRegion, removeRegion, removeRegionById, allRegions, isReady, zoomLevel, currentPlayingRegionId, isPlaying, setZoom, zoomIn, zoomOut, zoom, play, pause, playRegion, pauseRegion, playAllRegions, playing, duration } =
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
      // Detect mobile device and adjust timeout accordingly
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      window.innerWidth <= 768 || 
                      ('ontouchstart' in window);
      
      // Much shorter timeout for mobile - if it doesn't work quickly, show fallback
      const timeoutDuration = isMobile ? 15000 : 25000; // 15 seconds for mobile, 25 for desktop
      
      addDebugLog('Starting timeout for waveform loading', { 
        blobSize: blob.size, 
        blobType: blob.type, 
        isMobile, 
        timeoutDuration 
      });
      
      const timeout = setTimeout(() => {
        if (!isReady) {
          addDebugLog(`TIMEOUT: Waveform failed to load within ${timeoutDuration/1000} seconds`, { 
            isReady, 
            duration, 
            isMobile,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            hasTouch: 'ontouchstart' in window
          });
          
          // On mobile, show a more helpful message with fallback option
          if (isMobile) {
            setError('Mobile Waveform-Problem: Verwenden Sie die einfache Test-Seite für bessere Kompatibilität.');
          } else {
            setError(`Wellenform konnte nicht geladen werden (${timeoutDuration/1000}s Timeout). Bitte versuchen Sie es erneut oder verwenden Sie eine kürzere Audio-Datei.`);
          }
        }
      }, timeoutDuration);
      
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
          className="wavesurfer-container rounded-lg"
          style={{ 
            touchAction: 'pan-x pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            height: '100%' // Volle Höhe nutzen
          }}
        />
      
      {/* Zoom Slider */}
      <div className="mt-4 w-full">
        <ZoomSlider 
          zoomLevel={zoomLevel}
          onZoomChange={setZoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          minZoom={1}
          maxZoom={1000}
        />
      </div>
      
      {/* Mobile-optimized control buttons with larger touch targets */}
      <div className="mt-6 flex items-center gap-4">
        {/* Play/Pause Button - linksbündig, kreisförmig, Secondary-Style */}
        <button 
          onClick={() => {
            triggerHaptic();
            isPlaying ? pause() : play();
          }} 
          className="w-16 h-16 rounded-full border-2 border-gray-600 bg-gradient-to-r from-gray-700/30 to-gray-600/20 flex items-center justify-center hover:from-gray-600/40 hover:to-gray-500/30 active:from-gray-600/50 active:to-gray-500/40 transition-all duration-200 touch-manipulation shadow-lg"
          style={{ minHeight: '64px', minWidth: '64px' }}
        >
          {isPlaying ? (
            <Pause size={20} className="text-gray-300" strokeWidth={2} />
          ) : (
            <Play size={20} className="text-gray-300 ml-0.5" strokeWidth={2} />
          )}
        </button>
        
        {/* Set new Area Button - nimmt restliche Breite, Secondary-Style */}
        <button 
          onClick={handleAddNewRegion}
          className="flex-1 px-8 py-5 sm:py-4 rounded-full border-2 border-gray-600 bg-gradient-to-r from-gray-700/30 to-gray-600/20 flex items-center justify-center space-x-3 hover:from-gray-600/40 hover:to-gray-500/30 active:from-gray-600/50 active:to-gray-500/40 transition-all duration-200 touch-manipulation shadow-lg"
          style={{ minHeight: '64px' }}
        >
          <Plus size={20} className="text-gray-300" strokeWidth={2} />
          <span className="text-gray-300 text-base font-semibold">Set new Area</span>
        </button>
        
        {!isReady && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-orange-400 text-sm font-medium">loading…</span>
          </div>
        )}
      </div>

      {/* Full Recording Message */}
      {showFullRecordingMessage && (
        <div className="mt-3 flex justify-center">
          <div className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm font-medium text-center">
              The entire recording is already marked/selected
            </p>
          </div>
        </div>
      )}

      {/* Region List */}
      {isReady && allRegions.length > 0 && (
        <RegionList
          regions={allRegions}
          onPlayRegion={playRegion}
          onPauseRegion={pauseRegion}
          onDeleteRegion={(regionId) => {
            removeRegionById(regionId);
          }}
          onPlayAllRegions={playAllRegions}
          isPlaying={isPlaying}
          currentPlayingRegionId={currentPlayingRegionId}
        />
      )}

      {/* Mobile-optimized help text */}
      {isReady && !selection && (
        <div className="mt-4 text-center px-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
            <p className="text-sm sm:text-base text-blue-300 leading-relaxed font-medium">
              💡 Drag over the waveform or tap "New Area" to select a region
            </p>
            <p className="text-xs sm:text-sm text-blue-400/70 mt-2">
              Tip: Double-tap to zoom • Regions can be moved with drag & drop
            </p>
          </div>
        </div>
      )}

    </div>
  );
}