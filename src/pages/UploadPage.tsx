import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useFeedStore } from '../stores/feedStore';
import { validateAudioFile, getAudioDuration, generateId, formatDuration } from '../utils';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';
import type { AudioTrack } from '../types';

// German specification: predefined tags
const predefinedTags = ['Soft', 'Female', 'Toy', 'Passionated', 'Moan'];
const genderOptions = [
  { label: 'Frau', value: 'Female' }, 
  { label: 'Mann', value: 'Male' },
  { label: 'Paar', value: 'Couple' },
  { label: 'Diverse', value: 'Diverse' } // Added Diverse option
] as const;

export const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGender, setSelectedGender] = useState<'Female' | 'Male' | 'Couple' | 'Diverse' | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { currentUser, addMyTrack } = useUserStore();
  const { addTrack } = useFeedStore();

  // Load file from sessionStorage if coming from record page or audio editor
  useEffect(() => {
    const recordingData = sessionStorage.getItem('recordingData');
    if (recordingData) {
      try {
        const data = JSON.parse(recordingData);
        const { file, title: recordedTitle } = data;
        
        if (file && file.data) {
          // Check if it's a blob URL or base64 data
          if (file.data.startsWith('blob:')) {
            console.log('Loading blob URL from recording data...');
            fetch(file.data)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.blob();
              })
              .then(blob => {
                console.log('Created blob from URL', {
                  blobSize: blob.size,
                  blobType: blob.type
                });
                
                // Create a File object from the blob
                const fileName = file.name || (data.edited ? 'edited-audio.wav' : 'recording.wav');
                const fileObj = new File([blob], fileName, { type: blob.type });
                setSelectedFile(fileObj);
                setTitle(recordedTitle || (data.edited ? 'Bearbeitete Aufnahme' : 'Meine Aufnahme'));
                
                // Get duration
                getAudioDuration(fileObj).then(dur => {
                  setDuration(dur);
                });
                
                // Clear sessionStorage
                sessionStorage.removeItem('recordingData');
              })
              .catch(err => {
                console.error('Error loading recording data from blob URL:', err);
                setError('Fehler beim Laden der Aufnahme');
              });
          } else {
            // Convert base64 back to blob (legacy support)
            console.log('Converting base64 to blob...');
            fetch(file.data)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.blob();
              })
              .then(blob => {
                console.log('Created blob from base64', {
                  blobSize: blob.size,
                  blobType: blob.type
                });
                
                // Create a File object from the blob
                const fileName = file.name || (data.edited ? 'edited-audio.wav' : 'recording.wav');
                const fileObj = new File([blob], fileName, { type: blob.type });
                setSelectedFile(fileObj);
                setTitle(recordedTitle || (data.edited ? 'Bearbeitete Aufnahme' : 'Meine Aufnahme'));
                
                // Get duration
                getAudioDuration(fileObj).then(dur => {
                  setDuration(dur);
                });
                
                // Clear sessionStorage
                sessionStorage.removeItem('recordingData');
              })
              .catch(err => {
                console.error('Error loading recording data from base64:', err);
                setError('Fehler beim Laden der Aufnahme');
              });
          }
        } else {
          throw new Error('No file data found in recording data');
        }
      } catch (err) {
        console.error('Error parsing recording data:', err);
        setError('Fehler beim Laden der Aufnahme');
      }
    }
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
      setTitleError('Titel ist erforderlich');
      return false;
    }
    if (trimmed.length < 2) {
      setTitleError('Titel muss mindestens 2 Zeichen haben');
      return false;
    }
    if (trimmed.length > 85) {
      setTitleError('Titel darf maximal 85 Zeichen haben');
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
      setTitleError('Titel darf maximal 85 Zeichen lang sein');
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
      setError('Fehler beim Laden der Datei');
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
      setError('Maximal 10 Tags erlaubt');
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
    
    setIsUploading(true);
    setError('');
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (selectedGender) {
        formData.append('gender', selectedGender);
      }
      formData.append('tags', JSON.stringify(selectedTags));
      
      console.log('Uploading to backend...', {
        filename: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        title: title.trim(),
        tags: selectedTags
      });
      
      // Upload to PHP backend
      const response = await fetch('./upload.php', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload failed:', response.status, errorData);
        
        try {
          const errorJson = JSON.parse(errorData);
          throw new Error(errorJson.error || 'Upload failed');
        } catch {
          throw new Error(`Upload failed: ${response.status}`);
        }
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      // Create new track with server response data
      const newTrack: AudioTrack = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        url: result.data.url, // Use server URL
        duration: duration,
        user: currentUser,
        likes: 0,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(result.data.uploadedAt),
        tags: selectedTags,
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
      
      // Add to stores
      addMyTrack(newTrack);
      addTrack(newTrack);
      
      // Navigate to feed immediately
      navigate('/');
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Hochladen. Bitte versuche es erneut.');
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
        <h1 className="text-white text-4xl font-bold leading-tight mb-4">
          Audio hochladen
        </h1>


        {/* File Upload Area */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-500 rounded-xl p-8 text-center 
                     hover:border-orange-500 hover:bg-orange-500/5 transition-all duration-300 cursor-pointer"
          >
            <Upload size={48} className="text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Audio-Datei wählen
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              MP3, WAV, WebM, OGG, M4A (max 50MB)
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-orange-500 rounded-lg text-white font-medium">
              Dateien durchsuchen
            </div>
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
          <div className="flex-1 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Wie lautet der Titel dieser Aufnahme?
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Titel erstellen"
                className={`w-full px-4 py-3 bg-transparent border rounded-lg
                         text-white placeholder-gray-400
                         focus:outline-none focus:border-orange-500 focus:bg-orange-500/5
                         transition-all duration-200 ${
                           titleError ? 'border-red-500/50' : 'border-gray-500'
                         }`}
                maxLength={85}
                required
              />
              <div className="flex justify-between items-center mt-1">
                {titleError && (
                  <p className="text-red-400 text-xs">{titleError}</p>
                )}
                <div className="text-right text-xs text-gray-400 ml-auto">
                  {title.length}/85
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Füge eine Beschreibung hinzu, wenn du magst
              </label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Hier eingeben"
                rows={3}
                className="w-full px-4 py-3 bg-transparent border border-gray-500 rounded-lg
                         text-white placeholder-gray-400 resize-none
                         focus:outline-none focus:border-orange-500 focus:bg-orange-500/5
                         transition-all duration-200"
                maxLength={1000}
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {description.length}/1000
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Wer ist auf der Aufnahme zu hören?
              </label>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedGender(
                      selectedGender === option.value ? null : option.value
                    )}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedGender === option.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-transparent border border-gray-500 text-gray-400 hover:border-orange-500 hover:text-orange-500'
                    }`}
                    aria-label={`${option.label} ${
                      selectedGender === option.value ? 'ausgewählt' : 'nicht ausgewählt'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Vergib deiner Aufnahme Tags
              </label>

              {/* Predefined Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {predefinedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-orange-500 text-white'
                        : 'bg-transparent border border-gray-500 text-gray-400 hover:border-orange-500 hover:text-orange-500'
                    }`}
                    aria-label={`Tag: ${tag}, ${
                      selectedTags.includes(tag) ? 'ausgewählt' : 'nicht ausgewählt'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Custom Tag Input */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                  placeholder="+ Eigenen Tag eingeben"
                  className="flex-1 px-3 py-2 bg-transparent border border-gray-500 rounded-lg text-sm
                           text-white placeholder-gray-400
                           focus:outline-none focus:border-orange-500 focus:bg-orange-500/5
                           transition-all duration-200"
                  maxLength={24}
                  aria-label="Eigenen Tag eingeben"
                />
                <button
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim() || selectedTags.length >= 10}
                  className="px-3 py-2 bg-transparent border border-gray-500 rounded-lg text-gray-400
                           hover:border-orange-500 hover:text-orange-500 transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedTags.length >= 10 ? 'Maximal 10 Tags erlaubt' : 'Tag hinzufügen'}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">
                    Ausgewählte Tags ({selectedTags.length}/10):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-orange-500/20
                                 text-orange-500 text-xs rounded-full"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 transition-colors duration-200"
                          aria-label={`Tag ${tag} entfernen`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedTags.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Du kannst Tags setzen, um besser gefunden zu werden
                </p>
              )}
            </div>

          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Upload Button - Full Width */}
        {selectedFile && (
          <div className="mt-8">
            <button
              onClick={handleUpload}
              disabled={!title.trim() || titleError !== '' || isUploading}
              className="w-full py-4 px-6 rounded-xl border border-orange-500 bg-orange-500/20 flex items-center justify-center space-x-3
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500/30 transition-all duration-200"
              aria-label="Aufnahme hochladen"
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={20} className="text-orange-500" strokeWidth={1.5} />
              )}
              <span className="text-orange-500 font-medium">
                {isUploading ? 'Wird hochgeladen...' : 'Upload'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};