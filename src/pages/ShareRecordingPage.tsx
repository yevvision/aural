import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, X, Pause, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useFeedStore } from '../stores/feedStore';
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
import { compressAudioForUpload, formatFileSize, type CompressionResult } from '../utils/audioCompression';
import { uploadWithProgress, formatUploadSpeed, formatRemainingTime, formatUploadSize, type UploadProgress } from '../utils/uploadWithProgress';

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

export const ShareRecordingPage = () => {
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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoApproveActive, setIsAutoApproveActive] = useState(false);
  
  // Audio compression states
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [compressionError, setCompressionError] = useState('');
  
  const { currentUser, addMyTrack } = useUserStore();
  const { addTrack } = useFeedStore();

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
            console.log('🎵 ShareRecordingPage: Loading recording data...');
            
            let blob: Blob;
            
            // Prüfe ob es eine AudioUrlManager URL ist
            if (file.tempTrackId) {
              console.log('🔍 ShareRecordingPage: Found tempTrackId, loading from AudioUrlManager...', { tempTrackId: file.tempTrackId });
              const audioUrl = AudioUrlManager.getAudioUrl(file.tempTrackId);
              console.log('🔍 ShareRecordingPage: Retrieved audioUrl from AudioUrlManager:', { audioUrl });
              
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
              console.log('🔍 ShareRecordingPage: Loading data URL...');
              const response = await fetch(file.data);
              blob = await response.blob();
            } else if (file.data.startsWith('blob:')) {
              // Fallback: Blob URL
              console.log('🔍 ShareRecordingPage: Loading blob URL...');
              const response = await fetch(file.data);
              blob = await response.blob();
            } else {
              // Fallback: Base64
              console.log('🔍 ShareRecordingPage: Loading base64 data...');
              const response = await fetch(file.data);
              blob = await response.blob();
            }
            
            console.log('✅ ShareRecordingPage: Created blob from recording data:', {
              blobSize: blob.size,
              blobType: blob.type
            });
            
            // Create a File object from the blob
            const fileName = file.name || (data.edited ? 'edited-audio.wav' : 'recording.wav');
            const fileObj = new File([blob], fileName, { type: blob.type });
            setSelectedFile(fileObj);
            const today = new Date().toLocaleDateString('de-DE');
            setTitle(recordedTitle || (data.edited ? `Moments auf ${today}` : `Moments auf ${today}`));
            
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
          console.error('❌ ShareRecordingPage: Error loading recording data:', err);
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
    const defaultTitle = `Moments auf ${today}`;
    if (title === defaultTitle || title === 'Meine Aufnahme' || title.startsWith('Moments auf')) {
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
    setCompressionError('');
    setCompressionResult(null);
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    
    try {
      const dur = await getAudioDuration(file);
      setDuration(dur);
    } catch (err) {
      console.error('Error getting duration:', err);
      setError('Fehler beim Laden der Audio-Datei. Bitte versuchen Sie eine andere Datei.');
    }

    // Starte Audio-Kompression
    await compressSelectedFile(file);
  };

  const compressSelectedFile = async (file: File) => {
    setIsCompressing(true);
    setCompressionError('');
    
    try {
      console.log('🎵 ShareRecordingPage: Starting audio compression...', {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type
      });

      const result = await compressAudioForUpload(file, {
        targetBitrate: 128, // 128 kbps für gute Qualität
        targetFormat: 'mp3'
      });

      console.log('✅ ShareRecordingPage: Audio compression completed', {
        originalSize: formatFileSize(result.originalSize),
        compressedSize: formatFileSize(result.compressedSize),
        compressionRatio: result.compressionRatio.toFixed(1) + '%',
        format: result.format
      });

      setCompressionResult(result);
      
      // Aktualisiere selectedFile mit komprimierter Datei
      setSelectedFile(result.compressedFile);
      
    } catch (error) {
      console.error('❌ ShareRecordingPage: Audio compression failed:', error);
      setCompressionError('Kompression fehlgeschlagen. Original-Datei wird verwendet.');
      setCompressionResult({
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        format: file.type
      });
    } finally {
      setIsCompressing(false);
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
    setCompressionResult(null);
    setCompressionError('');
    setIsCompressing(false);
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
    
    if (isCompressing) {
      setError('Bitte warten Sie, bis die Audio-Optimierung abgeschlossen ist.');
      return;
    }
    
    // Set fallback title if empty
    const finalTitle = title.trim() || `Moments auf ${new Date().toLocaleDateString('de-DE')}`;
    
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

      // 3.6. Upload IMMER an den Server senden - Server entscheidet über Warteschlange
      console.log('📤 Uploading to server - server will decide if review is needed...');
      
      // Upload an den Server senden
      console.log('📤 Sending upload to server...');
      
      // 3. FormData mit Cap-Token erstellen
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('capToken', capToken);
      formData.append('requiresReview', securityCheck.requiresReview.toString());
      formData.append('userId', currentUser.id);
      formData.append('username', currentUser.username);
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
      
      // 4. Upload to PHP backend with progress tracking
      let response;
      let responseText;
      let serverUploadSuccess = false;
      
      try {
        // Use uploadWithProgress for better UX
        response = await uploadWithProgress('https://goaural.com/upload.php', formData, {
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
          onSuccess: (response) => {
            // Don't clear uploadProgress here - keep showing progress until server processing is complete
            console.log('📤 Upload completed, waiting for server response...');
          },
          onError: (error) => {
            setUploadProgress(null);
            throw error;
          }
        });
        
        responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response text:', responseText.substring(0, 200));
        
        // Clear upload progress now that we have server response
        setUploadProgress(null);
        
        if (response.ok) {
          serverUploadSuccess = true;
        } else {
          console.log('📁 Server upload failed, using fallback');
          serverUploadSuccess = false;
        }
      } catch (error) {
        console.log('📁 Server not reachable, using fallback:', error);
        setUploadProgress(null);
        serverUploadSuccess = false;
      }
      
      // Fallback: Immer lokal speichern wenn Server nicht erreichbar
      if (!serverUploadSuccess) {
        console.log('🔄 Using local storage fallback...');
        
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
          format: selectedFile.type,
          status: 'active' as const
        };
        
        console.log('✅ Creating local track:', localTrack.title);
        console.log('🎵 ShareRecordingPage: Adding local track to FeedStore:', localTrack.title);
        addTrack(localTrack);
        addMyTrack(localTrack);
        
        // Navigate to success page
        navigate('/upload-success', { 
          state: { 
            uploadId: localTrack.id, 
            title: localTrack.title, 
            trackId: localTrack.id 
          } 
        });
        return;
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
      
      // 6. Prüfen ob Review erforderlich ist (berücksichtige Auto-Approve Status)
      const requiresManualReview = (result.requiresReview || securityCheck.requiresReview) && !result.data.autoApproved;
      
      if (requiresManualReview) {
        console.log('📋 Upload requires manual review, showing pending modal...');
        
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
      } else if (result.data.autoApproved) {
        console.log('✅ Upload wurde automatisch freigegeben (Auto-Approve aktiv)');
        // Upload wurde automatisch freigegeben, zeige Erfolgsmeldung
        alert('Upload erfolgreich! Ihr Audio wurde automatisch freigegeben.');
      }
      
      // 7. Normale Verarbeitung - Track erstellen
      const trackId = result.data.trackId || generateId();
      
      // OPTION C: SYNCHRONISIERUNG - upload.php hat bereits Audio + Info gespeichert!
      // Verwende die Server-URL für die Audio-Datei
      const audioUrl = result.data.url || `https://goaural.com/uploads/${result.data.filename}`;
      
      const newTrack: AudioTrack = {
        id: trackId,
        title: finalTitle,
        description: description.trim(),
        url: audioUrl, // Verwende die Server-URL (nicht lokal speichern!)
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
      
      // OPTION C: SYNCHRONISIERUNG - upload.php hat bereits alles gespeichert!
      console.log('🔄 ShareRecordingPage: upload.php hat bereits Track gespeichert, synchronisiere nur lokal...');
      
      // WICHTIG: Nur lokal hinzufügen - upload.php hat bereits auf Server gespeichert!
      // Verwende centralDB.addTrack() direkt um Server-Duplikate zu vermeiden
      const { centralDB } = await import('../database/centralDatabase_simple');
      const localSuccess = centralDB.addTrack(newTrack);
      
      if (localSuccess) {
        console.log('🎵 ShareRecordingPage: Adding server track to FeedStore:', newTrack.title);
        addTrack(newTrack);
        addMyTrack(newTrack);
        console.log('✅ ShareRecordingPage: Track nur lokal synchronisiert - upload.php hat bereits auf Server gespeichert');
      } else {
        console.log('⚠️ ShareRecordingPage: Track bereits lokal vorhanden - das ist normal nach upload.php');
        console.log('🎵 ShareRecordingPage: Adding existing track to FeedStore:', newTrack.title);
        addTrack(newTrack);
        addMyTrack(newTrack);
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
                     hover:border-[#ff4e3a] hover:bg-[#ff4e3a]/5 transition-all duration-300 cursor-pointer"
          >
            <Upload size={48} className="text-[#ff4e3a] mx-auto mb-6" />
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
          <div className="mb-8">
            {/* Compression Loading */}
            {isCompressing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#ff4e3a]/10 border border-[#ff4e3a]/20 rounded-xl mb-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-[#ff4e3a] border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h3 className="text-[#ff4e3a] font-medium text-sm">
                      Optimiere Audio...
                    </h3>
                    <p className="text-[#ff4e3a]/80 text-xs mt-1">
                      Konvertiere zu MP3 für bessere Speichernutzung
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Compression Results */}
            {compressionResult && !isCompressing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-green-400 font-medium text-sm">
                      Audio optimiert
                    </h3>
                    <p className="text-green-300/80 text-xs mt-1">
                      Reduziert von {formatFileSize(compressionResult.originalSize)} auf {formatFileSize(compressionResult.compressedSize)} 
                      ({compressionResult.compressionRatio.toFixed(1)}% Ersparnis)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Compression Error */}
            {compressionError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-yellow-400 font-medium text-sm">
                      {compressionError}
                    </h3>
                    <p className="text-yellow-300/80 text-xs mt-1">
                      Original-Datei wird verwendet
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
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
                         focus:outline-none focus:border-[#ff4e3a] focus:bg-[#ff4e3a]/5
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
                         focus:outline-none focus:border-[#ff4e3a] focus:bg-[#ff4e3a]/5
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
                        ? 'bg-[#ff4e3a]/20 text-[#ff4e3a] border-[#ff4e3a]/50'
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
                      showHashtag={true}
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
                           focus:outline-none focus:border-[#ff4e3a] focus:bg-[#ff4e3a]/5
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#ff4e3a]/20
                                 text-[#ff4e3a] text-sm rounded-full border border-[#ff4e3a]/50"
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
              disabled={!title.trim() || titleError !== '' || isUploading || isCompressing || uploadProgress !== null}
              className="w-full px-8 py-5 sm:py-4 rounded-full border-2 border-[#ff4e3a] bg-gradient-to-r from-[#ff4e3a]/30 to-[#ff4e3a]/20 flex items-center justify-center space-x-3 hover:from-[#ff4e3a]/40 hover:to-[#ff4e3a]/30 active:from-[#ff4e3a]/50 active:to-[#ff4e3a]/40 transition-all duration-200 touch-manipulation shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{ minHeight: '64px' }}
            >
              {isCompressing ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#ff4e3a] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#ff4e3a] text-base font-semibold">Optimiere Audio...</span>
                </>
              ) : uploadProgress ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#ff4e3a] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#ff4e3a] text-base font-semibold">
                    Lade hoch... {uploadProgress.percent}%
                  </span>
                </>
              ) : isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#ff4e3a] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#ff4e3a] text-base font-semibold">Publishing...</span>
                </>
              ) : (
                <>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60 animate-shimmer"></div>
                  <Upload size={20} className="text-[#ff4e3a] relative z-10" strokeWidth={2} />
                  <span className="text-[#ff4e3a] text-base font-semibold relative z-10">Publish Recording</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
