import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import AudioEditor from '../components/audio/editor/AudioEditor';
import { AudioUrlManager } from '../services/audioUrlManager';
type EncodeFormat = 'mp3' | 'aac';

export const AudioEditorPage = () => {
  const navigate = useNavigate();
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [enableFfmpeg, setEnableFfmpeg] = useState(false);

  // Load recording from sessionStorage
  useEffect(() => {
    console.log('AudioEditorPage: Loading recording from sessionStorage...');
    
    const loadRecording = async () => {
      try {
        const recordingData = sessionStorage.getItem('recordingData');
        if (recordingData) {
          const data = JSON.parse(recordingData);
          console.log('AudioEditorPage: Found recording data:', data);
          
          if (data.file && data.file.data) {
            // If it's a blob URL, create a new blob from the existing URL
            if (data.file.data.startsWith('blob:')) {
              try {
                // For blob URLs, we need to fetch them, but with CSP handling
                const response = await fetch(data.file.data);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const blob = await response.blob();
                console.log('AudioEditorPage: Loaded blob from URL:', blob.size, 'bytes');
                setRecordingBlob(blob);
                setEnableFfmpeg(false);
              } catch (error) {
                console.error('AudioEditorPage: Error loading blob, trying to load test MP3:', error);
                await loadTestMP3();
              }
            } else if (data.file.data.startsWith('data:')) {
              // It's a data URL, convert directly to blob
              try {
                const response = await fetch(data.file.data);
                const blob = await response.blob();
                console.log('AudioEditorPage: Created blob from data URL:', blob.size, 'bytes');
                setRecordingBlob(blob);
                setEnableFfmpeg(false);
              } catch (error) {
                console.error('AudioEditorPage: Error converting data URL, trying to load test MP3:', error);
                await loadTestMP3();
              }
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
                console.error('AudioEditorPage: Error converting base64, trying to load test MP3:', error);
                await loadTestMP3();
              }
            }
          } else {
            console.log('AudioEditorPage: No file data found, trying to load test MP3');
            await loadTestMP3();
          }
        } else {
          console.log('AudioEditorPage: No recording data found, trying to load test MP3');
          await loadTestMP3();
        }
      } catch (error) {
        console.error('AudioEditorPage: Error loading recording data:', error);
        await loadTestMP3();
      }
    };

    loadRecording();
  }, [navigate]);

  const loadTestMP3 = async () => {
    console.log('Loading test MP3 file...');
    try {
      // Versuche zuerst die ElevenLabs_Clyde.mp3 zu laden
      const response = await fetch('/ElevenLabs_Clyde.mp3');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('✅ Test MP3 loaded successfully:', {
        size: blob.size,
        type: blob.type
      });
      
      setRecordingBlob(blob);
      setEnableFfmpeg(false);
    } catch (error) {
      console.error('❌ Failed to load test MP3, creating synthetic audio:', error);
      createTestAudioBlob();
    }
  };

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



  const handleEditorDone = async (processedBlob: Blob) => {
    console.log('🎯 handleEditorDone called with blob:', {
      size: processedBlob.size,
      type: processedBlob.type
    });
    
    try {
      // Erstelle eine temporäre Track-ID für den AudioUrlManager
      const tempTrackId = `temp_${Date.now()}`;
      
      // Speichere den verarbeiteten Blob im AudioUrlManager mit einzigartiger URL
      const audioUrl = await AudioUrlManager.storeAudioUrl(tempTrackId, processedBlob, 'unique');
      
      // Store the processed blob for upload
      const processedData = {
        file: {
          name: `edited_${Date.now()}.wav`,
          size: processedBlob.size,
          type: processedBlob.type,
          data: audioUrl, // Use the AudioUrlManager URL
          tempTrackId: tempTrackId // Store the temp ID for later use
        },
        duration: 0, // Will be calculated in upload page
        recordedAt: new Date().toISOString(),
        edited: true
      };

      sessionStorage.setItem('recordingData', JSON.stringify(processedData));
      console.log('✅ Processed recording data stored successfully with AudioUrlManager URL');
      console.log('🚀 Navigating to /upload...');
      navigate('/upload');
    } catch (err) {
      console.error('❌ Failed to process recording:', err);
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
              <Heading level={2} className="mb-2">
                Audio wird geladen...
              </Heading>
              <Body color="secondary" className="text-sm">
                Bereite deine Aufnahme für die Bearbeitung vor
              </Body>
            </div>
          </RevealOnScroll>
        </div>
      </PageTransition>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-4 sm:px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">

        {/* Mobile-optimized Title */}
        <Heading level={1} className="text-3xl sm:text-4xl mb-4 sm:mb-6">
          Sounds good!
        </Heading>

        {/* Mobile-optimized Description */}
        <Body color="secondary" className="mb-6 sm:mb-8 leading-snug text-sm sm:text-base font-light">
          Would you like to edit your recording? Create markers, trim sections, and export your audio with precision
        </Body>

        {/* Audio Editor with mobile optimizations */}
        {recordingBlob ? (
          <div className="flex-1 space-y-6">
            <AudioEditor
              recordingBlob={recordingBlob}
              onDone={handleEditorDone}
              enableFfmpeg={enableFfmpeg}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <motion.div
                className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              ></motion.div>
              <Body color="secondary" className="text-sm">Loading audio data...</Body>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
