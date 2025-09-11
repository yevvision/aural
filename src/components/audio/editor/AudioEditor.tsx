import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, AlertCircle, Trash2, Play, Download, ArrowRight } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';
import { concatenateSegments, encodeWithFfmpegWorker, trimToWav } from '../../../hooks/useTrimExport';

type EncodeFormat = 'mp3' | 'aac';

export default function AudioEditor({
  recordingBlob,
  onDone,
  enableFfmpeg = false,
}: {
  recordingBlob: Blob;
  onDone: (out: Blob) => void; // gibt den geschnittenen/encodierten Blob zurück
  enableFfmpeg?: boolean;
}) {
  console.log('AudioEditor: Received recording blob:', {
    size: recordingBlob?.size,
    type: recordingBlob?.type,
    hasBlob: !!recordingBlob
  });
  const [sel, setSel] = useState<{ start: number; end: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<{ start: number; end: number }[]>([]);
  const [allRegions, setAllRegions] = useState<{ start: number; end: number; id: string }[]>([]);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [waveformDuration, setWaveformDuration] = useState<number>(0);
  const [clickedSelection, setClickedSelection] = useState<{ start: number; end: number } | null>(null);
  const canExport = allRegions.length > 0 || selectedSegments.length > 0 || (sel !== null && sel.start < sel.end && sel.end > sel.start);

  const handleSelectionChange = (selection: { start: number; end: number } | null) => {
    console.log('AudioEditor: Selection changed to:', selection);
    setSel(selection);
  };

  const handleDurationChange = (duration: number) => {
    console.log('AudioEditor: Duration received from waveform:', duration);
    setWaveformDuration(duration);
  };

  const handleRegionsChange = (regions: { start: number; end: number; id: string }[]) => {
    console.log('AudioEditor: Regions changed:', regions);
    setAllRegions(regions);
  };

  // Get color for a specific region - all regions are orange now
  const getRegionColor = (regionId: string) => {
    return 'rgba(245, 158, 11, 0.25)'; // orange
  };

  const [removeRegionFn, setRemoveRegionFn] = useState<((start: number, end: number) => void) | null>(null);

  const handleRemoveRegionReady = (removeFn: (start: number, end: number) => void) => {
    setRemoveRegionFn(() => removeFn);
  };

  // Get audio duration when blob is available
  useEffect(() => {
    if (recordingBlob) {
      const audio = new Audio();
      const url = URL.createObjectURL(recordingBlob);
      audio.src = url;
      
      const handleLoadedMetadata = () => {
        console.log('AudioEditor: Audio duration loaded:', audio.duration);
        setAudioDuration(audio.duration);
        URL.revokeObjectURL(url);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
      
      const handleError = (error: Event) => {
        console.error('AudioEditor: Error loading audio metadata:', error);
        URL.revokeObjectURL(url);
        audio.removeEventListener('error', handleError);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      
      // Force load metadata
      audio.load();
    }
  }, [recordingBlob]);

  const handleAddSegment = () => {
    if (sel) {
      // Directly add the segment without showing confirmation buttons
      setSelectedSegments(prev => [...prev, sel]);
      setSel(null);
      console.log('AudioEditor: Segment added directly:', sel);
    }
  };


  const handleRemoveSegment = (index: number) => {
    setSelectedSegments(prev => prev.filter((_, i) => i !== index));
    console.log('AudioEditor: Segment removed at index:', index);
  };

  const handleSelectionClick = (selection: { start: number; end: number }) => {
    setClickedSelection(selection);
    console.log('AudioEditor: Selection clicked:', selection);
  };

  const handleDeleteSelection = (start?: number, end?: number) => {
    if (start !== undefined && end !== undefined) {
      // Delete specific region from both state and waveform
      if (removeRegionFn) {
        removeRegionFn(start, end);
      }
      // The region will be removed from state via the region-removed event
      console.log('AudioEditor: Region deleted:', { start, end });
    } else if (clickedSelection) {
      // Delete clicked selection (legacy)
      setSelectedSegments(prev => prev.filter(segment => 
        segment.start !== clickedSelection.start || segment.end !== clickedSelection.end
      ));
      setClickedSelection(null);
      console.log('AudioEditor: Selection deleted:', clickedSelection);
    }
  };

  const handlePlaySelection = (start?: number, end?: number) => {
    const playStart = start !== undefined ? start : clickedSelection?.start;
    const playEnd = end !== undefined ? end : clickedSelection?.end;
    
    if (playStart !== undefined && playEnd !== undefined && recordingBlob) {
      // Create audio element and play the selected segment
      const audio = new Audio();
      const url = URL.createObjectURL(recordingBlob);
      audio.src = url;
      
      audio.onloadedmetadata = () => {
        audio.currentTime = playStart;
        audio.play();
        
        // Stop at the end of the selection
        const stopAt = playEnd;
        const checkTime = () => {
          if (audio.currentTime >= stopAt) {
            audio.pause();
            audio.removeEventListener('timeupdate', checkTime);
            URL.revokeObjectURL(url);
          }
        };
        audio.addEventListener('timeupdate', checkTime);
      };
      
      console.log('AudioEditor: Playing selection:', { start: playStart, end: playEnd });
    }
  };

  const handleExport = async (format: 'wav' | 'mp3' | 'aac' = 'wav', quality: number = 128) => {
    console.log('🚀 Export called:', { format, quality, canExport, selectedSegments, sel, busy, allRegions });
    if (!canExport || busy) {
      console.log('❌ Export blocked:', { canExport, busy });
      return; // Prevent double-click
    }
    
    console.log('✅ Starting export...');
    setBusy(true);
    setError(null);
    
    try {
      // Use all regions if available, otherwise use selected segments or current selection
      let segmentsToExport = allRegions.length > 0 
        ? allRegions.map(region => ({ start: region.start, end: region.end }))
        : selectedSegments.length > 0 
          ? selectedSegments 
          : sel 
            ? [sel] 
            : [];
      
      console.log('📊 Segments to export:', segmentsToExport);
      console.log('📊 All regions:', allRegions);
      console.log('📊 Selected segments:', selectedSegments);
      console.log('📊 Current selection:', sel);
      
      if (segmentsToExport.length === 0) {
        throw new Error('Keine Segmente ausgewählt. Bitte wähle mindestens einen Bereich aus.');
      }
      
      // Sort segments by start time to ensure correct order
      const sortedSegments = [...segmentsToExport].sort((a, b) => a.start - b.start);
      
      // Validate segments
      for (const segment of sortedSegments) {
        if (segment.start >= segment.end) {
          throw new Error('Ungültige Segment-Auswahl: Start-Zeit muss vor End-Zeit liegen.');
        }
        if (segment.start < 0 || segment.end > waveformDuration) {
          throw new Error('Segment-Auswahl liegt außerhalb der Audio-Dauer.');
        }
      }
      
      // Concatenate all segments into one audio file
      console.log('🔄 Concatenating segments...');
      const wav = await concatenateSegments(recordingBlob, sortedSegments);
      console.log('✅ Concatenated WAV created, size:', wav.size);

      // 2) Optional: MP3/AAC via ffmpeg.wasm im Worker (auf Mobile evtl. langsam)
      if (format !== 'wav' && enableFfmpeg) {
        console.log('Encoding with ffmpeg...');
        try {
          const encoded = await encodeWithFfmpegWorker(wav, format as EncodeFormat, quality);
          console.log('Encoded file size:', encoded.size);
          onDone(encoded);
        } catch (ffmpegError) {
          console.warn('FFmpeg encoding failed, falling back to WAV:', ffmpegError);
          setError('MP3/AAC-Encoding fehlgeschlagen. Verwende WAV-Export.');
          // Fallback to WAV
          onDone(wav);
        }
      } else {
        console.log('🎵 Using WAV directly');
        // Default: WAV zurückgeben (oder WebM-Flow ergänzen)
        console.log('📤 Calling onDone with WAV blob...');
        onDone(wav);
        console.log('✅ onDone called successfully');
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectionDuration = sel ? sel.end - sel.start : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Waveform - im Stil der Audio-Detail-Seite */}
      <div className="bg-transparent">
        <WaveformVisualizer
          blob={recordingBlob} 
          onSelectionChange={handleSelectionChange}
          onDurationChange={handleDurationChange}
          onAddSegment={handleAddSegment}
          onRegionsChange={handleRegionsChange}
          onRemoveRegionReady={handleRemoveRegionReady}
        />
      </div>



      {/* All Regions - Individual boxes with matching colors */}
      <div className="space-y-3">
        {allRegions.length > 0 ? (
          allRegions.map((region, index) => {
            // All regions are orange
            const regionColor = 'rgba(245, 158, 11, 0.25)'; // orange
            
            // All regions are orange
            const colorVariant = 'orange';
            
            return (
              <div 
                key={region.id} 
                className="rounded-lg p-4 border-2"
                style={{ 
                  backgroundColor: regionColor,
                  borderColor: regionColor.replace('0.25', '0.5')
                }}
              >
                <div className="text-center mb-3">
                  <span className="text-sm font-medium text-white">
                    Region {index + 1}: {formatTime(region.start)} → {formatTime(region.end)}
                  </span>
                </div>
                
                {/* Action Buttons - Always visible */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlaySelection(region.start, region.end);
                    }}
                    className="flex-1 py-2 px-3 rounded-full border-2 border-white bg-transparent flex items-center justify-center space-x-2 hover:bg-white/10 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play size={14} className="text-white" strokeWidth={1.5} />
                    <span className="text-white text-sm font-medium">Play</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (index !== 0) {
                        handleDeleteSelection(region.start, region.end);
                      }
                    }}
                    disabled={index === 0}
                    className={`flex-1 py-2 px-3 rounded-full border-2 flex items-center justify-center space-x-2 transition-all duration-200 ${
                      index === 0 
                        ? 'border-white/50 bg-transparent cursor-not-allowed opacity-50'
                        : 'border-white bg-transparent hover:bg-white/10'
                    }`}
                    whileHover={index === 0 ? {} : { scale: 1.02 }}
                    whileTap={index === 0 ? {} : { scale: 0.98 }}
                  >
                    <Trash2 size={14} className={index === 0 ? 'text-white/50' : 'text-white'} strokeWidth={1.5} />
                    <span className={`text-sm font-medium ${index === 0 ? 'text-white/50' : 'text-white'}`}>
                      Delete
                    </span>
                  </motion.button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">
              Click "New Area" to mark a region
            </div>
          </div>
        )}
      </div>

      {/* Selected Segments Info */}
      {selectedSegments.length > 0 && (
        <div className="py-4 px-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="text-center">
            <div className="text-blue-400 text-sm font-medium mb-2">
              {selectedSegments.length} Segment{selectedSegments.length !== 1 ? 'e' : ''} ausgewählt
            </div>
            <div className="text-blue-300 text-xs space-y-2">
              {selectedSegments.map((segment, index) => (
                <div key={index} className="space-y-2">
                  <motion.div 
                    className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      clickedSelection && clickedSelection.start === segment.start && clickedSelection.end === segment.end
                        ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                        : 'hover:bg-white/5 hover:text-blue-200'
                    }`}
                    onClick={() => handleSelectionClick(segment)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Segment {index + 1}: {formatTime(segment.start)} → {formatTime(segment.end)}
                  </motion.div>
                  
                  {/* Action Buttons for clicked segment */}
                  {clickedSelection && clickedSelection.start === segment.start && clickedSelection.end === segment.end && (
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.button
                        onClick={handlePlaySelection}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-green-500 bg-green-500/20 flex items-center justify-center space-x-1 hover:bg-green-500/30 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Play size={12} className="text-green-500" strokeWidth={1.5} />
                        <span className="text-green-500 text-xs font-medium">Play</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={handleDeleteSelection}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-red-500 bg-red-500/20 flex items-center justify-center space-x-1 hover:bg-red-500/30 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 size={12} className="text-red-500" strokeWidth={1.5} />
                        <span className="text-red-500 text-xs font-medium">Delete</span>
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions when no selection */}
      {!canExport && !busy && (
        <div className="text-center py-6 px-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="text-blue-400 text-sm font-medium mb-2">
            🎯 Wählen Sie einen Bereich aus
          </div>
          <div className="text-blue-300 text-xs space-y-1">
            <p>• Drag over the waveform to mark an area</p>
            <p>• Or click "Set Region" for automatic selection</p>
            <p>• Add multiple segments to combine them</p>
          </div>
        </div>
      )}

      {/* Full-width Export Button */}
      <motion.button
        onClick={() => canExport ? handleExport() : null}
        disabled={!canExport || busy}
        className="w-full py-4 px-6 rounded-full border border-orange-500 bg-orange-500/20 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500/30 transition-all duration-200"
        whileHover={!busy && canExport ? { scale: 1.02 } : {}}
        whileTap={!busy && canExport ? { scale: 0.98 } : {}}
      >
        {busy ? (
          <motion.div
            className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <ArrowRight size={20} className="text-orange-500" strokeWidth={1.5} />
        )}
        <span className="text-orange-500 font-medium">
          {busy ? 'Processing...' : canExport ? 'Export' : 'Select area'}
        </span>
      </motion.button>

      {/* Error Display */}
      {error && (
        <motion.div 
          className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}


    </div>
  );
}
