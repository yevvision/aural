import { centralDB } from '../database/centralDatabase_simple';
import type { AudioTrack, ContentReport } from '../types';

// Database Service - Server-first für Kern-Funktionalität
// Nur Tracks und Pending Uploads sind server-first, Rest bleibt lokal
class DatabaseServiceClass {
  private listeners: Set<() => void> = new Set();
  private serverDataLoaded = false;

  // =============================================================================
  // SERVER-FIRST DATA LOADING (nur für Tracks)
  // =============================================================================

  // Load tracks from server and sync to local database
  private async loadTracksFromServer(): Promise<void> {
    try {
      console.log('🌐 DatabaseService: Loading tracks from server...');
      
      const { serverDatabaseService } = await import('./serverDatabaseService');
      const serverTracks = await serverDatabaseService.getAllTracks();
      
      if (serverTracks && serverTracks.length > 0) {
        console.log('🌐 DatabaseService: Server tracks loaded:', serverTracks.length);
        
        // Sync local database with server tracks
        // Clear existing tracks and add server tracks
        const currentData = centralDB.getDatabase();
        currentData.tracks = serverTracks;
        centralDB.saveDatabase(currentData);
        
        this.serverDataLoaded = true;
        console.log('✅ DatabaseService: Server tracks loaded and synced to local database');
      } else {
        console.log('🔍 DatabaseService: No tracks found on server');
        this.serverDataLoaded = true;
      }
      
    } catch (error) {
      console.error('❌ DatabaseService: Server load failed, using local database:', error);
      this.serverDataLoaded = true; // Mark as loaded to avoid infinite retries
    }
  }

  // =============================================================================
  // TRACKS - CRUD Operationen (SERVER-FIRST)
  // =============================================================================

  // GET: Alle Tracks abrufen (server-first)
  getTracks(currentUserId?: string): AudioTrack[] {
    // Load from server first if not already loaded
    if (!this.serverDataLoaded) {
      this.loadTracksFromServer();
    }
    return centralDB.getAllTracks(currentUserId);
  }

  // GET: Track by ID
  getTrack(id: string): AudioTrack | undefined {
    return centralDB.getTrackById(id);
  }

