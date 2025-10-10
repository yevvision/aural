import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Pause, Play, X, ArrowRight, ArrowLeft, Upload, CheckCircle, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useRealtimeAudioVisualizer } from '../hooks/useRealtimeAudioVisualizer';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body, Label, Caption } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { TagGroup, SelectableTag } from '../components/ui/Tag';
import { MultiToggle } from '../components/ui/Toggle';
import AudioEditor from '../components/audio/editor/AudioEditor';
import { UnicornBeamAudioVisualizer } from '../components/audio/UnicornBeamAudioVisualizer';

// Demo Workflow Steps
type WorkflowStep = 'record' | 'edit' | 'details' | 'publish' | 'pending';

interface PendingUploadData {
  uploadId: string;
  title: string;
  status: 'pending';
  reason: string;
  estimatedTime: string;
}

// Predefined tags for audio content
const predefinedTags = [
  'Soft', 'Passionate', 'Moan', 'Whisper', 'Breathing', 
  'Intimate', 'Seductive', 'Sweet', 'Gentle', 'Tender',
  'Romantic', 'Sensual', 'Loving', 'Warm', 'Affectionate'
];

const genderOptions = [
  { label: 'Female', value: 'Female' }, 
  { label: 'Male', value: 'Male' },
  { label: 'Couple', value: 'Couple' },
  { label: 'Diverse', value: 'Diverse' }
] as const;

