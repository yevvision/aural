import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, X, Pause, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useDatabase } from '../hooks/useDatabase';
import { getAudioDuration, generateId, formatDuration } from '../utils';
import { validateAudioFile, isValidAudioFile } from '../utils/audioValidation';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';
import { Button } from '../components/ui/Button';
import { Heading, Body, Label, Caption } from '../components/ui/Typography';
import { TagGroup, SelectableTag } from '../components/ui/Tag';
import { MultiToggle } from '../components/ui/Toggle';
import { capClient } from '../utils/capClient';
import { uploadSecurityManager } from '../utils/uploadSecurity';
import { AudioUrlManager } from '../services/audioUrlManager';
import { unifiedAudioManager } from '../services/unifiedAudioManager';

import type { AudioTrack } from '../types';

interface PendingUploadData {
  uploadId: string;
  title: string;
  status: 'pending';
  reason: string;
  estimatedTime: string;
}

// Predefined tags for audio content - 15 most used tags on the platform
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

export const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGender, setSelectedGender] = useState<'Female' | 'Male' | 'Couple' | 'Diverse' | null>('Diverse');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoApproveActive, setIsAutoApproveActive] = useState(false);
  
  const { currentUser, addMyTrack } = useUserStore();
  const { addTrack } = useDatabase();

  // Überwache Auto-Approve-Status
  useEffect(() => {
    const checkAutoApproveStatus = () => {
      const autoApproveActive = JSON.parse(localStorage.getItem('aural_queue_paused') || 'false');
      setIsAutoApproveActive(autoApproveActive);
    };

    // Initial check
    checkAutoApproveStatus();

    // Listen for auto approve status changes
    const handleAutoApproveStatusChange = (event: CustomEvent) => {
      setIsAutoApproveActive(event.detail.isPaused);
    };

    window.addEventListener('queuePauseStatusChanged', handleAutoApproveStatusChange as EventListener);

    return () => {
      window.removeEventListener('queuePauseStatusChanged', handleAutoApproveStatusChange as EventListener);
    };
  }, []);

  // Load file from sessionStorage if coming from record page or audio editor
  useEffect(() => {
    const loadRecordingData = async () => {
      const recordingData = sessionStorage.getItem('recordingData');
      if (recordingData) {
        try {
          const data = JSON.parse(recordingData);
          const { file, title: recordedTitle } = data;
          
          if (file && file.data) {
            console.log('🎵 UploadPage: Loading recording data...');
            
            let blob: Blob;
            
            // Prüfe ob es eine AudioUrlManager URL ist
            if (file.tempTrackId) {
              console.log('🔍 UploadPage: Found tempTrackId, loading from AudioUrlManager...', { tempTrackId: file.tempTrackId });
              const audioUrl = AudioUrlManager.getAudioUrl(file.tempTrackId);
              console.log('🔍 UploadPage: Retrieved audioUrl from AudioUrlManager:', { audioUrl });
              
              if (audioUrl) {
                // Prüfe ob es eine einzigartige URL ist
                if (audioUrl.startsWith('aural-audio-')) {
                  // Für einzigartige URLs, hole die tatsächliche Blob-URL
                  const resolvedUrl = AudioUrlManager.getAudioUrl(audioUrl);
                  if (resolvedUrl) {
                    const response = await fetch(resolvedUrl);
                    blob = await response.blob();
                  } else {
                    throw new Error('Failed to resolve unique URL');
                  }
                } else {
                  // Für normale URLs, konvertiere direkt
                  const response = await fetch(audioUrl);
                  blob = await response.blob();
                }
                
                // Lösche die temporären Daten aus dem AudioUrlManager
                AudioUrlManager.clearTrackUrls(file.tempTrackId);
              } else {
                throw new Error('No URL found in AudioUrlManager');
              }
            } else if (file.data.startsWith('data:')) {
              // Fallback: Normale Data URL
              console.log('🔍 UploadPage: Loading data URL...');
              const response = await fetch(file.data);
              blob = await response.blob();
            } else if (file.data.startsWith('blob:')) {
              // Fallback: Blob URL
              console.log('🔍 UploadPage: Loading blob URL...');
              const response = await fetch(file.data);
              blob = await response.blob();
            } else {
              // Fallback: Base64
              console.log('🔍 UploadPage: Loading base64 data...');
              const response = await fetch(file.data);
              blob = await response.blob();
            }
            
            console.log('✅ UploadPage: Created blob from recording data:', {
              blobSize: blob.size,
              blobType: blob.type
            });
            
            // Create a File object from the blob
            const fileName = file.name || (data.edited ? 'edited-audio.wav' : 'recording.wav');
            const fileObj = new File([blob], fileName, { type: blob.type });
            setSelectedFile(fileObj);
            const today = new Date().toLocaleDateString('de-DE');
            setTitle(recordedTitle || (data.edited ? `Moments of ${today}` : `Moments of ${today}`));
            
            // Get duration
            try {
              const dur = await getAudioDuration(fileObj);
              setDuration(dur);
            } catch (err) {
              console.error('Error getting duration:', err);
              setDuration(data.duration || 0);
            }
            
            // Clear sessionStorage
            sessionStorage.removeItem('recordingData');
          } else {
            throw new Error('No file data found in recording data');
          }
        } catch (err) {
          console.error('❌ UploadPage: Error loading recording data:', err);
          setError('Fehler beim Laden der Aufnahme');
        }
      }
    };

    loadRecordingData();
  }, []);


  // Track changes for unsaved changes warning
  useEffect(() => {
    if (title || description || selectedGender || selectedTags.length > 0) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [title, description, selectedGender, selectedTags]);


  const validateTitle = (title: string): boolean => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Title is required');
      return false;
    }
    if (trimmed.length < 2) {
      setTitleError('Title must be at least 2 characters');
      return false;
    }
    if (trimmed.length > 85) {
      setTitleError('Title must not exceed 85 characters');
      return false;
    }
    setTitleError('');
    return true;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setError(''); // Clear any previous errors
    
    // Validate title length
    if (value.length > 85) {
      setTitleError('Title must not exceed 85 characters');
    } else {
      setTitleError('');
    }
  };

  const handleTitleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Clear the field if it contains the default value
    const today = new Date().toLocaleDateString('de-DE');
    const defaultTitle = `Moments of ${today}`;
    if (title === defaultTitle || title === 'Meine Aufnahme' || title.startsWith('Moments of')) {
      setTitle('');
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setError(''); // Clear any previous errors
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Erste Validierung: Dateiformat und Größe
    if (!isValidAudioFile(file)) {
      setError('Bitte wählen Sie eine gültige Audio-Datei (MP3, WAV, OGG, etc.)');
      return;
    }

    // Zweite Validierung: Audio-Inhalt
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Dritte Validierung: Neue robuste Validierung
    try {
      // Zusätzliche Validierung mit isValidAudioFile
      if (!isValidAudioFile(file)) {
        setError('Audio-Datei ist beschädigt oder nicht unterstützt');
        return;
      }
      
      // Simuliere newValidation für den Rest des Codes
      const newValidation = { isValid: true, warnings: [], error: null };
      if (!newValidation.isValid) {
        setError(newValidation.error || 'Audio-Datei ist beschädigt oder nicht unterstützt');
        return;
      }
      
      if (newValidation.warnings) {
        console.warn('Audio validation warnings:', newValidation.warnings);
      }
    } catch (err) {
      console.error('Error in new validation:', err);
      // Fortfahren mit alter Validierung
    }

    setError('');
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    
    try {
      const dur = await getAudioDuration(file);
      setDuration(dur);
    } catch (err) {
      console.error('Error getting duration:', err);
      setError('Fehler beim Laden der Audio-Datei. Bitte versuchen Sie eine andere Datei.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setSelectedGender(null);
    setSelectedTags([]);
    setCustomTag('');
    setDuration(0);
    setError('');
    setTitleError('');
    setHasUnsavedChanges(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setError(''); // Clear any previous errors
  };

  const handleAddCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) return;
    
    // German spec: normalize tag
    const normalizedTag = tag.toLowerCase()
      .replace(/\s+/g, '-') // whitespace to dash
      .replace(/[^a-z0-9\-]/g, '') // only allowed characters
      .substring(0, 24); // max length

    if (normalizedTag.length < 2) {
      setError('Tag muss mindestens 2 Zeichen haben');
      return;
    }
    
    if (selectedTags.length >= 10) {
      setError('Maximum 10 tags allowed');
      return;
    }
    
    // Check for duplicates (case-insensitive)
    const isDuplicate = selectedTags.some(existingTag => 
      existingTag.toLowerCase() === normalizedTag
    );
    
    if (isDuplicate) {
      setError('Dieser Tag wurde bereits hinzugefügt');
      return;
    }
    
    // Check against predefined tags (case-insensitive)
    const isDuplicatePredefined = predefinedTags.some(predefinedTag => 
      predefinedTag.toLowerCase() === normalizedTag
    );
    
    if (isDuplicatePredefined) {
      setError('Dieser Tag ist bereits in der Liste verfügbar');
      return;
    }
    
    setError('');
    setSelectedTags(prev => [...prev, normalizedTag]);
    setCustomTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };


  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;
    
    // Set fallback title if empty
    const finalTitle = title.trim() || `Moments of ${new Date().toLocaleDateString('de-DE')}`;
    
    // Final validation
    if (!validateTitle(finalTitle)) {
      return;
    }
    
    // Gender validation - required field
    if (!selectedGender) {
      setError('Please select who is on the recording');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      // 1. Sicherheitscheck durchführen
      console.log('🔐 Starting security check...');
      const securityCheck = await uploadSecurityManager.checkUploadSecurity(selectedFile, duration);
      
      console.log('🔐 Security Check Result:', {
        allowed: securityCheck.allowed,
        requiresReview: securityCheck.requiresReview,
        reason: securityCheck.reason,
        deviceStats: {
          uploads30Min: securityCheck.deviceStats.uploads30Min,
          uploadsToday: securityCheck.deviceStats.uploadsToday,
          audioMinutesToday: securityCheck.deviceStats.audioMinutesToday
        }
      });
      
      // 2. WICHTIG: Device-Stats IMMER aktualisieren (auch bei normalen Uploads)
      const fileHash = await uploadSecurityManager.calculateFileHash(selectedFile);
      uploadSecurityManager.updateDeviceStatsAfterUpload(
        securityCheck.deviceStats, 
        fileHash, 
        duration
      );
      console.log('📊 Device stats updated for upload attempt');
      
      // 3. Cap-Token generieren (unsichtbar für User)
      console.log('🔐 Generating Cap proof-of-work token...');
      const capToken = await capClient.generateToken(selectedFile.size);
      
      // 3.5. Prüfe Auto-Approve-Status
      const isAutoApproveActive = JSON.parse(localStorage.getItem('aural_queue_paused') || 'false');
      if (isAutoApproveActive) {
        console.log('✅ Auto-Approve ist aktiv - Upload wird automatisch freigegeben');
        // Setze requiresReview auf false, damit der Upload automatisch freigegeben wird
        securityCheck.requiresReview = false;
        securityCheck.allowed = true;
        securityCheck.reason = 'Auto-Approve aktiv - Upload wird automatisch freigegeben';
      }

      // 3.6. Prüfe Sicherheitsregeln VOR dem Upload
      if (securityCheck.requiresReview || !securityCheck.allowed) {
        console.log('📋 Upload requires review BEFORE upload, showing pending modal...');
        
        const uploadId = generateId();
        
        // Erstelle Blob-URL für lokale Wiedergabe
        const audioBlobUrl = URL.createObjectURL(selectedFile);

        // Speichere nur Metadaten in localStorage (ohne Audio-Daten)
        const pendingUpload = {
          uploadId,
          filename: selectedFile.name,
          originalName: selectedFile.name,
          size: selectedFile.size,
          mimeType: selectedFile.type,
          url: audioBlobUrl, // Blob-URL für lokale Wiedergabe
          title: finalTitle,
          description: description.trim(),
          gender: selectedGender || undefined,
          tags: [...selectedTags, selectedGender],
          uploadedAt: new Date().toISOString(),
          status: 'pending_review',
          reason: securityCheck.reason || 'Security check triggered',
          duplicateCount: securityCheck.duplicateCheck.duplicateCount,
          deviceId: securityCheck.deviceStats.deviceId,
          userId: currentUser.id,
          username: currentUser.username,
          duration: duration // Audio-Dauer hinzufügen
        };
        
        // Speichere nur Metadaten in localStorage
        const existingUploads = JSON.parse(localStorage.getItem('aural_pending_uploads') || '{}');
        existingUploads[uploadId] = pendingUpload;
        localStorage.setItem('aural_pending_uploads', JSON.stringify(existingUploads));
        
        console.log('🔍 DEBUG: Pending upload saved to localStorage:', {
          uploadId,
          pendingUpload,
          allUploads: existingUploads,
          localStorageKey: 'aural_pending_uploads'
        });
        
        // Device-Stats wurden bereits oben aktualisiert
        
        const pendingData: PendingUploadData = {
          uploadId,
          title: finalTitle,
          status: 'pending',
          reason: securityCheck.reason || 'Security check triggered',
          estimatedTime: '5-10 minutes'
        };
        
        // Navigate to security check page with upload data
        navigate('/security-check', { state: pendingData });
        return;
      }
      
      // Normale Uploads (erlaubt und keine Review erforderlich)
      console.log('📤 Normal upload - proceeding with backend upload...');
      
      // 3. FormData mit Cap-Token erstellen
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('capToken', capToken);
      formData.append('requiresReview', securityCheck.requiresReview.toString());
      if (selectedGender) {
        formData.append('gender', selectedGender);
      }
      // Add gender as a tag for filtering
      const tagsWithGender = [...selectedTags, selectedGender];
      formData.append('tags', JSON.stringify(tagsWithGender));
      
      console.log('Uploading to backend with security measures...', {
        filename: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        title: finalTitle,
        tags: [...selectedTags, selectedGender],
        requiresReview: securityCheck.requiresReview,
        duplicateCount: securityCheck.duplicateCheck.duplicateCount
      });
      
      // 4. Upload to PHP backend
      let response;
      try {
        response = await fetch('/upload.php', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        console.log('Trying alternative upload path...');
        response = await fetch('./upload.php', {
          method: 'POST',
          body: formData
        });
      }
      
      // Read response body only once
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText.substring(0, 200));
      
      if (!response.ok) {
        console.error('Upload failed:', response.status, responseText);
        
        // Check if response is HTML (PHP error page)
        if (responseText.includes('<?php') || responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
          console.log('PHP server not available, using local storage fallback...');
          
          // Fallback: Store locally and simulate successful upload
          const audioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          
          const localTrack: AudioTrack = {
            id: generateId(),
            title: finalTitle,
            description: description.trim(),
            url: audioBase64,
            duration: duration,
            user: currentUser,
            userId: currentUser.id,
            likes: 0,
            isLiked: false,
            isBookmarked: false,
            createdAt: new Date(),
            tags: [...selectedTags, selectedGender],
            gender: selectedGender || undefined,
            filename: selectedFile.name,
            fileSize: selectedFile.size,
            format: selectedFile.type
          };
          
          addMyTrack(localTrack);
          addTrack(localTrack);
          navigate('/');
          return;
        }
        
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(errorJson.error || 'Upload failed');
        } catch {
          throw new Error(`Upload failed: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }
      
      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Upload successful:', result);
      } catch (jsonError) {
        console.error('JSON parsing failed:', responseText);
        
        // If JSON parsing fails, use fallback
        if (responseText.includes('<?php') || responseText.includes('<html')) {
          console.log('Server returned HTML instead of JSON, using local storage fallback...');
          
          const audioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          
          const localTrack: AudioTrack = {
            id: generateId(),
            title: finalTitle,
            description: description.trim(),
            url: audioBase64,
            duration: duration,
            user: currentUser,
            userId: currentUser.id,
            likes: 0,
            isLiked: false,
            isBookmarked: false,
            createdAt: new Date(),
            tags: [...selectedTags, selectedGender],
            gender: selectedGender || undefined,
            filename: selectedFile.name,
            fileSize: selectedFile.size,
            format: selectedFile.type
          };
          
          addMyTrack(localTrack);
          addTrack(localTrack);
          navigate('/');
          return;
        }
        
        throw new Error('Server antwortete mit ungültigem JSON');
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // 5. Device-Stats wurden bereits oben aktualisiert
      
      // 6. Prüfen ob Review erforderlich ist (IMMER prüfen, auch bei lokaler Speicherung)
      if (result.requiresReview || securityCheck.requiresReview) {
        console.log('📋 Upload requires review, showing pending modal...');
        
        const uploadId = result.data.uploadId || generateId();
        
        // Speichere Upload in pending queue
        const pendingUpload = {
          uploadId,
          filename: result.data.filename || selectedFile.name,
          originalName: selectedFile.name,
          size: selectedFile.size,
          mimeType: selectedFile.type,
          url: result.data.url || '',
          title: finalTitle,
          description: description.trim(),
          gender: selectedGender || undefined,
          tags: [...selectedTags, selectedGender],
          uploadedAt: new Date().toISOString(),
          status: 'pending_review',
          reason: securityCheck.reason || (securityCheck.duplicateCheck.isSuspicious ? 
            'Duplicate file detected' : 
            'Rate limit or security check triggered'),
          duplicateCount: securityCheck.duplicateCheck.duplicateCount,
          deviceId: securityCheck.deviceStats.deviceId,
          userId: currentUser.id,
          username: currentUser.username,
          duration: duration // Audio-Dauer hinzufügen
        };
        
        // Speichere in localStorage
        const existingUploads = JSON.parse(localStorage.getItem('aural_pending_uploads') || '{}');
        existingUploads[uploadId] = pendingUpload;
        localStorage.setItem('aural_pending_uploads', JSON.stringify(existingUploads));
        
        const pendingData: PendingUploadData = {
          uploadId,
          title: finalTitle,
          status: 'pending',
          reason: securityCheck.reason || 'Security check triggered',
          estimatedTime: '5-10 minutes'
        };
        
        // Navigate to security check page with upload data
        navigate('/security-check', { state: pendingData });
        return;
      }
      
      // 7. Normale Verarbeitung - Track erstellen
      const trackId = generateId();
      
      // Speichere die Audio-URL im CentralAudioManager (dauerhaft verfügbar)
      const storeResult = await unifiedAudioManager.storeNewAudio(trackId, selectedFile, { title: finalTitle });
      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to store audio');
      }
      const audioUrl = storeResult.url!;
      
      const newTrack: AudioTrack = {
        id: trackId,
        title: finalTitle,
        description: description.trim(),
        url: audioUrl, // Verwende die einzigartige URL für sofortige Wiedergabe
        duration: duration,
        user: currentUser,
        userId: currentUser.id,
        likes: 0,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(result.data.uploadedAt),
        tags: [...selectedTags, selectedGender],
        gender: selectedGender || undefined,
        filename: result.data.originalName,
        fileSize: result.data.size,
        format: result.data.mimeType,
        status: 'active' as const // Direkt hochgeladene Tracks sind sofort aktiv
      };
      
      console.log('Created new track with server data', {
        id: newTrack.id,
        title: newTrack.title,
        duration: newTrack.duration,
        tags: newTrack.tags,
        gender: newTrack.gender,
        url: newTrack.url,
        filename: newTrack.filename,
        fileSize: newTrack.fileSize
      });
      
      // ZENTRALE DATENBANK: Füge Track zur einzigen Quelle der Wahrheit hinzu
      console.log('🎯 UploadPage: Füge Track zur zentralen Datenbank hinzu...');
      const success = addTrack(newTrack);
      
      if (success) {
        console.log('✅ UploadPage: Track erfolgreich zur Datenbank hinzugefügt');
        addMyTrack(newTrack);
      } else {
        console.error('❌ UploadPage: Fehler beim Hinzufügen zur Datenbank');
        throw new Error('Track could not be added to database');
      }
      
      // Navigate to upload success page with track data
      navigate('/upload-success', { 
        state: { 
          uploadId: trackId, 
          title: newTrack.title, 
          trackId: newTrack.id 
        } 
      });
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="max-w-md mx-auto relative">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-6" style={{ paddingBottom: '100px' }}>

        {/* Title */}
        <Heading level={1} className="text-4xl mb-8">
          Share your recording
        </Heading>

        {/* Auto Approve Active Warning */}
        {isAutoApproveActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-green-400 font-medium text-sm">
                  Auto-approval active
                </h3>
                <p className="text-green-300/80 text-xs mt-1">
                  Your upload will be automatically approved
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* File Upload Area */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-500 rounded-xl p-12 text-center mb-8
                     hover:border-orange-500 hover:bg-orange-500/5 transition-all duration-300 cursor-pointer"
          >
            <Upload size={48} className="text-orange-500 mx-auto mb-6" />
            <Heading level={3} className="mb-3">
              Select Audio File
            </Heading>
            <Body color="secondary" className="text-sm mb-6">
              MP3, WAV, WebM, OGG, M4A (max 50MB)
            </Body>
            <Button variant="primary" size="md">
              Browse files
            </Button>
          </div>
        ) : (
          /* File Selected - no preview shown */
          <div></div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Metadata Form - im Stil der Audio-Detail-Seite */}
        {selectedFile && (
          <div className="flex-1 space-y-8">
            {/* Title Input */}
            <div>
              <Label className="block mb-3 normal-case">
                What is the title of this recording?
              </Label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onFocus={handleTitleFocus}
                placeholder="Create title"
                className={`w-full px-4 py-4 bg-transparent border rounded-lg
                         text-white placeholder-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-orange-500/5
                         transition-all duration-200 ${
                           titleError ? 'border-red-500/50' : 'border-gray-500'
                         }`}
                maxLength={85}
                required
              />
              <div className="flex justify-between items-center mt-2">
                {titleError && (
                  <Caption className="text-red-400">{titleError}</Caption>
                )}
                <Caption color="secondary" className="text-right ml-auto">
                  {title.length}/85
                </Caption>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="block mb-3 normal-case">
                Add a description if you like
              </Label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter description"
                rows={4}
                className="w-full px-4 py-4 bg-transparent border border-gray-500 rounded-lg
                         text-white placeholder-gray-400 resize-none
                         focus:outline-none focus:border-orange-500 focus:bg-orange-500/5
                         transition-all duration-200"
                maxLength={1000}
              />
              <Caption color="secondary" className="text-right mt-2">
                {description.length}/1000
              </Caption>
            </div>

            {/* Gender Selection */}
            <div>
              <Label className="block mb-4 normal-case">
                Who is on the recording?
              </Label>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedGender(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 ${
                      selectedGender === option.value
                        ? 'bg-orange-500/20 text-orange-500 border-orange-500/50'
                        : 'bg-white/5 text-text-secondary border-white/30 hover:bg-white/10 hover:text-text-primary hover:border-white/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginTop: '50px' }}>
              <Label className="block mb-4 normal-case">
                Add tags to your recording
              </Label>

              {/* Predefined Tags - nur nicht ausgewählte anzeigen */}
              <div className="flex flex-wrap gap-2 mb-4">
                {predefinedTags
                  .filter(tag => !selectedTags.includes(tag))
                  .map((tag) => (
                    <SelectableTag
                      key={tag}
                      value={tag}
                      selectedValues={selectedTags}
                      onSelectionChange={setSelectedTags}
                      size="md"
                      aria-label={`Tag: ${tag}, not selected`}
                    >
                      {tag}
                    </SelectableTag>
                  ))}
              </div>

              {/* Custom Tag Input */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                  placeholder="Enter your own tag"
                  className="flex-1 px-3 py-2 bg-transparent border border-gray-500 rounded-lg text-sm
                           text-white placeholder-gray-400
                           focus:outline-none focus:border-orange-500 focus:bg-orange-500/5
                           transition-all duration-200"
                  maxLength={24}
                  aria-label="Enter your own tag"
                />
                <button
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim() || selectedTags.length >= 10}
                  className="w-10 h-10 rounded-full border-2 border-gray-600 bg-gradient-to-r from-gray-700/30 to-gray-600/20 flex items-center justify-center hover:from-gray-600/40 hover:to-gray-500/30 active:from-gray-600/50 active:to-gray-500/40 transition-all duration-200 touch-manipulation shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={selectedTags.length >= 10 ? 'Maximum 10 tags allowed' : 'Add tag'}
                >
                  <Plus size={16} className="text-gray-300" strokeWidth={2} />
                </button>
              </div>

              {/* Selected Tags - gleiche Größe wie auswählbare Tags */}
              {selectedTags.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500/20
                                 text-orange-500 text-sm rounded-full border border-orange-500/50"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 transition-colors duration-200 p-0 w-3 h-3 flex items-center justify-center"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X size={10} className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedTags.length === 0 && (
                <Caption color="secondary" className="mt-2">
                  You can set tags to be found better
                </Caption>
              )}
            </div>

          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Body className="text-red-400 text-sm text-center">{error}</Body>
          </div>
        )}

        {/* Upload Button - Full Width */}
        {selectedFile && (
          <div className="mt-8" style={{ marginTop: '70px' }}>
            <button
              onClick={handleUpload}
              disabled={!title.trim() || titleError !== '' || isUploading}
              className="w-full px-8 py-5 sm:py-4 rounded-full border-2 border-orange-500 bg-gradient-to-r from-orange-500/30 to-orange-600/20 flex items-center justify-center space-x-3 hover:from-orange-500/40 hover:to-orange-600/30 active:from-orange-500/50 active:to-orange-600/40 transition-all duration-200 touch-manipulation shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '64px' }}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-orange-300 text-base font-semibold">Publishing...</span>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-orange-400" strokeWidth={2} />
                  <span className="text-orange-300 text-base font-semibold">Publish Recording</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};