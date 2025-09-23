import { DatabaseServiceV2 } from '../services/databaseService_v2';
import { autoMigrate } from '../database/migration';
import type { AudioTrack, User, Notification, PendingUpload, Follow } from '../types';

// Beispiel-Script für die neue V2-Datenbank
export class DatabaseV2Example {
  
  // Beispiel: Migration durchführen
  static async runMigration(): Promise<void> {
    console.log('🚀 Beispiel: Starte Migration...');
    
    const success = await autoMigrate();
    
    if (success) {
      console.log('✅ Beispiel: Migration erfolgreich abgeschlossen');
    } else {
      console.log('❌ Beispiel: Migration fehlgeschlagen');
    }
  }

  // Beispiel: Tracks abrufen und anzeigen
  static displayTracks(): void {
    console.log('📚 Beispiel: Zeige alle Tracks...');
    
    const tracks = DatabaseServiceV2.getTracks();
    console.log(`Gefunden: ${tracks.length} Tracks`);
    
    tracks.forEach(track => {
      console.log(`- ${track.title} von ${track.user.username} (${track.likes} Likes, ${track.plays || 0} Plays)`);
      if (track.tags && track.tags.length > 0) {
        console.log(`  Tags: ${track.tags.join(', ')}`);
      }
    });
  }

  // Beispiel: Follow-System verwenden
  static demonstrateFollowSystem(): void {
    console.log('👥 Beispiel: Follow-System...');
    
    const userId = 'user-1';
    const targetUserId = '4'; // Holler die Waldfee
    
    // Prüfe, ob bereits gefolgt wird
    const isFollowing = DatabaseServiceV2.isFollowing(userId, targetUserId);
    console.log(`User ${userId} folgt User ${targetUserId}: ${isFollowing}`);
    
    if (!isFollowing) {
      // Folge dem User
      const success = DatabaseServiceV2.follow(userId, targetUserId);
      console.log(`Follow erfolgreich: ${success}`);
    }
    
    // Zeige Following-Liste
    const following = DatabaseServiceV2.getFollowing(userId);
    console.log(`User ${userId} folgt:`, following.map(u => u.username));
    
    // Zeige Followers-Liste
    const followers = DatabaseServiceV2.getFollowers(targetUserId);
    console.log(`User ${targetUserId} hat ${followers.length} Follower:`, followers.map(u => u.username));
  }

  // Beispiel: Following-Feed abrufen
  static demonstrateFollowingFeed(): void {
    console.log('📰 Beispiel: Following-Feed...');
    
    const userId = 'user-1';
    const followingFeed = DatabaseServiceV2.getFollowingFeed(userId);
    
    console.log(`Following-Feed für User ${userId}: ${followingFeed.length} Tracks`);
    followingFeed.forEach(track => {
      console.log(`- ${track.title} von ${track.user.username} (${new Date(track.createdAt).toLocaleDateString()})`);
    });
  }

  // Beispiel: Bookmarks verwenden
  static demonstrateBookmarks(): void {
    console.log('🔖 Beispiel: Bookmark-System...');
    
    const userId = 'user-1';
    const trackId = 'holla-1';
    
    // Bookmark hinzufügen
    const success = DatabaseServiceV2.toggleBookmark(trackId, userId);
    console.log(`Bookmark hinzugefügt: ${success}`);
    
    // Bookmarked Tracks abrufen
    const bookmarkedTracks = DatabaseServiceV2.getUserBookmarkedTracks(userId);
    console.log(`Bookmarked Tracks für User ${userId}: ${bookmarkedTracks.length}`);
    bookmarkedTracks.forEach(track => {
      console.log(`- ${track.title} von ${track.user.username}`);
    });
  }

  // Beispiel: Top Tags abrufen
  static demonstrateTopTags(): void {
    console.log('🏷️ Beispiel: Top Tags...');
    
    const topTags = DatabaseServiceV2.getTopTags();
    console.log(`Top ${topTags.length} Tags:`);
    topTags.forEach((tag, index) => {
      console.log(`${index + 1}. ${tag.tag} (${tag.count} mal verwendet)`);
    });
  }

