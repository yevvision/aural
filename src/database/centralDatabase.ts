import type { AudioTrack, User, Comment, UserActivity, NotificationActivity } from '../types';

// Zentrale Datenbank - EINZIGE Quelle der Wahrheit
class CentralDatabase {
  private static instance: CentralDatabase;
  private data: {
    tracks: AudioTrack[];
    users: User[];
    comments: Comment[];
    likes: Map<string, Set<string>>; // trackId -> Set of userIds who liked
    bookmarks: Map<string, Set<string>>; // trackId -> Set of userIds who bookmarked
    activities: UserActivity[];
    notifications: NotificationActivity[];
  } = {
    tracks: [],
    users: [],
    comments: [],
    likes: new Map(),
    bookmarks: new Map(),
    activities: [],
    notifications: []
  };

  private constructor() {
    console.log('🏗️ CentralDB: Konstruktor aufgerufen');
    this.loadFromStorage();
    this.initializeDefaultData();
    console.log('✅ CentralDB: Initialisierung abgeschlossen');
  }

  // Singleton Pattern - nur eine Instanz
  public static getInstance(): CentralDatabase {
    if (!CentralDatabase.instance) {
      CentralDatabase.instance = new CentralDatabase();
    }
    return CentralDatabase.instance;
  }

  // =============================================================================
  // SINGLE SOURCE OF TRUTH - Alle Operationen gehen durch diese Methoden
  // =============================================================================

