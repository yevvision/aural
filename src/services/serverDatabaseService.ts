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

/**
 * Server-basierter Datenbank-Service
 * Ersetzt die lokale localStorage-basierte Datenbank
 */
class ServerDatabaseServiceClass {
  private baseUrl = 'http://localhost:5175';
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Im Development-Modus (localhost:5175) verwende lokale Datenbank
      if (this.baseUrl.includes('localhost:5175')) {
        console.log('🔧 ServerDatabaseService: Development mode - using local database');
        this.isInitialized = true;
        return;
      }
      
      // Teste Server-Verbindung nur in Production
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Server connection failed: ${response.status}`);
      }
      
      this.isInitialized = true;
      console.log('✅ ServerDatabaseService: Initialized successfully');
    } catch (error) {
      console.error('❌ ServerDatabaseService: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Lädt alle Tracks vom Server
   */
  async getAllTracks(): Promise<AudioTrack[]> {
    await this.initialize();
    
    // Im Development-Modus verwende lokale Datenbank
    if (this.baseUrl.includes('localhost:5175')) {
      try {
        const { centralDB } = await import('../database/centralDatabase_simple');
        const tracks = centralDB.getAllTracks();
        console.log('🔧 ServerDatabaseService: Loaded tracks from local database:', tracks.length);
        return tracks;
      } catch (error) {
        console.error('❌ ServerDatabaseService: Failed to load tracks from local database:', error);
        return [];
      }
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getTracks`);
      if (!response.ok) {
        throw new Error(`Failed to load tracks: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load tracks');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to load tracks:', error);
      return [];
    }
  }

  /**
   * Lädt alle pending Uploads vom Server
   */
  async getPendingUploads(): Promise<PendingUpload[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getPendingUploads`);
      if (!response.ok) {
        throw new Error(`Failed to load pending uploads: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load pending uploads');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to load pending uploads:', error);
      return [];
    }
  }

  /**
   * Lädt die komplette Datenbank vom Server
   */
  async getDatabase(): Promise<any> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to load database: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load database');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to load database:', error);
      return null;
    }
  }

  /**
   * Fügt einen Track zur Datenbank hinzu
   */
  async addTrack(track: AudioTrack): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addTrack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ track })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add track: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add track:', error);
      return false;
    }
  }

  /**
   * Genehmigt einen pending Upload
   */
  async approveUpload(uploadId: string): Promise<AudioTrack | null> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=approveUpload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to approve upload: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve upload');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to approve upload:', error);
      return null;
    }
  }

  /**
   * Löscht einen Track
   */
  async deleteTrack(trackId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=deleteTrack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete track: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to delete track:', error);
      return false;
    }
  }

  /**
   * Lädt einen User
   */
  async getUser(userId: string): Promise<User | null> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getUser&userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to load user: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load user');
      }
      
      return result.data;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to load user:', error);
      return null;
    }
  }

  /**
   * Fügt einen User hinzu
   */
  async addUser(user: User): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add user: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add user:', error);
      return false;
    }
  }

  /**
   * Synchronisiert lokale Daten mit dem Server
   */
  async syncWithServer(): Promise<void> {
    await this.initialize();
    
    try {
      const serverData = await this.getDatabase();
      if (serverData) {
        // Speichere Server-Daten als Backup in localStorage
        localStorage.setItem('aural-server-backup', JSON.stringify(serverData));
        console.log('✅ ServerDatabaseService: Synced with server');
      }
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to sync with server:', error);
    }
  }

  /**
   * Fallback: Lädt Daten aus localStorage wenn Server nicht verfügbar
   */
  getLocalBackup(): any {
    try {
      const backup = localStorage.getItem('aural-server-backup');
      return backup ? JSON.parse(backup) : null;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to load local backup:', error);
      return null;
    }
  }

  // ============================================================================
  // STUB METHODS - Implementierung folgt
  // ============================================================================

  async getAllUsers(): Promise<any[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get users:', error);
      return [];
    }
  }

  async getAllComments(): Promise<any[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      return data.comments || [];
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get comments:', error);
      return [];
    }
  }

  async getAllLikes(): Promise<any[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      return data.likes || [];
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get likes:', error);
      return [];
    }
  }

  async getTrackById(id: string): Promise<AudioTrack | undefined> {
    await this.initialize();
    
    try {
      const tracks = await this.getAllTracks();
      return tracks.find(track => track.id === id);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get track by ID:', error);
      return undefined;
    }
  }

  async getUserById(id: string): Promise<any | undefined> {
    await this.initialize();
    
    try {
      const users = await this.getAllUsers();
      return users.find(user => user.id === id);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get user by ID:', error);
      return undefined;
    }
  }

  async updateUser(userId: string, updates: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=updateUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to update user:', error);
      return false;
    }
  }

  async updateTrack(trackId: string, updates: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=updateTrack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, updates })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to update track:', error);
      return false;
    }
  }

  async addComment(comment: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addComment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add comment:', error);
      return false;
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=deleteComment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to delete comment:', error);
      return false;
    }
  }

  async getLikeByUserAndTrack(userId: string, trackId: string): Promise<any> {
    await this.initialize();
    
    try {
      const likes = await this.getAllLikes();
      return likes.find((like: any) => like.userId === userId && like.trackId === trackId);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get like:', error);
      return null;
    }
  }

  async removeLike(likeId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=removeLike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likeId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to remove like:', error);
      return false;
    }
  }

  async addLike(like: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addLike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(like)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add like:', error);
      return false;
    }
  }

  async getBookmarkByUserAndTrack(userId: string, trackId: string): Promise<any> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      const bookmarks = data.bookmarks || [];
      return bookmarks.find((bookmark: any) => bookmark.userId === userId && bookmark.trackId === trackId);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get bookmark:', error);
      return null;
    }
  }

  async removeBookmark(bookmarkId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=removeBookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to remove bookmark:', error);
      return false;
    }
  }

  async addBookmark(bookmark: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addBookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmark)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add bookmark:', error);
      return false;
    }
  }

  async incrementPlay(trackId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=incrementPlay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to increment play:', error);
      return false;
    }
  }

  async getUserLikedTracks(userId: string): Promise<AudioTrack[]> {
    await this.initialize();
    
    try {
      const likes = await this.getAllLikes();
      const userLikes = likes.filter((like: any) => like.userId === userId);
      const tracks = await this.getAllTracks();
      
      return tracks.filter(track => 
        userLikes.some((like: any) => like.trackId === track.id)
      );
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get user liked tracks:', error);
      return [];
    }
  }

  async getUserBookmarkedTracks(userId: string): Promise<AudioTrack[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      const bookmarks = data.bookmarks || [];
      const userBookmarks = bookmarks.filter((bookmark: any) => bookmark.userId === userId);
      const tracks = await this.getAllTracks();
      
      return tracks.filter(track => 
        userBookmarks.some((bookmark: any) => bookmark.trackId === track.id)
      );
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get user bookmarked tracks:', error);
      return [];
    }
  }

  async getCommentLikeByUserAndComment(userId: string, commentId: string): Promise<any> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      const commentLikes = data.commentLikes || [];
      return commentLikes.find((like: any) => like.userId === userId && like.commentId === commentId);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get comment like:', error);
      return null;
    }
  }

  async removeCommentLike(likeId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=removeCommentLike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likeId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to remove comment like:', error);
      return false;
    }
  }

  async addCommentLike(like: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addCommentLike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(like)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add comment like:', error);
      return false;
    }
  }

  async isCommentLikedByUser(commentId: string, userId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const like = await this.getCommentLikeByUserAndComment(userId, commentId);
      return !!like;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to check comment like status:', error);
      return false;
    }
  }

  async getCommentLikeCount(commentId: string): Promise<number> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      const commentLikes = data.commentLikes || [];
      return commentLikes.filter((like: any) => like.commentId === commentId).length;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get comment like count:', error);
      return 0;
    }
  }

  async getFollowByUsers(followerId: string, targetUserId: string): Promise<any> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      const follows = data.follows || [];
      return follows.find((follow: any) => follow.followerId === followerId && follow.targetUserId === targetUserId);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get follow:', error);
      return null;
    }
  }

  async removeFollow(followId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=removeFollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to remove follow:', error);
      return false;
    }
  }

  async addFollow(follow: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addFollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(follow)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add follow:', error);
      return false;
    }
  }

  async addUserActivity(activity: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addUserActivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add user activity:', error);
      return false;
    }
  }

  async addNotification(notification: any): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addNotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add notification:', error);
      return false;
    }
  }

  async getUserActivities(userId: string): Promise<any[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      const activities = data.userActivities || [];
      return activities.filter((activity: any) => activity.userId === userId);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get user activities:', error);
      return [];
    }
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      const notifications = data.notifications || [];
      return notifications.filter((notification: any) => notification.userId === userId);
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get user notifications:', error);
      return [];
    }
  }

  async markActivityAsRead(activityId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=markActivityAsRead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to mark activity as read:', error);
      return false;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=markNotificationAsRead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to mark notification as read:', error);
      return false;
    }
  }

  async addDemoActivitiesAndNotifications(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addDemoActivitiesAndNotifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add demo activities and notifications:', error);
      return false;
    }
  }

  async forceCreateDemoData(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=forceCreateDemoData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to force create demo data:', error);
      return false;
    }
  }

  async forceAddHollaTracks(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=forceAddHollaTracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to force add Holla tracks:', error);
      return false;
    }
  }

  async debugShowAllData(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 ServerDatabaseService: All data:', data);
      return true;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to debug show all data:', error);
      return false;
    }
  }

  async resetDatabase(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=resetDatabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to reset database:', error);
      return false;
    }
  }

  async testPersistence(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ ServerDatabaseService: Persistence test successful, data:', data);
      return true;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Persistence test failed:', error);
      return false;
    }
  }

  async getAllReports(): Promise<ContentReport[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      return data.reports || [];
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get reports:', error);
      return [];
    }
  }

  async addReport(report: ContentReport): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=addReport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to add report:', error);
      return false;
    }
  }

  async updateReportStatus(reportId: string, status: string, reviewedBy?: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=updateReportStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status, reviewedBy })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to update report status:', error);
      return false;
    }
  }

  async deleteReport(reportId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=deleteReport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to delete report:', error);
      return false;
    }
  }

  async deleteAllUserContent(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=deleteAllUserContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to delete all user content:', error);
      return false;
    }
  }

  async forceDeleteTrack(trackTitle: string, username: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=forceDeleteTrack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle, username })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to force delete track:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getDatabase`);
      if (!response.ok) {
        throw new Error(`Failed to get database: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        totalTracks: data.tracks?.length || 0,
        totalUsers: data.users?.length || 0,
        totalComments: data.comments?.length || 0,
        totalReports: data.reports?.length || 0,
        totalPendingUploads: data.pendingUploads?.length || 0
      };
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get stats:', error);
      return {};
    }
  }

  async searchTracks(query: string): Promise<AudioTrack[]> {
    await this.initialize();
    
    try {
      const tracks = await this.getAllTracks();
      const lowerQuery = query.toLowerCase();
      
      return tracks.filter(track => 
        track.title.toLowerCase().includes(lowerQuery) ||
        track.user.username.toLowerCase().includes(lowerQuery) ||
        (track.description && track.description.toLowerCase().includes(lowerQuery)) ||
        (track.tags && track.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to search tracks:', error);
      return [];
    }
  }

  async getTracksSorted(sortBy: string, order: string): Promise<AudioTrack[]> {
    await this.initialize();
    
    try {
      const tracks = await this.getAllTracks();
      
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
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get sorted tracks:', error);
      return [];
    }
  }

  async rejectUpload(uploadId: string, reason: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=rejectUpload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, reason })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to reject upload:', error);
      return false;
    }
  }

  // Auto-Approve Status Management
  async getAutoApproveStatus(): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getAutoApproveStatus`);
      if (!response.ok) {
        throw new Error(`Failed to get auto approve status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || false;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get auto approve status:', error);
      return false;
    }
  }

  async setAutoApproveStatus(status: boolean): Promise<boolean> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=setAutoApproveStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to set auto approve status:', error);
      return false;
    }
  }

  // User Data Management
  async getUserData(userId: string): Promise<any> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=getUserData&userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to get user data: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to get user data:', error);
      return null;
    }
  }

  async updateUserData(userId: string, userData: any, myTracks: any[], followedUsers: any[]): Promise<any> {
    await this.initialize();
    
    try {
      const response = await fetch(`${this.baseUrl}/upload.php?action=updateUserData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userData, myTracks, followedUsers })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update user data: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ ServerDatabaseService: Failed to update user data:', error);
      return null;
    }
  }

}

// Singleton-Instanz
export const serverDatabaseService = new ServerDatabaseServiceClass();
export default serverDatabaseService;
