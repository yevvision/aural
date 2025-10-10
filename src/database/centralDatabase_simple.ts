import type { 
  AudioTrack, 
  User, 
  Comment, 
  ContentReport, 
  UserActivity, 
  NotificationActivity,
  Notification,
  PendingUpload,
  Follow,
  TopTag,
  CommentLike,
  Play
} from '../types';

// Vereinfachte zentrale Datenbank - nur die wichtigsten Funktionen
class CentralDatabaseSimple {
  private static instance: CentralDatabaseSimple;
  private data: {
    // Collections (Arrays)
    users: User[];
    tracks: AudioTrack[];
    comments: Comment[];
    reports: ContentReport[];
    notifications: Notification[];
    pendingUploads: PendingUpload[];
    follows: Follow[];
    commentLikes: CommentLike[];
    plays: Play[];
    
    // Relation Maps (für Performance)
    likes: Map<string, Set<string>>; // trackId -> Set of userIds who liked
    bookmarks: Map<string, Set<string>>; // trackId -> Set of userIds who bookmarked
    commentLikesMap: Map<string, Set<string>>; // commentId -> Set of userIds who liked
    playsMap: Map<string, number>; // trackId -> play count
    
    // User Activities & Notifications
    userActivities: UserActivity[]; // User's own activities
    notificationActivities: NotificationActivity[]; // Notifications from others
    
    // Cache
    topTags: TopTag[];
    
    // Metadata
    timestamp: string;
  } = {
    users: [],
    tracks: [],
    comments: [],
    reports: [],
    notifications: [],
    pendingUploads: [],
    follows: [],
    commentLikes: [],
    plays: [],
    likes: new Map(),
    bookmarks: new Map(),
    commentLikesMap: new Map(),
    playsMap: new Map(),
    userActivities: [],
    notificationActivities: [],
    topTags: [],
    timestamp: new Date().toISOString()
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
    const playCount = this.data.playsMap.get(track.id) || 0;
    
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

  // GET: User by ID
  getUserById(id: string): User | undefined {
    return this.data.users.find(user => user.id === id);
  }

  // UPDATE: User aktualisieren (global - alle Tracks, Kommentare, Aktivitäten und Benachrichtigungen werden aktualisiert)
  updateUser(userId: string, updates: Partial<User>): boolean {
    console.log('👤 CentralDB Simple: updateUser()', { userId, updates });
    
    const userIndex = this.data.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      console.log('⚠️ CentralDB Simple: User nicht gefunden:', userId);
      return false;
    }

    // Update user in users array
    this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
    
    // Update all tracks that reference this user
    this.data.tracks.forEach((track, index) => {
      if (track.userId === userId || track.user?.id === userId) {
        this.data.tracks[index] = {
          ...track,
          user: {
            ...track.user,
            ...updates
          }
        };
      }
      
      // Update all comments within tracks that reference this user
      if (track.comments && track.comments.length > 0) {
        track.comments.forEach((comment, commentIndex) => {
          if (comment.user?.id === userId) {
            this.data.tracks[index].comments[commentIndex] = {
              ...comment,
              user: {
                ...comment.user,
                ...updates
              }
            };
          }
        });
      }
    });
    
    // Update all comments that reference this user
    this.data.comments.forEach((comment, index) => {
      if (comment.user?.id === userId) {
        this.data.comments[index] = {
          ...comment,
          user: {
            ...comment.user,
            ...updates
          }
        };
      }
    });
    
    // Update all user activities that reference this user
    this.data.userActivities.forEach((activity, index) => {
      if (activity.trackUser?.id === userId) {
        this.data.userActivities[index] = {
          ...activity,
          trackUser: {
            ...activity.trackUser,
            ...updates
          }
        };
      }
    });
    
    // Update all notification activities that reference this user
    this.data.notificationActivities.forEach((notification, index) => {
      if (notification.user?.id === userId) {
        this.data.notificationActivities[index] = {
          ...notification,
          user: {
            ...notification.user,
            ...updates
          }
        };
      }
    });
    
    // Update all notifications that reference this user
    this.data.notifications.forEach((notification, index) => {
      if (notification.user?.id === userId) {
        this.data.notifications[index] = {
          ...notification,
          user: {
            ...notification.user,
            ...updates
          }
        };
      }
    });
    
    this.saveToStorage();
    console.log('✅ CentralDB Simple: User und alle zugehörigen Daten aktualisiert:', userId);
    
    return true;
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

    // Füge userId hinzu falls nicht vorhanden
    if (!track.userId) {
      track.userId = track.user.id;
    }

    // Füge Track hinzu
    this.data.tracks.push(track);
    
    // Upload-Aktivität wird erst nach Freigabe erstellt (nicht hier)
    // Das passiert in der Admin-Freigabe-Funktion
    
    this.saveToStorage();
    
    console.log('✅ CentralDB Simple: Track hinzugefügt. Gesamt:', this.data.tracks.length);
    return true;
  }