  // GET: Tracks abrufen (mit aktuellen Like/Bookmark Status)
  getAllTracks(currentUserId?: string): AudioTrack[] {
    console.log('📚 CentralDB: getAllTracks() - Anzahl:', this.data.tracks.length);
    return [...this.data.tracks].map(track => this.enrichTrackWithUserData(track, currentUserId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Track mit Like/Bookmark Status für aktuellen User anreichern
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

  // GET: Alle Benutzer abrufen (aus gespeicherten Users + Track-Updates)
  getAllUsers(): User[] {
    console.log('👥 CentralDB: getAllUsers()');
    console.log('👥 CentralDB: Gespeicherte Benutzer:', this.data.users.length, this.data.users.map(u => u.username));
    
    const userMap = new Map<string, User>();
    
    // 1. Starte mit allen gespeicherten Benutzern
    this.data.users.forEach(user => {
      userMap.set(user.id, { ...user });
    });
    
    // 2. Füge Benutzer aus Tracks hinzu (falls sie nicht in der users-Liste sind)
    this.data.tracks.forEach(track => {
      if (!userMap.has(track.user.id)) {
        console.log('👥 CentralDB: Benutzer aus Track hinzugefügt:', track.user.username);
        userMap.set(track.user.id, { ...track.user });
      }
    });
    
    // 3. Aktualisiere Statistiken für alle Benutzer
    userMap.forEach((user, userId) => {
      const userTracks = this.data.tracks.filter(t => t.user.id === userId);
      const totalLikes = userTracks.reduce((sum, t) => sum + t.likes, 0);
      
      user.totalUploads = userTracks.length;
      user.totalLikes = totalLikes;
    });
    
    const users = Array.from(userMap.values());
    console.log('👥 CentralDB: Finale Benutzer:', users.length, users.map(u => ({ username: u.username, uploads: u.totalUploads, likes: u.totalLikes })));
    return users;
  }

  getTrackById(id: string): AudioTrack | undefined {
    return this.data.tracks.find(track => track.id === id);
  }

  // ADD: Track hinzufügen
  addTrack(track: AudioTrack): boolean {
    console.log('➕ CentralDB: addTrack()', { id: track.id, title: track.title, user: track.user.username });
    
    // Prüfe, ob Track bereits existiert
    const exists = this.data.tracks.some(t => t.id === track.id);
    if (exists) {
      console.log('⚠️ CentralDB: Track bereits vorhanden:', track.id);
      return false;
    }

    // Füge Benutzer hinzu, falls er noch nicht existiert
    const userExists = this.data.users.some(u => u.id === track.user.id);
    if (!userExists) {
      console.log('👤 CentralDB: Füge neuen Benutzer hinzu:', track.user.username);
      this.data.users.push(track.user);
    }

    // Füge Track hinzu
    this.data.tracks.push(track);
    this.saveToStorage();
    
    console.log('✅ CentralDB: Track hinzugefügt. Gesamt:', this.data.tracks.length);
    console.log('✅ CentralDB: Benutzer gesamt:', this.data.users.length);
    return true;
  }

  // DELETE: Track löschen
  deleteTrack(trackId: string): boolean {
    console.log('🗑️ CentralDB: deleteTrack()', trackId);
    
    const initialLength = this.data.tracks.length;
    this.data.tracks = this.data.tracks.filter(track => track.id !== trackId);
    
    const deleted = this.data.tracks.length < initialLength;
    if (deleted) {
      this.saveToStorage();
      console.log('✅ CentralDB: Track gelöscht. Verbleibend:', this.data.tracks.length);
    } else {
      console.log('⚠️ CentralDB: Track nicht gefunden:', trackId);
    }
    
    return deleted;
  }

  // DELETE: Alle Benutzerinhalte löschen (außer Holler die Waldfee)
  deleteAllUserContent(): boolean {
    console.log('🧹 CentralDB: deleteAllUserContent() - Lösche alle außer Holler die Waldfee');
    
    const hollaUserId = '4';
    const beforeCount = this.data.tracks.length;
    
    // Behalte nur die ersten 3 Holler-Tracks
    const hollaTracks = this.data.tracks
      .filter(track => track.user.id === hollaUserId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 3);
    
    this.data.tracks = hollaTracks;
    
    // Behalte nur Holler-Benutzer
    this.data.users = this.data.users.filter(user => user.id === hollaUserId);
    
    // Lösche alle Kommentare
    this.data.comments = [];
    
    this.saveToStorage();
    
    const afterCount = this.data.tracks.length;
    console.log(`✅ CentralDB: Löschung abgeschlossen. Vorher: ${beforeCount}, Nachher: ${afterCount}`);
    
    return true;
  }

  // UPDATE: Track aktualisieren
  updateTrack(trackId: string, updates: Partial<AudioTrack>): boolean {
    console.log('🔄 CentralDB: updateTrack()', trackId, Object.keys(updates));
    
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      console.log('⚠️ CentralDB: Track nicht gefunden für Update:', trackId);
      return false;
    }

    this.data.tracks[trackIndex] = { ...this.data.tracks[trackIndex], ...updates };
    this.saveToStorage();
    
    console.log('✅ CentralDB: Track aktualisiert:', trackId);
    return true;
  }

  // ADD: Kommentar zu Track hinzufügen
  addCommentToTrack(trackId: string, comment: any): boolean {
    console.log('💬 CentralDB: addCommentToTrack()', trackId, comment.content?.substring(0, 50));
    
    const trackIndex = this.data.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      console.log('⚠️ CentralDB: Track nicht gefunden für Kommentar:', trackId);
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
    
    console.log('✅ CentralDB: Kommentar hinzugefügt. Gesamt Kommentare für Track:', track.comments.length);
    return true;
  }

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

  // LIKE: Track liken/unliken
  toggleLike(trackId: string, userId: string): boolean {
    console.log('❤️ CentralDB: toggleLike()', trackId, userId);
    
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      console.log('⚠️ CentralDB: Track nicht gefunden für Like:', trackId);
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
      console.log('💔 CentralDB: Like entfernt');
    } else {
      trackLikes.add(userId);
      console.log('❤️ CentralDB: Like hinzugefügt');
    }

    // Aktualisiere Like-Count im Track
    track.likes = trackLikes.size;
    
    this.saveToStorage();
    return true;
  }

  // BOOKMARK: Track bookmarken/unbookmarken
  toggleBookmark(trackId: string, userId: string): boolean {
    console.log('🔖 CentralDB: toggleBookmark()', trackId, userId);
    
    const track = this.data.tracks.find(t => t.id === trackId);
    if (!track) {
      console.log('⚠️ CentralDB: Track nicht gefunden für Bookmark:', trackId);
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
      console.log('🔓 CentralDB: Bookmark entfernt');
    } else {
      trackBookmarks.add(userId);
      console.log('🔖 CentralDB: Bookmark hinzugefügt');
    }

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
    
    return this.data.tracks.filter(track => likedTrackIds.includes(track.id));
  }

  // GET: User's bookmarked tracks
  getUserBookmarkedTracks(userId: string): AudioTrack[] {
    const bookmarkedTrackIds: string[] = [];
    this.data.bookmarks.forEach((userIds, trackId) => {
      if (userIds.has(userId)) {
        bookmarkedTrackIds.push(trackId);
      }
    });
    
    return this.data.tracks.filter(track => bookmarkedTrackIds.includes(track.id));
  }

  // =============================================================================
  // ACTIVITY & NOTIFICATIONS
  // =============================================================================

  // ADD: User Activity hinzufügen
  addUserActivity(activity: Omit<UserActivity, 'id' | 'createdAt' | 'isRead'>): boolean {
    const newActivity: UserActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isRead: false
    };
    
    this.data.activities.push(newActivity);
    this.saveToStorage();
    
    console.log('📝 CentralDB: User Activity hinzugefügt:', newActivity.type);
    return true;
  }

  // ADD: Notification hinzufügen
  addNotification(notification: Omit<NotificationActivity, 'id' | 'createdAt' | 'isRead'>): boolean {
    const newNotification: NotificationActivity = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isRead: false
    };
    
    this.data.notifications.push(newNotification);
    this.saveToStorage();
    
