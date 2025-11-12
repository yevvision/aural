import { useEffect, useRef, useState } from 'react';
import { useWaveformEditor } from '../../../hooks/useWaveformEditor';
import { Play, Pause, Plus, Trash2 } from 'lucide-react';
import { ZoomSlider } from './ZoomSlider';

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number; id: string } | null>(null);
  const [lastModifiedRegion, setLastModifiedRegion] = useState<{ start: number; end: number; id: string } | null>(null);
  const [showRegionPlayButton, setShowRegionPlayButton] = useState(false);
  
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
  
  // Only initialize WaveSurfer when we have a valid blob and container
  const shouldInitialize = blob && containerRef.current && blob.size > 0;
  
  const { wavesurfer, selection, addOrReplaceRegion, addNewRegion, removeRegion, removeRegionById, updateRegionActiveState, setRegionActive, setAllRegionsInactive, forceRemoveBorders, allRegions, isReady, zoomLevel, currentPlayingRegionId, isPlaying, activeRegionId, setZoom, zoomIn, zoomOut, zoom, play, pause, playRegion, pauseRegion, playAllRegions, playing, duration } =
    useWaveformEditor({ 
      container: shouldInitialize ? containerRef.current : null, 
      audioBlob: shouldInitialize ? blob : null, 
      height: 120, 
      barWidth: 2,
      onRegionClick: (region) => {
        setSelectedRegion(region);
        setLastModifiedRegion(region);
        setShowRegionPlayButton(true);
        // Markiere diese Region als aktiv
        setRegionActive(region.id);
        addDebugLog('Region clicked, showing play button', region);
      },
      onRegionUpdate: (region) => {
        // Immer die zuletzt veränderte Region aktualisieren und anzeigen
        setLastModifiedRegion(region);
        setShowRegionPlayButton(true);
        // Markiere diese Region als aktiv
        setRegionActive(region.id);
        addDebugLog('Region updated, showing play button for modified region', region);
      },
      onRegionActivated: (region) => {
        // Region wurde aktiviert - aktualisiere die Active Region Anzeige
        setLastModifiedRegion(region);
        setShowRegionPlayButton(true);
        addDebugLog('Region activated, updating Active Region display', region);
      }
    });

  // Loading state management
  useEffect(() => {
    if (blob && !isReady && !isLoading) {
      setIsLoading(true);
      setError(null);
    } else if (isReady && isLoading) {
      setIsLoading(false);
    }
  }, [blob, isReady, isLoading]);

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

  // Prüfe ob die zuletzt veränderte Region noch existiert, wenn sich allRegions ändert
  useEffect(() => {
    if (lastModifiedRegion && showRegionPlayButton) {
      const regionStillExists = allRegions.some(r => r.id === lastModifiedRegion.id);
      if (!regionStillExists) {
        // Region wurde gelöscht, verstecke den Play-Button
        setShowRegionPlayButton(false);
        setLastModifiedRegion(null);
        addDebugLog('Last modified region was deleted, hiding play button', lastModifiedRegion);
      }
    }
  }, [allRegions, lastModifiedRegion, showRegionPlayButton]);

  // Debug-Logging für lastModifiedRegion Änderungen
  useEffect(() => {
    if (lastModifiedRegion) {
      addDebugLog('Last modified region state updated', {
        id: lastModifiedRegion.id,
        start: lastModifiedRegion.start,
        end: lastModifiedRegion.end,
        duration: lastModifiedRegion.end - lastModifiedRegion.start,
        showButton: showRegionPlayButton
      });
    }
  }, [lastModifiedRegion, showRegionPlayButton]);

  // Markiere alle Regionen als inaktiv, wenn der Play-Button geschlossen wird
  useEffect(() => {
    if (!showRegionPlayButton) {
      setAllRegionsInactive();
      addDebugLog('Play button closed, marking all regions as inactive');
    }
  }, [showRegionPlayButton, setAllRegionsInactive]);

  // Error boundary effect - listen to WaveSurfer's own error events
  useEffect(() => {
    if (blob && !isReady) {
      addDebugLog('Waveform loading started', { 
        blobSize: blob.size, 
        blobType: blob.type
      });
    }
  }, [blob, isReady]);

  // Listen to WaveSurfer error events
  useEffect(() => {
    if (wavesurfer?.current) {
      const handleError = (error: any) => {
        addDebugLog('WaveSurfer error detected', { error: error.message || error });
        setError('Fehler beim Laden der Wellenform. Bitte versuchen Sie es erneut.');
      };

      const handleReady = () => {
        addDebugLog('WaveSurfer ready');
        setError(null);
      };

      wavesurfer.current.on('error', handleError);
      wavesurfer.current.on('ready', handleReady);

      return () => {
        if (wavesurfer.current) {
          wavesurfer.current.un('error', handleError);
          wavesurfer.current.un('ready', handleReady);
        }
      };
    }
  }, [wavesurfer]);

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
    <div className={className ?? ''} style={{ paddingTop: '73px', marginTop: '-73px' }}>
      {/* Mobile-optimized waveform container with better touch support */}
        <div 
          ref={containerRef} 
          className="wavesurfer-container rounded-lg"
          style={{ 
            touchAction: 'pan-x pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            height: '120px',
            width: '100%',
            backgroundColor: '#000000',
            position: 'relative',
            overflow: 'visible'
          }}
        />
      
      {/* Zoom Slider */}
      <div className="mt-4 w-full">
        <ZoomSlider 
          zoomLevel={zoomLevel}
          onZoomChange={(level) => {
            if (isReady && wavesurfer?.current) {
              try {
                setZoom(level);
              } catch (error) {
                addDebugLog('Zoom change failed', { error: error.message || error });
                console.warn('Zoom change failed:', error);
              }
            }
          }}
          onZoomIn={() => {
            if (isReady && wavesurfer?.current) {
              try {
                zoomIn();
              } catch (error) {
                addDebugLog('Zoom in failed', { error: error.message || error });
                console.warn('Zoom in failed:', error);
              }
            }
          }}
          onZoomOut={() => {
            if (isReady && wavesurfer?.current) {
              try {
                zoomOut();
              } catch (error) {
                addDebugLog('Zoom out failed', { error: error.message || error });
                console.warn('Zoom out failed:', error);
              }
            }
          }}
          minZoom={1}
          maxZoom={1000}
        />
      </div>

      {/* Region Play Button - erscheint nur wenn eine Region ausgewählt oder verändert wurde */}
      {showRegionPlayButton && lastModifiedRegion && (
        <div className="mt-4 w-full">
          <div className="true-black-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm mb-1">Active Region</h4>
                <p className="text-white text-xs">
                  {Math.round(lastModifiedRegion.start)}s - {Math.round(lastModifiedRegion.end)}s
                  <span className="ml-2 text-gray-400">
                    ({Math.round(lastModifiedRegion.end - lastModifiedRegion.start)}s)
                  </span>
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    triggerHaptic();
                    if (isPlaying && currentPlayingRegionId === lastModifiedRegion.id) {
                      pauseRegion();
                    } else {
                      playRegion(lastModifiedRegion);
                    }
                  }}
                  className="w-9 h-9 rounded-full border border-gray-500 hover:border-gray-300 flex items-center justify-center transition-all duration-200 hover:bg-gray-500/10"
                  style={{ aspectRatio: '1/1', minWidth: '36px', minHeight: '36px', maxWidth: '36px', maxHeight: '36px' }}
                >
                  {isPlaying && currentPlayingRegionId === lastModifiedRegion.id ? (
                    <Pause size={16} className="text-white" strokeWidth={2} />
                  ) : (
                    <Play size={16} className="text-white ml-0.5" strokeWidth={2} />
                  )}
                </button>
                
                 <button
                   onClick={() => {
                     triggerHaptic();
                     if (allRegions.length > 1 && lastModifiedRegion) {
                       // Finde die vorherige Region (nach Zeit sortiert)
                       const sortedRegions = [...allRegions].sort((a, b) => a.start - b.start);
                       const currentIndex = sortedRegions.findIndex(r => r.id === lastModifiedRegion.id);
                       const previousRegion = currentIndex > 0 ? sortedRegions[currentIndex - 1] : sortedRegions[currentIndex + 1];
                       
                       // Region löschen
                       removeRegionById(lastModifiedRegion.id);
                       
                       // Vorherige Region aktivieren
                       if (previousRegion) {
                         setLastModifiedRegion(previousRegion);
                         setShowRegionPlayButton(true);
                         setRegionActive(previousRegion.id);
                         addDebugLog('Region deleted, previous region activated', previousRegion);
                       } else {
                         setShowRegionPlayButton(false);
                         setLastModifiedRegion(null);
                         addDebugLog('Region deleted, no previous region', lastModifiedRegion);
                       }
                     }
                   }}
                   disabled={allRegions.length <= 1}
                   className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 ${
                     allRegions.length <= 1 
                       ? 'border-gray-700 cursor-not-allowed opacity-50' 
                       : 'border-gray-500 hover:border-red-400 hover:bg-red-500/10'
                   }`}
                   style={{ aspectRatio: '1/1', minWidth: '36px', minHeight: '36px', maxWidth: '36px', maxHeight: '36px' }}
                   title={allRegions.length <= 1 ? 'Mindestens eine Region muss vorhanden bleiben' : 'Region löschen'}
                 >
                   <Trash2 size={16} className={allRegions.length <= 1 ? 'text-white/70' : 'text-white'} strokeWidth={2} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons unter der Active Region */}
      <div className="mt-4">
        {/* Vollbreite: Set new Area */}
        <button
          onClick={handleAddNewRegion}
          className="w-full h-12 rounded-full border border-gray-500 hover:border-gray-300 flex items-center justify-center transition-all duration-200 hover:bg-gray-500/10"
        >
          <Plus size={16} className="text-white mr-2" strokeWidth={2} />
          <span className="text-white text-sm font-medium">Set new Area</span>
        </button>

        {/* Zwei Buttons nebeneinander */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              triggerHaptic();
              playAllRegions();
            }}
            className="w-full h-12 rounded-full border border-gray-500 hover:border-gray-300 flex items-center justify-center transition-all duration-200 hover:bg-gray-500/10"
          >
            <Play size={16} className="text-white mr-2" strokeWidth={2} />
            <span className="text-white text-sm font-medium">Play all Areas</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic();
              play();
            }}
            className="w-full h-12 rounded-full border border-gray-500 hover:border-gray-300 flex items-center justify-center transition-all duration-200 hover:bg-gray-500/10"
          >
            <Play size={16} className="text-white mr-2" strokeWidth={2} />
            <span className="text-white text-sm font-medium">Play full audio</span>
          </button>
        </div>

        {!isReady && (
          <div className="mt-3 flex items-center space-x-2">
            <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-transparent via-[#ff4e3a]/30 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 h-full w-4 bg-gradient-to-r from-transparent via-[#ff4e3a]/50 to-transparent" 
                   style={{ 
                     animation: 'shimmer 1.5s ease-in-out infinite',
                     animationDelay: '0.2s'
                   }}></div>
            </div>
            <span className="text-[#ff4e3a] text-sm font-medium">loading…</span>
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