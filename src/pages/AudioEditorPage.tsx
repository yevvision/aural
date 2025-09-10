import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import AudioEditor from '../components/audio/editor/AudioEditor';
type EncodeFormat = 'mp3' | 'aac';

export const AudioEditorPage = () => {
  const navigate = useNavigate();
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [enableFfmpeg, setEnableFfmpeg] = useState(false);

  // Load recording from sessionStorage
  useEffect(() => {
    console.log('AudioEditorPage: Loading recording from sessionStorage...');
    
    try {
      const recordingData = sessionStorage.getItem('recordingData');
      if (recordingData) {
        const data = JSON.parse(recordingData);
        console.log('AudioEditorPage: Found recording data:', data);
        
        if (data.file && data.file.data) {
          // If it's a blob URL, try to fetch it, but fallback quickly
          if (data.file.data.startsWith('blob:')) {
            fetch(data.file.data)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
              })
              .then(blob => {
                console.log('AudioEditorPage: Loaded blob from URL:', blob.size, 'bytes');
                setRecordingBlob(blob);
                setEnableFfmpeg(false);
              })
              .catch(error => {
                console.error('AudioEditorPage: Error loading blob, using test audio:', error);
                createTestAudioBlob();
              });
          } else if (data.file.data.startsWith('data:')) {
            // It's a data URL, convert directly to blob
            fetch(data.file.data)
              .then(response => response.blob())
              .then(blob => {
                console.log('AudioEditorPage: Created blob from data URL:', blob.size, 'bytes');
                setRecordingBlob(blob);
                setEnableFfmpeg(false);
              })
              .catch(error => {
                console.error('AudioEditorPage: Error converting data URL, using test audio:', error);
                createTestAudioBlob();
              });
          } else {
            // It's raw base64, convert to blob
            try {
              const byteCharacters = atob(data.file.data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: data.file.type || 'audio/wav' });
              console.log('AudioEditorPage: Created blob from base64:', blob.size, 'bytes');
              setRecordingBlob(blob);
              setEnableFfmpeg(false);
            } catch (error) {
              console.error('AudioEditorPage: Error converting base64, using test audio:', error);
              createTestAudioBlob();
            }
          }
        } else {
          console.log('AudioEditorPage: No file data found, creating test audio');
          createTestAudioBlob();
        }
      } else {
        console.log('AudioEditorPage: No recording data found, creating test audio');
        createTestAudioBlob();
      }
    } catch (error) {
      console.error('AudioEditorPage: Error loading recording data:', error);
      createTestAudioBlob();
    }
  }, [navigate]);

  const createTestAudioBlob = () => {
    console.log('Creating test audio blob...');
    try {
      // Create a simple test audio using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 5; // 5 seconds
      const length = sampleRate * duration;
      
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate a simple sine wave
      for (let i = 0; i < length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1; // 440Hz sine wave
      }
      
      // Convert to WAV
      const wavBlob = audioBufferToWav(buffer);
      console.log('Test audio blob created:', {
        size: wavBlob.size,
        type: wavBlob.type
      });
      
                    setRecordingBlob(wavBlob);
              setEnableFfmpeg(false); // Disable ffmpeg for test audio too
    } catch (error) {
      console.error('Failed to create test audio:', error);
      navigate('/record');
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer) => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };



  const handleEditorDone = (processedBlob: Blob) => {
    console.log('🎯 handleEditorDone called with blob:', {
      size: processedBlob.size,
      type: processedBlob.type
    });
    
    // Store the processed blob for upload
    const blobUrl = URL.createObjectURL(processedBlob);
    const processedData = {
      file: {
        name: `edited_${Date.now()}.wav`,
        size: processedBlob.size,
        type: processedBlob.type,
        data: blobUrl // Use blob URL instead of base64
      },
      duration: 0, // Will be calculated in upload page
      recordedAt: new Date().toISOString(),
      edited: true
    };

    try {
      sessionStorage.setItem('recordingData', JSON.stringify(processedData));
      console.log('✅ Processed recording data stored successfully with blob URL');
      console.log('🚀 Navigating to /upload...');
      navigate('/upload');
    } catch (err) {
      console.error('❌ Failed to store processed recording:', err);
      // Fallback: direct navigation
      console.log('🚀 Fallback: Navigating to /upload...');
      navigate('/upload');
    }
  };

  if (!recordingBlob) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <RevealOnScroll direction="up">
            <div className="true-black-card text-center">
              <div className="w-8 h-8 border-2 border-gradient-strong border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-lg font-medium text-text-primary mb-2">
                Audio wird geladen...
              </h2>
              <p className="text-text-secondary text-sm">
                Bereite deine Aufnahme für die Bearbeitung vor
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </PageTransition>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-transparent">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">

        {/* Title */}
        <h1 className="text-white text-4xl font-bold leading-tight mb-4">
          Audio bearbeiten
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-6 leading-snug text-xs">
          Markiere den gewünschten Bereich und exportiere deine Aufnahme
        </p>

        {/* Audio Editor */}
        {recordingBlob ? (
          <div className="flex-1">
            <AudioEditor
              recordingBlob={recordingBlob}
              onDone={handleEditorDone}
              enableFfmpeg={enableFfmpeg}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              ></motion.div>
              <p className="text-gray-400">Lade Audio-Daten...</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
