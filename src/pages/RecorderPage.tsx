import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Play, Pause, Save, Trash2, MicOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useRealtimeAudioVisualizer } from '../hooks/useRealtimeAudioVisualizer';
import { useUserStore, useRecordingStore } from '../stores/userStore';
import { useFeedStore } from '../stores/feedStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { EnhancedAudioVisualizer } from '../components/audio/EnhancedAudioVisualizer';
import { UnicornAudioVisualizerAdvanced } from '../components/audio/UnicornAudioVisualizerAdvanced';
import { UnicornBeamAudioVisualizer } from '../components/audio/UnicornBeamAudioVisualizer';
import { generateId, formatSafeDate } from '../utils';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';
import { Button } from '../components/ui/Button';
import { Heading, Body } from '../components/ui/Typography';
import type { AudioTrack } from '../types';

export const RecorderPage = () => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewTrack, setPreviewTrack] = useState<AudioTrack | null>(null);
  const [autoProceed, setAutoProceed] = useState(false); // New state for auto-proceed
  
  const { currentUser, addMyTrack } = useUserStore();
  const { addTrack } = useFeedStore();
  
  const {
    isSupported,
    isRecording,
    isPaused,
    duration,
    isCheckingSupport, // New state
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
    getCurrentStream,
  } = useMediaRecorder({
    onRecordingComplete: (blob, recordingDuration) => {
      console.log('Recording completed:', recordingDuration);
      // Don't auto-set title, let user set it in upload page
    },
    onError: (errorMessage) => {
      console.error('MediaRecorder error:', errorMessage);
      setError(errorMessage);
    }
  });
  
  // Remove the logging that was causing re-renders
  // console.log('MediaRecorder state updated', { isRecording, isPaused, duration });

  // Real-time audio visualization
  const { visualizerData, startAnalyzing, stopAnalyzing } = useRealtimeAudioVisualizer();
  
  const { recordedBlob, reset: resetRecordingStore } = useRecordingStore();
  
  // Remove the logging that was causing re-renders
  // console.log('RecordingStore state updated', { recordedBlob: !!recordedBlob, duration });

  // Clear any previous recording state when entering the recorder
  useEffect(() => {
    // RecorderPage mounted, clearing previous recording state
    // Clear any existing session storage from previous recordings
    sessionStorage.removeItem('recordingData');
    sessionStorage.removeItem('uploadFile');
    // Reset the recording store to clear any previous blob
    resetRecordingStore();
    
    // Automatically start recording when the page loads
    const startRecordingAutomatically = async () => {
      console.log('Automatically starting recording');
      setError('');
      
      // Stop any currently playing audio before starting recording
      if (isPlaying) {
        console.log('Stopping audio playback before starting recording');
        pause();
      }
      
      try {
        await startRecording();
        
        // Start audio analysis for visualization
        const stream = getCurrentStream();
        if (stream) {
          startAnalyzing(stream);
        }
      } catch (err) {
        console.error('Failed to start recording automatically:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Starten der Aufnahme';
        setError(errorMessage);
      }
    };
    
    // Start recording after a short delay to allow the component to render
    const timer = setTimeout(startRecordingAutomatically, 100);
    
    // Cleanup on unmount
    return () => {
      console.log('RecorderPage unmounting, cleaning up');
      clearTimeout(timer);
      if (previewTrack?.url && previewTrack.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewTrack.url);
      }
    };
  }, []); // Empty dependency array to run only once on mount

  const handleStartRecording = async () => {
    // This function is no longer needed since recording starts automatically
    // But we'll keep it for safety in case it gets called
    console.log('handleStartRecording called but recording starts automatically');
  };

  const handleStopRecording = () => {
    console.log('Stopping recording');
    try {
      stopRecording();
      stopAnalyzing();
      setAutoProceed(true); // Set flag to auto-proceed after recording
      console.log('Recording stopped, will auto-proceed to upload');
    } catch (err) {
      console.error('Error stopping recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Stoppen der Aufnahme';
      setError(errorMessage);
    }
  };
  
  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };
  
  const handlePlayPause = () => {
    if (!recordedBlob || !previewTrack) return;
    
    const isCurrentTrackPlaying = currentTrack?.id === previewTrack.id && isPlaying;
    
    if (isCurrentTrackPlaying) {
      pause();
    } else {
      play(previewTrack);
    }
  };

  // Create preview track when recording is completed
  useEffect(() => {
    // Preview track useEffect triggered
    if (recordedBlob && !previewTrack) {
      // Creating preview track from recorded blob
      
      // Validate blob before creating preview
      if (recordedBlob.size === 0) {
        console.error('Recorded blob is empty');
        setError('Aufnahme ist leer. Bitte versuche es erneut.');
        return;
      }
      
      const previewId = `recording-preview-${Date.now()}`;
      const blobUrl = URL.createObjectURL(recordedBlob);
      
      const track: AudioTrack = {
        id: previewId,
        title: 'Recording Preview',
        description: 'Preview of recorded audio',
        duration: duration,
        url: blobUrl,
        user: currentUser!,
        userId: currentUser!.id,
        likes: 0,
        isLiked: false,
        createdAt: new Date(),
        tags: [],
      };
      
      setPreviewTrack(track);
      console.log('Preview track created successfully');
      
      // Set autoProceed to true to automatically navigate to upload
      setAutoProceed(true);
    }
  }, [recordedBlob, duration, currentUser, previewTrack]); // Only depend on these values

  const handleSave = async () => {
    console.log('handleSave called', { recordedBlob: !!recordedBlob, currentUser: !!currentUser });
    
    if (!recordedBlob || !currentUser) {
      console.error('Cannot save: missing recordedBlob or currentUser', { recordedBlob: !!recordedBlob, currentUser: !!currentUser });
      setError('Keine Aufnahme zum Speichern vorhanden');
      return;
    }
    
    console.log('Starting save process', {
      blobSize: recordedBlob.size,
      blobType: recordedBlob.type,
      duration
    });
    
    setIsSaving(true);
    
    try {
      // Validate blob
      if (recordedBlob.size === 0) {
        throw new Error('Recording blob is empty');
      }
      
      if (duration === 0) {
        throw new Error('Recording duration is zero');
      }
      
      // Create file from blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording_${timestamp}.webm`;
      const file = new File([recordedBlob], filename, { type: recordedBlob.type });
      
      console.log('Created file from blob', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Convert blob to base64 for persistent storage
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log('Base64 conversion successful', {
            resultLength: result.length,
            startsWithData: result.startsWith('data:')
          });
          resolve(result);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('Failed to convert recording to base64'));
        };
        reader.readAsDataURL(recordedBlob);
      });
      
      // Store recording data in sessionStorage to pass to upload page
      const recordingData = {
        file: {
          name: filename,
          size: file.size,
          type: file.type,
          data: base64Data // Use base64 instead of object URL
        },
        duration: duration,
        recordedAt: new Date().toISOString()
      };
      
      console.log('Storing recording data in sessionStorage', {
        dataSize: JSON.stringify(recordingData).length,
        duration: recordingData.duration
      });
      
      // Store in sessionStorage with error handling
      try {
        sessionStorage.setItem('recordingData', JSON.stringify(recordingData));
        console.log('Successfully stored recording data in sessionStorage');
      } catch (storageError) {
        console.error('Failed to store in sessionStorage:', storageError);
        throw new Error('Fehler beim Speichern der Aufnahme. Aufnahme ist möglicherweise zu groß.');
      }
      
      // Navigate to audio editor page with recording
      console.log('Navigating to audio editor page');
      navigate('/audio-editor');
    } catch (err) {
      console.error('Save failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Fehler beim Vorbereiten der Aufnahme: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDiscard = () => {
    console.log('Discarding recording');
    setTitle('');
    setPreviewTrack(null);
    setAutoProceed(false); // Reset auto-proceed flag
    setError(''); // Clear any errors
    
    try {
      cancelRecording();
      stopAnalyzing();
      resetRecordingStore(); // Reset the recording store
    } catch (err) {
      console.error('Error discarding recording:', err);
    }
    
    // Reset duration to 0 by restarting the recording process
    const restartRecording = async () => {
      try {
        await startRecording();
        
        // Start audio analysis for visualization
        const stream = getCurrentStream();
        if (stream) {
          startAnalyzing(stream);
        }
      } catch (err) {
        console.error('Failed to restart recording:', err);
        const errorMessage = err instanceof Error ? err.message : 'Fehler beim Neustarten der Aufnahme';
        setError(errorMessage);
      }
    };
    
    // Restart recording after a short delay
    setTimeout(restartRecording, 100);
  };
  
  const handleBack = () => {
    console.log('Back button clicked', { isRecording });
    if (isRecording) {
      console.log('Canceling recording');
      try {
        cancelRecording();
        stopAnalyzing();
      } catch (err) {
        console.error('Error canceling recording:', err);
      }
    }
    // Instead of navigating to /record, go back in history
    console.log('Navigating back in history');
    navigate('/record'); // Navigate back to the record page instead of using history
  };

  // Auto-proceed to upload page after preview is created
  useEffect(() => {
    // Auto-proceed useEffect triggered
    if (autoProceed && previewTrack && recordedBlob) {
      // Auto-proceeding to upload page in 1.5 seconds
      const timer = setTimeout(() => {
        console.log('Auto-proceed timer triggered, calling handleSave');
        handleSave();
      }, 1500); // Show preview for 1.5 seconds before auto-proceeding
      
      return () => {
        console.log('Clearing auto-proceed timer');
        clearTimeout(timer);
      };
    }
  }, [autoProceed, previewTrack, recordedBlob]); // Only depend on these values

  // Show loading state while checking support
  if (isCheckingSupport) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <RevealOnScroll direction="up">
            <div className="true-black-card text-center">
              <Loader2 size={48} className="text-gradient-strong mx-auto mb-6 animate-spin" />
              <Heading level={2} className="mb-3">
                Browser wird überprüft...
              </Heading>
              <Body color="secondary">
                Überprüfung der Audioaufnahme-Funktion
              </Body>
            </div>
          </RevealOnScroll>
        </div>
      </PageTransition>
    );
  }

  if (!isSupported) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <RevealOnScroll direction="up">
            <div className="true-black-card text-center">
              <MicOff size={64} className="text-text-secondary mx-auto mb-6" />
              <Heading level={2} className="mb-3">
                Aufnahme nicht unterstützt
              </Heading>
              <Body color="secondary" className="mb-6">
                Ihr Browser unterstützt die Audioaufnahme nicht
              </Body>
              <Button
                onClick={handleBack}
                variant="primary"
                size="md"
              >
                Zurück
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

      <div className="px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">

         {/* Title - "Aufnahme läuft" - zentriert */}
         <div className="text-center mb-8" style={{ zIndex: 30 }}>
           <Heading level={1} className="text-4xl mb-4">
             {isRecording && !isPaused ? 'Aufnahme läuft' : 
              isRecording && isPaused ? 'Aufnahme pausiert' :
              !isRecording && !recordedBlob ? 'Bereit zur Aufnahme' :
              'Aufnahme abgeschlossen'}
           </Heading>
           
           {/* Duration Display - direkt unter dem Titel */}
           <div className="text-6xl font-mono text-white mb-8 tabular-nums">
             {formatDuration(duration)}
           </div>
         </div>

        {/* Full viewport Audio Visualizer with Controls */}
        <div className="fixed inset-0 w-full h-full">
          {/* Full viewport Unicorn Beam Audio Visualizer */}
          <UnicornBeamAudioVisualizer
            frequencies={visualizerData.frequencies}
            volume={visualizerData.volume}
            isActive={isRecording && !isPaused}
            size="large"
            className="w-full h-full"
          />
          
           {/* Visual State Indicator - centered over the visualizer */}
           <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
            {isRecording ? (
              /* Recording Animation */
              <div className="relative w-[200px] h-[200px] flex items-center justify-center">
                <div className="text-4xl text-white animate-pulse">🎵</div>
              </div>
            ) : recordedBlob ? (
              /* Success State */
              <div className="relative w-[200px] h-[200px] rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="text-4xl text-green-400">✓</div>
              </div>
            ) : (
              /* Ready State */
              <div className="relative w-[200px] h-[200px] rounded-full bg-white/10 flex items-center justify-center">
                <Mic size={32} className="text-white/60" />
              </div>
            )}
          </div>
        </div>

         {/* Recording Controls - positioned over the visualizer */}
         {isRecording && (
           <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2" style={{ zIndex: 40 }}>
            <div className="flex justify-center items-center space-x-6">
              <Button
                size="lg"
                onClick={handlePauseResume}
                variant="outline"
                className={isPaused ? "border-orange-500 bg-orange-500/20" : ""}
                aria-label={isPaused ? "Resume recording" : "Pause recording"}
              >
                {isPaused ? 
                  <Play size={24} className="text-orange-500" strokeWidth={1.5} /> :
                  <Pause size={24} className="text-gray-400" strokeWidth={1.5} />
                }
              </Button>
              
              <Button
                size="lg"
                onClick={handleStopRecording}
                variant="outline"
                aria-label="Stop recording"
                className="border-red-500 bg-red-500/20"
              >
                <Square size={24} className="text-red-400" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Error Message Display */}
        {error && !recordedBlob && !isRecording && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Body color="secondary" className="text-red-400 text-sm text-center">{error}</Body>
            <Button
              onClick={() => {
                setError('');
                handleDiscard();
              }}
              variant="glass"
              size="sm"
              fullWidth
              className="mt-2"
            >
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* Preview Controls - im Stil der Audio-Detail-Seite */}
        {recordedBlob && !isRecording && (
          <div className="mt-8 py-6 px-6 flex items-center space-x-4 bg-transparent backdrop-blur-sm -mx-6">
            {/* Auto-proceed message */}
            {autoProceed && (
              <div className="flex-1 text-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <Body className="text-white text-sm">Aufnahme wird vorbereitet...</Body>
              </div>
            )}
            
            {/* Playback Control */}
            {!autoProceed && (
              <Button
                size="lg"
                onClick={handlePlayPause}
                variant="outline"
                aria-label={currentTrack?.id === previewTrack?.id && isPlaying ? "Pause" : "Play"}
                disabled={autoProceed}
                className={currentTrack?.id === previewTrack?.id && isPlaying ? "border-orange-500 bg-orange-500/20" : ""}
              >
                {currentTrack?.id === previewTrack?.id && isPlaying ? 
                  <Pause size={24} className="text-orange-500" strokeWidth={1.5} /> :
                  <Play size={24} className="text-gray-400" strokeWidth={1.5} />
                }
              </Button>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex-1 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Body color="secondary" className="text-red-400 text-sm text-center">{error}</Body>
              </div>
            )}

            {/* Action Buttons - only show if not auto-proceeding */}
            {!autoProceed && (
              <>
                <Button
                  size="lg"
                  onClick={handleDiscard}
                  variant="outline"
                  aria-label="Discard recording"
                  className="hover:border-red-500 hover:bg-red-500/20"
                >
                  <Trash2 size={24} className="text-gray-400 hover:text-red-400" strokeWidth={1.5} />
                </Button>
                
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={!recordedBlob || isSaving}
                  variant="outline"
                  aria-label="Save recording"
                  className="border-orange-500 bg-orange-500/20"
                >
                  {isSaving ? 
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> :
                    <Save size={24} className="text-orange-500" strokeWidth={1.5} />
                  }
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};