  // DELETE: Track löschen (mit allen zugehörigen Daten)
  deleteTrack(trackId: string): boolean {
    console.log('🗑️ CentralDB Simple: deleteTrack()', trackId);
    
    // Finde den Track vor dem Löschen
    const trackToDelete = this.data.tracks.find(track => track.id === trackId);
    
    const initialLength = this.data.tracks.length;
    this.data.tracks = this.data.tracks.filter(track => track.id !== trackId);
    
    const deleted = this.data.tracks.length < initialLength;
    if (deleted && trackToDelete) {
      // Erstelle User-Aktivität für das Löschen (vor dem Löschen der anderen Activities)
      const deleteActivity: UserActivity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'my_delete',
        trackId: trackId,
        trackTitle: trackToDelete.title,
        trackUser: trackToDelete.user,
        createdAt: new Date(),
        isRead: false
      };
      
      this.data.userActivities.unshift(deleteActivity);
      console.log('🔔 CentralDB: User-Aktivität (Delete) gespeichert:', deleteActivity.type);
      
      // Lösche alle zugehörigen Daten
      this.data.likes.delete(trackId);
      this.data.bookmarks.delete(trackId);
      this.data.playsMap.delete(trackId);
      
      // Lösche alle Kommentare zu diesem Track
      this.data.comments = this.data.comments.filter(comment => comment.trackId !== trackId);
      
      // Lösche alle anderen User Activities zu diesem Track (aber behalte die delete-Activity)
      this.data.userActivities = this.data.userActivities.filter(activity => 
        activity.trackId !== trackId || activity.type === 'my_delete'
      );
      
      // Lösche alle Notifications zu diesem Track
      this.data.notificationActivities = this.data.notificationActivities.filter(notification => notification.trackId !== trackId);
      
      this.saveToStorage();
      console.log('✅ CentralDB Simple: Track und alle zugehörigen Daten gelöscht. Verbleibend:', this.data.tracks.length);
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
    
    // Speichere User-Aktivität (eigener Kommentar)
    const userActivity: UserActivity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'my_comment',
      trackId: trackId,
      trackTitle: track.title,
      trackUser: track.user,
      commentText: comment.content,
      createdAt: new Date(),
      isRead: false
    };
    
    this.data.userActivities.unshift(userActivity);
    console.log('🔔 CentralDB: User-Aktivität (Comment) gespeichert:', userActivity.type);
    
    // Erstelle Benachrichtigung für den Track-Besitzer (falls nicht der User selbst)
    if (track.user.id !== comment.user.id) {
      const notification: NotificationActivity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'comment',
        user: comment.user,
        trackId: trackId,
        trackTitle: track.title,
        commentText: comment.content,
        targetUserId: track.user.id,
        createdAt: new Date(),
        isRead: false
      };
      
