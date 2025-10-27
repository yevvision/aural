// Core data types for the Aural app - German Specification Implementation

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  totalLikes: number;
  totalUploads: number;
  bio?: string;
  createdAt: Date;
  // German spec: Additional user fields
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  duration: number; // in seconds
  url: string;
  userId: string; // NEU: Redundante User-ID für bessere Performance
  user: User;
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean; // New bookmark functionality
  comments?: Comment[];
  commentsCount?: number;
  plays?: number; // New: Play count tracking
  createdAt: Date;
  waveformData?: number[]; // For visualizer
  tags?: string[];
  // German spec: Gender categorization (Wer ist zu hören?)
  gender?: 'Female' | 'Male' | 'Mixed' | 'Couple' | 'Diverse'; // Added 'Couple' and 'Diverse' options
  // German spec: Additional metadata
  filename?: string;
  fileSize?: number;
  format?: string;
  isPublic?: boolean;
  // Status für Warteschlange und Freigabe
  status?: 'active' | 'pending' | 'inactive' | 'approved' | 'rejected';
}

export interface Comment {
  id: string;
  content: string; // Einheitlich: content statt text
  user: User;
  trackId: string;
  createdAt: Date;
  // German spec: Additional comment features
  likes?: number;
  isLiked?: boolean;
  parentId?: string; // For reply threading
}

export interface PlaybackState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isExpanded: boolean;
  isLoading: boolean;
  isFinished: boolean;
  // German spec: Additional playback features
  playlist?: AudioTrack[];
  currentIndex?: number;
  repeatMode?: 'none' | 'one' | 'all';
  isShuffled?: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordedBlob: Blob | null;
  duration: number;
  isProcessing: boolean;
  // German spec: Additional recording features
  levelMeter?: number;
  recordingName?: string;
  hasPermission?: boolean;
  error?: string;
}

// German spec: Feed filter types
export interface FeedFilter {
  type: 'all' | 'following' | 'trending' | 'new' | 'bookmarked';
  label: string;
}

// German spec: Audio metadata for upload/recording
export interface AudioMetadata {
  title: string;
  description?: string;
  tags?: string[];
  gender?: 'Female' | 'Male' | 'Mixed';
  isPublic?: boolean;
}

// German spec: Registration flow types
export interface RegistrationData {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  isOver18: boolean;
  step: 1 | 2 | 3 | 4 | 5;
}

export interface RegistrationStep {
  id: number;
  title: string;
  description?: string;
  isComplete: boolean;
  isActive: boolean;
}

// German spec: Notification types for Comments/Likes page
export interface NotificationActivity {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'bookmark' | 'followed_user_upload' | 'upload' | 'upload_approved' | 'upload_rejected';
  user: User;
  trackId?: string;
  trackTitle?: string;
  commentText?: string;
  targetUserId?: string; // Für Benachrichtigungen, die an einen bestimmten User gerichtet sind
  createdAt: Date;
  isRead: boolean;
}

// German spec: User's own activity tracking
export interface UserActivity {
  id: string;
  type: 'my_like' | 'my_comment' | 'my_upload' | 'my_bookmark' | 'my_follow' | 'my_upload_rejected' | 'my_delete';
  trackId: string;
  trackTitle: string;
  trackUser?: User; // The owner of the track (for likes/comments/bookmarks)
  commentText?: string; // For comments
  followedUser?: User; // For follow activities
  createdAt: Date;
  isRead: boolean;
}

// German spec: Upload form validation
export interface UploadFormData {
  title: string;
  description?: string;
  gender: 'Female' | 'Male' | 'Mixed' | 'Couple'; // Added 'Couple' option
  tags: string[];
  file: File;
  customTags?: string;
}

// German spec: Validation errors
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// German spec: Search and filter types
export interface SearchFilters {
  gender?: 'Female' | 'Male' | 'Mixed' | 'Couple'; // Added 'Couple' option
  tags?: string[];
  duration?: 'short' | 'medium' | 'long'; // <2min, 2-10min, >10min
  dateRange?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'recent' | 'popular' | 'trending';
}

