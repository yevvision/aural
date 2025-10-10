import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, FileAudio, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

export const DemoUploadPage = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Simuliere Upload-Prozess
  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simuliere Upload-Fortschritt
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Lade Demo-Audio beim Laden der Seite
  useEffect(() => {
    const loadDemoAudio = async () => {
      try {
        console.log('🎵 DemoUploadPage: Loading demo audio...');
        
        const response = await fetch('/ElevenLabs_Clyde.mp3');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('✅ DemoUploadPage: Audio loaded successfully:', {
          size: blob.size,
          type: blob.type
        });
        
        setAudioBlob(blob);
      } catch (err) {
        console.error('❌ DemoUploadPage: Failed to load audio:', err);
      }
    };

    loadDemoAudio();
  }, []);

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
          Upload Demo
        </Heading>

        {/* Demo Description */}
        <Body color="secondary" className="mb-6 sm:mb-8 leading-snug text-sm sm:text-base font-light">
          Diese Demo zeigt die Upload-Funktionalität mit Drag & Drop
        </Body>

        {/* Demo Content */}
        <div className="flex-1 space-y-6">
          {/* Upload Area */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={32} className="text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Audio hochladen</h3>
              <p className="text-gray-400 text-sm">
                Ziehen Sie eine Audio-Datei hierher oder klicken Sie zum Auswählen
              </p>
            </div>
            
            {/* Demo Audio Info */}
            {audioBlob && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <FileAudio size={24} className="text-orange-400" />
                  <div className="flex-1">
                    <p className="text-white font-medium">ElevenLabs_Clyde.mp3</p>
                    <p className="text-gray-400 text-sm">
                      {Math.round(audioBlob.size / 1024)} KB • {audioBlob.type}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={isUploading || uploadComplete}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading... {uploadProgress}%
                </>
              ) : uploadComplete ? (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  Upload abgeschlossen
                </>
              ) : (
                <>
                  <Upload size={20} className="mr-2" />
                  Demo Upload starten
                </>
              )}
            </Button>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-2 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
            
            {/* Upload Complete */}
            {uploadComplete && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={20} className="text-green-400" />
                  <p className="text-green-400 font-medium">Upload erfolgreich!</p>
                </div>
                <p className="text-green-300 text-sm mt-1">
                  Die Demo-Audio-Datei wurde erfolgreich hochgeladen.
                </p>
              </div>
            )}
          </div>
          
          {/* Demo Features */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Demo-Features</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">Drag & Drop Upload</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">Fortschrittsanzeige</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">Audio-Format-Validierung</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <p className="text-gray-300 text-sm">Automatische Verarbeitung</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