  // ADD: Neuen Track hinzufügen (server-first)
  async addTrack(track: AudioTrack): Promise<boolean> {
    try {
      console.log('🌐 DatabaseService: Adding track to server:', track.id);
      
      const { serverDatabaseService } = await import('./serverDatabaseService');
      const serverSuccess = await serverDatabaseService.addTrack(track);
      
      if (serverSuccess) {
        console.log('✅ DatabaseService: Track added to server successfully');
        // Add to local database for immediate display
        const localSuccess = centralDB.addTrack(track);
        if (localSuccess) {
          this.notifyListeners();
        }
        return true;
      } else {
        console.error('❌ DatabaseService: Failed to add track to server');
        // Fallback to local
        const localSuccess = centralDB.addTrack(track);
        if (localSuccess) {
          this.notifyListeners();
        }
        return localSuccess;
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server error, adding locally:', error);
      // Fallback to local
      const localSuccess = centralDB.addTrack(track);
      if (localSuccess) {
        this.notifyListeners();
      }
      return localSuccess;
    }
  }

  // DELETE: Track löschen (server-first)
  async deleteTrack(trackId: string): Promise<boolean> {
    try {
      console.log('🌐 DatabaseService: Deleting track from server:', trackId);
      
      const { serverDatabaseService } = await import('./serverDatabaseService');
      const serverSuccess = await serverDatabaseService.deleteTrack(trackId);
      
      if (serverSuccess) {
        console.log('✅ DatabaseService: Track deleted from server successfully');
        // Remove from local database
        const localSuccess = centralDB.deleteTrack(trackId);
        if (localSuccess) {
          this.notifyListeners();
        }
        return true;
      } else {
        console.error('❌ DatabaseService: Failed to delete track from server');
        // Fallback to local
        const localSuccess = centralDB.deleteTrack(trackId);
        if (localSuccess) {
          this.notifyListeners();
        }
        return localSuccess;
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server error, deleting locally:', error);
      // Fallback to local
      const localSuccess = centralDB.deleteTrack(trackId);
      if (localSuccess) {
        this.notifyListeners();
      }
      return localSuccess;
    }
  }

  // UPDATE: Track aktualisieren
  updateTrack(trackId: string, updates: Partial<AudioTrack>): boolean {
    const success = centralDB.updateTrack(trackId, updates);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // =============================================================================
  // PENDING UPLOADS (SERVER-FIRST)
  // =============================================================================

  // GET: Pending Uploads (server-first)
  async getPendingUploads(): Promise<any[]> {
    try {
      console.log('🌐 DatabaseService: Getting pending uploads from server');
      
      const { serverDatabaseService } = await import('./serverDatabaseService');
      const serverPendingUploads = await serverDatabaseService.getPendingUploads();
      
      if (serverPendingUploads) {
        console.log('✅ DatabaseService: Pending uploads retrieved from server successfully');
        return serverPendingUploads;
      } else {
        console.error('❌ DatabaseService: Failed to get pending uploads from server');
        // Fallback to local
        return centralDB.getPendingUploads();
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server error, getting local pending uploads:', error);
      // Fallback to local
      return centralDB.getPendingUploads();
    }
  }

  // APPROVE: Upload genehmigen (server-first)
  async approveUpload(uploadId: string): Promise<AudioTrack | null> {
    try {
      console.log('🌐 DatabaseService: Approving upload on server:', uploadId);
      
      const { serverDatabaseService } = await import('./serverDatabaseService');
      const approvedTrack = await serverDatabaseService.approveUpload(uploadId);
      
      if (approvedTrack) {
        console.log('✅ DatabaseService: Upload approved on server successfully');
        // Add to local database
        centralDB.addTrack(approvedTrack);
        this.notifyListeners();
        return approvedTrack;
      } else {
        console.error('❌ DatabaseService: Failed to approve upload on server');
        return null;
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server error, approving locally:', error);
      return null;
    }
  }

  // =============================================================================
  // ALLE ANDEREN METHODEN - LOKAL (wie vorher)
  // =============================================================================

  // GET: Alle Benutzer abrufen
  getUsers(): any[] {
    return centralDB.getAllUsers();
  }

  // GET: User by ID
  getUserById(id: string): any | undefined {
    return centralDB.getUserById(id);
  }

  // ADD: User hinzufügen
  addUser(user: any): boolean {
    const success = centralDB.addUser(user);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // UPDATE: User aktualisieren
  updateUser(userId: string, updates: any): boolean {
    const success = centralDB.updateUser(userId, updates);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // ADD: Kommentar zu Track hinzufügen
  addCommentToTrack(trackId: string, comment: any): boolean {
    const success = centralDB.addCommentToTrack(trackId, comment);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // DELETE: Kommentar von Track löschen
  deleteCommentFromTrack(trackId: string, commentId: string): boolean {
    const success = centralDB.deleteCommentFromTrack(trackId, commentId);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // LIKE: Track liken/unliken
  toggleLike(trackId: string, userId: string): boolean {
    const success = centralDB.toggleLike(trackId, userId);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // BOOKMARK: Track bookmarken/unbookmarken
  toggleBookmark(trackId: string, userId: string): boolean {
    const success = centralDB.toggleBookmark(trackId, userId);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // PLAY: Play-Anzahl erhöhen
  incrementPlay(trackId: string): boolean {
    const success = centralDB.incrementPlay(trackId);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // GET: User's liked tracks
  getUserLikedTracks(userId: string): AudioTrack[] {
    return centralDB.getUserLikedTracks(userId);
  }

  // GET: User's bookmarked tracks
  getUserBookmarkedTracks(userId: string): AudioTrack[] {
    return centralDB.getUserBookmarkedTracks(userId);
  }

  // LIKE: Comment liken/unliken
  toggleCommentLike(commentId: string, userId: string): boolean {
    const success = centralDB.toggleCommentLike(commentId, userId);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // GET: Comment like status for user
  isCommentLikedByUser(commentId: string, userId: string): boolean {
    return centralDB.isCommentLikedByUser(commentId, userId);
  }

  // GET: Comment like count
  getCommentLikeCount(commentId: string): number {
    return centralDB.getCommentLikeCount(commentId);
  }

  // FOLLOW: User folgen/entfolgen
  toggleFollow(followerId: string, targetUserId: string): boolean {
    return centralDB.toggleFollow(followerId, targetUserId);
  }

  // ADD: User Activity hinzufügen
  addUserActivity(activity: any): boolean {
    return centralDB.addUserActivity(activity);
  }

  // ADD: Notification hinzufügen
  addNotification(notification: any): boolean {
    return centralDB.addNotification(notification);
  }

  // GET: User Activities
  getUserActivities(userId: string): any[] {
    return centralDB.getUserActivities(userId);
  }

  // GET: User Notifications
  getUserNotifications(userId: string): any[] {
    return centralDB.getUserNotifications(userId);
  }

  // MARK: Activity als gelesen markieren
  markActivityAsRead(activityId: string): boolean {
    return centralDB.markActivityAsRead(activityId);
  }

  // MARK: Notification als gelesen markieren
  markNotificationAsRead(notificationId: string): boolean {
    return centralDB.markNotificationAsRead(notificationId);
  }

  // Demo-Daten für Aktivitäten und Benachrichtigungen hinzufügen
  addDemoActivitiesAndNotifications(): void {
    centralDB.addDemoActivitiesAndNotifications();
  }

  // FORCE: Demo-Daten erstellen (für Testing)
  forceCreateDemoData(): void {
    centralDB.forceCreateDemoData();
  }

  // FORCE: Holla-Tracks hinzufügen (auch wenn bereits Daten vorhanden sind)
  forceAddHollaTracks(): void {
    centralDB.forceAddHollaTracks();
    this.notifyListeners();
  }

  // DEBUG: Zeige alle Daten
  debugShowAllData(): void {
    centralDB.debugShowAllData();
  }

  // RESET: Datenbank komplett zurücksetzen
  resetDatabase(): void {
    centralDB.resetDatabase();
  }

  // TEST: Teste Persistierung
  testPersistence(): void {
    centralDB.testPersistence();
  }

  // GET: Alle Reports abrufen
  getReports(): ContentReport[] {
    return centralDB.getAllReports();
  }

  // ADD: Neuen Report hinzufügen
  addReport(report: ContentReport): boolean {
    const success = centralDB.addReport(report);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // UPDATE: Report-Status aktualisieren
  updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string): boolean {
    const success = centralDB.updateReportStatus(reportId, status, reviewedBy);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // DELETE: Report löschen
  deleteReport(reportId: string): boolean {
    const success = centralDB.deleteReport(reportId);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // Alle Benutzerinhalte löschen
  deleteAllUserContent(): boolean {
    const success = (centralDB as any).deleteAllUserContent();
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // Spezifischen Track löschen (für problematische Tracks)
  forceDeleteTrack(trackTitle: string, username: string): boolean {
    const success = (centralDB as any).forceDeleteTrack(trackTitle, username);
    if (success) {
      this.notifyListeners();
    }
    return success;
  }

  // Statistiken abrufen
  getStats() {
    return centralDB.getStats();
  }

  // GET: Alle Kommentare abrufen (aus Tracks extrahiert)
  getComments(): any[] {
    const allComments: any[] = [];
    
    const tracks = centralDB.getAllTracks();
    tracks.forEach(track => {
      if (track.comments && track.comments.length > 0) {
        track.comments.forEach(comment => {
          allComments.push({
            ...comment,
            trackId: track.id,
            trackTitle: track.title
          });
        });
      }
    });
    
    return allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Datenbank zurücksetzen
  reset(): void {
    centralDB.reset();
    this.notifyListeners();
  }

  // =============================================================================
  // LISTENER SYSTEM - Für Echtzeit-Synchronisation
  // =============================================================================

  // Listener hinzufügen (für Komponenten, die bei Änderungen benachrichtigt werden wollen)
  addListener(callback: () => void): () => void {
    this.listeners.add(callback);
    
    // Return function to remove listener
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Alle Listener benachrichtigen
  notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ DatabaseService: Fehler beim Benachrichtigen eines Listeners:', error);
      }
    });
  }

  // =============================================================================
  // SEARCH & FILTER
  // =============================================================================

  // Tracks nach Kriterien suchen
  searchTracks(query: string): AudioTrack[] {
    const allTracks = this.getTracks();
    const lowerQuery = query.toLowerCase();
    
    return allTracks.filter(track => 
      track.title.toLowerCase().includes(lowerQuery) ||
      track.user.username.toLowerCase().includes(lowerQuery) ||
      (track.description && track.description.toLowerCase().includes(lowerQuery)) ||
      (track.tags && track.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  // Tracks sortiert abrufen
  getTracksSorted(sortBy: 'title' | 'user' | 'date' | 'likes' | 'duration' | 'fileSize' = 'date', order: 'asc' | 'desc' = 'desc'): AudioTrack[] {
    const tracks = this.getTracks();
    
    return tracks.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'user':
          aValue = a.user.username.toLowerCase();
          bValue = b.user.username.toLowerCase();
          break;
        case 'likes':
          aValue = a.likes;
          bValue = b.likes;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'fileSize':
          aValue = a.fileSize || 0;
          bValue = b.fileSize || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // =============================================================================
  // DEBUG & DEVELOPMENT
  // =============================================================================

  // Debug: Aktuellen Zustand ausgeben
  debug(): void {
    // Debug method - logs removed for performance
  }
}

// Singleton-Export
export const DatabaseService = new DatabaseServiceClass();

// Export für einfache Verwendung
export default DatabaseService;
