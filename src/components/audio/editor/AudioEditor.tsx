import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, AlertCircle, Trash2, Play, Download, ArrowRight } from 'lucide-react';
import { concatenateSegments, encodeWithFfmpegWorker, trimToWav } from '../../../hooks/useTrimExport';
import { Button } from '../../ui/Button';
import { Body } from '../../ui/Typography';

type EncodeFormat = 'mp3' | 'aac';

export default function AudioEditor({
  recordingBlob,
  onDone,
  enableFfmpeg = false,
  waveformSelection,
  waveformRegions,
  removeRegionFn,
}: {
  recordingBlob: Blob;
  onDone: (out: Blob) => void; // gibt den geschnittenen/encodierten Blob zurück
  enableFfmpeg?: boolean;
  waveformSelection?: { start: number; end: number } | null;
  waveformRegions?: { start: number; end: number; id: string }[];
  removeRegionFn?: ((start: number, end: number) => void) | null;
}) {
  console.log('🎵 AudioEditor: Received recording blob:', {
    size: recordingBlob?.size,
    type: recordingBlob?.type,
    hasBlob: !!recordingBlob
  });
  
  const [sel, setSel] = useState<{ start: number; end: number } | null>(waveformSelection || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<{ start: number; end: number }[]>([]);
  const [allRegions, setAllRegions] = useState<{ start: number; end: number; id: string }[]>(waveformRegions || []);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [waveformDuration, setWaveformDuration] = useState<number>(0);
  const [clickedSelection, setClickedSelection] = useState<{ start: number; end: number } | null>(null);
  const [isFixingAudio, setIsFixingAudio] = useState(false);
  const [fixedBlob, setFixedBlob] = useState<Blob | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  // Allow export if we have any valid selection or regions, or if we have a recording blob
  const canExport = (waveformRegions && waveformRegions.length > 0) || 
                   allRegions.length > 0 || 
                   selectedSegments.length > 0 || 
                   (sel !== null && sel.start < sel.end && sel.end > sel.start) ||
                   (waveformSelection !== null && waveformSelection.start < waveformSelection.end && waveformSelection.end > waveformSelection.start) ||
                   (recordingBlob && recordingBlob.size > 0); // Allow export if we have a valid recording blob

  // Debug logging for canExport
  console.log('🎵 AudioEditor: canExport check:', {
    canExport,
    hasWaveformRegions: waveformRegions && waveformRegions.length > 0,
    waveformRegionsLength: waveformRegions?.length || 0,
    hasAllRegions: allRegions.length > 0,
    allRegionsLength: allRegions.length,
    hasSelectedSegments: selectedSegments.length > 0,
    selectedSegmentsLength: selectedSegments.length,
    hasSel: sel !== null && sel.start < sel.end && sel.end > sel.start,
    hasWaveformSelection: waveformSelection !== null && waveformSelection.start < waveformSelection.end && waveformSelection.end > waveformSelection.start,
    hasRecordingBlob: recordingBlob && recordingBlob.size > 0,
    recordingBlobSize: recordingBlob?.size || 0
  });
  
  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // Haptic feedback for button interactions
    }
  };

  const handleSelectionChange = (selection: { start: number; end: number } | null) => {
    console.log('🎵 AudioEditor: Selection changed to:', selection);
    setSel(selection);
  };

  const handleDurationChange = (duration: number) => {
    console.log('🎵 AudioEditor: Duration received from waveform:', duration);
    setWaveformDuration(duration);
  };

  const handleRegionsChange = (regions: { start: number; end: number; id: string }[]) => {
    console.log('🎵 AudioEditor: Regions changed:', regions);
    setAllRegions(regions);
  };

  // Get color for a specific region - all regions are orange now
  const getRegionColor = (regionId: string) => {
    return 'rgba(245, 158, 11, 0.25)'; // orange
  };

  const [localRemoveRegionFn, setLocalRemoveRegionFn] = useState<((start: number, end: number) => void) | null>(null);

  const handleRemoveRegionReady = (removeFn: (start: number, end: number) => void) => {
    setLocalRemoveRegionFn(() => removeFn);
  };

  // Hilfsfunktion zum Reparieren von Audio-Blobs
  const fixAudioBlob = async (blob: Blob): Promise<Blob | null> => {
    try {
      console.log('🔧 AudioEditor: Attempting to fix audio blob using AudioContext...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('🔧 AudioEditor: Audio buffer decoded successfully', { 
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      });
      
      // Konvertiere zurück zu WAV-Format
      const wavBlob = await audioBufferToWav(audioBuffer);
      await audioContext.close();
      
      console.log('🔧 AudioEditor: Audio blob fixed successfully', { 
        originalSize: blob.size, 
        fixedSize: wavBlob.size 
      });
      
      return wavBlob;
    } catch (error) {
      console.error('❌ AudioEditor: Failed to fix audio blob:', error);
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

  // Set current blob immediately - let useWaveformEditor handle validation and repair
  useEffect(() => {
    if (recordingBlob) {
      console.log('🎵 AudioEditor: Setting current blob for WaveformVisualizer');
      setCurrentBlob(recordingBlob);
      setError(null);
      setIsFixingAudio(false);
    }
  }, [recordingBlob]);

  const handleAddSegment = () => {
    if (sel) {
      // Directly add the segment without showing confirmation buttons
      setSelectedSegments(prev => [...prev, sel]);
      setSel(null);
      console.log('🎵 AudioEditor: Segment added directly:', sel);
    }
  };

  const handleRemoveSegment = (index: number) => {
    setSelectedSegments(prev => prev.filter((_, i) => i !== index));
    console.log('🎵 AudioEditor: Segment removed at index:', index);
  };

  const handleClearAllSegments = () => {
    setSelectedSegments([]);
    setSel(null);
    console.log('🎵 AudioEditor: All segments cleared');
  };

  const handleExport = async () => {
    if (busy) return;
    
    setBusy(true);
    setError(null);
    
    try {
      console.log('🚀 AudioEditor: Starting export process...');
      console.log('🎵 AudioEditor: Selected segments:', selectedSegments);
      console.log('🎵 AudioEditor: All regions:', allRegions);
      console.log('🎵 AudioEditor: Current selection:', sel);
      
      // Verwende den reparierten Blob falls verfügbar
      const blobToUse = currentBlob || recordingBlob;
      console.log('🎵 AudioEditor: Using blob for export:', {
        isFixed: !!currentBlob,
        size: blobToUse.size,
        type: blobToUse.type
      });
      
      let resultBlob: Blob;
      
      if (selectedSegments.length > 0) {
        // Export selected segments
        console.log('🎵 AudioEditor: Exporting selected segments...');
        resultBlob = await concatenateSegments(blobToUse, selectedSegments);
      } else if (waveformRegions && waveformRegions.length > 0) {
        // Export waveform regions
        console.log('🎵 AudioEditor: Exporting waveform regions...');
        const regionSegments = waveformRegions.map(region => ({
          start: region.start,
          end: region.end
        }));
        resultBlob = await concatenateSegments(blobToUse, regionSegments);
      } else if (allRegions.length > 0) {
        // Export all regions
        console.log('🎵 AudioEditor: Exporting all regions...');
        const regionSegments = allRegions.map(region => ({
          start: region.start,
          end: region.end
        }));
        resultBlob = await concatenateSegments(blobToUse, regionSegments);
      } else if (waveformSelection && waveformSelection.start < waveformSelection.end && waveformSelection.end > waveformSelection.start) {
        // Export waveform selection
        console.log('🎵 AudioEditor: Exporting waveform selection...');
        resultBlob = await trimToWav(blobToUse, waveformSelection.start, waveformSelection.end);
      } else if (sel && sel.start < sel.end && sel.end > sel.start) {
        // Export current selection
        console.log('🎵 AudioEditor: Exporting current selection...');
        resultBlob = await trimToWav(blobToUse, sel.start, sel.end);
      } else {
        // Export entire audio if no specific selection
        console.log('🎵 AudioEditor: No specific selection, exporting entire audio...');
        resultBlob = blobToUse;
      }
      
      console.log('✅ AudioEditor: Export completed, result blob:', {
        size: resultBlob.size,
        type: resultBlob.type
      });
      
      // Encode if ffmpeg is enabled
      if (enableFfmpeg && resultBlob) {
        console.log('🎵 AudioEditor: Encoding with ffmpeg...');
        const encodedBlob = await encodeWithFfmpegWorker(resultBlob, 'mp3');
        console.log('✅ AudioEditor: Encoding completed:', {
          size: encodedBlob.size,
          type: encodedBlob.type
        });
        onDone(encodedBlob);
      } else {
        onDone(resultBlob);
      }
      
    } catch (err) {
      console.error('❌ AudioEditor: Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
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
            <Button 
              onClick={() => window.location.href = '/recorder'}
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              Record Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Zeige Reparatur-Status
    if (isFixingAudio) {
      return (
        <div className="space-y-4">
          <div className="w-full h-32 rounded bg-[#ff4e3a]/20 border border-[#ff4e3a]/30 flex items-center justify-center">
            <div className="text-center">
              {/* Subtile Loading-Animation statt Spinner */}
              <div className="w-full h-2 bg-[#ff4e3a] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-transparent via-[#ff4e3a]/30 to-transparent animate-pulse"></div>
                <div className="absolute inset-0 h-full w-8 bg-gradient-to-r from-transparent via-[#ff4e3a]/50 to-transparent" 
                     style={{ 
                       animation: 'shimmer 1.5s ease-in-out infinite',
                       animationDelay: '0.2s'
                     }}></div>
              </div>
              <Body className="text-[#ff4e3a] text-sm">Repairing audio...</Body>
              <Body className="text-[#ff4e3a] text-xs mt-1">Please wait a moment</Body>
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
            {/* Subtile Loading-Animation in der Progress-Bar */}
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-transparent via-gray-400/30 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 h-full w-8 bg-gradient-to-r from-transparent via-gray-400/50 to-transparent" 
                   style={{ 
                     animation: 'shimmer 1.5s ease-in-out infinite',
                     animationDelay: '0.2s'
                   }}></div>
            </div>
            <Body className="text-gray-400 text-sm">Preparing audio...</Body>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Audio Info */}
      <div className="text-center text-sm text-gray-400 mb-6">
        {audioDuration > 0 && (
          <p>Audio duration: {Math.round(audioDuration)} seconds</p>
        )}
        {fixedBlob && (
          <p className="text-green-400">✓ Audio successfully repaired</p>
        )}
      </div>


      {/* Selected Segments */}
      {selectedSegments.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300">Selected segments:</h3>
          <div className="space-y-2">
            {selectedSegments.map((segment, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
              >
                <span className="text-sm text-gray-300">
                  {Math.round(segment.start)}s - {Math.round(segment.end)}s
                </span>
                <Button
                  size="sm"
                  onClick={() => handleRemoveSegment(index)}
                  variant="ghost"
                  aria-label="Remove segment"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </Button>
          </div>
            ))}
          </div>
          <Button
            onClick={handleClearAllSegments}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-300"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-8">
        <button
          onClick={handleExport}
          disabled={!canExport || busy}
          className="w-full h-12 rounded-full bg-[#ff4e3a] hover:bg-[#e63e2e] active:bg-[#cc2e1e] flex items-center justify-center space-x-3 transition-all duration-200 touch-manipulation shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              {/* Subtile Loading-Animation statt Spinner */}
              <div className="w-16 h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                <div className="absolute inset-0 h-full w-4 bg-gradient-to-r from-transparent via-white/70 to-transparent" 
                     style={{ 
                       animation: 'shimmer 1.5s ease-in-out infinite',
                       animationDelay: '0.2s'
                     }}></div>
              </div>
              <span className="text-white text-base font-semibold">Exporting...</span>
            </>
          ) : (
            <>
              <ArrowRight size={20} className="text-white" strokeWidth={2} />
              <span className="text-white text-base font-semibold">Next Step</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}