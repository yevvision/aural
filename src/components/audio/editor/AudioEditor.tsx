import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, AlertCircle, Trash2, Play } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';
import { concatenateSegments, encodeWithFfmpegWorker } from '../../../hooks/useTrimExport';

type EncodeFormat = 'mp3' | 'aac';

export default function AudioEditor({
  recordingBlob,
  onDone,
  enableFfmpeg = false,
  preferredFormat = 'mp3' as EncodeFormat,
  kbps = 128,
}: {
  recordingBlob: Blob;
  onDone: (out: Blob) => void; // gibt den geschnittenen/encodierten Blob zurück
  enableFfmpeg?: boolean;
  preferredFormat?: EncodeFormat;
  kbps?: number;
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
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [waveformDuration, setWaveformDuration] = useState<number>(0);
  const [clickedSelection, setClickedSelection] = useState<{ start: number; end: number } | null>(null);
  const canExport = selectedSegments.length > 0 || sel !== null;

  const handleSelectionChange = (selection: { start: number; end: number } | null) => {
    console.log('AudioEditor: Selection changed to:', selection);
    setSel(selection);
  };

  const handleDurationChange = (duration: number) => {
    console.log('AudioEditor: Duration received from waveform:', duration);
    setWaveformDuration(duration);
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

  const handleDeleteSelection = () => {
    if (clickedSelection) {
      setSelectedSegments(prev => prev.filter(segment => 
        segment.start !== clickedSelection.start || segment.end !== clickedSelection.end
      ));
      setClickedSelection(null);
      console.log('AudioEditor: Selection deleted:', clickedSelection);
    }
  };

  const handlePlaySelection = () => {
    if (clickedSelection && recordingBlob) {
      // Create audio element and play the selected segment
      const audio = new Audio();
      const url = URL.createObjectURL(recordingBlob);
      audio.src = url;
      
      audio.onloadedmetadata = () => {
        audio.currentTime = clickedSelection.start;
        audio.play();
        
        // Stop at the end of the selection
        const stopAt = clickedSelection.end;
        const checkTime = () => {
          if (audio.currentTime >= stopAt) {
            audio.pause();
            audio.removeEventListener('timeupdate', checkTime);
            URL.revokeObjectURL(url);
          }
        };
        audio.addEventListener('timeupdate', checkTime);
      };
      
      console.log('AudioEditor: Playing selection:', clickedSelection);
    }
  };

  const exportSelection = async () => {
    console.log('Export selection called:', { canExport, selectedSegments, busy });
    if (!canExport || busy) return; // Prevent double-click
    
    setBusy(true);
    setError(null);
    
    try {
      console.log('Starting export with segments:', selectedSegments);
      
      // Sort segments by start time to ensure correct order
      const sortedSegments = [...selectedSegments].sort((a, b) => a.start - b.start);
      
      // Concatenate all segments into one audio file
      const wav = await concatenateSegments(recordingBlob, sortedSegments);
      console.log('Concatenated WAV created, size:', wav.size);

      // 2) Optional: MP3/AAC via ffmpeg.wasm im Worker (auf Mobile evtl. langsam)
      if (enableFfmpeg) {
        console.log('Encoding with ffmpeg...');
        try {
          const encoded = await encodeWithFfmpegWorker(wav, preferredFormat, kbps);
          console.log('Encoded file size:', encoded.size);
          onDone(encoded);
        } catch (ffmpegError) {
          console.warn('FFmpeg encoding failed, falling back to WAV:', ffmpegError);
          setError('MP3/AAC-Encoding fehlgeschlagen. Verwende WAV-Export.');
          // Fallback to WAV
          onDone(wav);
        }
      } else {
        console.log('Using WAV directly');
        // Default: WAV zurückgeben (oder WebM-Flow ergänzen)
        onDone(wav);
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
        />
      </div>

      {/* Duration Info */}
      <div className="mt-8 py-4 px-6 bg-transparent backdrop-blur-sm -mx-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          {/* Audio Duration */}
          <div>
            <div className="text-gray-400 text-xs mb-1">Dauer der Aufnahme:</div>
            <div className="text-white text-lg font-mono">
              {formatTime(waveformDuration || audioDuration)}
            </div>
            {/* Debug info */}
            {import.meta.env.DEV && (
              <div className="text-xs text-gray-500 mt-1">
                Debug: Audio={audioDuration.toFixed(2)}s, Waveform={waveformDuration.toFixed(2)}s
              </div>
            )}
          </div>
          
          {/* Selection Duration */}
          <div>
            <div className="text-gray-400 text-xs mb-1">Dauer der Auswahl:</div>
            <div className="text-white text-lg font-mono">
              {(() => {
                // Calculate total duration of all selected segments plus current selection
                const totalDuration = selectedSegments.reduce((sum, segment) => sum + (segment.end - segment.start), 0);
                const currentSelectionDuration = sel ? (sel.end - sel.start) : 0;
                const combinedDuration = totalDuration + currentSelectionDuration;
                return formatTime(combinedDuration);
              })()}
            </div>
          </div>
        </div>
        
        {/* Selection Details */}
        {sel && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <motion.div 
              className={`text-center text-sm cursor-pointer p-2 rounded-lg transition-all duration-200 ${
                clickedSelection && clickedSelection.start === sel.start && clickedSelection.end === sel.end
                  ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
              }`}
              onClick={() => handleSelectionClick(sel)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Auswahl: {formatTime(sel.start)} → {formatTime(sel.end)}
            </motion.div>
            
            {/* Action Buttons for clicked selection */}
            {clickedSelection && clickedSelection.start === sel.start && clickedSelection.end === sel.end && (
              <motion.div 
                className="flex gap-3 mt-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={handlePlaySelection}
                  className="flex-1 py-2 px-3 rounded-lg border border-green-500 bg-green-500/20 flex items-center justify-center space-x-2 hover:bg-green-500/30 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={14} className="text-green-500" strokeWidth={1.5} />
                  <span className="text-green-500 text-xs font-medium">Abspielen</span>
                </motion.button>
                
                <motion.button
                  onClick={handleDeleteSelection}
                  className="flex-1 py-2 px-3 rounded-lg border border-red-500 bg-red-500/20 flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trash2 size={14} className="text-red-500" strokeWidth={1.5} />
                  <span className="text-red-500 text-xs font-medium">Löschen</span>
                </motion.button>
              </motion.div>
            )}
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
                        <span className="text-green-500 text-xs font-medium">Abspielen</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={handleDeleteSelection}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-red-500 bg-red-500/20 flex items-center justify-center space-x-1 hover:bg-red-500/30 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 size={12} className="text-red-500" strokeWidth={1.5} />
                        <span className="text-red-500 text-xs font-medium">Löschen</span>
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-width Export Button */}
      <motion.button
        onClick={exportSelection}
        disabled={!canExport || busy}
        className="w-full py-4 px-6 rounded-xl border border-orange-500 bg-orange-500/20 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500/30 transition-all duration-200"
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
          <Scissors size={20} className="text-orange-500" strokeWidth={1.5} />
        )}
        <span className="text-orange-500 font-medium">
          {busy ? 'Wird verarbeitet...' : 'Next step'}
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
