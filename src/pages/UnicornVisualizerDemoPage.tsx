import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Mic, Volume2 } from 'lucide-react';
import { useRealtimeAudioVisualizer } from '../hooks/useRealtimeAudioVisualizer';
import { UnicornAudioVisualizerAdvanced } from '../components/audio/UnicornAudioVisualizerAdvanced';
import { UnicornBeamAudioVisualizer } from '../components/audio/UnicornBeamAudioVisualizer';
import { PageTransition } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

export const UnicornVisualizerDemoPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [visualizerType, setVisualizerType] = useState<'advanced' | 'beam'>('beam');
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time audio visualization
  const { visualizerData, startAnalyzing, stopAnalyzing } = useRealtimeAudioVisualizer();

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  // Handle recording
  const handleRecord = async () => {
    if (isRecording) {
      stopAnalyzing();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        startAnalyzing(stream);
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Mikrofon-Zugriff wurde verweigert. Bitte erlauben Sie den Zugriff und versuchen Sie es erneut.');
      }
    }
  };

  // Handle audio playback
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Heading level={1} className="text-4xl mb-4">
              Unicorn Audio Visualizer Demo
            </Heading>
            <Body className="text-lg text-gray-300">
              Teste den neuen Audio-Visualizer basierend auf Unicorn Studio
            </Body>
          </div>

          {/* Visualizer Type Selector */}
          <div className="flex justify-center items-center mb-8">
            <div className="flex space-x-4">
              <Button
                onClick={() => setVisualizerType('beam')}
                className={`px-6 py-3 rounded-lg ${
                  visualizerType === 'beam' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Beam Animation
              </Button>
              <Button
                onClick={() => setVisualizerType('advanced')}
                className={`px-6 py-3 rounded-lg ${
                  visualizerType === 'advanced' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Advanced Animation
              </Button>
            </div>
          </div>

          {/* Main Visualizer */}
          <div className="flex justify-center items-center mb-12">
            <div className="relative">
              {visualizerType === 'beam' ? (
                <UnicornBeamAudioVisualizer
                  frequencies={visualizerData.frequencies}
                  volume={visualizerData.volume}
                  isActive={isRecording || isPlaying}
                  audioElement={audioRef.current}
                  isPlaying={isPlaying}
                  size="large"
                />
              ) : (
                <UnicornAudioVisualizerAdvanced
                  frequencies={visualizerData.frequencies}
                  volume={visualizerData.volume}
                  isActive={isRecording || isPlaying}
                  audioElement={audioRef.current}
                  isPlaying={isPlaying}
                  size="large"
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center space-y-8">
            {/* Recording Controls */}
            <div className="flex flex-col items-center space-y-4">
              <Heading level={2} className="text-2xl">Mikrofon-Aufnahme</Heading>
              <Button
                onClick={handleRecord}
                className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-6 h-6 mr-2" />
                    Aufnahme stoppen
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6 mr-2" />
                    Aufnahme starten
                  </>
                )}
              </Button>
            </div>

            {/* Audio File Controls */}
            <div className="flex flex-col items-center space-y-4">
              <Heading level={2} className="text-2xl">Audio-Datei abspielen</Heading>
              
              {/* File Input */}
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Audio-Datei auswählen
                </Button>
                
                {audioFile && (
                  <span className="text-gray-300">
                    {audioFile.name}
                  </span>
                )}
              </div>

              {/* Playback Controls */}
              {audioUrl && (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handlePlayPause}
                    className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
                      isPlaying 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-6 h-6 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6 mr-2" />
                        Abspielen
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Hidden Audio Element */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  preload="metadata"
                  className="hidden"
                />
              )}
            </div>

            {/* Status Information */}
            <div className="text-center space-y-2">
              <div className="text-lg">
                <span className="text-gray-400">Status: </span>
                <span className={`font-semibold ${
                  isRecording ? 'text-red-400' : 
                  isPlaying ? 'text-green-400' : 
                  'text-gray-400'
                }`}>
                  {isRecording ? 'Aufnahme läuft' : 
                   isPlaying ? 'Wiedergabe läuft' : 
                   'Bereit'}
                </span>
              </div>
              
              <div className="text-sm text-gray-500">
                <span>Lautstärke: {(visualizerData.volume * 100).toFixed(1)}%</span>
                <span className="mx-2">|</span>
                <span>Aktiv: {visualizerData.isActive ? 'Ja' : 'Nein'}</span>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <Heading level={3} className="text-xl mb-4 text-blue-400">
                🎵 Audio-Integration
              </Heading>
              <Body className="text-gray-300">
                Der Visualizer reagiert in Echtzeit auf Audio-Daten und passt die Unicorn Studio Animation entsprechend an.
              </Body>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <Heading level={3} className="text-xl mb-4 text-purple-400">
                🎨 3D-Animation
              </Heading>
              <Body className="text-gray-300">
                Verwendet die gleiche Unicorn Studio 3D-Engine wie der Hintergrund mit dem Projekt "3Z7rqYRTDAvnqc3BpTTz".
              </Body>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <Heading level={3} className="text-xl mb-4 text-green-400">
                📊 Frequenz-Analyse
              </Heading>
              <Body className="text-gray-300">
                Analysiert tiefe, mittlere und hohe Frequenzen separat und passt die Visualisierung entsprechend an.
              </Body>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <Heading level={3} className="text-xl mb-4 text-orange-400">
                ⚡ Echtzeit-Reaktion
              </Heading>
              <Body className="text-gray-300">
                Skalierung, Farben, Blur-Effekte und andere Parameter ändern sich dynamisch basierend auf dem Audio-Input.
              </Body>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default UnicornVisualizerDemoPage;
