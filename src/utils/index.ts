// Utility functions for the Aural app

import type { AudioTrack, User } from '../types';

/**
 * Class name utility for conditional classes
 */
export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Duration formatting utility with enhanced error handling
 */
export const formatDuration = (seconds: number | undefined | null): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Safe date conversion utility
 */
export const toSafeDate = (value: Date | string | number | undefined | null): Date => {
  if (!value) return new Date();
  
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? new Date() : value;
  }
  
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  return new Date();
};

/**
 * Safe date formatting with fallbacks
 */
export const formatSafeDate = (
  value: Date | string | number | undefined | null,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const safeDate = toSafeDate(value);
    return safeDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    });
  } catch (error) {
    console.warn('Date formatting failed:', error);
    return 'Invalid date';
  }
};

/**
 * German date formatting
 */
export const formatDateGerman = (value: Date | string | number | undefined | null): string => {
  try {
    const safeDate = toSafeDate(value);
    
    // German date format: DD.MM.YYYY
    return safeDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (error) {
    console.warn('German date formatting failed:', error);
    return 'Unbekanntes Datum';
  }
};

/**
 * German relative time formatting
 */
export const formatRelativeTimeGerman = (value: Date | string | number | undefined | null): string => {
  try {
    const safeDate = toSafeDate(value);
    const now = new Date();
    const diffInMs = now.getTime() - safeDate.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInMinutes < 1) {
      return 'gerade eben';
    }
    
    if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `vor ${minutes} Min`;
    }
    
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `vor ${hours}h`;
    }
    
    if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `vor ${days}d`;
    }
    
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `vor ${weeks}w`;
    }
    
    return formatSafeDate(value, { day: 'numeric', month: 'short' });
  } catch (error) {
    console.warn('German relative time formatting failed:', error);
    return 'unbekannt';
  }
};

/**
 * Relative time formatting
 */
export const formatRelativeTime = (value: Date | string | number | undefined | null): string => {
  try {
    const safeDate = toSafeDate(value);
    const now = new Date();
    const diffInMs = now.getTime() - safeDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    }
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    }
    
    if (diffInDays < 3) {
      return `${Math.floor(diffInDays)}d ago`;
    }
    
    return formatSafeDate(value, { month: 'short', day: 'numeric' });
  } catch (error) {
    console.warn('Relative time formatting failed:', error);
    return 'Unknown time';
  }
};

/**
 * Format time ago (e.g., "2 hours ago") - Legacy support
 */
export const formatTimeAgo = (date: Date | string | number): string => {
  return formatRelativeTime(date);
};

/**
 * Time ago utility - Alias for convenience
 */
export const timeAgo = (value: Date | string | number | undefined | null): string => {
  return formatRelativeTime(value);
};

/**
 * Get audio duration from file
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      URL.revokeObjectURL(audio.src);
    };
    
    audio.onerror = () => {
      reject(new Error('Failed to load audio file'));
      URL.revokeObjectURL(audio.src);
    };
    
    audio.src = URL.createObjectURL(file);
  });
};

/**
 * Generate waveform data from audio file using Web Audio API
 */
export const generateWaveformData = async (audioBuffer: ArrayBuffer, samples: number = 100): Promise<number[]> => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = await audioContext.decodeAudioData(audioBuffer);
    
    const data = buffer.getChannelData(0); // Get first channel
    const blockSize = Math.floor(data.length / samples);
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(data[i * blockSize + j]);
      }
      waveform.push(sum / blockSize);
    }
    
    return waveform;
  } catch (error) {
    console.error('Failed to generate waveform:', error);
    // Return dummy waveform data
    return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.1);
  }
};

/**
 * Get audio file metadata
 */
export const getAudioMetadata = async (file: File): Promise<{
  duration: number;
  size: number;
  type: string;
  bitrate?: number;
  sampleRate?: number;
}> => {
  const duration = await getAudioDuration(file);
  
  return {
    duration,
    size: file.size,
    type: file.type,
    // Note: Getting bitrate and sample rate requires more complex analysis
    // For now, we'll estimate based on file size and duration
    bitrate: duration > 0 ? Math.round((file.size * 8) / duration / 1000) : undefined,
  };
};

/**
 * Compress audio file (basic implementation)
 */
