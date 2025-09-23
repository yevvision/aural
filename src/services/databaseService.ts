import { centralDB } from '../database/centralDatabase_simple';
import type { AudioTrack, ContentReport } from '../types';

// Database Service - Wrapper für die zentrale Datenbank
// Alle Komponenten verwenden DIESEN Service
class DatabaseServiceClass {
  private listeners: Set<() => void> = new Set();

  // =============================================================================
  // TRACKS - CRUD Operationen
  // =============================================================================

  // GET: Alle Tracks abrufen (mit User-spezifischen Daten)
  getTracks(currentUserId?: string): AudioTrack[] {
    console.log('🔗 DatabaseService: getTracks()', currentUserId ? `für User: ${currentUserId}` : '');
    return centralDB.getAllTracks(currentUserId);
  }

  // GET: Track by ID
  getTrack(id: string): AudioTrack | undefined {
    console.log('🔗 DatabaseService: getTrack()', id);
    return centralDB.getTrackById(id);
  }

  // GET: Alle Benutzer abrufen
  getUsers(): any[] {
    console.log('🔗 DatabaseService: getUsers()');
    return centralDB.getAllUsers();
  }

  // ADD: Neuen Track hinzufügen
  addTrack(track: AudioTrack): boolean {
    console.log('🔗 DatabaseService: addTrack()', { id: track.id, title: track.title });
    const success = centralDB.addTrack(track);
    
    if (success) {
      // Notifiziere alle Listener über Änderung
      this.notifyListeners();
    }
    
    return success;
  }

  // DELETE: Track löschen
  deleteTrack(trackId: string): boolean {
    console.log('🔗 DatabaseService: deleteTrack()', trackId);
    const success = centralDB.deleteTrack(trackId);
    
    if (success) {
      // Notifiziere alle Listener über Änderung
      this.notifyListeners();
    }
    
    return success;
  }

  // UPDATE: Track aktualisieren
  updateTrack(trackId: string, updates: Partial<AudioTrack>): boolean {
    const success = centralDB.updateTrack(trackId, updates);
    
    if (success) {
      // Notifiziere alle Listener über Änderung
      this.notifyListeners();
    }
    
    return success;
  }

  // ADD: Kommentar zu Track hinzufügen
  addCommentToTrack(trackId: string, comment: any): boolean {
    console.log('🔗 DatabaseService: addCommentToTrack()', trackId);
    const success = centralDB.addCommentToTrack(trackId, comment);
    
    if (success) {
      // Notifiziere alle Listener über Änderung
      this.notifyListeners();
    }
    
    return success;
  }