export const DemoWorkflowPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  
  // Form data for details step
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGender, setSelectedGender] = useState<'Female' | 'Male' | 'Couple' | 'Diverse' | null>('Diverse');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  
  // Real-time audio visualization
  const { visualizerData, startAnalyzing, stopAnalyzing } = useRealtimeAudioVisualizer();
  
  const {
    startRecording: startMediaRecording,
    stopRecording: stopMediaRecording,
    pauseRecording: pauseMediaRecording,
    resumeRecording: resumeMediaRecording,
    cancelRecording: cancelMediaRecording,
    formatDuration,
    getCurrentStream,
  } = useMediaRecorder({
    onRecordingComplete: (blob, recordingDuration) => {
      console.log('Demo recording completed:', { blob, recordingDuration });
      setIsRecording(false);
      setRecordingDuration(0);
      stopAnalyzing();
      setAudioBlob(blob);
      // Automatically proceed to edit step
      setTimeout(() => {
        setCurrentStep('edit');
      }, 1000);
    },
    onError: (error) => {
      console.error('Demo recording error:', error);
      setIsRecording(false);
      setRecordingDuration(0);
      stopAnalyzing();
    }
  });

  // Load demo audio from URL if no recording
  useEffect(() => {
    if (currentStep === 'edit' && !audioBlob) {
      loadDemoAudio();
    }
  }, [currentStep]);

  const loadDemoAudio = async () => {
    try {
      console.log('🎵 Loading demo audio from local file...');
      // Versuche zuerst die lokale ElevenLabs_Clyde.mp3 zu laden
      const response = await fetch('/ElevenLabs_Clyde.mp3');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('✅ Demo audio loaded successfully:', {
        size: blob.size,
        type: blob.type
      });
      
      setAudioBlob(blob);
    } catch (err) {
      console.error('❌ Failed to load demo audio:', err);
      console.log('🔄 Falling back to synthetic audio...');
      // Create a simple test audio as fallback
      createTestAudioBlob();
    }
  };

  const createTestAudioBlob = () => {
    try {
      console.log('🎵 Creating synthetic test audio...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 10; // 10 seconds
      const length = sampleRate * duration;
      
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate a simple sine wave
      for (let i = 0; i < length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
      }
      
      const wavBlob = audioBufferToWav(buffer);
      console.log('✅ Test audio blob created:', {
        size: wavBlob.size,
        type: wavBlob.type
      });
      setAudioBlob(wavBlob);
    } catch (error) {
      console.error('❌ Failed to create test audio:', error);
      console.log('🔄 This is a fallback - the app will still work with other audio sources');
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer) => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
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
    
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Update recording duration
  useEffect(() => {
    let interval: number;
    let lastUpdateTime = Date.now();
    
    const updateDuration = () => {
      if (isRecording && !isPaused) {
        const now = Date.now();
        const timeDiff = now - lastUpdateTime;
        setRecordingDuration(prev => prev + (timeDiff / 1000));
        lastUpdateTime = now;
      }
    };
    
    if (isRecording && !isPaused) {
      interval = window.setInterval(updateDuration, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  // Handle recording start/stop
  const handleRecordClick = async () => {
    if (!isRecording) {
      try {
        await startMediaRecording();
        setIsRecording(true);
        setRecordingDuration(0);
        
        const stream = getCurrentStream();
        if (stream) {
          startAnalyzing(stream);
        }
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    } else {
      stopMediaRecording();
      setIsRecording(false);
      stopAnalyzing();
    }
  };

  // Handle pause/resume
  const handlePauseResumeClick = () => {
    if (isPaused) {
      resumeMediaRecording();
      setIsPaused(false);
    } else {
      pauseMediaRecording();
      setIsPaused(true);
    }
  };

  // Handle cancel recording
  const handleCancelRecording = () => {
    cancelMediaRecording();
    setIsRecording(false);
    setRecordingDuration(0);
    stopAnalyzing();
  };

  // Handle editor completion
  const handleEditorDone = (processedBlob: Blob) => {
    console.log('🎯 Editor done with blob:', {
      size: processedBlob.size,
      type: processedBlob.type
    });
    setProcessedBlob(processedBlob);
    setCurrentStep('details');
  };

  // Handle publish
  const handlePublish = () => {
    const pendingData: PendingUploadData = {
      uploadId: `demo_${Date.now()}`,
      title: title || 'Demo Audio',
      status: 'pending',
      reason: 'Demo-Upload zur Prüfung',
      estimatedTime: '2-5 Minuten'
    };
    
    // Store in sessionStorage for pending page
    sessionStorage.setItem('demoPendingData', JSON.stringify(pendingData));
    setCurrentStep('pending');
  };

  // Skip to edit step (for testing)
  const skipToEdit = () => {
    setCurrentStep('edit');
  };

  const renderRecordStep = () => (
    <div className="max-w-md mx-auto px-4 py-6 pb-24 relative min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="h-full relative"
      >
        {/* Title */}
        <div className="text-center pt-8 pb-4" style={{ zIndex: 30 }}>
          <Heading level={1} className="text-3xl font-bold text-white mb-2">
            {isRecording ? 'Have fun!' : 'Ready?'}
          </Heading>
        </div>

        {/* Audio Visualizer with Record Button */}
        <div className="flex flex-col items-center justify-center py-8 relative">
          <UnicornBeamAudioVisualizer
            frequencies={visualizerData.frequencies}
            volume={visualizerData.volume}
            isActive={isRecording}
            size="large"
            className="relative"
          />
          
          {/* Record Button */}
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

        {/* Skip to edit button for demo */}
        {!isRecording && (
          <div className="text-center mt-8">
            <button
              onClick={skipToEdit}
              className="text-orange-500 hover:text-orange-400 text-sm underline transition-colors duration-200"
            >
              Skip to Edit (Demo)
            </button>
          </div>
        )}
      </motion.div>

      {/* Recording Controls */}
      {isRecording && (
        <div className="recording-controls-container">
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
  );

  const renderEditStep = () => (
    <div className="max-w-md mx-auto min-h-screen relative">
      <div className="h-[72px]"></div>
      <div className="px-4 sm:px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">
        <Heading level={1} className="text-3xl sm:text-4xl mb-4 sm:mb-6">
          Sounds good!
        </Heading>
        <Body color="secondary" className="mb-6 sm:mb-8 leading-snug text-sm sm:text-base font-light">
          Would you like to edit your recording? Create markers, trim sections, and export your audio with precision
        </Body>

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
              <Body color="secondary" className="text-sm">Loading audio data...</Body>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center">
          <Heading level={1} className="text-3xl font-bold text-white mb-2">
            Almost there!
          </Heading>
          <Body color="secondary" className="text-sm">
            Give your audio a name and add some details
          </Body>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white mb-2">Title *</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your audio"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your audio (optional)"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Gender</Label>
            <MultiToggle
              options={genderOptions}
              value={selectedGender}
              onChange={setSelectedGender}
              className="grid grid-cols-2 gap-2"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Tags</Label>
            <TagGroup
              tags={predefinedTags}
              selectedTags={selectedTags}
              onTagToggle={(tag) => {
                setSelectedTags(prev => 
                  prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                );
              }}
              maxSelections={5}
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={() => setCurrentStep('edit')}
            variant="secondary"
            className="flex-1"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <Button
            onClick={handlePublish}
            variant="primary"
            className="flex-1"
            disabled={!title.trim()}
          >
            Publish
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const renderPendingStep = () => {
    const pendingData = JSON.parse(sessionStorage.getItem('demoPendingData') || '{}');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Shield className="w-10 h-10 text-orange-500" />
            </motion.div>
            
            <Heading level={1} className="text-3xl mb-4">
              Sicherheitsprüfung läuft
            </Heading>
            
            <Body color="secondary" className="text-lg">
              Hey, zur Sicherheit prüfen wir deinen Upload. Du erhältst automatisch eine Benachrichtigung, sobald dein Audio freigegeben wurde.
            </Body>
          </div>

          {/* Upload Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <Heading level={3} className="text-xl text-orange-500">{pendingData.title}</Heading>
                <Body color="secondary">Upload ID: {pendingData.uploadId}</Body>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-300">Upload erfolgreich empfangen</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-orange-500" />
                <span className="text-gray-300">Sicherheitscheck läuft</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-gray-300">Nächster Schritt: automatische Freigabe, wenn alles passt</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <Body className="text-orange-400 text-sm">
                <strong>Grund für Prüfung:</strong> {pendingData.reason}
              </Body>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              className="flex-1 sm:flex-none"
            >
              Verstanden
            </Button>
            <Button
              onClick={() => navigate('/privacy')}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Warum?
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  };

  return (
    <PageTransition>
      <AnimatePresence mode="wait">
        {currentStep === 'record' && (
          <motion.div
            key="record"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderRecordStep()}
          </motion.div>
        )}
        
        {currentStep === 'edit' && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderEditStep()}
          </motion.div>
        )}
        
        {currentStep === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderDetailsStep()}
          </motion.div>
        )}
        
        {currentStep === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPendingStep()}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