export const compressAudio = async (file: File, quality: number = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    audio.onloadedmetadata = () => {
      try {
        // This is a simplified compression - in reality you'd use Web Audio API
        // For now, we'll just return the original file
        // In production, you'd want to use a proper audio compression library
        resolve(file);
      } catch (error) {
        reject(error);
      }
    };
    
    audio.onerror = () => reject(new Error('Failed to load audio for compression'));
    audio.src = URL.createObjectURL(file);
  });
};

/**
 * Create audio context with proper browser compatibility
 */
export const createAudioContext = (): AudioContext | null => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    return new AudioContext();
  } catch (error) {
    console.error('Web Audio API not supported:', error);
    return null;
  }
};

/**
 * Check if Web Audio API is supported
 */
export const isWebAudioSupported = (): boolean => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};

/**
 * Check if MediaRecorder is supported
 */
export const isMediaRecorderSupported = (): boolean => {
  return !!(typeof navigator !== 'undefined' && 
           navigator.mediaDevices && 
           typeof navigator.mediaDevices.getUserMedia === 'function' && 
           typeof window.MediaRecorder !== 'undefined');
};

/**
 * Validate audio file
 */
export const validateAudioFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 50MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only MP3, WAV, WebM, OGG, and M4A files are allowed' };
  }
  
  return { isValid: true };
};

/**
 * Create dummy users for demo
 */
export const createDummyUsers = (): User[] => [
  {
    id: '1',
    username: 'alex_voice',
    avatar: '/avatars/1.jpg',
    totalLikes: 150,
    totalUploads: 12,
    bio: 'Voice artist and storyteller 🎙️',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    username: 'sarah_sounds',
    avatar: '/avatars/2.jpg',
    totalLikes: 89,
    totalUploads: 8,
    bio: 'ASMR creator & sound designer',
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    username: 'mike_music',
    avatar: '/avatars/3.jpg',
    totalLikes: 245,
    totalUploads: 18,
    bio: 'Musician sharing voice notes 🎵',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '4',
    username: 'hollladiewaldfee',
    avatar: '/avatars/4.jpg',
    totalLikes: 42,
    totalUploads: 3,
    bio: 'Intime Flüsterstimmen und entspannende Momente 🌸',
    createdAt: new Date('2024-01-05'),
  },
];

/**
 * Create dummy audio tracks for demo
 */
