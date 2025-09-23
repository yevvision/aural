import type { 
  AudioTrack, 
  User, 
  Comment, 
  ContentReport, 
  Notification, 
  PendingUpload, 
  Follow, 
  TopTag,
  CommentLike,
  Play
} from '../types';

// Zentrale Datenbank V2 - Erweiterte Version mit allen neuen Features
class CentralDatabaseV2 {
  private static instance: CentralDatabaseV2;
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
    likes: Map<string, Set<string>>; // trackId -> Set of userIds
    bookmarks: Map<string, Set<string>>; // trackId -> Set of userIds
    commentLikesMap: Map<string, Set<string>>; // commentId -> Set of userIds
    playsMap: Map<string, number>; // trackId -> play count
    
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
    topTags: [],
    timestamp: new Date().toISOString()
  };

  private constructor() {
    console.log('🏗️ CentralDB V2: Konstruktor aufgerufen');
    this.loadFromStorage();
    this.migrateFromV1();
    this.initializeDefaultData();
    console.log('✅ CentralDB V2: Initialisierung abgeschlossen');
  }

  // Singleton Pattern
  public static getInstance(): CentralDatabaseV2 {
    if (!CentralDatabaseV2.instance) {
      CentralDatabaseV2.instance = new CentralDatabaseV2();
    }
    return CentralDatabaseV2.instance;
  }

  // =============================================================================
  // MIGRATION VON V1 ZU V2
  // =============================================================================

  private migrateFromV1(): void {
    try {
      const v1Data = localStorage.getItem('aural-central-database');
      if (!v1Data) {
        console.log('📭 CentralDB V2: Keine V1-Daten gefunden - frische Installation');
        return;
      }

      const parsed = JSON.parse(v1Data);
      console.log('🔄 CentralDB V2: Migriere von V1...');

      // Migriere Tracks und füge userId hinzu
      if (parsed.tracks && Array.isArray(parsed.tracks)) {
        this.data.tracks = parsed.tracks.map((track: any) => ({
          ...track,
          userId: track.user?.id || track.userId || 'unknown',
          tags: Array.isArray(track.tags) ? track.tags : [],
          createdAt: new Date(track.createdAt)
        }));
      }

      // Migriere Users
      if (parsed.users && Array.isArray(parsed.users)) {
        this.data.users = parsed.users.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }));
      }

      // Migriere Comments
      if (parsed.comments && Array.isArray(parsed.comments)) {
        this.data.comments = parsed.comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        }));
      }

      // Migriere Reports
      if (parsed.reports && Array.isArray(parsed.reports)) {
        this.data.reports = parsed.reports.map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          reviewedAt: report.reviewedAt ? new Date(report.reviewedAt) : undefined
        }));
      }

      // Migriere Likes Map
      if (parsed.likes && Array.isArray(parsed.likes)) {
        parsed.likes.forEach((item: { trackId: string; userIds: string[] }) => {
          if (item && item.trackId && Array.isArray(item.userIds)) {
            this.data.likes.set(item.trackId, new Set(item.userIds));
          }
        });
      }

      // Migriere Bookmarks Map
      if (parsed.bookmarks && Array.isArray(parsed.bookmarks)) {
        parsed.bookmarks.forEach((item: { trackId: string; userIds: string[] }) => {
          if (item && item.trackId && Array.isArray(item.userIds)) {
            this.data.bookmarks.set(item.trackId, new Set(item.userIds));
          }
        });
      }

      // Initialisiere neue Collections
      this.data.notifications = [];
      this.data.pendingUploads = [];
      this.data.follows = [];
      this.data.commentLikes = [];
      this.data.plays = [];
      this.data.commentLikesMap = new Map();
      this.data.playsMap = new Map();
      this.data.topTags = [];

      // Berechne Top Tags
      this.recomputeTopTags();

      this.saveToStorage();
      console.log('✅ CentralDB V2: Migration abgeschlossen');
    } catch (error) {
      console.error('❌ CentralDB V2: Fehler bei Migration:', error);
    }
  }

  // =============================================================================
  // TRACK OPERATIONEN
  // =============================================================================

  getAllTracks(currentUserId?: string): AudioTrack[] {
    console.log('📚 CentralDB V2: getAllTracks() - Anzahl:', this.data.tracks.length);
    return [...this.data.tracks].map(track => this.enrichTrackWithUserData(track, currentUserId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private enrichTrackWithUserData(track: AudioTrack, currentUserId?: string): AudioTrack {
    const enrichedTrack = { ...track };
    
    if (currentUserId) {
      // Like Status
      const trackLikes = this.data.likes.get(track.id) || new Set();
      enrichedTrack.isLiked = trackLikes.has(currentUserId);
      enrichedTrack.likes = trackLikes.size;
      
      // Bookmark Status
      const trackBookmarks = this.data.bookmarks.get(track.id) || new Set();
      enrichedTrack.isBookmarked = trackBookmarks.has(currentUserId);
    }
    
    return enrichedTrack;
  }

  getTrackById(id: string): AudioTrack | undefined {
    return this.data.tracks.find(track => track.id === id);
  }

  addTrack(track: AudioTrack): boolean {
    console.log('➕ CentralDB V2: addTrack()', { id: track.id, title: track.title, user: track.user.username });
    
    // Validierung
    if (!track.title || !track.url || track.duration <= 0) {
      console.log('⚠️ CentralDB V2: Ungültige Track-Daten');
      return false;
    }

    // Prüfe, ob Track bereits existiert
    const exists = this.data.tracks.some(t => t.id === track.id);
    if (exists) {
      console.log('⚠️ CentralDB V2: Track bereits vorhanden:', track.id);
      return false;
    }

    // Füge userId hinzu falls nicht vorhanden
    if (!track.userId) {
      track.userId = track.user.id;
    }

    // Füge Benutzer hinzu, falls er noch nicht existiert
    const userExists = this.data.users.some(u => u.id === track.user.id);
    if (!userExists) {
      console.log('👤 CentralDB V2: Füge neuen Benutzer hinzu:', track.user.username);
      this.data.users.push(track.user);
    }

    // Füge Track hinzu
    this.data.tracks.push(track);
    
    // Berechne Top Tags neu
    this.recomputeTopTags();
    
    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Track hinzugefügt. Gesamt:', this.data.tracks.length);
    return true;
  }

  deleteTrack(trackId: string): boolean {
    console.log('🗑️ CentralDB V2: deleteTrack()', trackId);
    
    const initialLength = this.data.tracks.length;
    this.data.tracks = this.data.tracks.filter(track => track.id !== trackId);
    
    const deleted = this.data.tracks.length < initialLength;
    if (deleted) {
      // Entferne auch aus Maps
      this.data.likes.delete(trackId);
      this.data.bookmarks.delete(trackId);
      this.data.playsMap.delete(trackId);
      
      // Berechne Top Tags neu
      this.recomputeTopTags();
      
      this.saveToStorage();
      console.log('✅ CentralDB V2: Track gelöscht. Verbleibend:', this.data.tracks.length);
    } else {
      console.log('⚠️ CentralDB V2: Track nicht gefunden:', trackId);
    }
    
    return deleted;
  }

  updateTrack(trackId: string, updates: Partial<AudioTrack>): boolean {
    console.log('🔄 CentralDB V2: updateTrack()', trackId, Object.keys(updates));
    
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      console.log('⚠️ CentralDB V2: Track nicht gefunden für Update:', trackId);
      return false;
    }

    this.data.tracks[trackIndex] = { ...this.data.tracks[trackIndex], ...updates };
    
    // Berechne Top Tags neu falls Tags geändert wurden
    if (updates.tags) {
      this.recomputeTopTags();
    }
    
    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Track aktualisiert:', trackId);
    return true;
  }

  // =============================================================================
  // USER OPERATIONEN
  // =============================================================================

  getAllUsers(): User[] {
    console.log('👥 CentralDB V2: getAllUsers()');
    
    const userMap = new Map<string, User>();
    
    // 1. Starte mit allen gespeicherten Benutzern
    this.data.users.forEach(user => {
      userMap.set(user.id, { ...user });
    });
    
    // 2. Füge Benutzer aus Tracks hinzu (falls sie nicht in der users-Liste sind)
    this.data.tracks.forEach(track => {
      if (!userMap.has(track.user.id)) {
        console.log('👥 CentralDB V2: Benutzer aus Track hinzugefügt:', track.user.username);
        userMap.set(track.user.id, { ...track.user });
      }
    });
    
    // 3. Aktualisiere Statistiken für alle Benutzer
    userMap.forEach((user, userId) => {
      const userTracks = this.data.tracks.filter(t => t.userId === userId);
      const totalLikes = userTracks.reduce((sum, t) => sum + t.likes, 0);
      
      user.totalUploads = userTracks.length;
      user.totalLikes = totalLikes;
    });
    
    const users = Array.from(userMap.values());
    console.log('👥 CentralDB V2: Finale Benutzer:', users.length);
    return users;
  }

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

  toggleLike(trackId: string, userId: string): boolean {
    console.log('❤️ CentralDB V2: toggleLike()', trackId, userId);
    
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      console.log('⚠️ CentralDB V2: Track nicht gefunden für Like:', trackId);
      return false;
    }

    // Initialisiere Likes-Set falls nicht vorhanden
    if (!this.data.likes.has(trackId)) {
      this.data.likes.set(trackId, new Set());
    }

    const trackLikes = this.data.likes.get(trackId)!;
    const wasLiked = trackLikes.has(userId);
    
    if (wasLiked) {
      trackLikes.delete(userId);
      console.log('💔 CentralDB V2: Like entfernt');
    } else {
      trackLikes.add(userId);
      console.log('❤️ CentralDB V2: Like hinzugefügt');
    }

    // Aktualisiere Like-Count im Track
    track.likes = trackLikes.size;
    
    this.saveToStorage();
    return true;
  }

  toggleBookmark(trackId: string, userId: string): boolean {
    console.log('🔖 CentralDB V2: toggleBookmark()', trackId, userId);
    
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      console.log('⚠️ CentralDB V2: Track nicht gefunden für Bookmark:', trackId);
      return false;
    }

    // Initialisiere Bookmarks-Set falls nicht vorhanden
    if (!this.data.bookmarks.has(trackId)) {
      this.data.bookmarks.set(trackId, new Set());
    }

    const trackBookmarks = this.data.bookmarks.get(trackId)!;
    const wasBookmarked = trackBookmarks.has(userId);
    
    if (wasBookmarked) {
      trackBookmarks.delete(userId);
      console.log('🔓 CentralDB V2: Bookmark entfernt');
    } else {
      trackBookmarks.add(userId);
      console.log('🔖 CentralDB V2: Bookmark hinzugefügt');
    }

    this.saveToStorage();
    return true;
  }

  getUserLikedTracks(userId: string): AudioTrack[] {
    const likedTrackIds: string[] = [];
    this.data.likes.forEach((userIds, trackId) => {
      if (userIds.has(userId)) {
        likedTrackIds.push(trackId);
      }
    });
    
    return this.data.tracks
      .filter(track => likedTrackIds.includes(track.id))
      .map(track => this.enrichTrackWithUserData(track, userId));
  }

  getUserBookmarkedTracks(userId: string): AudioTrack[] {
    const bookmarkedTrackIds: string[] = [];
    this.data.bookmarks.forEach((userIds, trackId) => {
      if (userIds.has(userId)) {
        bookmarkedTrackIds.push(trackId);
      }
    });
    
    return this.data.tracks
      .filter(track => bookmarkedTrackIds.includes(track.id))
      .map(track => this.enrichTrackWithUserData(track, userId));
  }

  // =============================================================================
  // FOLLOW SYSTEM
  // =============================================================================

  follow(followerId: string, followeeId: string): boolean {
    console.log('👥 CentralDB V2: follow()', followerId, '->', followeeId);
    
    if (followerId === followeeId) {
      console.log('⚠️ CentralDB V2: User kann sich nicht selbst folgen');
      return false;
    }

    // Prüfe, ob Follow bereits existiert
    const exists = this.data.follows.some(f => f.followerId === followerId && f.followeeId === followeeId);
    if (exists) {
      console.log('⚠️ CentralDB V2: Follow bereits vorhanden');
      return false;
    }

    const follow: Follow = {
      followerId,
      followeeId,
      createdAt: new Date()
    };

    this.data.follows.push(follow);
    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Follow hinzugefügt');
    return true;
  }

  unfollow(followerId: string, followeeId: string): boolean {
    console.log('👥 CentralDB V2: unfollow()', followerId, '->', followeeId);
    
    const initialLength = this.data.follows.length;
    this.data.follows = this.data.follows.filter(f => !(f.followerId === followerId && f.followeeId === followeeId));
    
    const unfollowed = this.data.follows.length < initialLength;
    if (unfollowed) {
      this.saveToStorage();
      console.log('✅ CentralDB V2: Unfollow erfolgreich');
    } else {
      console.log('⚠️ CentralDB V2: Follow nicht gefunden');
    }
    
    return unfollowed;
  }

  getFollowers(userId: string): User[] {
    const followerIds = this.data.follows
      .filter(f => f.followeeId === userId)
      .map(f => f.followerId);
    
    return this.data.users.filter(user => followerIds.includes(user.id));
  }

  getFollowing(userId: string): User[] {
    const followingIds = this.data.follows
      .filter(f => f.followerId === userId)
      .map(f => f.followeeId);
    
    return this.data.users.filter(user => followingIds.includes(user.id));
  }

  isFollowing(followerId: string, followeeId: string): boolean {
    return this.data.follows.some(f => f.followerId === followerId && f.followeeId === followeeId);
  }

  // =============================================================================
  // PENDING UPLOADS
  // =============================================================================

  addPendingUpload(pending: Omit<PendingUpload, 'id' | 'createdAt'>): PendingUpload {
    console.log('⏳ CentralDB V2: addPendingUpload()', pending.reason);
    
    const newPending: PendingUpload = {
      ...pending,
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.data.pendingUploads.push(newPending);
    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Pending Upload hinzugefügt:', newPending.id);
    return newPending;
  }

  listPendingUploads(): PendingUpload[] {
    return [...this.data.pendingUploads].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  approvePendingUpload(pendingId: string, adminId: string): boolean {
    console.log('✅ CentralDB V2: approvePendingUpload()', pendingId);
    
    const pending = this.data.pendingUploads.find(p => p.id === pendingId);
    if (!pending) {
      console.log('⚠️ CentralDB V2: Pending Upload nicht gefunden:', pendingId);
      return false;
    }

    pending.status = 'approved';
    pending.decidedAt = new Date();
    pending.decidedBy = adminId;

    // Sende Notification an User falls vorhanden
    if (pending.userId) {
      this.addNotification({
        userId: pending.userId,
        type: 'UPLOAD_APPROVED',
        payload: { trackId: pending.tempTrackId, title: 'Upload freigegeben' }
      });
    }

    this.saveToStorage();
    console.log('✅ CentralDB V2: Pending Upload freigegeben');
    return true;
  }

  rejectPendingUpload(pendingId: string, adminId: string, note?: string): boolean {
    console.log('❌ CentralDB V2: rejectPendingUpload()', pendingId);
    
    const pending = this.data.pendingUploads.find(p => p.id === pendingId);
    if (!pending) {
      console.log('⚠️ CentralDB V2: Pending Upload nicht gefunden:', pendingId);
      return false;
    }

    pending.status = 'rejected';
    pending.decidedAt = new Date();
    pending.decidedBy = adminId;

    // Sende Notification an User falls vorhanden
    if (pending.userId) {
      this.addNotification({
        userId: pending.userId,
        type: 'UPLOAD_APPROVED', // Könnte auch ein eigener Type sein
        payload: { trackId: pending.tempTrackId, title: 'Upload abgelehnt', note }
      });
    }

    this.saveToStorage();
    console.log('✅ CentralDB V2: Pending Upload abgelehnt');
    return true;
  }

  // =============================================================================
  // NOTIFICATIONS
  // =============================================================================

  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    console.log('🔔 CentralDB V2: addNotification()', notification.type);
    
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.data.notifications.push(newNotification);
    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Notification hinzugefügt:', newNotification.id);
    return newNotification;
  }

  getUserNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationRead(notificationId: string): boolean {
    console.log('📖 CentralDB V2: markNotificationRead()', notificationId);
    
    const notification = this.data.notifications.find(n => n.id === notificationId);
    if (!notification) {
      console.log('⚠️ CentralDB V2: Notification nicht gefunden:', notificationId);
      return false;
    }

    notification.readAt = new Date();
    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Notification als gelesen markiert');
    return true;
  }

  // =============================================================================
  // TOP TAGS SYSTEM
  // =============================================================================

  recomputeTopTags(limit: number = 20): TopTag[] {
    console.log('🏷️ CentralDB V2: recomputeTopTags()');
    
    const tagCounts = new Map<string, number>();
    
    // Sammle alle Tags aus allen Tracks
    this.data.tracks.forEach(track => {
      if (track.tags && Array.isArray(track.tags)) {
        track.tags.forEach(tag => {
          const normalizedTag = tag.trim().toLowerCase();
          if (normalizedTag.length > 0) {
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
          }
        });
      }
    });
    
    // Sortiere nach Häufigkeit und nimm Top N
    const sortedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    this.data.topTags = sortedTags;
    console.log('✅ CentralDB V2: Top Tags berechnet:', sortedTags.length);
    return sortedTags;
  }

  getTopTags(): TopTag[] {
    return [...this.data.topTags];
  }

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  toggleCommentLike(commentId: string, userId: string): boolean {
    console.log('❤️ CentralDB V2: toggleCommentLike()', commentId, userId);
    
    // Initialisiere Comment-Likes-Set falls nicht vorhanden
    if (!this.data.commentLikesMap.has(commentId)) {
      this.data.commentLikesMap.set(commentId, new Set());
    }

    const commentLikes = this.data.commentLikesMap.get(commentId)!;
    const wasLiked = commentLikes.has(userId);
    
    if (wasLiked) {
      commentLikes.delete(userId);
      console.log('💔 CentralDB V2: Comment Like entfernt');
    } else {
      commentLikes.add(userId);
      console.log('❤️ CentralDB V2: Comment Like hinzugefügt');
    }

    this.saveToStorage();
    return true;
  }

  isCommentLikedByUser(commentId: string, userId: string): boolean {
    const commentLikes = this.data.commentLikesMap.get(commentId);
    return commentLikes ? commentLikes.has(userId) : false;
  }

  getCommentLikeCount(commentId: string): number {
    const commentLikes = this.data.commentLikesMap.get(commentId);
    return commentLikes ? commentLikes.size : 0;
  }

  // =============================================================================
  // PLAY TRACKING
  // =============================================================================

  incrementPlay(trackId: string): boolean {
    console.log('▶️ CentralDB V2: incrementPlay()', trackId);
    
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      console.log('⚠️ CentralDB V2: Track nicht gefunden für Play:', trackId);
      return false;
    }

    const currentCount = this.data.playsMap.get(trackId) || 0;
    this.data.playsMap.set(trackId, currentCount + 1);
    
    // Aktualisiere auch im Track
    track.plays = currentCount + 1;
    
    this.saveToStorage();
    console.log('✅ CentralDB V2: Play count erhöht:', currentCount + 1);
    return true;
  }

  getPlayCount(trackId: string): number {
    return this.data.playsMap.get(trackId) || 0;
  }

  // =============================================================================
  // PERSISTIERUNG
  // =============================================================================

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
        users: this.data.users || [],
        tracks: this.data.tracks || [],
        comments: this.data.comments || [],
        reports: this.data.reports || [],
        notifications: this.data.notifications || [],
        pendingUploads: this.data.pendingUploads || [],
        follows: this.data.follows || [],
        commentLikes: this.data.commentLikes || [],
        plays: this.data.plays || [],
        likes: likesArray || [],
        bookmarks: bookmarksArray || [],
        commentLikes: commentLikesArray || [],
        plays: playsArray || [],
        topTags: this.data.topTags || [],
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('aural-central-database-v2', JSON.stringify(dataToSave));
      console.log('💾 CentralDB V2: Daten gespeichert');
    } catch (error) {
      console.error('❌ CentralDB V2: Fehler beim Speichern:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('aural-central-database-v2');
      if (!stored) {
        console.log('📭 CentralDB V2: Keine gespeicherten Daten gefunden - wird initialisiert');
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
        users: Array.isArray(parsed.users) ? parsed.users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt) })) : [],
        tracks: Array.isArray(parsed.tracks) ? parsed.tracks.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) })) : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })) : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt), reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined })) : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt), readAt: n.readAt ? new Date(n.readAt) : undefined })) : [],
        pendingUploads: Array.isArray(parsed.pendingUploads) ? parsed.pendingUploads.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), decidedAt: p.decidedAt ? new Date(p.decidedAt) : undefined })) : [],
        follows: Array.isArray(parsed.follows) ? parsed.follows.map((f: any) => ({ ...f, createdAt: new Date(f.createdAt) })) : [],
        commentLikes: Array.isArray(parsed.commentLikes) ? parsed.commentLikes.map((cl: any) => ({ ...cl, createdAt: new Date(cl.createdAt) })) : [],
        plays: Array.isArray(parsed.plays) ? parsed.plays.map((p: any) => ({ ...p, lastPlayedAt: new Date(p.lastPlayedAt) })) : [],
        likes: likesMap,
        bookmarks: bookmarksMap,
        commentLikesMap: commentLikesMap,
        playsMap: playsMap,
        topTags: Array.isArray(parsed.topTags) ? parsed.topTags : [],
        timestamp: parsed.timestamp || new Date().toISOString()
      };
      
      console.log('📥 CentralDB V2: Daten aus localStorage geladen');
    } catch (error) {
      console.error('❌ CentralDB V2: Fehler beim Laden:', error);
      this.data = { 
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
        topTags: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  // =============================================================================
  // DEMO-DATEN
  // =============================================================================

  private initializeDefaultData(): void {
    // Nur einmal initialisieren
    if (this.data.tracks.length > 0) {
      console.log('📋 CentralDB V2: Daten bereits vorhanden, keine Initialisierung');
      return;
    }

    console.log('🏗️ CentralDB V2: Initialisiere Demo-Daten...');

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
        userId: hollaUser.id,
        user: hollaUser,
        likes: 23,
        isLiked: false,
        isBookmarked: false,
        commentsCount: 2,
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
    
    // Berechne Top Tags
    this.recomputeTopTags();

    this.saveToStorage();
    console.log('✅ CentralDB V2: Demo-Daten initialisiert');
  }

  // =============================================================================
  // STATISTIKEN
  // =============================================================================

  getStats() {
    const totalComments = this.data.tracks.reduce((sum, track) => {
      return sum + (track.comments ? track.comments.length : 0);
    }, 0);
    
    let totalLikes = 0;
    this.data.likes.forEach(userIds => {
      totalLikes += userIds.size;
    });
    
    let totalBookmarks = 0;
    this.data.bookmarks.forEach(userIds => {
      totalBookmarks += userIds.size;
    });

    let totalPlays = 0;
    this.data.playsMap.forEach(count => {
      totalPlays += count;
    });
    
    console.log('📊 CentralDB V2: Statistiken berechnet');
    
    return {
      totalUsers: this.data.users.length,
      totalTracks: this.data.tracks.length,
      totalComments: totalComments,
      totalLikes: totalLikes,
      totalBookmarks: totalBookmarks,
      totalPlays: totalPlays,
      totalNotifications: this.data.notifications.length,
      totalPendingUploads: this.data.pendingUploads.length,
      totalFollows: this.data.follows.length,
      totalFileSize: this.data.tracks.reduce((sum, track) => sum + (track.fileSize || 0), 0)
    };
  }

  // =============================================================================
  // COMMENT OPERATIONEN
  // =============================================================================

  addCommentToTrack(trackId: string, comment: any): boolean {
    console.log('💬 CentralDB V2: addCommentToTrack()', trackId, comment.content?.substring(0, 50));
    
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      console.log('⚠️ CentralDB V2: Track nicht gefunden für Kommentar:', trackId);
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
    
    console.log('✅ CentralDB V2: Kommentar hinzugefügt. Gesamt Kommentare für Track:', track.comments.length);
    return true;
  }

  deleteCommentFromTrack(trackId: string, commentId: string): boolean {
    console.log('🗑️ CentralDB V2: deleteCommentFromTrack()', trackId, commentId);
    
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      console.log('⚠️ CentralDB V2: Track nicht gefunden für Kommentar-Löschung:', trackId);
      return false;
    }

    const track = this.data.tracks[trackIndex];
    
    if (!track.comments) {
      console.log('⚠️ CentralDB V2: Keine Kommentare vorhanden');
      return false;
    }
    
    const initialLength = track.comments.length;
    track.comments = track.comments.filter(comment => comment.id !== commentId);
    
    const deleted = track.comments.length < initialLength;
    if (deleted) {
      track.commentsCount = track.comments.length;
      this.saveToStorage();
      console.log('✅ CentralDB V2: Kommentar gelöscht. Verbleibend:', track.comments.length);
    } else {
      console.log('⚠️ CentralDB V2: Kommentar nicht gefunden:', commentId);
    }
    
    return deleted;
  }

  // =============================================================================
  // REPORT OPERATIONEN
  // =============================================================================

  getAllReports(): ContentReport[] {
    console.log('📋 CentralDB V2: getAllReports()');
    return [...this.data.reports].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  addReport(report: ContentReport): boolean {
    console.log('📋 CentralDB V2: addReport()', { id: report.id, type: report.type });
    
    // Prüfe, ob Report bereits existiert
    const exists = this.data.reports.some(r => r.id === report.id);
    if (exists) {
      console.log('⚠️ CentralDB V2: Report bereits vorhanden:', report.id);
      return false;
    }

    this.data.reports.push(report);
    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Report hinzugefügt. Gesamt:', this.data.reports.length);
    return true;
  }

  updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string): boolean {
    console.log('📋 CentralDB V2: updateReportStatus()', reportId, status);
    
    const reportIndex = this.data.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      console.log('⚠️ CentralDB V2: Report nicht gefunden:', reportId);
      return false;
    }

    this.data.reports[reportIndex].status = status;
    this.data.reports[reportIndex].reviewedAt = new Date();
    if (reviewedBy) {
      this.data.reports[reportIndex].reviewedBy = reviewedBy;
    }

    this.saveToStorage();
    
    console.log('✅ CentralDB V2: Report-Status aktualisiert');
    return true;
  }

  deleteReport(reportId: string): boolean {
    console.log('🗑️ CentralDB V2: deleteReport()', reportId);
    
    const initialLength = this.data.reports.length;
    this.data.reports = this.data.reports.filter(r => r.id !== reportId);
    
    const deleted = this.data.reports.length < initialLength;
    if (deleted) {
      this.saveToStorage();
      console.log('✅ CentralDB V2: Report gelöscht. Verbleibend:', this.data.reports.length);
    } else {
      console.log('⚠️ CentralDB V2: Report nicht gefunden:', reportId);
    }
    
    return deleted;
  }

  // =============================================================================
  // ADMIN-FUNKTIONEN
  // =============================================================================

  deleteAllUserContent(): boolean {
    console.log('🧹 CentralDB V2: deleteAllUserContent() - Lösche alle außer Holler die Waldfee');
    
    const hollaUserId = '4';
    const beforeCount = this.data.tracks.length;
    
    // Behalte nur die ersten 3 Holler-Tracks
    const hollaTracks = this.data.tracks
      .filter(track => track.userId === hollaUserId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 3);
    
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
    this.data.likes.clear();
    this.data.bookmarks.clear();
    this.data.commentLikesMap.clear();
    this.data.playsMap.clear();
    this.data.topTags = [];
    
    this.saveToStorage();
    
    const afterCount = this.data.tracks.length;
    console.log(`✅ CentralDB V2: Löschung abgeschlossen. Vorher: ${beforeCount}, Nachher: ${afterCount}`);
    
    return true;
  }

  reset(): void {
    console.log('🔄 CentralDB V2: Komplette Datenbank zurücksetzen');
    this.data = { 
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
      topTags: [],
      timestamp: new Date().toISOString()
    };
    localStorage.removeItem('aural-central-database-v2');
    this.initializeDefaultData();
  }
}

// Singleton-Export
export const centralDBV2 = CentralDatabaseV2.getInstance();
