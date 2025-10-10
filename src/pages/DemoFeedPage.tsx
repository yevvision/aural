import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

export const DemoFeedPage = () => {
  const navigate = useNavigate();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lade die ElevenLabs_Clyde.mp3 Datei lokal
  useEffect(() => {
    const loadTestAudio = async () => {
      try {
        console.log('🎵 DemoFeedPage: Loading ElevenLabs_Clyde.mp3 locally...');
        
        // Lade die MP3-Datei aus dem public Ordner
        const response = await fetch('/ElevenLabs_Clyde.mp3');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('✅ DemoFeedPage: Audio loaded successfully:', {
          size: blob.size,
          type: blob.type
        });
        
        setAudioBlob(blob);
        setLoading(false);
      } catch (err) {
        console.error('❌ DemoFeedPage: Failed to load audio:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Audio-Datei');
        setLoading(false);
      }
    };

    loadTestAudio();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24 bg-black min-h-screen">
          <RevealOnScroll direction="up">
            <div className="true-black-card text-center">
              <div className="w-8 h-8 border-2 border-gradient-strong border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <Heading level={2} className="mb-2">
                Demo wird geladen...
              </Heading>
              <Body color="secondary" className="text-sm">
                Bereite die Feed-Demo vor
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
        <div className="max-w-md mx-auto px-4 py-6 pb-24 bg-black min-h-screen">
          <RevealOnScroll direction="up">
            <div className="true-black-card text-center">
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
          </RevealOnScroll>
        </div>
      </PageTransition>
    );
  }

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
          Feed Demo
        </Heading>

        {/* Demo Description */}
        <Body color="secondary" className="mb-6 sm:mb-8 leading-snug text-sm sm:text-base font-light">
          Diese Demo zeigt die Feed-Funktionalität mit einer Test-Audio-Datei
        </Body>

        {/* Demo Content */}
        <div className="flex-1 space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <Music size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Demo Audio Track</h3>
                <p className="text-gray-400 text-sm">ElevenLabs Clyde Voice</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-300 text-sm mb-2">Audio-Info:</p>
                <p className="text-gray-400 text-xs">
                  Größe: {audioBlob ? `${Math.round(audioBlob.size / 1024)} KB` : 'Unbekannt'}
                </p>
                <p className="text-gray-400 text-xs">
                  Typ: {audioBlob ? audioBlob.type : 'Unbekannt'}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    // Simuliere Feed-Interaktion
                    console.log('Demo: Feed-Interaktion gestartet');
                  }}
                  variant="primary"
                  className="flex-1"
                >
                  <Music size={16} className="mr-2" />
                  Demo abspielen
                </Button>
                
                <Button
                  onClick={() => navigate('/demo-record')}
                  variant="ghost"
                  className="flex-1"
                >
                  Record Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