export const createDummyTracks = (): AudioTrack[] => {
  const users = createDummyUsers();
  
  // Create some sample comments for testing
  const sampleComments = [
    {
      id: 'comment-1',
      content: 'Das ist wirklich entspannend! Perfekt zum Einschlafen.',
      user: users[1],
      trackId: '1',
      createdAt: new Date('2024-02-15T20:30:00')
    },
    {
      id: 'comment-2', 
      content: 'Wunderschöne Stimme! Mehr davon bitte.',
      user: users[2],
      trackId: '1',
      createdAt: new Date('2024-02-15T21:15:00')
    },
    {
      id: 'comment-3',
      content: 'Sehr beruhigend, danke für das Teilen!',
      user: users[0],
      trackId: '2',
      createdAt: new Date('2024-02-14T19:45:00')
    },
  ];
  
  // For demo purposes, we'll create silent audio tracks
  // In a real app, these would be actual audio file URLs
  const silentAudioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBSJ31/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBSJ31/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBSJ31/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBSJ31/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBSJ31/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBSJ31/LNeSs=';
  
  return [
    {
      id: '1',
      title: 'Whispered Secrets',
      description: 'Intimate whispers sharing personal thoughts and desires',
      duration: 180,
      url: silentAudioUrl,
      user: users[0],
      likes: 24,
      isLiked: false,
      comments: sampleComments.filter(c => c.trackId === '1'),
      commentsCount: 2,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      tags: ['Whisper', 'Soft', 'Intimate'],
      gender: 'Female' as const,
    },
    {
      id: '2',
      title: 'ASMR Rain Sounds',
      description: 'Gentle rain sounds with soft spoken words for relaxation',
      duration: 95,
      url: silentAudioUrl,
      user: users[1],
      likes: 18,
      isLiked: true,
      comments: sampleComments.filter(c => c.trackId === '2'),
      commentsCount: 1,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      tags: ['ASMR', 'Rain', 'Relaxing'],
      gender: 'Female' as const,
    },
    {
      id: '3',
      title: 'Deep Voice Meditation',
      description: 'Calming meditation guide with a deep, soothing voice',
      duration: 240,
      url: silentAudioUrl,
      user: users[2],
      likes: 42,
      isLiked: false,
      commentsCount: 0,
      createdAt: new Date('2024-02-13'),
      tags: ['Deep', 'Meditation', 'Calming'],
      gender: 'Male' as const,
    },
    {
      id: '4',
      title: 'Bedtime Story',
      description: 'A gentle bedtime story told in a soft, caring voice',
      duration: 45,
      url: silentAudioUrl,
      user: users[0],
      likes: 7,
      isLiked: false,
      commentsCount: 0,
      createdAt: new Date('2024-02-12'),
      tags: ['Bedtime', 'Story', 'Gentle'],
      gender: 'Female' as const,
    },
    {
      id: '5',
      title: 'Voice Note Confessions',
      description: 'Personal thoughts and confessions shared through voice',
      duration: 156,
      url: silentAudioUrl,
      user: users[1],
      likes: 31,
      isLiked: true,
      commentsCount: 0,
      createdAt: new Date('2024-02-11'),
      tags: ['Personal', 'Confessions', 'Intimate'],
      gender: 'Female' as const,
    },
    {
      id: '6',
      title: 'Morning Affirmations',
      description: 'Positive affirmations to start your day with confidence',
      duration: 120,
      url: silentAudioUrl,
      user: users[2],
      likes: 35,
      isLiked: false,
      commentsCount: 0,
      createdAt: new Date('2024-02-10'),
      tags: ['Affirmations', 'Positive', 'Morning'],
      gender: 'Male' as const,
    },
    // New track from alex_voice - yuhu
    {
      id: 'alex-yuhu',
      title: 'yuhu',
      description: 'Eine fröhliche und energetische Aufnahme mit positiven Vibes und guter Laune. Perfekt für den Start in den Tag oder wenn man einen Energieschub braucht.',
      duration: 120, // 2 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 15,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(), // Today
      tags: ['Happy', 'Energy', 'Positive', 'Morning', 'Motivation', 'Good Vibes'],
      gender: 'Male' as const,
    },
    // New track from alex_voice - latest upload
    {
      id: 'alex-latest',
      title: 'Meine tiefgreifenden Gedanken über die Zukunft der digitalen Kommunikation und persönliche Erfahrungen',
      description: 'In dieser neuen Aufnahme teile ich meine aktuellen Überlegungen zur Entwicklung der digitalen Kommunikation. Ich spreche über die Auswirkungen von Social Media auf unsere zwischenmenschlichen Beziehungen und wie sich die Art, wie wir miteinander kommunizieren, in den letzten Jahren verändert hat. Dabei gehe ich auf verschiedene Aspekte ein, von der Bedeutung von Emojis bis hin zu den Herausforderungen der Online-Kommunikation. Ich teile auch persönliche Anekdoten aus meinem Alltag und erkläre, wie ich versuche, eine gesunde Balance zwischen digitaler und analoger Kommunikation zu finden.',
      duration: 300, // 5 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 22,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 60 * 1000), // 1 minute from now (newest)
      tags: ['Communication', 'Digital', 'Personal', 'Future', 'Social Media', 'Technology', 'Reflection'],
      gender: 'Male' as const,
    },
    // New track from alex_voice - fresh upload
    {
      id: 'alex-fresh',
      title: 'Meine neuesten Erkenntnisse über die Kunst des Storytellings und persönliche Erfahrungen',
      description: 'Hallo zusammen! In dieser brandneuen Aufnahme teile ich meine neuesten Erkenntnisse über die Kunst des Storytellings. Ich spreche über verschiedene Erzähltechniken, die ich in den letzten Monaten gelernt habe, und wie sie die Art, wie ich Geschichten erzähle, verändert haben. Dabei gehe ich auf die Bedeutung von Emotionen in Geschichten ein und erkläre, wie man eine fesselnde Erzählung aufbaut, die die Zuhörer von der ersten bis zur letzten Sekunde in ihren Bann zieht. Ich teile auch praktische Tipps und Tricks, die jeder anwenden kann, um seine eigenen Geschichten lebendiger und interessanter zu gestalten.',
      duration: 240, // 4 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 18,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 120 * 1000), // 2 minutes from now (newest)
      tags: ['Storytelling', 'Personal', 'Tips', 'Experience', 'Creative', 'Narrative', 'Art'],
      gender: 'Male' as const,
    },
    // Brand new track from alex_voice - just uploaded
    {
      id: 'alex-brand-new',
      title: 'Meine tiefgreifenden Gedanken über die Zukunft der digitalen Kommunikation und persönliche Erfahrungen',
      description: 'In dieser brandneuen Aufnahme teile ich meine tiefgreifenden Gedanken über die Zukunft der digitalen Kommunikation. Ich spreche über die Veränderungen, die ich in den letzten Jahren beobachtet habe, und wie sich die Art, wie wir miteinander kommunizieren, entwickelt hat. Dabei gehe ich auf die Vor- und Nachteile der digitalen Kommunikation ein und teile persönliche Erfahrungen aus meinem eigenen Leben.',
      duration: 300, // 5 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 30 * 1000), // 30 seconds from now (brand new)
      tags: ['Digital', 'Communication', 'Future', 'Personal', 'Thoughts', 'Technology', 'Experience'],
      gender: 'Male' as const,
    },
    // Super fresh and funny track from alex_voice
    {
      id: 'alex-funny-new',
      title: 'Warum Katzen besser programmieren können als ich',
      description: 'Eine humorvolle Aufnahme über meine Beobachtungen, wie meine Katze beim Tippen auf der Tastatur zufällig besseren Code produziert als ich nach stundenlangem Debugging. Inklusive praktischer Tipps, wie man seine Katze als Code-Reviewer einsetzt!',
      duration: 180, // 3 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 10 * 1000), // 10 seconds from now (super fresh)
      tags: ['Funny', 'Cats', 'Programming', 'Humor', 'Life', 'Tech', 'Animals'],
      gender: 'Male' as const,
    },
    // Another fresh and funny track from alex_voice
    {
      id: 'alex-funny-latest',
      title: 'Mein Kühlschrank hat mir heute das Leben gerettet',
      description: 'Eine wahre Geschichte über den Tag, an dem mein intelligenter Kühlschrank mir dabei geholfen hat, eine wichtige Deadline zu schaffen. Spoiler: Es ging um vergessene Pizza und eine geniale Idee um 3 Uhr morgens!',
      duration: 150, // 2.5 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 5 * 1000), // 5 seconds from now (ultra fresh)
      tags: ['Funny', 'Life', 'Fridge', 'Pizza', 'Deadline', 'Humor', 'Story'],
      gender: 'Male' as const,
    },
    // Brand new funny track from alex_voice
    {
      id: 'alex-funny-newest',
      title: 'Warum ich heute mit meiner Waschmaschine gesprochen habe',
      description: 'Eine humorvolle Aufnahme über den Moment, als ich gemerkt habe, dass ich tatsächlich mit meiner Waschmaschine rede, als wäre sie ein Familienmitglied. Inklusive Tipps, wie man eine gesunde Beziehung zu seinen Haushaltsgeräten aufbaut!',
      duration: 200, // 3.3 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 2 * 1000), // 2 seconds from now (super fresh)
      tags: ['Funny', 'Washing Machine', 'Life', 'Humor', 'Appliances', 'Story', 'Daily Life'],
      gender: 'Male' as const,
    },
    // Another brand new funny track from alex_voice
    {
      id: 'alex-funny-ultra-new',
      title: 'Mein Toaster hat heute eine wichtige Entscheidung getroffen',
      description: 'Eine wahre Geschichte über den Tag, an dem mein intelligenter Toaster beschlossen hat, dass mein Brot nicht geröstet werden sollte. Inklusive einer tiefgreifenden Diskussion über die Autonomie von Küchengeräten und warum mein Kaffee jetzt traurig ist.',
      duration: 180, // 3 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 1 * 1000), // 1 second from now (ultra fresh)
      tags: ['Funny', 'Toaster', 'Life', 'Humor', 'Appliances', 'Story', 'Kitchen'],
      gender: 'Male' as const,
    },
    // Brand new test post from alex_voice for notification testing
    {
      id: 'alex-test-notification',
      title: 'Test Benachrichtigung',
      description: 'Dieser Post dient zum Testen der Benachrichtigungsfunktion. Wenn du das siehst, funktioniert das System!',
      duration: 120, // 2 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 500), // 0.5 seconds from now (super fresh for testing)
      tags: ['Test', 'Notification', 'System', 'Debug'],
      gender: 'Male' as const,
    },
    // Fresh new post from alex_voice - right now!
    {
      id: 'alex-fresh-now',
      title: 'Neuer Post jetzt!',
      description: 'Dieser Post wurde gerade eben erstellt um die Benachrichtigungen zu testen.',
      duration: 90, // 1.5 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 100), // 0.1 seconds from now (ultra fresh)
      tags: ['Fresh', 'Now', 'Test', 'Notification'],
      gender: 'Male' as const,
    },
    // Another fresh post from alex_voice
    {
      id: 'alex-another-fresh',
      title: 'Noch ein neuer Post!',
      description: 'Alex_voice hat wieder etwas Neues gepostet um die Benachrichtigungen zu testen.',
      duration: 75, // 1.25 minutes
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 50), // 0.05 seconds from now (super fresh)
      tags: ['Another', 'Fresh', 'Post', 'Test'],
      gender: 'Male' as const,
    },
    // Brand new post from alex_voice - right now!
    {
      id: 'alex-latest-post',
      title: 'Neuester Post!',
      description: 'Alex_voice hat gerade eben den neuesten Post erstellt.',
      duration: 60, // 1 minute
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 25), // 0.025 seconds from now (ultra fresh)
      tags: ['Latest', 'Newest', 'Fresh', 'Now'],
      gender: 'Male' as const,
    },
    // Super fresh post from alex_voice - just posted!
    {
      id: 'alex-super-fresh',
      title: 'Super frischer Post!',
      description: 'Alex_voice hat gerade eben den super frischen Post erstellt.',
      duration: 45, // 45 seconds
      url: silentAudioUrl,
      user: users.find(u => u.username === 'alex_voice') || users[0],
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() + 10), // 0.01 seconds from now (super fresh)
      tags: ['Super', 'Fresh', 'Latest', 'New'],
      gender: 'Male' as const,
    },
    // Tracks from hollladiewaldfee
    {
      id: 'holla-1',
      title: 'Intime Flüsterstimme',
      description: 'Eine sanfte, beruhigende Stimme für entspannte Momente',
      duration: 195, // 3:15 Minuten
      url: silentAudioUrl,
      user: users.find(u => u.username === 'hollladiewaldfee') || users[3],
      likes: 23,
      isLiked: false,
      comments: [],
      commentsCount: 5,
      createdAt: new Date(Date.now() - 86400000), // 1 Tag alt
      tags: ['Whisper', 'Intimate', 'Relaxing', 'Soft'],
      gender: 'Female' as const,
    },
    {
      id: 'holla-2',
      title: 'Süße Träume',
      description: 'Eine warme, einladende Stimme zum Einschlafen',
      duration: 240, // 4 Minuten
      url: silentAudioUrl,
      user: users.find(u => u.username === 'hollladiewaldfee') || users[3],
      likes: 15,
      isLiked: false,
      comments: [],
      commentsCount: 3,
      createdAt: new Date(Date.now() - 172800000), // 2 Tage alt
      tags: ['Sleep', 'Dreams', 'Warm', 'Comforting'],
      gender: 'Female' as const,
    },
    {
      id: 'holla-3',
      title: 'Morgenritual',
      description: 'Ein sanfter Start in den Tag mit positiven Gedanken',
      duration: 180, // 3 Minuten
      url: silentAudioUrl,
      user: users.find(u => u.username === 'hollladiewaldfee') || users[3],
      likes: 4,
      isLiked: false,
      comments: [],
      commentsCount: 1,
      createdAt: new Date(Date.now() - 259200000), // 3 Tage alt
      tags: ['Morning', 'Positive', 'Ritual', 'Energy'],
      gender: 'Female' as const,
    },
  ];
  
  // Filter out all tracks by alex_voice (User ID '1')
  return [
    {
      id: '1',
      title: 'Whispered Secrets',
      description: 'Intimate whispers sharing personal thoughts and desires',
      duration: 180,
      url: silentAudioUrl,
      user: users[0],
      likes: 24,
      isLiked: false,
      comments: sampleComments.filter(c => c.trackId === '1'),
      commentsCount: 2,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      tags: ['Whisper', 'Soft', 'Intimate'],
      gender: 'Female' as const,
    },
    {
      id: '2',
      title: 'ASMR Rain Sounds',
      description: 'Gentle rain sounds with soft spoken words for relaxation',
      duration: 95,
      url: silentAudioUrl,
      user: users[1],
      likes: 18,
      isLiked: true,
      comments: sampleComments.filter(c => c.trackId === '2'),
      commentsCount: 1,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      tags: ['ASMR', 'Rain', 'Relaxing'],
      gender: 'Female' as const,
    },
    {
      id: '3',
      title: 'Deep Voice Meditation',
      description: 'Calming meditation guide with a deep, soothing voice',
      duration: 240,
      url: silentAudioUrl,
      user: users[2],
      likes: 42,
      isLiked: false,
      commentsCount: 0,
      createdAt: new Date('2024-02-13'),
      tags: ['Deep', 'Meditation', 'Calming'],
      gender: 'Male' as const,
    },
    {
      id: 'holla-1',
      title: 'Intime Flüsterstimme',
      description: 'Eine sanfte, beruhigende Stimme für entspannte Momente',
      duration: 195, // 3:15 Minuten
      url: silentAudioUrl,
      user: users.find(u => u.username === 'hollladiewaldfee') || users[3],
      likes: 23,
      isLiked: false,
      comments: [],
      commentsCount: 5,
      createdAt: new Date(Date.now() - 86400000), // 1 Tag alt
      tags: ['Whisper', 'Intimate', 'Relaxing', 'Soft'],
      gender: 'Female' as const,
    },
    {
      id: 'holla-2',
      title: 'Süße Träume',
      description: 'Eine warme, einladende Stimme zum Einschlafen',
      duration: 240, // 4 Minuten
      url: silentAudioUrl,
      user: users.find(u => u.username === 'hollladiewaldfee') || users[3],
      likes: 15,
      isLiked: false,
      comments: [],
      commentsCount: 3,
      createdAt: new Date(Date.now() - 172800000), // 2 Tage alt
      tags: ['Sleep', 'Dreams', 'Warm', 'Comforting'],
      gender: 'Female' as const,
    },
    {
      id: 'holla-3',
      title: 'Morgenritual',
      description: 'Ein sanfter Start in den Tag mit positiven Gedanken',
      duration: 180, // 3 Minuten
      url: silentAudioUrl,
      user: users.find(u => u.username === 'hollladiewaldfee') || users[3],
      likes: 4,
      isLiked: false,
      comments: [],
      commentsCount: 1,
      createdAt: new Date(Date.now() - 259200000), // 3 Tage alt
      tags: ['Morning', 'Positive', 'Ritual', 'Energy'],
      gender: 'Female' as const,
    },
  ].filter(track => track.user.id !== '1');
};

