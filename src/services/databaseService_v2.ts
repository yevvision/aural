import { centralDBV2 } from '../database/centralDatabase_v2';
import type { 
  AudioTrack, 
  User, 
  Comment, 
  ContentReport, 
  Notification, 
  PendingUpload, 
  Follow, 
  TopTag 
} from '../types';

// Database Service V2 - Erweiterte Version mit allen neuen Features
class DatabaseServiceV2Class {
  private listeners: Set<() => void> = new Set();

  // =============================================================================
  // TRACKS - CRUD Operationen
  // =============================================================================

  getTracks(currentUserId?: string): AudioTrack[] {
    console.log('🔗 DatabaseService V2: getTracks()', currentUserId ? `für User: ${currentUserId}` : '');
    return centralDBV2.getAllTracks(currentUserId);
  }

  getTrack(id: string): AudioTrack | undefined {
    console.log('🔗 DatabaseService V2: getTrack()', id);
    return centralDBV2.getTrackById(id);
  }

  getUsers(): User[] {
    console.log('🔗 DatabaseService V2: getUsers()');
    return centralDBV2.getAllUsers();
  }

  addTrack(track: AudioTrack): boolean {
    console.log('🔗 DatabaseService V2: addTrack()', { id: track.id, title: track.title });
    const success = centralDBV2.addTrack(track);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  deleteTrack(trackId: string): boolean {
    console.log('🔗 DatabaseService V2: deleteTrack()', trackId);
    const success = centralDBV2.deleteTrack(trackId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  updateTrack(trackId: string, updates: Partial<AudioTrack>): boolean {
    const success = centralDBV2.updateTrack(trackId, updates);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  addCommentToTrack(trackId: string, comment: any): boolean {
    console.log('🔗 DatabaseService V2: addCommentToTrack()', trackId);
    const success = centralDBV2.addCommentToTrack(trackId, comment);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  deleteCommentFromTrack(trackId: string, commentId: string): boolean {
    console.log('🔗 DatabaseService V2: deleteCommentFromTrack()', trackId, commentId);
    const success = centralDBV2.deleteCommentFromTrack(trackId, commentId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

  toggleLike(trackId: string, userId: string): boolean {
    const success = centralDBV2.toggleLike(trackId, userId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  toggleBookmark(trackId: string, userId: string): boolean {
    const success = centralDBV2.toggleBookmark(trackId, userId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  incrementPlay(trackId: string): boolean {
    const success = centralDBV2.incrementPlay(trackId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  getUserLikedTracks(userId: string): AudioTrack[] {
    console.log('🔗 DatabaseService V2: getUserLikedTracks()', userId);
    return centralDBV2.getUserLikedTracks(userId);
  }

  getUserBookmarkedTracks(userId: string): AudioTrack[] {
    console.log('🔗 DatabaseService V2: getUserBookmarkedTracks()', userId);
    return centralDBV2.getUserBookmarkedTracks(userId);
  }

  // =============================================================================
  // FOLLOW SYSTEM
  // =============================================================================

  follow(userId: string, targetId: string): boolean {
    console.log('🔗 DatabaseService V2: follow()', userId, '->', targetId);
    const success = centralDBV2.follow(userId, targetId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  unfollow(userId: string, targetId: string): boolean {
    console.log('🔗 DatabaseService V2: unfollow()', userId, '->', targetId);
    const success = centralDBV2.unfollow(userId, targetId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  getFollowers(userId: string): User[] {
    console.log('🔗 DatabaseService V2: getFollowers()', userId);
    return centralDBV2.getFollowers(userId);
  }

  getFollowing(userId: string): User[] {
    console.log('🔗 DatabaseService V2: getFollowing()', userId);
    return centralDBV2.getFollowing(userId);
  }

  isFollowing(followerId: string, followeeId: string): boolean {
    console.log('🔗 DatabaseService V2: isFollowing()', followerId, '->', followeeId);
    return centralDBV2.isFollowing(followerId, followeeId);
  }

  // =============================================================================
  // PENDING UPLOADS
  // =============================================================================

  addPendingUpload(pending: Omit<PendingUpload, 'id' | 'createdAt'>): PendingUpload {
    console.log('🔗 DatabaseService V2: addPendingUpload()', pending.reason);
    const result = centralDBV2.addPendingUpload(pending);
    
    this.notifyListeners();
    return result;
  }

  listPendingUploads(): PendingUpload[] {
    console.log('🔗 DatabaseService V2: listPendingUploads()');
    return centralDBV2.listPendingUploads();
  }

  approvePendingUpload(pendingId: string, adminId: string): boolean {
    console.log('🔗 DatabaseService V2: approvePendingUpload()', pendingId);
    const success = centralDBV2.approvePendingUpload(pendingId, adminId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  rejectPendingUpload(pendingId: string, adminId: string, note?: string): boolean {
    console.log('🔗 DatabaseService V2: rejectPendingUpload()', pendingId);
    const success = centralDBV2.rejectPendingUpload(pendingId, adminId, note);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  // =============================================================================
  // NOTIFICATIONS
  // =============================================================================

  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    console.log('🔗 DatabaseService V2: addNotification()', notification.type);
    const result = centralDBV2.addNotification(notification);
    
    this.notifyListeners();
    return result;
  }

  getUserNotifications(userId: string): Notification[] {
    console.log('🔗 DatabaseService V2: getUserNotifications()', userId);
    return centralDBV2.getUserNotifications(userId);
  }

  markNotificationRead(notificationId: string): boolean {
    console.log('🔗 DatabaseService V2: markNotificationRead()', notificationId);
    const success = centralDBV2.markNotificationRead(notificationId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  // =============================================================================
  // TOP TAGS
  // =============================================================================

  getTopTags(): TopTag[] {
    console.log('🔗 DatabaseService V2: getTopTags()');
    return centralDBV2.getTopTags();
  }

  recomputeTopTags(limit: number = 20): TopTag[] {
    console.log('🔗 DatabaseService V2: recomputeTopTags()', limit);
    const result = centralDBV2.recomputeTopTags(limit);
    
    this.notifyListeners();
    return result;
  }

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  toggleCommentLike(commentId: string, userId: string): boolean {
    console.log('🔗 DatabaseService V2: toggleCommentLike()', commentId, userId);
    const success = centralDBV2.toggleCommentLike(commentId, userId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  isCommentLikedByUser(commentId: string, userId: string): boolean {
    console.log('🔗 DatabaseService V2: isCommentLikedByUser()', commentId, userId);
    return centralDBV2.isCommentLikedByUser(commentId, userId);
  }

  getCommentLikeCount(commentId: string): number {
    console.log('🔗 DatabaseService V2: getCommentLikeCount()', commentId);
    return centralDBV2.getCommentLikeCount(commentId);
  }

  // =============================================================================
  // PLAY TRACKING
  // =============================================================================

  getPlayCount(trackId: string): number {
    console.log('🔗 DatabaseService V2: getPlayCount()', trackId);
    return centralDBV2.getPlayCount(trackId);
  }

  // =============================================================================
  // REPORT-FUNKTIONEN
  // =============================================================================

  getReports(): ContentReport[] {
    console.log('🔗 DatabaseService V2: getReports()');
    return centralDBV2.getAllReports();
  }

  addReport(report: ContentReport): boolean {
    console.log('🔗 DatabaseService V2: addReport()', { id: report.id, type: report.type });
    const success = centralDBV2.addReport(report);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string): boolean {
    const success = centralDBV2.updateReportStatus(reportId, status, reviewedBy);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  deleteReport(reportId: string): boolean {
    console.log('🔗 DatabaseService V2: deleteReport()', reportId);
    const success = centralDBV2.deleteReport(reportId);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  // =============================================================================
  // ADMIN-FUNKTIONEN
  // =============================================================================

  deleteAllUserContent(): boolean {
    console.log('🔗 DatabaseService V2: deleteAllUserContent()');
    const success = (centralDBV2 as any).deleteAllUserContent();
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }

  getStats() {
    console.log('🔗 DatabaseService V2: getStats()');
    return centralDBV2.getStats();
  }

  getComments(): any[] {
    console.log('🔗 DatabaseService V2: getComments()');
    const allComments: any[] = [];
    
    const tracks = centralDBV2.getAllTracks();
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
    
    console.log('💬 DatabaseService V2: Gefundene Kommentare:', allComments.length);
    return allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  reset(): void {
    console.log('🔗 DatabaseService V2: reset()');
    centralDBV2.reset();
    this.notifyListeners();
  }

  // =============================================================================
  // LISTENER SYSTEM - Für Echtzeit-Synchronisation
  // =============================================================================

  addListener(callback: () => void): () => void {
    console.log('🔗 DatabaseService V2: addListener() - Anzahl Listener:', this.listeners.size + 1);
    this.listeners.add(callback);
    
    // Return function to remove listener
    return () => {
      this.listeners.delete(callback);
      console.log('🔗 DatabaseService V2: removeListener() - Anzahl Listener:', this.listeners.size);
    };
  }

  notifyListeners(): void {
    console.log('📢 DatabaseService V2: notifyListeners() - Benachrichtige', this.listeners.size, 'Listener');
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ DatabaseService V2: Fehler beim Benachrichtigen eines Listeners:', error);
      }
    });
  }

  // =============================================================================
  // SEARCH & FILTER
  // =============================================================================

  searchTracks(query: string): AudioTrack[] {
    console.log('🔍 DatabaseService V2: searchTracks()', query);
    const allTracks = this.getTracks();
    const lowerQuery = query.toLowerCase();
    
    return allTracks.filter(track => 
      track.title.toLowerCase().includes(lowerQuery) ||
      track.user.username.toLowerCase().includes(lowerQuery) ||
      (track.description && track.description.toLowerCase().includes(lowerQuery)) ||
      (track.tags && track.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  getTracksSorted(sortBy: 'title' | 'user' | 'date' | 'likes' | 'duration' | 'fileSize' | 'plays' = 'date', order: 'asc' | 'desc' = 'desc'): AudioTrack[] {
    console.log('🔗 DatabaseService V2: getTracksSorted()', sortBy, order);
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
        case 'plays':
          aValue = a.plays || 0;
          bValue = b.plays || 0;
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
  // FOLLOWING FEED
  // =============================================================================

  getFollowingFeed(userId: string): AudioTrack[] {
    console.log('🔗 DatabaseService V2: getFollowingFeed()', userId);
    const following = this.getFollowing(userId);
    const followingIds = following.map(user => user.id);
    
    return this.getTracks(userId)
      .filter(track => followingIds.includes(track.userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // =============================================================================
  // VALIDIERUNGEN
  // =============================================================================

  validateTrack(track: Partial<AudioTrack>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!track.title || track.title.trim().length === 0) {
      errors.push('Titel ist erforderlich');
    }
    
    if (!track.url || track.url.trim().length === 0) {
      errors.push('URL ist erforderlich');
    }
    
    if (!track.duration || track.duration <= 0) {
      errors.push('Dauer muss größer als 0 sein');
    }
    
    if (track.tags && Array.isArray(track.tags)) {
      track.tags.forEach(tag => {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          errors.push('Tags müssen nicht-leere Strings sein');
        } else if (tag.length > 24) {
          errors.push('Tags dürfen maximal 24 Zeichen lang sein');
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateComment(comment: Partial<Comment>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!comment.content || comment.content.trim().length === 0) {
      errors.push('Kommentar-Inhalt ist erforderlich');
    }
    
    if (!comment.trackId || comment.trackId.trim().length === 0) {
      errors.push('Track-ID ist erforderlich');
    }
    
    if (!comment.user || !comment.user.id) {
      errors.push('Benutzer ist erforderlich');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateFollow(followerId: string, followeeId: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!followerId || followerId.trim().length === 0) {
      errors.push('Follower-ID ist erforderlich');
    }
    
    if (!followeeId || followeeId.trim().length === 0) {
      errors.push('Followee-ID ist erforderlich');
    }
    
    if (followerId === followeeId) {
      errors.push('Benutzer kann sich nicht selbst folgen');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // =============================================================================
  // DEBUG & DEVELOPMENT
  // =============================================================================

  debug(): void {
    // Debug method - logs removed for performance
  }
}

// Singleton-Export
export const DatabaseServiceV2 = new DatabaseServiceV2Class();

// Export für einfache Verwendung
export default DatabaseServiceV2;
