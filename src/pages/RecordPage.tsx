import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Pause, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useRealtimeAudioVisualizer } from '../hooks/useRealtimeAudioVisualizer';
import { useRecordingStore } from '../stores/userStore';
import { PageTransition } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import { EnhancedAudioVisualizer } from '../components/audio/EnhancedAudioVisualizer';
import { UnicornAudioVisualizerAdvanced } from '../components/audio/UnicornAudioVisualizerAdvanced';
import { UnicornBeamAudioVisualizer } from '../components/audio/UnicornBeamAudioVisualizer';

// German spec: RecordPage with audio visualizer and record button
export const RecordPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recordedBlob, duration, reset: resetRecording, isRecording, startRecording: startRecordingStore, stopRecording: stopRecordingStore, pauseRecording: pauseRecordingStore, resumeRecording: resumeRecordingStore } = useRecordingStore();
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Real-time audio visualization
  const { visualizerData, startAnalyzing, stopAnalyzing } = useRealtimeAudioVisualizer();
  
  const {
    startRecording: startMediaRecording,
    stopRecording: stopMediaRecording,
    pauseRecording: pauseMediaRecording,
    resumeRecording: resumeMediaRecording,
    cancelRecording: cancelMediaRecording,
    isPaused,
    formatDuration,
    getCurrentStream,
  } = useMediaRecorder({
    onRecordingComplete: (blob, recordingDuration) => {
      console.log('🎵 Recording completed:', { 
        blobSize: blob.size, 
        blobType: blob.type, 
        recordingDuration 
      });
      
      // Set recording state to false immediately
      stopRecordingStore();
      setRecordingDuration(0);
      stopAnalyzing();
      
      // Store recording data in sessionStorage for audio editor
      const blobUrl = URL.createObjectURL(blob);
      const recordingData = {
        file: {
          name: `recording_${Date.now()}.webm`,
          size: blob.size,
          type: blob.type,
          data: blobUrl // Use blob URL instead of base64
        },
        duration: recordingDuration,
        recordedAt: new Date().toISOString()
      };
      
      try {
        sessionStorage.setItem('recordingData', JSON.stringify(recordingData));
        console.log('✅ Recording data stored successfully with blob URL');
        console.log('🚀 Navigating to audio editor...');
        
        // Force navigation with a small delay to ensure state is updated
        setTimeout(() => {
          console.log('🎯 Executing navigation to /audio-editor');
          navigate('/audio-editor');
        }, 100);
        
      } catch (err) {
        console.error('❌ Failed to store recording data:', err);
        console.log('🚀 Still navigating to audio editor despite error...');
        
        // Still navigate to audio editor
        setTimeout(() => {
          console.log('🎯 Executing fallback navigation to /audio-editor');
          navigate('/audio-editor');
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Recording error:', error);
      setIsRecording(false);
      setRecordingDuration(0);
      stopAnalyzing();
    }
  });

  useEffect(() => {
    if (recordedBlob) {
      // Reset recording state after successful recording
      resetRecording(); // Reset the recording store
      
      // Note: Track wird erst nach Upload mit Titel in die Bibliothek hinzugefügt
      // Die Aufnahme wird nur in sessionStorage gespeichert und zur Upload-Seite weitergeleitet
    }
  }, [recordedBlob, duration, resetRecording]);

  // Update recording duration - only when recording and not paused, with page visibility support
  useEffect(() => {
    let interval: number;
    let hiddenStartTime = 0;
    let lastUpdateTime = Date.now();
    
    const updateDuration = () => {
      if (isRecording && !isPaused) {
        const now = Date.now();
        const timeDiff = now - lastUpdateTime;
        setRecordingDuration(prev => prev + (timeDiff / 1000));
        lastUpdateTime = now;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden - store the time
        hiddenStartTime = Date.now();
        console.log('📱 RecordPage: Page became hidden, pausing timer updates');
      } else {
        // Page became visible - adjust for hidden time
        if (hiddenStartTime > 0) {
          const hiddenDuration = Date.now() - hiddenStartTime;
          console.log('📱 RecordPage: Page became visible, adjusting for hidden time:', hiddenDuration, 'ms');
          hiddenStartTime = 0;
        }
        // Reset last update time to prevent large jumps
        lastUpdateTime = Date.now();
        // Immediately update duration when page becomes visible
        updateDuration();
      }
    };
    
    if (isRecording && !isPaused) {
      interval = window.setInterval(updateDuration, 100);
      
      // Listen for page visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Also listen for window focus/blur events as backup
      window.addEventListener('focus', handleVisibilityChange);
      window.addEventListener('blur', handleVisibilityChange);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [isRecording, isPaused]);

  // Handle recording start/stop
  const handleRecordClick = async () => {
    if (!isRecording) {
      try {
        // Set global recording state immediately when button is clicked
        startRecordingStore();
        setRecordingDuration(0);
        
        await startMediaRecording();
        
        // Start audio analysis for visualization
        const stream = getCurrentStream();
        if (stream) {
          startAnalyzing(stream);
        }
      } catch (error) {
        console.error('Failed to start recording:', error);
        // Reset global state if recording failed
        stopRecordingStore();
      }
    } else {
      // Stop recording
      stopMediaRecording();
      stopRecordingStore();
      stopAnalyzing();
    }
  };

  // Handle pause/resume
  const handlePauseResumeClick = () => {
    if (isPaused) {
      resumeMediaRecording();
      resumeRecordingStore();
    } else {
      pauseMediaRecording();
      pauseRecordingStore();
    }
  };

  // Handle cancel recording
  const handleCancelRecording = () => {
    // Cancel the recording and reset everything
    cancelMediaRecording(); // This properly cancels and resets the MediaRecorder
    stopRecordingStore();
    setRecordingDuration(0);
    stopAnalyzing();
    
    // Clear any stored recording data to prevent navigation to audio editor
    try {
      sessionStorage.removeItem('recordingData');
    } catch (err) {
      console.error('Failed to clear recording data:', err);
    }
  };


  // German spec: Upload button triggers file selection
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      // Store file in sessionStorage for upload page
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('uploadFile', JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result
        }));
        navigate('/upload');
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 pb-24 relative min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="h-full relative"
        >
          {/* Title - oben positioniert */}
          <div className="text-center pt-8 pb-4 desktop-title-spacing" style={{ zIndex: 30 }}>
            <Heading level={1} className="text-3xl font-bold text-white mb-2">
              {isRecording ? 'Have fun!' : 'Ready?'}
            </Heading>
          </div>

          {/* Audio Visualizer with Record Button - centered and scrollable */}
          <div className="flex flex-col items-center justify-center py-8 relative">
            {/* Audio Visualizer */}
            <UnicornBeamAudioVisualizer
              frequencies={visualizerData.frequencies}
              volume={visualizerData.volume}
              isActive={isRecording}
              size="large"
              className="relative"
            />
            
            {/* Record Button - positioned over the visualizer */}
            <button
              onClick={handleRecordClick}
              className="absolute z-10 rounded-full bg-transparent backdrop-blur-sm flex items-center justify-center shadow-voice overflow-visible"
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              style={{
                width: '100px',
                height: '100px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {isRecording ? (
                <Square size={28} strokeWidth={1.5} className="text-white" />
              ) : (
                <Mic size={28} strokeWidth={1.5} className="text-white" />
              )}
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>

        {/* Upload Text - außerhalb des motion.div, nur bei nicht-recording */}
        {!isRecording && (
          <div className="upload-hint-container">
            <Body color="secondary" className="text-sm text-white/60">
              Alternatively to recording, you can also upload an audio file from your device.
            </Body>
            <button
              onClick={handleUploadClick}
              className="mt-2 text-[#ff4e3a] hover:text-[#ff4e3a] text-sm underline transition-colors duration-200"
            >
              Upload file
            </button>
          </div>
        )}

        {/* Recording Controls - außerhalb des motion.div, nur bei recording */}
        {isRecording && (
          <div className="recording-controls-container">
            {/* Time and Control Buttons in one row */}
            <div className="flex items-center justify-center space-x-3">
              <div className="text-lg font-mono text-white tabular-nums">
                {formatDuration(recordingDuration)}
              </div>
              <button
                onClick={handlePauseResumeClick}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center
                         hover:bg-white/20 transition-all duration-200"
                aria-label={isPaused ? 'Aufnahme fortsetzen' : 'Aufnahme pausieren'}
              >
                {isPaused ? (
                  <Play size={16} className="text-white" strokeWidth={1.5} />
                ) : (
                  <Pause size={16} className="text-white" strokeWidth={1.5} />
                )}
              </button>
              <button
                onClick={handleCancelRecording}
                className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center
                         hover:bg-red-500/30 transition-all duration-200"
                aria-label="Aufnahme abbrechen"
              >
                <X size={16} className="text-red-400" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};