    console.log('🔔 CentralDB: Notification hinzugefügt:', newNotification.type);
    return true;
  }

  // GET: User Activities
  getUserActivities(userId: string): UserActivity[] {
    return this.data.activities
      .filter(activity => activity.trackUser?.id === userId || activity.followedUser?.id === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // GET: User Notifications
  getUserNotifications(userId: string): NotificationActivity[] {
    return this.data.notifications
      .filter(notification => notification.user.id === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // MARK: Activity als gelesen markieren
  markActivityAsRead(activityId: string): boolean {
    const activity = this.data.activities.find(a => a.id === activityId);
    if (activity) {
      activity.isRead = true;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // MARK: Notification als gelesen markieren
  markNotificationAsRead(notificationId: string): boolean {
    const notification = this.data.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // =============================================================================
  // STATISTIKEN
  // =============================================================================

  getStats() {
    // Kommentare aus allen Tracks zählen
    const totalComments = this.data.tracks.reduce((sum, track) => {
      return sum + (track.comments ? track.comments.length : 0);
    }, 0);
    
    // Likes aus Likes-Map zählen
    let totalLikes = 0;
    this.data.likes.forEach(userIds => {
      totalLikes += userIds.size;
    });
    
    console.log('📊 CentralDB: Statistiken berechnet - Kommentare:', totalComments, 'Likes:', totalLikes);
    
    return {
      totalUsers: this.data.users.length,
      totalTracks: this.data.tracks.length,
      totalComments: totalComments,
      totalLikes: totalLikes,
      totalBookmarks: Array.from(this.data.bookmarks.values()).reduce((sum, userIds) => sum + userIds.size, 0),
      totalActivities: this.data.activities.length,
      totalNotifications: this.data.notifications.length,
      totalFileSize: this.data.tracks.reduce((sum, track) => sum + (track.fileSize || 0), 0)
    };
  }

  // =============================================================================
  // PERSISTIERUNG - NUR EIN localStorage-Schlüssel
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

      const dataToSave = {
        tracks: this.data.tracks || [],
        users: this.data.users || [],
        comments: this.data.comments || [],
        likes: likesArray || [],
        bookmarks: bookmarksArray || [],
        activities: this.data.activities || [],
        notifications: this.data.notifications || [],
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('aural-central-database', JSON.stringify(dataToSave));
      console.log('💾 CentralDB: Daten gespeichert (Tracks:', this.data.tracks?.length || 0, 'Likes:', this.data.likes?.size || 0, 'Bookmarks:', this.data.bookmarks?.size || 0, ')');
    } catch (error) {
      console.error('❌ CentralDB: Fehler beim Speichern:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('aural-central-database');
      if (!stored) {
        console.log('📭 CentralDB: Keine gespeicherten Daten gefunden - wird initialisiert');
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

      this.data = {
        tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        likes: likesMap,
        bookmarks: bookmarksMap,
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : []
      };
      
      console.log('📥 CentralDB: Daten aus localStorage geladen:');
      console.log('📥 CentralDB: - Tracks:', this.data.tracks.length);
      console.log('📥 CentralDB: - Users:', this.data.users.length, this.data.users.map(u => u.username));
      console.log('📥 CentralDB: - Comments:', this.data.comments.length);
      console.log('📥 CentralDB: - Likes:', this.data.likes.size);
      console.log('📥 CentralDB: - Bookmarks:', this.data.bookmarks.size);
      console.log('📥 CentralDB: - Activities:', this.data.activities.length);
      console.log('📥 CentralDB: - Notifications:', this.data.notifications.length);
    } catch (error) {
      console.error('❌ CentralDB: Fehler beim Laden:', error);
      this.data = { 
        tracks: [], 
        users: [], 
        comments: [], 
        likes: new Map(), 
        bookmarks: new Map(), 
        activities: [], 
        notifications: [] 
      };
    }
  }

  // =============================================================================
  // DEMO-DATEN - NUR EINMAL BEIM ERSTEN START
  // =============================================================================

  private initializeDefaultData(): void {
    // Nur einmal initialisieren
    if (this.data.tracks.length > 0) {
      console.log('📋 CentralDB: Daten bereits vorhanden, keine Initialisierung');
      return;
    }

    console.log('🏗️ CentralDB: Initialisiere Demo-Daten...');

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
            createdAt: new Date(Date.now() - 3600000),
            likes: 2,
            isLiked: false
          },
          {
            id: 'comment-2', 
            content: 'Sehr entspannend, danke! 🙏',
            user: currentUser,
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
            createdAt: new Date(Date.now() - 172800000),
            likes: 5,
            isLiked: false
          },
          {
            id: 'comment-5',
            content: 'Hilft mir beim Meditieren',
            user: currentUser,
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
    
    console.log('🏗️ CentralDB: Benutzer initialisiert:', this.data.users.map(u => u.username));

    this.saveToStorage();
    console.log('✅ CentralDB: Demo-Daten initialisiert (3 Holler-Tracks)');
  }

  // =============================================================================
  // ADMIN-FUNKTIONEN
  // =============================================================================

  // Komplette Datenbank zurücksetzen
  reset(): void {
    console.log('🔄 CentralDB: Komplette Datenbank zurücksetzen');
    this.data = { 
      tracks: [], 
      users: [], 
      comments: [], 
      likes: new Map(), 
      bookmarks: new Map(), 
      activities: [], 
      notifications: [] 
    };
    localStorage.removeItem('aural-central-database');
    this.initializeDefaultData();
  }
}

// Singleton-Export
export const centralDB = CentralDatabase.getInstance();