  // DELETE: Kommentar von Track löschen
  deleteCommentFromTrack(trackId: string, commentId: string): boolean {
    console.log('🔗 DatabaseService: deleteCommentFromTrack()', trackId, commentId);
    const success = centralDB.deleteCommentFromTrack(trackId, commentId);
    
    if (success) {
      // Notifiziere alle Listener über Änderung
      this.notifyListeners();
    }
    
    return success;
  }

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

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
    console.log('🔗 DatabaseService: getUserLikedTracks()', userId);
    return centralDB.getUserLikedTracks(userId);
  }

  // GET: User's bookmarked tracks
  getUserBookmarkedTracks(userId: string): AudioTrack[] {
    console.log('🔗 DatabaseService: getUserBookmarkedTracks()', userId);
    return centralDB.getUserBookmarkedTracks(userId);
  }

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  // LIKE: Comment liken/unliken
  toggleCommentLike(commentId: string, userId: string): boolean {
    console.log('🔗 DatabaseService: toggleCommentLike()', commentId, userId);
    const success = centralDB.toggleCommentLike(commentId, userId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  // GET: Comment like status for user
  isCommentLikedByUser(commentId: string, userId: string): boolean {
    console.log('🔗 DatabaseService: isCommentLikedByUser()', commentId, userId);
    return centralDB.isCommentLikedByUser(commentId, userId);
  }

  // GET: Comment like count
  getCommentLikeCount(commentId: string): number {
    console.log('🔗 DatabaseService: getCommentLikeCount()', commentId);
    return centralDB.getCommentLikeCount(commentId);
  }

  // ADD: User Activity hinzufügen (Placeholder)
  addUserActivity(activity: any): boolean {
    console.log('🔗 DatabaseService: addUserActivity() - Placeholder', activity.type);
    // TODO: Implementiere Activity-System
    return true;
  }

  // ADD: Notification hinzufügen (Placeholder)
  addNotification(notification: any): boolean {
    console.log('🔗 DatabaseService: addNotification() - Placeholder', notification.type);
    // TODO: Implementiere Notification-System
    return true;
  }

  // GET: User Activities (Placeholder)
  getUserActivities(userId: string): any[] {
    console.log('🔗 DatabaseService: getUserActivities() - Placeholder', userId);
    // TODO: Implementiere Activity-Abruf
    return [];
  }

  // GET: User Notifications (Placeholder)
  getUserNotifications(userId: string): any[] {
    console.log('🔗 DatabaseService: getUserNotifications() - Placeholder', userId);
    // TODO: Implementiere Notification-Abruf
    return [];
  }

  // MARK: Activity als gelesen markieren (Placeholder)
  markActivityAsRead(activityId: string): boolean {
    console.log('🔗 DatabaseService: markActivityAsRead() - Placeholder', activityId);
    // TODO: Implementiere Activity-Update
    return true;
  }

  // MARK: Notification als gelesen markieren (Placeholder)
  markNotificationAsRead(notificationId: string): boolean {
    console.log('🔗 DatabaseService: markNotificationAsRead() - Placeholder', notificationId);
    // TODO: Implementiere Notification-Update
    return true;
  }

  // =============================================================================
  // REPORT-FUNKTIONEN
  // =============================================================================

  // GET: Alle Reports abrufen
  getReports(): ContentReport[] {
    console.log('🔗 DatabaseService: getReports()');
    return centralDB.getAllReports();
  }

  // ADD: Neuen Report hinzufügen
  addReport(report: ContentReport): boolean {
    console.log('🔗 DatabaseService: addReport()', { id: report.id, type: report.type });
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
    console.log('🔗 DatabaseService: deleteReport()', reportId);
    const success = centralDB.deleteReport(reportId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  // =============================================================================
  // ADMIN-FUNKTIONEN
  // =============================================================================

  // Alle Benutzerinhalte löschen
  deleteAllUserContent(): boolean {
    console.log('🔗 DatabaseService: deleteAllUserContent()');
    const success = (centralDB as any).deleteAllUserContent();
    
    if (success) {
      // Notifiziere alle Listener über Änderung
      this.notifyListeners();
    }
    
    return success;
  }

  // Statistiken abrufen
  getStats() {
    console.log('🔗 DatabaseService: getStats()');
    return centralDB.getStats();
  }

  // GET: Alle Kommentare abrufen (aus Tracks extrahiert)
  getComments(): any[] {
    console.log('🔗 DatabaseService: getComments()');
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
    
    console.log('💬 DatabaseService: Gefundene Kommentare:', allComments.length);
    return allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Datenbank zurücksetzen
  reset(): void {
    console.log('🔗 DatabaseService: reset()');
    centralDB.reset();
    this.notifyListeners();
  }

  // =============================================================================
  // LISTENER SYSTEM - Für Echtzeit-Synchronisation
  // =============================================================================

  // Listener hinzufügen (für Komponenten, die bei Änderungen benachrichtigt werden wollen)
  addListener(callback: () => void): () => void {
    console.log('🔗 DatabaseService: addListener() - Anzahl Listener:', this.listeners.size + 1);
    this.listeners.add(callback);
    
    // Return function to remove listener
    return () => {
      this.listeners.delete(callback);
      console.log('🔗 DatabaseService: removeListener() - Anzahl Listener:', this.listeners.size);
    };
  }

  // Alle Listener benachrichtigen
  notifyListeners(): void {
    console.log('📢 DatabaseService: notifyListeners() - Benachrichtige', this.listeners.size, 'Listener');
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
    console.log('🔍 DatabaseService: searchTracks()', query);
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
    console.log('🔗 DatabaseService: getTracksSorted()', sortBy, order);
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