  // Beispiel: Notifications verwenden
  static demonstrateNotifications(): void {
    console.log('🔔 Beispiel: Notification-System...');
    
    const userId = 'user-1';
    
    // Notification hinzufügen
    const notification: Omit<Notification, 'id' | 'createdAt'> = {
      userId,
      type: 'UPLOAD_APPROVED',
      payload: { trackId: 'holla-1', title: 'Intime Flüsterstimme' }
    };
    
    const newNotification = DatabaseServiceV2.addNotification(notification);
    console.log(`Notification hinzugefügt: ${newNotification.id}`);
    
    // Notifications abrufen
    const notifications = DatabaseServiceV2.getUserNotifications(userId);
    console.log(`Notifications für User ${userId}: ${notifications.length}`);
    notifications.forEach(notif => {
      console.log(`- ${notif.type}: ${JSON.stringify(notif.payload)} (${notif.readAt ? 'gelesen' : 'ungelesen'})`);
    });
  }

  // Beispiel: Pending Uploads verwenden
  static demonstratePendingUploads(): void {
    console.log('⏳ Beispiel: Pending Uploads...');
    
    // Pending Upload hinzufügen
    const pendingUpload: Omit<PendingUpload, 'id' | 'createdAt'> = {
      userId: 'user-1',
      deviceId: 'device-123',
      fileHash: 'sha256:abc123...',
      reason: 'rate',
      status: 'pending'
    };
    
    const newPending = DatabaseServiceV2.addPendingUpload(pendingUpload);
    console.log(`Pending Upload hinzugefügt: ${newPending.id}`);
    
    // Pending Uploads auflisten
    const pendingUploads = DatabaseServiceV2.listPendingUploads();
    console.log(`Pending Uploads: ${pendingUploads.length}`);
    pendingUploads.forEach(pending => {
      console.log(`- ${pending.id}: ${pending.reason} (${pending.status})`);
    });
    
    // Pending Upload freigeben (Admin-Funktion)
    const adminId = 'admin-1';
    const approved = DatabaseServiceV2.approvePendingUpload(newPending.id, adminId);
    console.log(`Pending Upload freigegeben: ${approved}`);
  }

  // Beispiel: Comment Likes verwenden
  static demonstrateCommentLikes(): void {
    console.log('❤️ Beispiel: Comment Likes...');
    
    const commentId = 'comment-1';
    const userId = 'user-1';
    
    // Comment Like hinzufügen
    const success = DatabaseServiceV2.toggleCommentLike(commentId, userId);
    console.log(`Comment Like hinzugefügt: ${success}`);
    
    // Comment Like Status prüfen
    const isLiked = DatabaseServiceV2.isCommentLikedByUser(commentId, userId);
    console.log(`Comment ${commentId} von User ${userId} geliked: ${isLiked}`);
    
    // Comment Like Count abrufen
    const likeCount = DatabaseServiceV2.getCommentLikeCount(commentId);
    console.log(`Comment ${commentId} hat ${likeCount} Likes`);
  }

  // Beispiel: Play Tracking verwenden
  static demonstratePlayTracking(): void {
    console.log('▶️ Beispiel: Play Tracking...');
    
    const trackId = 'holla-1';
    
    // Play Count erhöhen
    const success = DatabaseServiceV2.incrementPlay(trackId);
    console.log(`Play Count erhöht: ${success}`);
    
    // Play Count abrufen
    const playCount = DatabaseServiceV2.getPlayCount(trackId);
    console.log(`Track ${trackId} wurde ${playCount} mal abgespielt`);
  }

  // Beispiel: Suche verwenden
  static demonstrateSearch(): void {
    console.log('🔍 Beispiel: Suche...');
    
    // Suche nach "ASMR"
    const asmrTracks = DatabaseServiceV2.searchTracks('ASMR');
    console.log(`Suche nach "ASMR": ${asmrTracks.length} Tracks gefunden`);
    asmrTracks.forEach(track => {
      console.log(`- ${track.title} von ${track.user.username}`);
    });
    
    // Suche nach "holla"
    const hollaTracks = DatabaseServiceV2.searchTracks('holla');
    console.log(`Suche nach "holla": ${hollaTracks.length} Tracks gefunden`);
  }

