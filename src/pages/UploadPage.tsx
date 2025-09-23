import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useDatabase } from '../hooks/useDatabase';
import { validateAudioFile, getAudioDuration, generateId, formatDuration } from '../utils';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';
import { Button, IconButton } from '../components/ui/Button';
import { Heading, Body, Label, Caption } from '../components/ui/Typography';
import { TagGroup, SelectableTag } from '../components/ui/Tag';
import { MultiToggle } from '../components/ui/Toggle';
import { capClient } from '../utils/capClient';
import { uploadSecurityManager } from '../utils/uploadSecurity';
import { PendingUploadPage } from './PendingUploadPage';
import { AudioUrlManager } from '../services/audioUrlManager';

interface PendingUploadData {
  uploadId: string;
  title: string;
  status: 'pending';
  reason: string;
  estimatedTime: string;
}
import type { AudioTrack } from '../types';

// Predefined tags for audio content
const predefinedTags = ['Soft', 'Female', 'Toy', 'Passionate', 'Moan'];
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
  const [showPendingPage, setShowPendingPage] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<PendingUploadData | null>(null);
  
  const { currentUser, addMyTrack } = useUserStore();
  const { addTrack } = useDatabase();

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
              console.log('🔍 UploadPage: Found tempTrackId, loading from AudioUrlManager...');
              const audioUrl = AudioUrlManager.getAudioUrl(file.tempTrackId);
              
              if (audioUrl) {
                // Konvertiere die AudioUrlManager URL zurück zu einem Blob
                const response = await fetch(audioUrl);
                blob = await response.blob();
                
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
            setTitle(recordedTitle || (data.edited ? 'Bearbeitete Aufnahme' : 'Meine Aufnahme'));
            
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setError(''); // Clear any previous errors
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError('');
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    
    try {
      const dur = await getAudioDuration(file);
      setDuration(dur);
    } catch (err) {
      console.error('Error getting duration:', err);
      setError('Error loading file');
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
    
    // Final validation
    if (!validateTitle(title)) {
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
      
      // 3.5. Prüfe Sicherheitsregeln VOR dem Upload
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
          title: title.trim(),
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
        
        // Device-Stats wurden bereits oben aktualisiert
        
        const pendingData: PendingUploadData = {
          uploadId,
          title: title.trim(),
          status: 'pending',
          reason: securityCheck.reason || 'Security check triggered',
          estimatedTime: '5-10 minutes'
        };
        
        setPendingUploadData(pendingData);
        setShowPendingPage(true);
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
        title: title.trim(),
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
            title: title.trim(),
            description: description.trim(),
            url: audioBase64,
            duration: duration,
            user: currentUser,
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
            title: title.trim(),
            description: description.trim(),
            url: audioBase64,
            duration: duration,
            user: currentUser,
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
          title: title.trim(),
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
          title: title.trim(),
          status: 'pending',
          reason: securityCheck.reason || 'Security check triggered',
          estimatedTime: '5-10 minutes'
        };
        
        setPendingUploadData(pendingData);
        setShowPendingPage(true);
        return;
      }
      
      // 7. Normale Verarbeitung - Track erstellen
      // Erstelle eine lokale Base64-URL für sofortige Wiedergabe
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      const trackId = generateId();
      
      // Speichere die Audio-URL im AudioUrlManager
      const audioUrl = await AudioUrlManager.storeAudioUrl(trackId, selectedFile, 'base64');
      
      const newTrack: AudioTrack = {
        id: trackId,
        title: title.trim(),
        description: description.trim(),
        url: audioUrl, // Verwende die lokale Base64-URL für sofortige Wiedergabe
        duration: duration,
        user: currentUser,
        likes: 0,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(result.data.uploadedAt),
        tags: [...selectedTags, selectedGender],
        gender: selectedGender || undefined,
        filename: result.data.originalName,
        fileSize: result.data.size,
        format: result.data.mimeType
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
      
      // Navigate to feed immediately
      navigate('/');
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-transparent">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">

        {/* Title */}
        <Heading level={1} className="text-4xl mb-8">
          Upload Audio
        </Heading>

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
              Dateien durchsuchen
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
              <Label className="block mb-3">
                What is the title of this recording?
              </Label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
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
              <Label className="block mb-3">
                Add a description if you like
              </Label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Hier eingeben"
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
              <Label className="block mb-4">
                Who is on the recording?
              </Label>
              <MultiToggle
                options={genderOptions.map(option => ({
                  value: option.value,
                  label: option.label
                }))}
                value={selectedGender || ''}
                onChange={(value) => setSelectedGender(value as typeof selectedGender)}
                variant="segmented"
                size="md"
                className="flex flex-wrap gap-2"
              />
            </div>

            {/* Tags */}
            <div>
              <Label className="block mb-4">
                Add tags to your recording
              </Label>

              {/* Predefined Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {predefinedTags.map((tag) => (
                  <SelectableTag
                    key={tag}
                    value={tag}
                    selectedValues={selectedTags}
                    onSelectionChange={setSelectedTags}
                    size="md"
                    aria-label={`Tag: ${tag}, ${
                      selectedTags.includes(tag) ? 'selected' : 'not selected'
                    }`}
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
                  placeholder="+ Enter your own tag"
                  className="flex-1 px-3 py-2 bg-transparent border border-gray-500 rounded-lg text-sm
                           text-white placeholder-gray-400
                           focus:outline-none focus:border-orange-500 focus:bg-orange-500/5
                           transition-all duration-200"
                  maxLength={24}
                  aria-label="Enter your own tag"
                />
                <IconButton
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim() || selectedTags.length >= 10}
                  variant="outline"
                  size="sm"
                  icon={<Plus size={16} />}
                  aria-label={selectedTags.length >= 10 ? 'Maximum 10 tags allowed' : 'Add tag'}
                />
              </div>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div>
                  <Caption color="secondary" className="mb-2">
                    Ausgewählte Tags ({selectedTags.length}/10):
                  </Caption>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20
                                 text-orange-500 text-xs rounded-full"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 transition-colors duration-200 p-0 w-3 h-3 flex items-center justify-center"
                          aria-label={`Tag ${tag} entfernen`}
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
          <div className="mt-8">
            <Button
              onClick={handleUpload}
              disabled={!title.trim() || titleError !== '' || isUploading}
              variant="primary"
              size="lg"
              fullWidth
              className="py-4 flex items-center justify-center space-x-3"
              aria-label="Aufnahme hochladen"
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={20} strokeWidth={1.5} />
              )}
              <span>
                {isUploading ? 'Wird hochgeladen...' : 'Upload'}
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Pending Upload Page */}
      {showPendingPage && pendingUploadData && (
        <PendingUploadPage uploadData={pendingUploadData} />
      )}
    </div>
  );
};