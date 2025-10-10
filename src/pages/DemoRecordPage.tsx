import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

export const DemoRecordPage = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Simuliere Aufnahme-Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    console.log('Demo: Aufnahme gestartet');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simuliere eine Demo-Audio-Datei
    createDemoAudioBlob();
    console.log('Demo: Aufnahme gestoppt');
  };

  const createDemoAudioBlob = () => {
    try {
      console.log('🎵 Creating demo recording...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 5; // 5 seconds
      const length = sampleRate * duration;
      
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate a simple sine wave
      for (let i = 0; i < length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
      }
      
      const wavBlob = audioBufferToWav(buffer);
      console.log('✅ Demo recording created:', {
        size: wavBlob.size,
        type: wavBlob.type
      });
      setAudioBlob(wavBlob);
    } catch (error) {
      console.error('❌ Failed to create demo recording:', error);
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-black">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-4 sm:px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </Button>
        </div>

        {/* Demo Title */}
        <Heading level={1} className="text-3xl sm:text-4xl mb-4 sm:mb-6">
          Record Demo
        </Heading>

        {/* Demo Description */}
        <Body color="secondary" className="mb-6 sm:mb-8 leading-snug text-sm sm:text-base font-light">
          Diese Demo zeigt die Aufnahme-Funktionalität
        </Body>

        {/* Demo Content */}
        <div className="flex-1 space-y-6">
          {/* Recording Interface */}
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="mb-6">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
              }`}>
                {isRecording ? (
                  <MicOff size={48} className="text-white" />
                ) : (
                  <Mic size={48} className="text-white" />
                )}
              </div>
              
              <div className="text-3xl font-mono text-white mb-2">
                {formatDuration(recordingDuration)}
              </div>
              
              <p className="text-gray-400 text-sm">
                {isRecording ? 'Aufnahme läuft...' : 'Bereit für Aufnahme'}
              </p>
            </div>
            
            <div className="space-y-3">
              {!isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  <Mic size={20} className="mr-2" />
                  Aufnahme starten
                </Button>
              ) : (
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                >
                  <MicOff size={20} className="mr-2" />
                  Aufnahme stoppen
                </Button>
              )}
            </div>
          </div>

          {/* Recording Result */}
          {audioBlob && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">Aufnahme abgeschlossen</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-2">Aufnahme-Info:</p>
                  <p className="text-gray-400 text-xs">
                    Dauer: {formatDuration(recordingDuration)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Größe: {Math.round(audioBlob.size / 1024)} KB
                  </p>
                  <p className="text-gray-400 text-xs">
                    Typ: {audioBlob.type}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant="primary"
                    className="flex-1"
                  >
                    {isPlaying ? (
                      <Pause size={16} className="mr-2" />
                    ) : (
                      <Play size={16} className="mr-2" />
                    )}
                    {isPlaying ? 'Pause' : 'Abspielen'}
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/demo-audio-editor')}
                    variant="ghost"
                    className="flex-1"
                  >
                    Bearbeiten
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
