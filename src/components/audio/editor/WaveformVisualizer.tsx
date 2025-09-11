import { useEffect, useRef, useState } from 'react';
import { useWaveformEditor } from '../../../hooks/useWaveformEditor';
import { Play, Pause, Plus } from 'lucide-react';

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
  
  const { selection, addOrReplaceRegion, addNewRegion, removeRegion, allRegions, isReady, zoom, play, pause, playing, duration } =
    useWaveformEditor({ container: containerRef.current, audioBlob: blob, height: 120, barWidth: 2 });

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

  // Error boundary effect
  useEffect(() => {
    if (blob && !isReady) {
      const timeout = setTimeout(() => {
        if (!isReady) {
          setError('Wellenform konnte nicht geladen werden. Bitte versuchen Sie es erneut.');
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [blob, isReady]);

  if (error) {
  return (
    <div className={className ?? ''}>
        <div className="w-full h-28 rounded bg-red-900/20 border border-red-500/30 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                // Retry by recreating the component
                window.location.reload();
              }}
              className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
            >
              Erneut versuchen
            </button>
          </div>
          </div>
      </div>
    );
  }

  return (
    <div className={className ?? ''}>
      <div ref={containerRef} className="w-full h-28 rounded bg-neutral-800 touch-pan-x touch-pan-y" />
      <div className="mt-3 flex items-center justify-center gap-4">
        <button 
            onClick={() => (playing() ? pause() : play())} 
          className="w-12 h-12 rounded-full border-2 border-white bg-transparent flex items-center justify-center hover:bg-white/10 transition-all duration-200"
          >
            {playing() ? (
            <Pause size={20} className="text-white" strokeWidth={1.5} />
          ) : (
            <Play size={20} className="text-white" strokeWidth={1.5} />
          )}
        </button>
        
        <button 
          onClick={() => addNewRegion(0)} 
          className="px-6 py-3 rounded-full border border-orange-500 bg-orange-500/20 flex items-center space-x-2 hover:bg-orange-500/30 transition-all duration-200"
        >
          <Plus size={16} className="text-orange-500" strokeWidth={1.5} />
          <span className="text-orange-500 text-sm font-medium">New Area</span>
        </button>
        
        {!isReady && <span className="text-sm opacity-70">lädt…</span>}
      </div>

      {/* Help text when no selection */}
      {isReady && !selection && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-400">
            💡 Drag over the waveform or click "Set Region" to select an area
          </p>
        </div>
      )}
    </div>
  );
}