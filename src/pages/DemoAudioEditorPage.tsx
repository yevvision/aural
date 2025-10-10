import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import AudioEditor from '../components/audio/editor/AudioEditor';
import { Button } from '../components/ui/Button';

export const DemoAudioEditorPage = () => {
  const navigate = useNavigate();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lade die ElevenLabs_Clyde.mp3 Datei lokal
  useEffect(() => {
    const loadTestAudio = async () => {
      try {
        console.log('🎵 DemoAudioEditorPage: Loading ElevenLabs_Clyde.mp3 locally...');
        
        // Lade die MP3-Datei aus dem public Ordner
        const response = await fetch('/ElevenLabs_Clyde.mp3');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('✅ DemoAudioEditorPage: Audio loaded successfully:', {
          size: blob.size,
          type: blob.type
        });
        
        setAudioBlob(blob);
        setLoading(false);
      } catch (err) {
        console.error('❌ DemoAudioEditorPage: Failed to load audio:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Audio-Datei');
        setLoading(false);
      }
    };

    loadTestAudio();
  }, []);

  const handleEditorDone = async (processedBlob: Blob) => {
    console.log('🎯 DemoAudioEditorPage: Editor done with blob:', {
      size: processedBlob.size,
      type: processedBlob.type
    });
    
    // Simuliere erfolgreiche Bearbeitung
    alert(`Demo: Audio erfolgreich bearbeitet!\nGröße: ${Math.round(processedBlob.size / 1024)} KB`);
    
    // Navigiere zurück zur Hauptseite
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <Heading level={2} className="mb-2 text-white">
            Demo wird geladen...
          </Heading>
          <Body color="secondary" className="text-sm">
            Bereite die Audio-Editor-Demo vor
          </Body>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Heading level={2} className="mb-2 text-red-400">
            Demo-Fehler
          </Heading>
          <Body color="secondary" className="text-sm mb-4">
            {error}
          </Body>
          <Button onClick={() => navigate('/')} variant="primary">
            Zurück zur Hauptseite
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </Button>
          <h1 className="text-white font-semibold">Audio Editor Demo</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-6">
        <div className="max-w-md mx-auto px-4">
          {/* Demo Description */}
          <Body color="secondary" className="mb-6 sm:mb-8 leading-snug text-sm sm:text-base font-light">
            Diese Demo zeigt die Audio-Bearbeitungsfunktionalität mit Markern und Wellenform
          </Body>

          {/* Audio Editor with mobile optimizations */}
          {audioBlob ? (
            <div className="space-y-6">
              <AudioEditor
                recordingBlob={audioBlob}
                onDone={handleEditorDone}
                enableFfmpeg={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
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
    </div>
  );
};
