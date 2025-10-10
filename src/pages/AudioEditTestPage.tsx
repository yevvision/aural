import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import AudioEditor from '../components/audio/editor/AudioEditor';
import { Button } from '../components/ui/Button';

export const AudioEditTestPage = () => {
  const navigate = useNavigate();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lade die ElevenLabs_Clyde.mp3 Datei lokal
  useEffect(() => {
    const loadTestAudio = async () => {
      try {
        console.log('🎵 AudioEditTestPage: Loading ElevenLabs_Clyde.mp3 locally...');
        
        // Lade die MP3-Datei aus dem public Ordner
        const response = await fetch('/ElevenLabs_Clyde.mp3');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('✅ AudioEditTestPage: Audio loaded successfully:', {
          size: blob.size,
          type: blob.type
        });
        
        setAudioBlob(blob);
        setLoading(false);
      } catch (err) {
        console.error('❌ AudioEditTestPage: Failed to load audio:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Audio-Datei');
        setLoading(false);
      }
    };

    loadTestAudio();
  }, []);

  const handleEditorDone = async (processedBlob: Blob) => {
    console.log('🎯 AudioEditTestPage: Editor done with blob:', {
      size: processedBlob.size,
      type: processedBlob.type
    });
    
    try {
      // Erstelle einen Download-Link für die verarbeitete Datei
      const url = URL.createObjectURL(processedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_okayletsgo_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ AudioEditTestPage: File downloaded successfully');
    } catch (err) {
      console.error('❌ AudioEditTestPage: Failed to download file:', err);
    }
  };

  if (loading) {
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
                Lade okayletsgo.mp3 für den Test
              </Body>
            </div>
          </RevealOnScroll>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <RevealOnScroll direction="up">
            <div className="true-black-card text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-red-400" />
              </div>
              <Heading level={2} className="mb-2 text-red-400">
                Fehler beim Laden
              </Heading>
              <Body color="secondary" className="text-sm mb-6">
                {error}
              </Body>
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                className="w-full"
              >
                Erneut versuchen
              </Button>
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
        {/* Header mit Zurück-Button */}
        <div className="flex items-center mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
            className="mr-4 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <Heading level={1} className="text-3xl sm:text-4xl">
              Audio Edit Test
            </Heading>
            <Body color="secondary" className="text-sm">
              Teste die Edit-Funktionalität mit okayletsgo.mp3
            </Body>
          </div>
        </div>

        {/* Audio Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-6 border border-white/10"
        >
          <div className="flex items-center mb-2">
            <Music className="w-5 h-5 text-blue-400 mr-2" />
            <Heading level={3} className="text-lg text-blue-400">
              Test-Audio geladen
            </Heading>
          </div>
          <Body color="secondary" className="text-sm">
            Datei: ElevenLabs_Clyde.mp3 (Lokal) - {Math.round((audioBlob?.size || 0) / 1024)} KB
          </Body>
        </motion.div>

        {/* Audio Editor */}
        {audioBlob ? (
          <div className="flex-1 space-y-6">
            <AudioEditor
              recordingBlob={audioBlob}
              onDone={handleEditorDone}
              enableFfmpeg={false}
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
              <Body color="secondary" className="text-sm">Audio wird vorbereitet...</Body>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Body color="secondary" className="text-xs">
            Diese Seite dient zum Testen der Audio-Edit-Funktionalität
          </Body>
        </motion.div>
      </div>
    </div>
  );
};

export default AudioEditTestPage;