export interface SearchResult {
  tracks: AudioTrack[];
  users: User[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// German spec: Category/Tag system
export interface AudioCategory {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  color?: string;
}

// German spec: Predefined tags from specification
export const PREDEFINED_TAGS = [
  'Soft',
  'Female',
  'Male',
  'Toy',
  'ASMR',
  'Story',
  'Erotic',
  'Intimate',
  'Voice',
  'Whisper',
  'Roleplay'
] as const;

export type PredefinedTag = typeof PREDEFINED_TAGS[number];

// German spec: Navigation item types

// German spec: Context types for player visibility
export interface PlayerVisibilityContext {
  visibleAudioCardIds: Set<string>;
  setVisibleAudioCardIds: (update: (prev: Set<string>) => Set<string>) => void;
  expandedAudioCardId: string | null;
  setExpandedAudioCardId: (trackId: string | null) => void;
}

// German spec: Player queue management
export interface PlaybackQueue {
  tracks: AudioTrack[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  history: AudioTrack[];
}

// German spec: Audio analysis data
export interface AudioAnalysis {
  duration: number;
  peaks: number[];
  waveform: Float32Array;
  sampleRate: number;
  channels: number;
  bitRate?: number;
}

// German spec: File upload progress
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// German spec: User preferences
export interface UserPreferences {
  autoplay: boolean;
  volume: number;
  showWaveforms: boolean;
  notifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    newTracks: boolean;
  };
  privacy: {
    profileVisible: boolean;
    tracksVisible: boolean;
    allowComments: boolean;
  };
}

// German spec: App state for localStorage persistence
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  preferences: UserPreferences;
  recentSearches: string[];
  lastPlayed?: AudioTrack;
  feedFilter: FeedFilter['type'];
  version: string;
}

// German spec: Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

// German spec: Content report system
export interface ContentReport {
  id: string;
  type: 'comment' | 'recording' | 'description';
  targetId: string; // ID of the reported comment or track
  targetTitle?: string; // Title of the track or content of the comment
  reporterId: string;
  reporterUsername: string;
  reason?: string; // Optional text description
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

// German spec: API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: AppError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// =============================================================================
// NEUE DATENTYPEN FÜR V2 MIGRATION
// =============================================================================

// NEU: Notification System
export interface Notification {
  id: string;
  userId: string;
  type: 'UPLOAD_APPROVED' | 'NEW_COMMENT' | 'LIKE' | 'FOLLOW' | 'BOOKMARK' | 'COMMENT_LIKE';
  payload: Record<string, any>; // Kleines JSON für spezifische Daten
  createdAt: Date;
  readAt?: Date;
}

// NEU: Pending Upload Queue
export interface PendingUpload {
  id: string;
  uploadId: string; // Alias für id für Kompatibilität
  tempTrackId?: string; // Falls UI-Vorschau benötigt wird
  userId?: string; // Auch anonym möglich
  username?: string; // Username für Anzeige
  deviceId: string; // Aus First-Party-Token
  fileHash: string; // Zur 5×-Duplikat-Regel
  reason: 'rate' | 'duplicate5' | string; // Erweitert für verschiedene Gründe
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'pending_review';
  decidedAt?: Date;
  decidedBy?: string;
  // Zusätzliche Felder für Server-Integration
  filename?: string;
  originalName?: string;
  title?: string;
  description?: string;
  duplicateCount?: number;
  duration?: number;
  size?: number;
  mimeType?: string;
  url?: string;
  tags?: string[];
  gender?: string;
  source?: 'server' | 'localStorage'; // Für Debugging und Deduplizierung
}

// NEU: Follow System
export interface Follow {
  followerId: string;
  followeeId: string;
  createdAt: Date;
}

// NEU: Top Tags Cache
export interface TopTag {
  tag: string;
  count: number;
}

// NEU: Comment Like System
export interface CommentLike {
  commentId: string;
  userId: string;
  createdAt: Date;
}

// NEU: Play Tracking
export interface Play {
  trackId: string;
  count: number;
  lastPlayedAt: Date;
}

// UnicornStudio Type Definitions
declare global {
  interface Window {
    UnicornStudio: {
      create: (config: any) => any;
      destroy: (instance: any) => void;
      [key: string]: any;
    };
    unicornScenes: any;
  }
}