/**
 * Type guards for runtime validation
 */
export const isValidDate = (value: any): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isValidDateString = (value: any): value is string => {
  return typeof value === 'string' && !isNaN(Date.parse(value));
};

export const isValidTimestamp = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && value > 0;
};

/**
 * Data sanitization for User objects
 */
export const sanitizeUser = (user: any): User => {
  return {
    id: String(user?.id || ''),
    username: String(user?.username || 'Unknown User'),
    avatar: user?.avatar ? String(user.avatar) : undefined,
    totalLikes: typeof user?.totalLikes === 'number' ? user.totalLikes : 0,
    totalUploads: typeof user?.totalUploads === 'number' ? user.totalUploads : 0,
    bio: user?.bio ? String(user.bio) : undefined,
    createdAt: user?.createdAt || new Date()
  };
};

/**
 * Data sanitization for AudioTrack objects
 */
export const sanitizeAudioTrack = (track: any): AudioTrack => {
  return {
    id: String(track.id || ''),
    title: String(track.title || 'Untitled'),
    description: track.description ? String(track.description) : undefined,
    duration: typeof track.duration === 'number' ? track.duration : 0,
    url: String(track.url || ''),
    user: sanitizeUser(track.user),
    likes: typeof track.likes === 'number' ? track.likes : 0,
    isLiked: Boolean(track.isLiked),
    isBookmarked: Boolean(track.isBookmarked),
    comments: Array.isArray(track.comments) ? track.comments : undefined,
    commentsCount: typeof track.commentsCount === 'number' ? track.commentsCount : 0,
    plays: typeof track.plays === 'number' ? track.plays : 0,
    createdAt: track.createdAt || new Date(),
    waveformData: Array.isArray(track.waveformData) ? track.waveformData : undefined,
    tags: Array.isArray(track.tags) ? track.tags : undefined,
    gender: track.gender && ['Female', 'Male', 'Mixed'].includes(track.gender) ? track.gender : undefined
  };
};

/**
 * Debounce function for search and other real-time operations
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Convert file to base64 for storage
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};