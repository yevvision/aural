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
  const [isFixingAudio, setIsFixingAudio] = useState(false);
  const [fixedBlob, setFixedBlob] = useState<Blob | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const canExport = allRegions.length > 0 || selectedSegments.length > 0 || (sel !== null && sel.start < sel.end && sel.end > sel.start);
  
  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // Haptic feedback for button interactions
    }
  };

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

  // Hilfsfunktion zum Reparieren von Audio-Blobs
  const fixAudioBlob = async (blob: Blob): Promise<Blob | null> => {
    try {
      console.log('AudioEditor: Attempting to fix audio blob using AudioContext...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('AudioEditor: Audio buffer decoded successfully', { 
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      });
      
      // Konvertiere zurück zu WAV-Format
      const wavBlob = await audioBufferToWav(audioBuffer);
      await audioContext.close();
      
      console.log('AudioEditor: Audio blob fixed successfully', { 
        originalSize: blob.size, 
        fixedSize: wavBlob.size 
      });
      
      return wavBlob;
    } catch (error) {
      console.error('AudioEditor: Failed to fix audio blob:', error);
      return null;
    }
  };

  // Hilfsfunktion zum Konvertieren von AudioBuffer zu WAV
  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Erstelle WAV-Header
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV-Header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Konvertiere Audio-Daten
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Sofortige Audio-Reparatur beim Laden
  useEffect(() => {
    if (recordingBlob) {
      console.log('AudioEditor: Starting immediate audio repair...');
      setIsFixingAudio(true);
      setError('Audio wird repariert...');
      
      // Repariere den Blob sofort
      fixAudioBlob(recordingBlob).then(fixedBlob => {
        if (fixedBlob) {
          console.log('AudioEditor: Audio blob fixed successfully!');
          setFixedBlob(fixedBlob);
          setCurrentBlob(fixedBlob);
          setError(null);
          setIsFixingAudio(false);
          
          // Validiere den reparierten Blob
          const audio = new Audio();
          const url = URL.createObjectURL(fixedBlob);
          audio.src = url;
          
          audio.addEventListener('loadedmetadata', () => {
            console.log('AudioEditor: Fixed audio duration:', audio.duration);
            if (isFinite(audio.duration) && audio.duration > 0) {
              console.log('AudioEditor: Fixed audio is valid!');
              setAudioDuration(audio.duration);
            } else {
              console.error('AudioEditor: Fixed audio still has invalid duration');
              setError('Audio konnte nicht vollständig repariert werden.');
            }
            URL.revokeObjectURL(url);
          });
          
          audio.addEventListener('error', (e) => {
            console.error('AudioEditor: Fixed audio validation error:', e);
            setError('Reparierte Audio-Datei ist ungültig.');
            URL.revokeObjectURL(url);
          });
          
          audio.load();
        } else {
          console.error('AudioEditor: Could not fix audio blob');
          setError('Audio-Datei konnte nicht repariert werden. Bitte nehmen Sie erneut auf.');
          setIsFixingAudio(false);
        }
      });
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

  const handleClearAllSegments = () => {
    setSelectedSegments([]);
    setSel(null);
    console.log('AudioEditor: All segments cleared');
  };

  const handleExport = async () => {
    if (busy) return;
    
    setBusy(true);
    setError(null);
    
    try {
      console.log('AudioEditor: Starting export process...');
      console.log('AudioEditor: Selected segments:', selectedSegments);
      console.log('AudioEditor: All regions:', allRegions);
      console.log('AudioEditor: Current selection:', sel);
      
      // Verwende den reparierten Blob falls verfügbar
      const blobToUse = currentBlob || recordingBlob;
      console.log('AudioEditor: Using blob for export:', {
        isFixed: !!currentBlob,
        size: blobToUse.size,
        type: blobToUse.type
      });
      
      let resultBlob: Blob;
      
      if (selectedSegments.length > 0) {
        // Export selected segments
        console.log('AudioEditor: Exporting selected segments...');
        resultBlob = await concatenateSegments(blobToUse, selectedSegments);
      } else if (allRegions.length > 0) {
        // Export all regions
        console.log('AudioEditor: Exporting all regions...');
        const regionSegments = allRegions.map(region => ({
          start: region.start,
          end: region.end
        }));
        resultBlob = await concatenateSegments(blobToUse, regionSegments);
      } else if (sel && sel.start < sel.end && sel.end > sel.start) {
        // Export current selection
        console.log('AudioEditor: Exporting current selection...');
        resultBlob = await trimToWav(blobToUse, sel.start, sel.end);
      } else {
        throw new Error('Keine gültige Auswahl zum Exportieren');
      }
      
      console.log('AudioEditor: Export completed, result blob:', {
        size: resultBlob.size,
        type: resultBlob.type
      });
      
      // Encode if ffmpeg is enabled
      if (enableFfmpeg && resultBlob) {
        console.log('AudioEditor: Encoding with ffmpeg...');
        const encodedBlob = await encodeWithFfmpegWorker(resultBlob, 'mp3');
        console.log('AudioEditor: Encoding completed:', {
          size: encodedBlob.size,
          type: encodedBlob.type
        });
        onDone(encodedBlob);
      } else {
        onDone(resultBlob);
      }
      
    } catch (err) {
      console.error('AudioEditor: Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  // Zeige Fehler oder Reparatur-Status
  if (error) {
    return (
      <div className="space-y-4">
        <div className="w-full h-32 rounded bg-red-900/20 border border-red-500/30 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button 
              onClick={() => window.location.href = '/recorder'}
              className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700"
            >
              Neu aufnehmen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Zeige Reparatur-Status
  if (isFixingAudio) {
    return (
      <div className="space-y-4">
        <div className="w-full h-32 rounded bg-orange-900/20 border border-orange-500/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-orange-400 text-sm">Audio wird repariert...</p>
            <p className="text-orange-300 text-xs mt-1">Bitte warten Sie einen Moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Zeige Wellenform nur wenn wir einen gültigen Blob haben
  if (!currentBlob) {
    return (
      <div className="space-y-4">
        <div className="w-full h-32 rounded bg-gray-900/20 border border-gray-500/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Audio wird vorbereitet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Waveform Visualizer mit repariertem Blob */}
      <WaveformVisualizer
        blob={currentBlob}
        onSelectionChange={handleSelectionChange}
        onDurationChange={handleDurationChange}
        onRegionsChange={handleRegionsChange}
        onRemoveRegionReady={handleRemoveRegionReady}
        className="w-full"
      />

      {/* Audio Info */}
      <div className="text-center text-sm text-gray-400">
        {audioDuration > 0 && (
          <p>Audio-Dauer: {Math.round(audioDuration)} Sekunden</p>
        )}
        {fixedBlob && (
          <p className="text-green-400">✓ Audio erfolgreich repariert</p>
        )}
      </div>

      {/* Selection Controls */}
      {sel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-2 justify-center"
        >
          <button
            onClick={handleAddSegment}
            className="px-4 py-2 rounded bg-orange-600 text-white text-sm hover:bg-orange-700 flex items-center justify-center gap-2"
          >
            <Scissors size={16} />
            Segment hinzufügen
          </button>
          <button
            onClick={() => setSel(null)}
            className="px-4 py-2 rounded bg-gray-600 text-white text-sm hover:bg-gray-700"
          >
            Abbrechen
          </button>
        </motion.div>
      )}

      {/* Selected Segments */}
      {selectedSegments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Ausgewählte Segmente:</h3>
          <div className="space-y-1">
            {selectedSegments.map((segment, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
              >
                <span className="text-sm text-gray-300">
                  {Math.round(segment.start)}s - {Math.round(segment.end)}s
                </span>
                <button
                  onClick={() => handleRemoveSegment(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleClearAllSegments}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Alle löschen
          </button>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExport}
          disabled={!canExport || busy}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {busy ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Exportiere...
            </>
          ) : (
            <>
              <Download size={20} />
              Exportieren
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Export Info */}
      {canExport && (
        <div className="text-center text-sm text-gray-400">
          {selectedSegments.length > 0 && (
            <p>{selectedSegments.length} Segment(e) ausgewählt</p>
          )}
          {allRegions.length > 0 && selectedSegments.length === 0 && (
            <p>{allRegions.length} Region(en) ausgewählt</p>
          )}
          {sel && selectedSegments.length === 0 && allRegions.length === 0 && (
            <p>Aktuelle Auswahl: {Math.round(sel.start)}s - {Math.round(sel.end)}s</p>
          )}
        </div>
      )}
    </div>
  );
}