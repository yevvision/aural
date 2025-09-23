import type { AudioTrack, User, Comment, ContentReport } from '../types';

// Vereinfachte zentrale Datenbank - nur die wichtigsten Funktionen
class CentralDatabaseSimple {
  private static instance: CentralDatabaseSimple;
  private data: {
    tracks: AudioTrack[];
    users: User[];
    comments: Comment[];
    reports: ContentReport[];
    likes: Map<string, Set<string>>; // trackId -> Set of userIds who liked
    bookmarks: Map<string, Set<string>>; // trackId -> Set of userIds who bookmarked
    commentLikes: Map<string, Set<string>>; // commentId -> Set of userIds who liked
    plays: Map<string, number>; // trackId -> play count
  } = {
    tracks: [],
    users: [],
    comments: [],
    reports: [],
    likes: new Map(),
    bookmarks: new Map(),
    commentLikes: new Map(),
    plays: new Map()
  };

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultData();
  }

  // Singleton Pattern
  public static getInstance(): CentralDatabaseSimple {
    if (!CentralDatabaseSimple.instance) {
      CentralDatabaseSimple.instance = new CentralDatabaseSimple();
    }
    return CentralDatabaseSimple.instance;
  }

  // GET: Tracks abrufen (mit User-spezifischen Daten)
  getAllTracks(currentUserId?: string): AudioTrack[] {
    
    const sortedTracks = [...this.data.tracks].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Bereichere Tracks mit User-spezifischen Daten
    if (currentUserId) {
      const enrichedTracks = sortedTracks.map(track => this.enrichTrackWithUserData(track, currentUserId));
      return enrichedTracks;
    }

    return sortedTracks;
  }

  // Hilfsmethode: Track mit User-spezifischen Daten bereichern
  private enrichTrackWithUserData(track: AudioTrack, userId: string): AudioTrack {
    const trackLikes = this.data.likes.get(track.id) || new Set();
    const trackBookmarks = this.data.bookmarks.get(track.id) || new Set();
    const playCount = this.data.plays.get(track.id) || 0;
    
    const isLiked = trackLikes.has(userId);
    const isBookmarked = trackBookmarks.has(userId);
    const likesCount = trackLikes.size;
    
    // Berechne commentsCount aus den Kommentaren im Track
    const commentsCount = track.comments ? track.comments.length : 0;
    
    return {
      ...track,
      isLiked,
      isBookmarked,
      likes: likesCount,
      commentsCount,
      plays: playCount
    };
  }

  // GET: Alle Benutzer abrufen
  getAllUsers(): User[] {
    return [...this.data.users];
  }

  getTrackById(id: string): AudioTrack | undefined {
    return this.data.tracks.find(track => track.id === id);
  }

  // ADD: Track hinzufügen
  addTrack(track: AudioTrack): boolean {
    console.log('➕ CentralDB Simple: addTrack()', { id: track.id, title: track.title, user: track.user.username });
    
    // Prüfe, ob Track bereits existiert
    const exists = this.data.tracks.some(t => t.id === track.id);
    if (exists) {
      console.log('⚠️ CentralDB Simple: Track bereits vorhanden:', track.id);
      return false;
    }

    // Füge Benutzer hinzu, falls er noch nicht existiert
    const userExists = this.data.users.some(u => u.id === track.user.id);
    if (!userExists) {
      console.log('👤 CentralDB Simple: Füge neuen Benutzer hinzu:', track.user.username);
      this.data.users.push(track.user);
    }

    // Füge Track hinzu
    this.data.tracks.push(track);
    this.saveToStorage();
    
    console.log('✅ CentralDB Simple: Track hinzugefügt. Gesamt:', this.data.tracks.length);
    return true;
  }

  // DELETE: Track löschen
  deleteTrack(trackId: string): boolean {
    console.log('🗑️ CentralDB Simple: deleteTrack()', trackId);
    
    const initialLength = this.data.tracks.length;
    this.data.tracks = this.data.tracks.filter(track => track.id !== trackId);
    
    const deleted = this.data.tracks.length < initialLength;
    if (deleted) {
      this.saveToStorage();
      console.log('✅ CentralDB Simple: Track gelöscht. Verbleibend:', this.data.tracks.length);
    } else {
      console.log('⚠️ CentralDB Simple: Track nicht gefunden:', trackId);
    }
    
    return deleted;
  }

  // UPDATE: Track aktualisieren
  updateTrack(trackId: string, updates: Partial<AudioTrack>): boolean {
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      return false;
    }

    this.data.tracks[trackIndex] = { ...this.data.tracks[trackIndex], ...updates };
    this.saveToStorage();
    
    return true;
  }

  // ADD: Kommentar zu Track hinzufügen
  addCommentToTrack(trackId: string, comment: any): boolean {
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      return false;
    }

    const track = this.data.tracks[trackIndex];
    
    // Initialisiere comments Array falls es nicht existiert
    if (!track.comments) {
      track.comments = [];
    }
    
    // Füge neuen Kommentar hinzu
    track.comments.push(comment);
    
    // Aktualisiere commentsCount
    track.commentsCount = track.comments.length;
    
    this.saveToStorage();
    
    return true;
  }

  // DELETE: Kommentar von Track löschen
  deleteCommentFromTrack(trackId: string, commentId: string): boolean {
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      return false;
    }

    const track = this.data.tracks[trackIndex];
    
    if (!track.comments) {
      return false;
    }
    
    const initialLength = track.comments.length;
    track.comments = track.comments.filter(comment => comment.id !== commentId);
    
    if (track.comments.length < initialLength) {
      // Aktualisiere commentsCount
      track.commentsCount = track.comments.length;
      this.saveToStorage();
      return true;
    } else {
      return false;
    }
  }

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

  // LIKE: Track liken/unliken
  toggleLike(trackId: string, userId: string): boolean {
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      return false;
    }

    // Hole oder erstelle Set für diesen Track
    if (!this.data.likes.has(trackId)) {
      this.data.likes.set(trackId, new Set());
    }
    
    const trackLikes = this.data.likes.get(trackId)!;
    const wasLiked = trackLikes.has(userId);
    
    if (wasLiked) {
      // Unlike
      trackLikes.delete(userId);
    } else {
      // Like
      trackLikes.add(userId);
    }
    
    this.saveToStorage();
    return true;
  }

  // BOOKMARK: Track bookmarken/unbookmarken
  toggleBookmark(trackId: string, userId: string): boolean {
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      return false;
    }

    // Hole oder erstelle Set für diesen Track
    if (!this.data.bookmarks.has(trackId)) {
      this.data.bookmarks.set(trackId, new Set());
    }
    
    const trackBookmarks = this.data.bookmarks.get(trackId)!;
    const wasBookmarked = trackBookmarks.has(userId);
    
    if (wasBookmarked) {
      // Unbookmark
      trackBookmarks.delete(userId);
    } else {
      // Bookmark
      trackBookmarks.add(userId);
    }
    
    this.saveToStorage();
    return true;
  }

  // PLAY: Play-Anzahl erhöhen
  incrementPlay(trackId: string): boolean {
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      return false;
    }

    // Erhöhe Play-Anzahl
    const currentPlays = this.data.plays.get(trackId) || 0;
    this.data.plays.set(trackId, currentPlays + 1);
    
    this.saveToStorage();
    return true;
  }

  // GET: User's liked tracks
  getUserLikedTracks(userId: string): AudioTrack[] {
    const likedTrackIds: string[] = [];
    this.data.likes.forEach((userIds, trackId) => {
      if (userIds.has(userId)) {
        likedTrackIds.push(trackId);
      }
    });
    
    return this.data.tracks
      .filter(track => likedTrackIds.includes(track.id))
      .map(track => this.enrichTrackWithUserData(track, userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // GET: User's bookmarked tracks
  getUserBookmarkedTracks(userId: string): AudioTrack[] {
    const bookmarkedTrackIds: string[] = [];
    this.data.bookmarks.forEach((userIds, trackId) => {
      if (userIds.has(userId)) {
        bookmarkedTrackIds.push(trackId);
      }
    });
    
    return this.data.tracks
      .filter(track => bookmarkedTrackIds.includes(track.id))
      .map(track => this.enrichTrackWithUserData(track, userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  // LIKE: Comment liken/unliken
  toggleCommentLike(commentId: string, userId: string): boolean {
    // Hole oder erstelle Set für diesen Kommentar
    if (!this.data.commentLikes.has(commentId)) {
      this.data.commentLikes.set(commentId, new Set());
    }
    
    const commentLikes = this.data.commentLikes.get(commentId)!;
    const wasLiked = commentLikes.has(userId);
    
    if (wasLiked) {
      // Unlike
      commentLikes.delete(userId);
    } else {
      // Like
      commentLikes.add(userId);
    }
    
    this.saveToStorage();
    return true;
  }

  // GET: Comment like status for user
  isCommentLikedByUser(commentId: string, userId: string): boolean {
    const commentLikes = this.data.commentLikes.get(commentId);
    return commentLikes ? commentLikes.has(userId) : false;
  }

  // GET: Comment like count
  getCommentLikeCount(commentId: string): number {
    const commentLikes = this.data.commentLikes.get(commentId);
    return commentLikes ? commentLikes.size : 0;
  }

  // =============================================================================
  // REPORTS
  // =============================================================================

  // GET: Alle Reports abrufen
  getAllReports(): ContentReport[] {
    return [...this.data.reports].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ADD: Neuen Report hinzufügen
  addReport(report: ContentReport): boolean {
    // Prüfe, ob Report bereits existiert
    const exists = this.data.reports.some(r => r.id === report.id);
    if (exists) {
      return false;
    }

    this.data.reports.push(report);
    this.saveToStorage();
    
    return true;
  }

  // UPDATE: Report-Status aktualisieren
  updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string): boolean {
    const reportIndex = this.data.reports.findIndex(report => report.id === reportId);
    if (reportIndex === -1) {
      return false;
    }

    this.data.reports[reportIndex] = { 
      ...this.data.reports[reportIndex], 
      status,
      reviewedAt: new Date(),
      reviewedBy
    };
    this.saveToStorage();
    
    return true;
  }

  // DELETE: Report löschen
  deleteReport(reportId: string): boolean {
    const initialLength = this.data.reports.length;
    this.data.reports = this.data.reports.filter(report => report.id !== reportId);
    
    const deleted = this.data.reports.length < initialLength;
    if (deleted) {
      this.saveToStorage();
    }
    
    return deleted;
  }

  // STATISTIKEN
  getStats() {
    const totalComments = this.data.tracks.reduce((sum, track) => {
      return sum + (track.comments ? track.comments.length : 0);
    }, 0);
    
    // Statistiken berechnet
    
    return {
      totalUsers: this.data.users.length,
      totalTracks: this.data.tracks.length,
      totalComments: totalComments,
      totalLikes: this.data.tracks.reduce((sum, track) => sum + track.likes, 0),
      totalFileSize: this.data.tracks.reduce((sum, track) => sum + (track.fileSize || 0), 0),
      totalReports: this.data.reports.length,
      pendingReports: this.data.reports.filter(r => r.status === 'pending').length
    };
  }

  // PERSISTIERUNG
  private saveToStorage(): void {
    try {
      // Konvertiere Maps zu Arrays für JSON-Serialisierung
      const likesArray = Array.from(this.data.likes.entries()).map(([trackId, userIds]) => ({
        trackId,
        userIds: Array.from(userIds)
      }));
      
      const bookmarksArray = Array.from(this.data.bookmarks.entries()).map(([trackId, userIds]) => ({
        trackId,
        userIds: Array.from(userIds)
      }));

      const commentLikesArray = Array.from(this.data.commentLikes.entries()).map(([commentId, userIds]) => ({
        commentId,
        userIds: Array.from(userIds)
      }));

      const playsArray = Array.from(this.data.plays.entries()).map(([trackId, count]) => ({
        trackId,
        count
      }));

      const dataToSave = {
        tracks: this.data.tracks,
        users: this.data.users,
        comments: this.data.comments,
        reports: this.data.reports,
        likes: likesArray,
        bookmarks: bookmarksArray,
        commentLikes: commentLikesArray,
        plays: playsArray,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('aural-central-database', JSON.stringify(dataToSave));
      // Data saved to storage
    } catch (error) {
      console.error('❌ CentralDB Simple: Fehler beim Speichern:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('aural-central-database');
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      
      // Konvertiere Arrays zurück zu Maps
      const likesMap = new Map<string, Set<string>>();
      if (parsed.likes && Array.isArray(parsed.likes)) {
        parsed.likes.forEach((item: { trackId: string; userIds: string[] }) => {
          if (item && item.trackId && Array.isArray(item.userIds)) {
            likesMap.set(item.trackId, new Set(item.userIds));
          }
        });
      }
      
      const bookmarksMap = new Map<string, Set<string>>();
      if (parsed.bookmarks && Array.isArray(parsed.bookmarks)) {
        parsed.bookmarks.forEach((item: { trackId: string; userIds: string[] }) => {
          if (item && item.trackId && Array.isArray(item.userIds)) {
            bookmarksMap.set(item.trackId, new Set(item.userIds));
          }
        });
      }

      const commentLikesMap = new Map<string, Set<string>>();
      if (parsed.commentLikes && Array.isArray(parsed.commentLikes)) {
        parsed.commentLikes.forEach((item: { commentId: string; userIds: string[] }) => {
          if (item && item.commentId && Array.isArray(item.userIds)) {
            commentLikesMap.set(item.commentId, new Set(item.userIds));
          }
        });
      }

      const playsMap = new Map<string, number>();
      if (parsed.plays && Array.isArray(parsed.plays)) {
        parsed.plays.forEach((item: { trackId: string; count: number }) => {
          if (item && item.trackId && typeof item.count === 'number') {
            playsMap.set(item.trackId, item.count);
          }
        });
      }

      this.data = {
        tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        likes: likesMap,
        bookmarks: bookmarksMap,
        commentLikes: commentLikesMap,
        plays: playsMap
      };
      
      // Data loaded from localStorage
    } catch (error) {
      console.error('❌ CentralDB Simple: Fehler beim Laden:', error);
      this.data = { tracks: [], users: [], comments: [], reports: [], likes: new Map(), bookmarks: new Map(), commentLikes: new Map(), plays: new Map() };
    }
  }

  // DEMO-DATEN
  private initializeDefaultData(): void {
    // Nur einmal initialisieren
    if (this.data.tracks.length > 0) {
      return;
    }

    // Holler die Waldfee Benutzer
    const hollaUser: User = {
      id: '4',
      username: 'holladiewaldfee',
      email: 'holla@example.com',
      totalLikes: 72,
      totalUploads: 3,
      createdAt: new Date('2024-01-05'),
      isVerified: true
    };

    // Aktueller Benutzer (yevvo)
    const currentUser: User = {
      id: 'user-1',
      username: 'yevvo',
      email: 'yevvo@example.com',
      totalLikes: 0,
      totalUploads: 0,
      createdAt: new Date('2024-01-10'),
      isVerified: false
    };

    // Demo-Tracks von Holler die Waldfee
    const demoTracks: AudioTrack[] = [
      {
        id: 'holla-1',
        title: 'Intime Flüsterstimme',
        description: 'Eine sanfte, beruhigende Stimme für entspannte Momente',
        duration: 195,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        user: hollaUser,
        likes: 23,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 2,
        plays: 0,
        createdAt: new Date(Date.now() - 86400000), // 1 Tag alt
        fileSize: 2560000,
        filename: 'intime_fluesterstimme.wav',
        tags: ['Soft', 'Female', 'ASMR'],
        gender: 'Female',
        comments: [
          {
            id: 'comment-1',
            content: 'Wunderschöne Stimme! 😍',
            user: currentUser,
            trackId: 'holla-1',
            createdAt: new Date(Date.now() - 3600000),
            likes: 2,
            isLiked: false
          },
          {
            id: 'comment-2', 
            content: 'Sehr entspannend, danke! 🙏',
            user: currentUser,
            trackId: 'holla-1',
            createdAt: new Date(Date.now() - 7200000),
            likes: 1,
            isLiked: false
          }
        ]
      },
      {
        id: 'holla-2',
        title: 'ASMR Entspannung',
        description: 'Sanfte Geräusche und Flüstern für tiefe Entspannung',
        duration: 420,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        user: hollaUser,
        likes: 18,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 1,
        plays: 0,
        createdAt: new Date(Date.now() - 172800000), // 2 Tage alt
        fileSize: 5120000,
        filename: 'asmr_entspannung.wav',
        tags: ['ASMR', 'Relaxing', 'Female'],
        gender: 'Female',
        comments: [
          {
            id: 'comment-3',
            content: 'Perfekt zum Einschlafen! 😴',
            user: currentUser,
            trackId: 'holla-2',
            createdAt: new Date(Date.now() - 86400000),
            likes: 3,
            isLiked: false
          }
        ]
      },
      {
        id: 'holla-3',
        title: 'Stille Momente',
        description: 'Eine ruhige, meditative Erfahrung',
        duration: 300,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        user: hollaUser,
        likes: 31,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 2,
        plays: 0,
        createdAt: new Date(Date.now() - 259200000), // 3 Tage alt
        fileSize: 3840000,
        filename: 'stille_momente.wav',
        tags: ['Meditation', 'Calm', 'Female'],
        gender: 'Female',
        comments: [
          {
            id: 'comment-4',
            content: 'So beruhigend! 🧘‍♀️',
            user: currentUser,
            trackId: 'holla-3',
            createdAt: new Date(Date.now() - 172800000),
            likes: 5,
            isLiked: false
          },
          {
            id: 'comment-5',
            content: 'Hilft mir beim Meditieren',
            user: currentUser,
            trackId: 'holla-3',
            createdAt: new Date(Date.now() - 259200000),
            likes: 2,
            isLiked: false
          }
        ]
      }
    ];

    // Daten hinzufügen
    this.data.users = [hollaUser, currentUser];
    this.data.tracks = demoTracks;
    this.data.comments = [];
    this.data.reports = [];
    
    this.saveToStorage();
  }

  // ADMIN-FUNKTIONEN
  reset(): void {
    this.data = { tracks: [], users: [], comments: [], reports: [], likes: new Map(), bookmarks: new Map(), commentLikes: new Map(), plays: new Map() };
    localStorage.removeItem('aural-central-database');
    this.initializeDefaultData();
  }
}

// Singleton-Export
export const centralDB = CentralDatabaseSimple.getInstance();