  // Beispiel: Sortierung verwenden
  static demonstrateSorting(): void {
    console.log('📊 Beispiel: Sortierung...');
    
    // Nach Likes sortieren
    const tracksByLikes = DatabaseServiceV2.getTracksSorted('likes', 'desc');
    console.log('Tracks nach Likes sortiert:');
    tracksByLikes.slice(0, 3).forEach(track => {
      console.log(`- ${track.title}: ${track.likes} Likes`);
    });
    
    // Nach Plays sortieren
    const tracksByPlays = DatabaseServiceV2.getTracksSorted('plays', 'desc');
    console.log('Tracks nach Plays sortiert:');
    tracksByPlays.slice(0, 3).forEach(track => {
      console.log(`- ${track.title}: ${track.plays || 0} Plays`);
    });
  }

  // Beispiel: Validierung verwenden
  static demonstrateValidation(): void {
    console.log('✅ Beispiel: Validierung...');
    
    // Track validieren
    const validTrack: Partial<AudioTrack> = {
      title: 'Test Track',
      url: 'data:audio/wav;base64,test',
      duration: 120,
      tags: ['Test', 'Valid']
    };
    
    const trackValidation = DatabaseServiceV2.validateTrack(validTrack);
    console.log(`Track-Validierung: ${trackValidation.isValid ? 'Gültig' : 'Ungültig'}`);
    if (!trackValidation.isValid) {
      console.log('Fehler:', trackValidation.errors);
    }
    
    // Follow validieren
    const followValidation = DatabaseServiceV2.validateFollow('user-1', 'user-2');
    console.log(`Follow-Validierung: ${followValidation.isValid ? 'Gültig' : 'Ungültig'}`);
    if (!followValidation.isValid) {
      console.log('Fehler:', followValidation.errors);
    }
  }

  // Beispiel: Statistiken anzeigen
  static displayStats(): void {
    console.log('📊 Beispiel: Statistiken...');
    
    const stats = DatabaseServiceV2.getStats();
    console.log('Datenbank-Statistiken:');
    console.log(`- Benutzer: ${stats.totalUsers}`);
    console.log(`- Tracks: ${stats.totalTracks}`);
    console.log(`- Kommentare: ${stats.totalComments}`);
    console.log(`- Likes: ${stats.totalLikes}`);
    console.log(`- Bookmarks: ${stats.totalBookmarks}`);
    console.log(`- Plays: ${stats.totalPlays}`);
    console.log(`- Notifications: ${stats.totalNotifications}`);
    console.log(`- Pending Uploads: ${stats.totalPendingUploads}`);
    console.log(`- Follows: ${stats.totalFollows}`);
    console.log(`- Dateigröße: ${(stats.totalFileSize / 1024 / 1024).toFixed(2)} MB`);
  }

  // Führe alle Beispiele aus
  static async runAllExamples(): Promise<void> {
    console.log('🚀 Beispiel: Starte alle Beispiele...');
    
    try {
      // 1. Migration
      await this.runMigration();
      
      // 2. Grundlegende Funktionen
      this.displayTracks();
      this.displayStats();
      
      // 3. Follow-System
      this.demonstrateFollowSystem();
      this.demonstrateFollowingFeed();
      
      // 4. Bookmarks
      this.demonstrateBookmarks();
      
      // 5. Top Tags
      this.demonstrateTopTags();
      
      // 6. Notifications
      this.demonstrateNotifications();
      
      // 7. Pending Uploads
      this.demonstratePendingUploads();
      
      // 8. Comment Likes
      this.demonstrateCommentLikes();
      
      // 9. Play Tracking
      this.demonstratePlayTracking();
      
      // 10. Suche und Sortierung
      this.demonstrateSearch();
      this.demonstrateSorting();
      
      // 11. Validierung
      this.demonstrateValidation();
      
      console.log('✅ Beispiel: Alle Beispiele erfolgreich ausgeführt');
      
    } catch (error) {
      console.error('❌ Beispiel: Fehler beim Ausführen der Beispiele:', error);
    }
  }
}

// Export für einfache Verwendung
export default DatabaseV2Example;