      this.data.notificationActivities.unshift(notification);
      console.log('🔔 CentralDB: Benachrichtigung (Comment) gespeichert für User:', track.user.id);
    }
    
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
      
      // Speichere User-Aktivität in der zentralen Datenbank
      const userActivity: UserActivity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'my_like',
        trackId: trackId,
        trackTitle: track.title,
        trackUser: track.user,
        createdAt: new Date(),
        isRead: false
      };
      
      this.data.userActivities.unshift(userActivity);
      console.log('🔔 CentralDB: User-Aktivität (Like) gespeichert:', userActivity.type);
      
      // Erstelle auch Benachrichtigung für den Track-Besitzer (falls nicht der User selbst)
      if (track.user.id !== userId) {
        const notification: NotificationActivity = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'like',
          user: this.data.users.find(u => u.id === userId) || track.user,
          trackId: trackId,
          trackTitle: track.title,
          targetUserId: track.user.id,
          createdAt: new Date(),
          isRead: false
        };
        
        this.data.notificationActivities.unshift(notification);
        console.log('🔔 CentralDB: Benachrichtigung (Like) gespeichert für User:', track.user.id);
      }
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
      
      // Speichere User-Aktivität in der zentralen Datenbank
      const userActivity: UserActivity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'my_bookmark',
        trackId: trackId,
        trackTitle: track.title,
        trackUser: track.user,
        createdAt: new Date(),
        isRead: false
      };
      
      this.data.userActivities.unshift(userActivity);
      console.log('🔔 CentralDB: User-Aktivität (Bookmark) gespeichert:', userActivity.type);
      
      // Erstelle auch Benachrichtigung für den Track-Besitzer (falls nicht der User selbst)
      if (track.user.id !== userId) {
        const notification: NotificationActivity = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'bookmark',
          user: this.data.users.find(u => u.id === userId) || track.user,
          trackId: trackId,
          trackTitle: track.title,
          targetUserId: track.user.id,
          createdAt: new Date(),
          isRead: false
        };
        
        this.data.notificationActivities.unshift(notification);
        console.log('🔔 CentralDB: Benachrichtigung (Bookmark) gespeichert für User:', track.user.id);
      }
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
    const currentPlays = this.data.playsMap.get(trackId) || 0;
    this.data.playsMap.set(trackId, currentPlays + 1);
    
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
    if (!this.data.commentLikesMap.has(commentId)) {
      this.data.commentLikesMap.set(commentId, new Set());
    }
    
    const commentLikes = this.data.commentLikesMap.get(commentId)!;
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
    const commentLikes = this.data.commentLikesMap.get(commentId);
    return commentLikes ? commentLikes.has(userId) : false;
  }

  // GET: Comment like count
  getCommentLikeCount(commentId: string): number {
    const commentLikes = this.data.commentLikesMap.get(commentId);
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

      const commentLikesArray = Array.from(this.data.commentLikesMap.entries()).map(([commentId, userIds]) => ({
        commentId,
        userIds: Array.from(userIds)
      }));

      const playsArray = Array.from(this.data.playsMap.entries()).map(([trackId, count]) => ({
        trackId,
        count
      }));

      const dataToSave = {
        // Collections
        tracks: this.data.tracks,
        users: this.data.users,
        comments: this.data.comments,
        reports: this.data.reports,
        notifications: this.data.notifications,
        pendingUploads: this.data.pendingUploads,
        follows: this.data.follows,
        commentLikes: this.data.commentLikes,
        plays: this.data.plays,
        
        // Maps
        likes: likesArray,
        bookmarks: bookmarksArray,
        commentLikesMap: commentLikesArray,
        playsMap: playsArray,
        
        // User Activities & Notifications
        userActivities: this.data.userActivities.map(activity => ({
          ...activity,
          createdAt: activity.createdAt instanceof Date ? activity.createdAt.toISOString() : activity.createdAt
        })),
        notificationActivities: this.data.notificationActivities.map(notification => ({
          ...notification,
          createdAt: notification.createdAt instanceof Date ? notification.createdAt.toISOString() : notification.createdAt
        })),
        
        // Cache
        topTags: this.data.topTags,
        
        // Metadata
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('aural-central-database', JSON.stringify(dataToSave));
      console.log('💾 CentralDB Simple: Daten gespeichert - UserActivities:', this.data.userActivities.length, 'Notifications:', this.data.notificationActivities.length);
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
      if (parsed.commentLikesMap && Array.isArray(parsed.commentLikesMap)) {
        parsed.commentLikesMap.forEach((item: { commentId: string; userIds: string[] }) => {
          if (item && item.commentId && Array.isArray(item.userIds)) {
            commentLikesMap.set(item.commentId, new Set(item.userIds));
          }
        });
      }

      const playsMap = new Map<string, number>();
      if (parsed.playsMap && Array.isArray(parsed.playsMap)) {
        parsed.playsMap.forEach((item: { trackId: string; count: number }) => {
          if (item && item.trackId && typeof item.count === 'number') {
            playsMap.set(item.trackId, item.count);
          }
        });
      }

      this.data = {
        // Collections
        tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        pendingUploads: Array.isArray(parsed.pendingUploads) ? parsed.pendingUploads : [],
        follows: Array.isArray(parsed.follows) ? parsed.follows : [],
        commentLikes: Array.isArray(parsed.commentLikes) ? parsed.commentLikes : [],
        plays: Array.isArray(parsed.plays) ? parsed.plays : [],
        
        // Maps
        likes: likesMap,
        bookmarks: bookmarksMap,
        commentLikesMap: commentLikesMap,
        playsMap: playsMap,
        
        // User Activities & Notifications
        userActivities: Array.isArray(parsed.userActivities) ? parsed.userActivities.map(activity => ({
          ...activity,
          createdAt: new Date(activity.createdAt)
        })) : [],
        notificationActivities: Array.isArray(parsed.notificationActivities) ? parsed.notificationActivities.map(notification => ({
          ...notification,
          createdAt: new Date(notification.createdAt)
        })) : [],
        
        // Cache
        topTags: Array.isArray(parsed.topTags) ? parsed.topTags : [],
        
        // Metadata
        timestamp: parsed.timestamp || new Date().toISOString()
      };
      
      console.log('📥 CentralDB Simple: Daten geladen - UserActivities:', this.data.userActivities.length, 'Notifications:', this.data.notificationActivities.length);
    } catch (error) {
      console.error('❌ CentralDB Simple: Fehler beim Laden:', error);
      this.data = { 
        tracks: [], users: [], comments: [], reports: [], notifications: [], pendingUploads: [], follows: [], commentLikes: [], plays: [],
        likes: new Map(), bookmarks: new Map(), commentLikesMap: new Map(), playsMap: new Map(),
        userActivities: [], notificationActivities: [], topTags: [], timestamp: new Date().toISOString()
      };
    }
  }

  // DEMO-DATEN
  private initializeDefaultData(): void {
    console.log('🔔 CentralDB Simple: initializeDefaultData() - Start');
    console.log('🔔 Current data:', {
      tracks: this.data.tracks.length,
      users: this.data.users.length,
      userActivities: this.data.userActivities.length,
      notifications: this.data.notificationActivities.length
    });
    
    // Prüfe ob Demo-Daten bereits existieren
    const hasTracks = this.data.tracks.length > 0;
    const hasActivities = this.data.userActivities.length > 0;
    const hasNotifications = this.data.notificationActivities.length > 0;
    
    console.log('🔔 Demo-Daten Status:', { hasTracks, hasActivities, hasNotifications });
    
    // Prüfe ob holladiewaldfee Tracks bereits vorhanden sind
    const hollaTracks = this.data.tracks.filter(track => track.user.username === 'holladiewaldfee');
    const hasHollaTracks = hollaTracks.length > 0;
    
    console.log('🔔 Holla-Tracks Status:', { hasHollaTracks, count: hollaTracks.length });
    
    // WICHTIG: Nur Demo-Daten hinzufügen, wenn KEINE Aktivitäten vorhanden sind
    // Das verhindert, dass Demo-Daten echte Aktivitäten überschreiben
    if (hasActivities && hasNotifications && hasHollaTracks) {
      console.log('🔔 Aktivitäten, Benachrichtigungen und Holla-Tracks bereits vorhanden, überspringe Demo-Daten');
      return;
    }

    // Holler die Waldfee Benutzer
    const hollaUser: User = {
      id: '4',
      username: 'holladiewaldfee',
      email: 'holla@example.com',
      totalLikes: 72,
      totalUploads: 13,
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
        userId: hollaUser.id,
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
        userId: hollaUser.id,
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
        userId: hollaUser.id,
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
      },
      // 10 weitere Tracks von holladiewaldfee
      {
        id: 'holla-4',
        title: 'Waldgeflüster',
        description: 'Mystische Klänge aus dem tiefen Wald',
        duration: 280,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 42,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 3,
        plays: 0,
        createdAt: new Date(Date.now() - 345600000), // 4 Tage alt
        fileSize: 3200000,
        filename: 'waldgefluester.wav',
        tags: ['Nature', 'Mystical', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-5',
        title: 'Mondlicht-Meditation',
        description: 'Entspannung unter dem silbernen Mondlicht',
        duration: 450,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 37,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 1,
        plays: 0,
        createdAt: new Date(Date.now() - 432000000), // 5 Tage alt
        fileSize: 4800000,
        filename: 'mondlicht_meditation.wav',
        tags: ['Meditation', 'Moonlight', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-6',
        title: 'Feenflüstern',
        description: 'Zauberhafte Stimmen aus dem Feenreich',
        duration: 320,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 55,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 4,
        plays: 0,
        createdAt: new Date(Date.now() - 518400000), // 6 Tage alt
        fileSize: 3600000,
        filename: 'feenfluestern.wav',
        tags: ['Fantasy', 'Magical', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-7',
        title: 'Regentropfen-Symphonie',
        description: 'Sanfte Regengeräusche mit melodischem Flüstern',
        duration: 380,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 29,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 2,
        plays: 0,
        createdAt: new Date(Date.now() - 604800000), // 7 Tage alt
        fileSize: 4200000,
        filename: 'regentropfen_symphonie.wav',
        tags: ['Rain', 'Nature', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-8',
        title: 'Traumreise',
        description: 'Eine geführte Reise in die Welt der Träume',
        duration: 520,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 48,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 3,
        plays: 0,
        createdAt: new Date(Date.now() - 691200000), // 8 Tage alt
        fileSize: 5600000,
        filename: 'traumreise.wav',
        tags: ['Dreams', 'Guided', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-9',
        title: 'Kristallklänge',
        description: 'Heilende Schwingungen aus reinen Kristallen',
        duration: 350,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 33,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 1,
        plays: 0,
        createdAt: new Date(Date.now() - 777600000), // 9 Tage alt
        fileSize: 3800000,
        filename: 'kristallklaenge.wav',
        tags: ['Healing', 'Crystals', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-10',
        title: 'Meeresrauschen',
        description: 'Beruhigende Wellen mit sanftem Flüstern',
        duration: 400,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 41,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 2,
        plays: 0,
        createdAt: new Date(Date.now() - 864000000), // 10 Tage alt
        fileSize: 4400000,
        filename: 'meeresrauschen.wav',
        tags: ['Ocean', 'Waves', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-11',
        title: 'Sternenlicht',
        description: 'Magische Klänge unter dem Sternenhimmel',
        duration: 290,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 36,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 1,
        plays: 0,
        createdAt: new Date(Date.now() - 950400000), // 11 Tage alt
        fileSize: 3300000,
        filename: 'sternlicht.wav',
        tags: ['Stars', 'Night', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-12',
        title: 'Garten der Stille',
        description: 'Friedliche Momente in einem geheimen Garten',
        duration: 360,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 44,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 3,
        plays: 0,
        createdAt: new Date(Date.now() - 1036800000), // 12 Tage alt
        fileSize: 4000000,
        filename: 'garten_der_stille.wav',
        tags: ['Garden', 'Peaceful', 'Female'],
        gender: 'Female',
        comments: []
      },
      {
        id: 'holla-13',
        title: 'Morgenröte',
        description: 'Sanfte Klänge zum Begrüßen des neuen Tages',
        duration: 310,
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        userId: hollaUser.id,
        user: hollaUser,
        likes: 27,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 2,
        plays: 0,
        createdAt: new Date(Date.now() - 1123200000), // 13 Tage alt
        fileSize: 3500000,
        filename: 'morgenroete.wav',
        tags: ['Dawn', 'Morning', 'Female'],
        gender: 'Female',
        comments: []
      }
    ];

    // Demo-Aktivitäten für User-1
    const demoActivities: UserActivity[] = [
      {
        id: 'activity-1',
        type: 'my_upload',
        trackUser: currentUser,
        trackId: 'user-1-track-1',
        trackTitle: 'Meine erste Aufnahme',
        createdAt: new Date(Date.now() - 3600000), // 1 Stunde alt
        isRead: false
      },
      {
        id: 'activity-2',
        type: 'my_like',
        trackUser: currentUser,
        trackId: 'holla-1',
        trackTitle: 'Intime Flüsterstimme',
        createdAt: new Date(Date.now() - 7200000), // 2 Stunden alt
        isRead: false
      }
    ];

    // Demo-Benachrichtigungen für User-1
    const demoNotifications: NotificationActivity[] = [
      {
        id: 'notification-1',
        type: 'like',
        user: hollaUser,
        trackId: 'user-1-track-1',
        trackTitle: 'Meine erste Aufnahme',
        targetUserId: 'user-1',
        createdAt: new Date(Date.now() - 1800000), // 30 Minuten alt
        isRead: false
      },
      {
        id: 'notification-2',
        type: 'comment',
        user: hollaUser,
        trackId: 'user-1-track-1',
        trackTitle: 'Meine erste Aufnahme',
        commentText: 'Tolle Aufnahme!',
        targetUserId: 'user-1',
        createdAt: new Date(Date.now() - 900000), // 15 Minuten alt
        isRead: false
      }
    ];

    // Daten hinzufügen (nur wenn sie noch nicht existieren)
    if (!hasTracks) {
      this.data.users = [hollaUser, currentUser];
      this.data.tracks = demoTracks;
      this.data.comments = [];
      this.data.reports = [];
      console.log('🔔 Tracks und Users hinzugefügt');
    } else if (!hasHollaTracks) {
      // Füge holladiewaldfee Tracks hinzu, auch wenn andere Tracks bereits vorhanden sind
      console.log('🔔 Füge holladiewaldfee Tracks zu bestehenden Tracks hinzu');
      
      // Füge holladiewaldfee Benutzer hinzu, falls nicht vorhanden
      const existingHollaUser = this.data.users.find(u => u.id === hollaUser.id);
      if (!existingHollaUser) {
        this.data.users.push(hollaUser);
        console.log('🔔 holladiewaldfee Benutzer hinzugefügt');
      }
      
      // Füge alle holladiewaldfee Tracks hinzu
      this.data.tracks.push(...demoTracks);
      console.log('🔔 holladiewaldfee Tracks hinzugefügt:', demoTracks.length);
    }
    
    if (!hasActivities) {
      this.data.userActivities = demoActivities;
      console.log('🔔 Demo-Aktivitäten hinzugefügt:', demoActivities.length);
    }
    
    if (!hasNotifications) {
      this.data.notificationActivities = demoNotifications;
      console.log('🔔 Demo-Benachrichtigungen hinzugefügt:', demoNotifications.length);
    }
    
    console.log('🔔 Finale Daten nach Initialisierung:', {
      tracks: this.data.tracks.length,
      users: this.data.users.length,
      userActivities: this.data.userActivities.length,
      notifications: this.data.notificationActivities.length
    });
    
    this.saveToStorage();
    console.log('🔔 CentralDB Simple: initializeDefaultData() - Abgeschlossen');
  }

  // =============================================================================
  // FOLLOW OPERATIONS
  // =============================================================================

  // FOLLOW: User folgen/entfolgen
  toggleFollow(followerId: string, targetUserId: string): boolean {
    const follower = this.data.users.find(u => u.id === followerId);
    const targetUser = this.data.users.find(u => u.id === targetUserId);
    
    if (!follower || !targetUser || followerId === targetUserId) {
      return false;
    }

    // Hier würde normalerweise eine Follow-Tabelle verwaltet werden
    // Für jetzt erstellen wir nur die Aktivitäten/Benachrichtigungen
    
    // Speichere User-Aktivität (eigener Follow)
    const userActivity: UserActivity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'my_follow',
      trackId: '',
      trackTitle: '',
      followedUser: targetUser,
      createdAt: new Date(),
      isRead: false
    };
    
    this.data.userActivities.unshift(userActivity);
    console.log('🔔 CentralDB: User-Aktivität (Follow) gespeichert:', userActivity.type);
    
    // Erstelle Benachrichtigung für den gefolgten User
    const notification: NotificationActivity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'follow',
      user: follower,
      trackId: undefined,
      trackTitle: undefined,
      targetUserId: targetUserId,
      createdAt: new Date(),
      isRead: false
    };
    
      this.data.notificationActivities.unshift(notification);
      console.log('🔔 CentralDB: Benachrichtigung (Follow) gespeichert für User:', targetUserId);
    
    this.saveToStorage();
    return true;
  }

  // =============================================================================
  // USER ACTIVITIES & NOTIFICATIONS
  // =============================================================================

  // GET: User's own activities
  getUserActivities(userId: string): UserActivity[] {
    // Da UserActivity kein userId Feld hat, filtern wir über trackUser
    const activities = this.data.userActivities.filter(activity => 
      activity.trackUser?.id === userId || activity.followedUser?.id === userId
    );
    console.log('🔔 getUserActivities:', userId, '->', activities.length, 'activities');
    return activities;
  }

  // GET: Notifications for a specific user
  getUserNotifications(userId: string): NotificationActivity[] {
    const notifications = this.data.notificationActivities.filter(notification => 
      !notification.targetUserId || notification.targetUserId === userId
    );
    console.log('🔔 getUserNotifications:', userId, '->', notifications.length, 'notifications');
    return notifications;
  }

  // ADD: User's own activity
  addUserActivity(activity: Omit<UserActivity, 'id' | 'createdAt'>): boolean {
    try {
      const newActivity: UserActivity = {
        ...activity,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        isRead: false
      };
      
      this.data.userActivities.unshift(newActivity);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to add user activity:', error);
      return false;
    }
  }

  // ADD: Notification for a user
  addNotification(notification: Omit<NotificationActivity, 'id' | 'createdAt'>): boolean {
    try {
      const newNotification: NotificationActivity = {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        isRead: false
      };
      
      this.data.notificationActivities.unshift(newNotification);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to add notification:', error);
      return false;
    }
  }

  // MARK: Activity as read
  markActivityAsRead(activityId: string): boolean {
    try {
      const activity = this.data.userActivities.find(a => a.id === activityId);
      if (activity && !activity.isRead) {
        activity.isRead = true;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark activity as read:', error);
      return false;
    }
  }

  // MARK: Notification as read
  markNotificationAsRead(notificationId: string): boolean {
    try {
      const notification = this.data.notificationActivities.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  // =============================================================================
  // ADMIN-FUNKTIONEN
  // =============================================================================

  // DELETE: Alle Benutzerinhalte löschen (außer Holler die Waldfee)
  deleteAllUserContent(): boolean {
    console.log('🧹 CentralDB Simple: deleteAllUserContent() - Lösche alle außer Holler die Waldfee');
    
    const hollaUserId = '4';
    const beforeCount = this.data.tracks.length;
    
    // Logge alle Tracks vor der Löschung
    console.log('🔍 Tracks vor Löschung:', this.data.tracks.map(t => ({ 
      id: t.id, 
      title: t.title, 
      user: t.user.username, 
      userId: t.user.id 
    })));
    
    // Behalte nur die ersten 3 Holler-Tracks
    const hollaTracks = this.data.tracks
      .filter(track => track.user.id === hollaUserId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 3);
    
    console.log('🔍 Holler-Tracks die behalten werden:', hollaTracks.map(t => ({ 
      id: t.id, 
      title: t.title, 
      user: t.user.username 
    })));
    
    this.data.tracks = hollaTracks;
    
    // Behalte nur Holler-Benutzer
    this.data.users = this.data.users.filter(user => user.id === hollaUserId);
    
    // Lösche alle anderen Daten
    this.data.comments = [];
    this.data.reports = [];
    this.data.notifications = [];
    this.data.pendingUploads = [];
    this.data.follows = [];
    this.data.commentLikes = [];
    this.data.plays = [];
    this.data.userActivities = [];
    this.data.notificationActivities = [];
    this.data.likes.clear();
    this.data.bookmarks.clear();
    this.data.commentLikesMap.clear();
    this.data.playsMap.clear();
    this.data.topTags = [];
    
    this.saveToStorage();
    
    const afterCount = this.data.tracks.length;
    console.log(`✅ CentralDB Simple: Löschung abgeschlossen. Vorher: ${beforeCount}, Nachher: ${afterCount}`);
    
    // Logge verbleibende Tracks
    console.log('🔍 Verbleibende Tracks:', this.data.tracks.map(t => ({ 
      id: t.id, 
      title: t.title, 
      user: t.user.username 
    })));
    
    return true;
  }

  // DELETE: Spezifischen Track löschen (für problematische Tracks)
  forceDeleteTrack(trackTitle: string, username: string): boolean {
    console.log(`🧹 CentralDB Simple: forceDeleteTrack() - Lösche Track "${trackTitle}" von "${username}"`);
    
    const beforeCount = this.data.tracks.length;
    
    // Finde den Track vor dem Löschen
    const trackToDelete = this.data.tracks.find(track => 
      track.title === trackTitle && track.user.username === username
    );
    
    // Finde und lösche den Track
    this.data.tracks = this.data.tracks.filter(track => 
      !(track.title === trackTitle && track.user.username === username)
    );
    
    const deleted = this.data.tracks.length < beforeCount;
    
    if (deleted && trackToDelete) {
      // Erstelle User-Aktivität für das Löschen
      const deleteActivity: UserActivity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'my_delete',
        trackId: trackToDelete.id,
        trackTitle: trackToDelete.title,
        trackUser: trackToDelete.user,
        createdAt: new Date(),
        isRead: false
      };
      
      this.data.userActivities.unshift(deleteActivity);
      console.log('🔔 CentralDB: User-Aktivität (Force Delete) gespeichert:', deleteActivity.type);
      
      this.saveToStorage();
      console.log(`✅ CentralDB Simple: Track "${trackTitle}" von "${username}" gelöscht. Verbleibend: ${this.data.tracks.length}`);
    } else {
      console.log(`⚠️ CentralDB Simple: Track "${trackTitle}" von "${username}" nicht gefunden`);
    }
    
    return deleted;
  }

  reset(): void {
    this.data = { 
      tracks: [], 
      users: [], 
      comments: [], 
      reports: [], 
      notifications: [],
      pendingUploads: [],
      follows: [],
      commentLikes: [],
      plays: [],
      likes: new Map(), 
      bookmarks: new Map(), 
      commentLikesMap: new Map(), 
      playsMap: new Map(),
      userActivities: [],
      notificationActivities: [],
      topTags: [],
      timestamp: new Date().toISOString()
    };
    localStorage.removeItem('aural-central-database');
    this.initializeDefaultData();
  }

  // Demo-Daten für Aktivitäten und Benachrichtigungen hinzufügen
  addDemoActivitiesAndNotifications(): void {
    console.log('🔔 addDemoActivitiesAndNotifications: Start');
    console.log('🔔 Current userActivities:', this.data.userActivities.length);
    console.log('🔔 Current notifications:', this.data.notificationActivities.length);
    
    // Prüfe ob bereits Demo-Daten existieren
    if (this.data.userActivities.length > 0 && this.data.notificationActivities.length > 0) {
      console.log('🔔 Demo-Daten bereits vorhanden, überspringe');
      return;
    }

    // Holler die Waldfee Benutzer (falls nicht vorhanden)
    const hollaUser = this.data.users.find(u => u.id === '4') || {
      id: '4',
      username: 'holladiewaldfee',
      email: 'holla@example.com',
      totalLikes: 72,
      totalUploads: 13,
      createdAt: new Date('2024-01-05'),
      isVerified: true
    };

    // Aktueller Benutzer (yevvo)
    const currentUser = this.data.users.find(u => u.id === 'user-1') || {
      id: 'user-1',
      username: 'yevvo',
      email: 'yevvo@example.com',
      totalLikes: 0,
      totalUploads: 0,
      createdAt: new Date('2024-01-10'),
      isVerified: false
    };

    // Demo-Aktivitäten für User-1
    const demoActivities: UserActivity[] = [
      {
        id: 'activity-1',
        type: 'my_upload',
        trackUser: currentUser,
        trackId: 'user-1-track-1',
        trackTitle: 'Meine erste Aufnahme',
        createdAt: new Date(Date.now() - 3600000), // 1 Stunde alt
        isRead: false
      },
      {
        id: 'activity-2',
        type: 'my_like',
        trackUser: currentUser,
        trackId: 'holla-1',
        trackTitle: 'Intime Flüsterstimme',
        createdAt: new Date(Date.now() - 7200000), // 2 Stunden alt
        isRead: false
      }
    ];

    // Demo-Benachrichtigungen für User-1
    const demoNotifications: NotificationActivity[] = [
      {
        id: 'notification-1',
        type: 'like',
        user: hollaUser,
        trackId: 'user-1-track-1',
        trackTitle: 'Meine erste Aufnahme',
        targetUserId: 'user-1',
        createdAt: new Date(Date.now() - 1800000), // 30 Minuten alt
        isRead: false
      },
      {
        id: 'notification-2',
        type: 'comment',
        user: hollaUser,
        trackId: 'user-1-track-1',
        trackTitle: 'Meine erste Aufnahme',
        commentText: 'Tolle Aufnahme!',
        targetUserId: 'user-1',
        createdAt: new Date(Date.now() - 900000), // 15 Minuten alt
        isRead: false
      }
    ];

    // Füge Demo-Daten hinzu
    if (this.data.userActivities.length === 0) {
      this.data.userActivities = demoActivities;
      console.log('🔔 Demo-Aktivitäten hinzugefügt:', demoActivities.length);
    }
    
    if (this.data.notificationActivities.length === 0) {
      this.data.notificationActivities = demoNotifications;
      console.log('🔔 Demo-Benachrichtigungen hinzugefügt:', demoNotifications.length);
    }
    
    console.log('🔔 Speichere in localStorage...');
    this.saveToStorage();
    console.log('🔔 Demo-Daten erfolgreich erstellt und gespeichert');
  }

  // FORCE: Demo-Daten erstellen (für Testing)
  forceCreateDemoData(): void {
    console.log('🔔 FORCE: Erstelle Demo-Daten...');
    this.data.userActivities = [];
    this.data.notificationActivities = [];
    this.addDemoActivitiesAndNotifications();
    
    // Lade Daten neu und prüfe
    setTimeout(() => {
      const activities = this.getUserActivities('user-1');
      const notifications = this.getUserNotifications('user-1');
      console.log('🔔 FORCE: Nach Erstellung - Activities:', activities.length, 'Notifications:', notifications.length);
    }, 100);
  }

  // FORCE: Holla-Tracks hinzufügen (auch wenn bereits Daten vorhanden sind)
  forceAddHollaTracks(): void {
    console.log('🔔 FORCE: Füge holladiewaldfee Tracks hinzu...');
    
    // Prüfe ob holladiewaldfee Tracks bereits vorhanden sind
    const existingHollaTracks = this.data.tracks.filter(track => track.user.username === 'holladiewaldfee');
    console.log('🔔 FORCE: Vorhandene Holla-Tracks:', existingHollaTracks.length);
    
    if (existingHollaTracks.length < 13) {
      // Erstelle die neuen Tracks direkt
      const hollaUser: User = {
        id: '4',
        username: 'holladiewaldfee',
        email: 'holla@example.com',
        totalLikes: 72,
        totalUploads: 13,
        createdAt: new Date('2024-01-05'),
        isVerified: true
      };

      // Erstelle die 10 neuen Tracks
      const newTracks: AudioTrack[] = [
        {
          id: 'holla-4',
          title: 'Waldgeflüster',
          description: 'Mystische Klänge aus dem tiefen Wald',
          duration: 280,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 42,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 3,
          plays: 0,
          createdAt: new Date(Date.now() - 345600000),
          fileSize: 3200000,
          filename: 'waldgefluester.wav',
          tags: ['Nature', 'Mystical', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-5',
          title: 'Mondlicht-Meditation',
          description: 'Entspannung unter dem silbernen Mondlicht',
          duration: 450,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 37,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 1,
          plays: 0,
          createdAt: new Date(Date.now() - 432000000),
          fileSize: 4800000,
          filename: 'mondlicht_meditation.wav',
          tags: ['Meditation', 'Moonlight', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-6',
          title: 'Feenflüstern',
          description: 'Zauberhafte Stimmen aus dem Feenreich',
          duration: 320,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 55,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 4,
          plays: 0,
          createdAt: new Date(Date.now() - 518400000),
          fileSize: 3600000,
          filename: 'feenfluestern.wav',
          tags: ['Fantasy', 'Magical', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-7',
          title: 'Regentropfen-Symphonie',
          description: 'Sanfte Regengeräusche mit melodischem Flüstern',
          duration: 380,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 29,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 2,
          plays: 0,
          createdAt: new Date(Date.now() - 604800000),
          fileSize: 4200000,
          filename: 'regentropfen_symphonie.wav',
          tags: ['Rain', 'Nature', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-8',
          title: 'Traumreise',
          description: 'Eine geführte Reise in die Welt der Träume',
          duration: 520,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 48,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 3,
          plays: 0,
          createdAt: new Date(Date.now() - 691200000),
          fileSize: 5600000,
          filename: 'traumreise.wav',
          tags: ['Dreams', 'Guided', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-9',
          title: 'Kristallklänge',
          description: 'Heilende Schwingungen aus reinen Kristallen',
          duration: 350,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 33,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 1,
          plays: 0,
          createdAt: new Date(Date.now() - 777600000),
          fileSize: 3800000,
          filename: 'kristallklaenge.wav',
          tags: ['Healing', 'Crystals', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-10',
          title: 'Meeresrauschen',
          description: 'Beruhigende Wellen mit sanftem Flüstern',
          duration: 400,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 41,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 2,
          plays: 0,
          createdAt: new Date(Date.now() - 864000000),
          fileSize: 4400000,
          filename: 'meeresrauschen.wav',
          tags: ['Ocean', 'Waves', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-11',
          title: 'Sternenlicht',
          description: 'Magische Klänge unter dem Sternenhimmel',
          duration: 290,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 36,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 1,
          plays: 0,
          createdAt: new Date(Date.now() - 950400000),
          fileSize: 3300000,
          filename: 'sternlicht.wav',
          tags: ['Stars', 'Night', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-12',
          title: 'Garten der Stille',
          description: 'Friedliche Momente in einem geheimen Garten',
          duration: 360,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 44,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 3,
          plays: 0,
          createdAt: new Date(Date.now() - 1036800000),
          fileSize: 4000000,
          filename: 'garten_der_stille.wav',
          tags: ['Garden', 'Peaceful', 'Female'],
          gender: 'Female',
          comments: []
        },
        {
          id: 'holla-13',
          title: 'Morgenröte',
          description: 'Sanfte Klänge zum Begrüßen des neuen Tages',
          duration: 310,
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          userId: hollaUser.id,
          user: hollaUser,
          likes: 27,
          isLiked: false,
          isBookmarked: false,
          commentsCount: 2,
          plays: 0,
          createdAt: new Date(Date.now() - 1123200000),
          fileSize: 3500000,
          filename: 'morgenroete.wav',
          tags: ['Dawn', 'Morning', 'Female'],
          gender: 'Female',
          comments: []
        }
      ];

      // Füge nur die neuen Tracks hinzu, die noch nicht vorhanden sind
      const tracksToAdd = newTracks.filter(newTrack => 
        !this.data.tracks.some(existingTrack => existingTrack.id === newTrack.id)
      );

      if (tracksToAdd.length > 0) {
        // Füge holladiewaldfee Benutzer hinzu, falls nicht vorhanden
        const existingHollaUser = this.data.users.find(u => u.id === hollaUser.id);
        if (!existingHollaUser) {
          this.data.users.push(hollaUser);
          console.log('🔔 FORCE: holladiewaldfee Benutzer hinzugefügt');
        }

        // Füge neue Tracks hinzu
        this.data.tracks.push(...tracksToAdd);
        console.log('🔔 FORCE: Neue Holla-Tracks hinzugefügt:', tracksToAdd.length);
        
        // Speichere in localStorage
        this.saveToStorage();
      } else {
        console.log('🔔 FORCE: Alle Holla-Tracks bereits vorhanden');
      }
    } else {
      console.log('🔔 FORCE: Alle 13 Holla-Tracks bereits vorhanden');
    }
    
    // Zeige aktuelle Anzahl der Tracks
    const allHollaTracks = this.data.tracks.filter(track => track.user.username === 'holladiewaldfee');
    console.log('🔔 FORCE: Gesamt Holla-Tracks:', allHollaTracks.length);
  }

  // DEBUG: Zeige alle Daten
  debugShowAllData(): void {
    console.log('🔍 DEBUG: Alle Daten in der Datenbank:');
    console.log('  - Users:', this.data.users.length);
    console.log('  - Tracks:', this.data.tracks.length);
    console.log('  - UserActivities:', this.data.userActivities.length);
    console.log('  - Notifications:', this.data.notificationActivities.length);
    console.log('  - User-1 Activities:', this.getUserActivities('user-1').length);
    console.log('  - User-1 Notifications:', this.getUserNotifications('user-1').length);
  }

  // RESET: Datenbank komplett zurücksetzen
  resetDatabase(): void {
    console.log('🔄 CentralDB: Reset Database...');
    this.data = { 
      tracks: [], 
      users: [], 
      comments: [], 
      reports: [], 
      notifications: [],
      pendingUploads: [],
      follows: [],
      commentLikes: [],
      plays: [],
      likes: new Map(), 
      bookmarks: new Map(), 
      commentLikesMap: new Map(), 
      playsMap: new Map(),
      userActivities: [],
      notificationActivities: [],
      topTags: [],
      timestamp: new Date().toISOString()
    };
    localStorage.removeItem('aural-central-database');
    this.initializeDefaultData();
    console.log('🔄 CentralDB: Reset abgeschlossen');
  }

  // TEST: Teste Persistierung
  testPersistence(): void {
    console.log('🧪 CentralDB: Teste Persistierung...');
    
    // Erstelle Test-Aktivität
    const testActivity = {
      id: 'test-activity-' + Date.now(),
      type: 'my_like' as const,
      userId: 'user-1',
      trackId: 'test-track',
      trackTitle: 'Test Track',
      trackUser: { id: 'user-2', username: 'test-user' } as any,
      createdAt: new Date(),
      isRead: false
    };
    
    // Füge Test-Aktivität hinzu
    this.data.userActivities.unshift(testActivity);
    console.log('🧪 Test-Aktivität hinzugefügt:', testActivity.id);
    
    // Speichere in localStorage
    this.saveToStorage();
    console.log('🧪 Daten gespeichert');
    
    // Lade aus localStorage
    this.loadFromStorage();
    console.log('🧪 Daten geladen - UserActivities:', this.data.userActivities.length);
    
    // Prüfe ob Test-Aktivität noch da ist
    const foundActivity = this.data.userActivities.find(a => a.id === testActivity.id);
    if (foundActivity) {
      console.log('✅ Persistierung funktioniert!');
    } else {
      console.log('❌ Persistierung funktioniert NICHT!');
    }
  }
}

// Singleton-Export
export const centralDB = CentralDatabaseSimple.getInstance();
