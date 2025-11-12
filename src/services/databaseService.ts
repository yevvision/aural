import { centralDB } from '../database/centralDatabase_simple';
import type { AudioTrack, ContentReport } from '../types';

// Database Service - Server-first für Kern-Funktionalität
// Nur Tracks und Pending Uploads sind server-first, Rest bleibt lokal
class DatabaseServiceClass {
  private listeners: Set<() => void> = new Set();
  private serverDataLoaded = false;
  private syncInterval: NodeJS.Timeout | null = null;
  
  // Initialisiere automatische Server-Synchronisation beim Start
  constructor() {
    // Starte automatische Synchronisation beim ersten App-Start
    this.initializeServerSync();
  }
  
  // Initialisiere automatische Server-Synchronisation
  private initializeServerSync(): void {
    // Lade sofort vom Server beim Start
    this.loadTracksFromServer();
    
    // Synchronisiere alle 30 Sekunden automatisch mit dem Server
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      console.log('🔄 DatabaseService: Periodische Server-Synchronisation...');
      this.loadTracksFromServer();
    }, 30000); // Alle 30 Sekunden
    
    console.log('✅ DatabaseService: Automatische Server-Synchronisation aktiviert (alle 30 Sekunden)');
  }

  // =============================================================================
  // SERVER-FIRST DATA LOADING (nur für Tracks)
  // =============================================================================

  // Load tracks from server and sync to local database
  private async loadTracksFromServer(): Promise<void> {
    try {
      console.log('🌐 DatabaseService: Loading tracks from server...');
      
      const { serverDatabaseService } = await import('./serverDatabaseService');
      const serverTracks = await serverDatabaseService.getAllTracks();
      
      // WICHTIG: Lade auch Kommentare vom Server und integriere sie in Tracks!
      let serverComments: any[] = [];
      try {
        serverComments = await serverDatabaseService.getAllComments();
        console.log('💬 DatabaseService: Server comments loaded:', serverComments.length);
        
        // Integriere Kommentare in Tracks basierend auf trackId
        const commentsByTrackId = new Map<string, any[]>();
        serverComments.forEach((comment: any) => {
          if (comment.trackId) {
            if (!commentsByTrackId.has(comment.trackId)) {
              commentsByTrackId.set(comment.trackId, []);
            }
            commentsByTrackId.get(comment.trackId)!.push(comment);
          }
        });
        
        // Füge Kommentare zu den entsprechenden Tracks hinzu
        serverTracks.forEach((track: any) => {
          const trackComments = commentsByTrackId.get(track.id) || [];
          if (trackComments.length > 0) {
            track.comments = trackComments;
            console.log(`💬 DatabaseService: ${trackComments.length} Kommentare zu Track ${track.id} hinzugefügt`);
          } else if (!track.comments) {
            track.comments = []; // Stelle sicher, dass comments immer ein Array ist
          }
        });
      } catch (error) {
        console.warn('⚠️ DatabaseService: Fehler beim Laden der Kommentare vom Server:', error);
        // Fallback: Verwende Kommentare aus den Tracks selbst, falls vorhanden
      }
      
      if (serverTracks && serverTracks.length > 0) {
        console.log('🌐 DatabaseService: Server tracks loaded:', serverTracks.length);
        
        // Sync local database with server tracks
        // WICHTIG: Überschreibe NUR die Tracks, behalte Likes/Bookmarks-Maps!
        // Prüfe ob getDatabase verfügbar ist, sonst verwende direkten Zugriff
        let currentData: any;
        try {
          if (centralDB && typeof centralDB.getDatabase === 'function') {
            currentData = centralDB.getDatabase();
          } else {
            // Fallback: Zugriff über internes data-Property (falls verfügbar)
            console.warn('⚠️ DatabaseService: getDatabase nicht verfügbar, verwende direkten Zugriff');
            currentData = (centralDB as any).data || {
              likes: new Map(),
              bookmarks: new Map(),
              playsMap: new Map(),
              commentLikesMap: new Map(),
              tracks: []
            };
          }
        } catch (error) {
          console.error('❌ DatabaseService: Fehler beim Zugriff auf Datenbank:', error);
          // Verwende leere Maps als Fallback
          currentData = {
            likes: new Map(),
            bookmarks: new Map(),
            playsMap: new Map(),
            commentLikesMap: new Map(),
            tracks: []
          };
        }
        
        // Stelle sicher, dass Maps existieren (könnte Array sein nach JSON-Parsing)
        if (!(currentData.likes instanceof Map)) {
          const likesMap = new Map<string, Set<string>>();
          if (Array.isArray(currentData.likes)) {
            currentData.likes.forEach((item: any) => {
              if (item.trackId && Array.isArray(item.userIds)) {
                likesMap.set(item.trackId, new Set(item.userIds));
              }
            });
          }
          currentData.likes = likesMap;
        }
        
        if (!(currentData.bookmarks instanceof Map)) {
          const bookmarksMap = new Map<string, Set<string>>();
          if (Array.isArray(currentData.bookmarks)) {
            currentData.bookmarks.forEach((item: any) => {
              if (item.trackId && Array.isArray(item.userIds)) {
                bookmarksMap.set(item.trackId, new Set(item.userIds));
              }
            });
          }
          currentData.bookmarks = bookmarksMap;
        }
        
        if (!(currentData.playsMap instanceof Map)) {
          const playsMap = new Map<string, number>();
          if (Array.isArray(currentData.playsMap)) {
            currentData.playsMap.forEach((item: any) => {
              if (item.trackId && typeof item.count === 'number') {
                playsMap.set(item.trackId, item.count);
              }
            });
          }
          currentData.playsMap = playsMap;
        }
        
        // WICHTIG: Lade Likes, Bookmarks und Plays vom Server und merge sie mit lokalen!
        try {
          // Lade Likes vom Server
          const serverLikes = await serverDatabaseService.getAllLikes();
          console.log('❤️ DatabaseService: Server likes loaded:', serverLikes.length);
          
          // Konvertiere Server-Likes in Map-Format
          serverLikes.forEach((like: any) => {
            if (like.trackId && like.userId) {
              if (!currentData.likes.has(like.trackId)) {
                currentData.likes.set(like.trackId, new Set<string>());
              }
              currentData.likes.get(like.trackId)!.add(like.userId);
            }
          });
          
          // Lade Bookmarks vom Server
          const serverBookmarks = await serverDatabaseService.getAllBookmarks();
          console.log('🔖 DatabaseService: Server bookmarks loaded:', serverBookmarks.length);
          
          // Konvertiere Server-Bookmarks in Map-Format
          serverBookmarks.forEach((bookmark: any) => {
            if (bookmark.trackId && bookmark.userId) {
              if (!currentData.bookmarks.has(bookmark.trackId)) {
                currentData.bookmarks.set(bookmark.trackId, new Set<string>());
              }
              currentData.bookmarks.get(bookmark.trackId)!.add(bookmark.userId);
            }
          });
          
          // Lade Plays vom Server
          const serverPlays = await serverDatabaseService.getAllPlays();
          console.log('▶️ DatabaseService: Server plays loaded:', serverPlays.length);
          
          // Konvertiere Server-Plays in Map-Format
          serverPlays.forEach((play: any) => {
            if (play.trackId && typeof play.count === 'number') {
              // Merge: Verwende Maximum zwischen Server und lokal
              const localPlays = currentData.playsMap.get(play.trackId) || 0;
              currentData.playsMap.set(play.trackId, Math.max(localPlays, play.count));
            }
          });
          
          console.log('✅ DatabaseService: Likes/Bookmarks/Plays vom Server synchronisiert:', {
            likes: currentData.likes.size,
            bookmarks: currentData.bookmarks.size,
            plays: currentData.playsMap.size
          });
        } catch (error) {
          console.warn('⚠️ DatabaseService: Fehler beim Laden von Likes/Bookmarks/Plays vom Server:', error);
          // Fallback: Verwende lokale Daten
        }
        
        // Speichere die Like/Bookmark/Plays-Maps nach dem Merge
        const savedLikes = new Map(currentData.likes);
        const savedBookmarks = new Map(currentData.bookmarks);
        const savedPlaysMap = new Map(currentData.playsMap);
        
        // WICHTIG: Bereinige Server-Tracks von dynamischen Werten!
        const cleanedServerTracks = serverTracks.map(track => {
          const { 
            likes: _likes, 
            isLiked: _isLiked, 
            isBookmarked: _isBookmarked, 
            plays: _plays,
            commentsCount: _commentsCount,
            ...cleanTrack 
          } = track;
          
          // Bereinige auch Kommentare innerhalb der Tracks
          if (cleanTrack.comments) {
            cleanTrack.comments = cleanTrack.comments.map((comment: any) => {
              const { likes: _cLikes, isLiked: _cIsLiked, ...cleanComment } = comment;
              return cleanComment;
            });
          }
          
          return cleanTrack;
        });
        
        // Überschreibe nur die Tracks (bereinigt!)
        currentData.tracks = cleanedServerTracks;
        
        // Stelle die Like/Bookmark/Plays-Maps wieder her (mit Server-Daten gemerged)
        currentData.likes = savedLikes;
        currentData.bookmarks = savedBookmarks;
        currentData.playsMap = savedPlaysMap;
        
        console.log('💾 DatabaseService: Tracks aktualisiert, Likes/Bookmarks/Plays vom Server synchronisiert:', {
          tracksCount: currentData.tracks.length,
          likesCount: currentData.likes.size,
          bookmarksCount: currentData.bookmarks.size,
          playsCount: currentData.playsMap.size
        });
        
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
    // Lade IMMER vom Server, auch wenn bereits geladen (für aktuelle Daten)
    // Aber nur wenn noch nicht geladen oder wenn genug Zeit vergangen ist
    if (!this.serverDataLoaded) {
      this.loadTracksFromServer();
    }
    return centralDB.getAllTracks(currentUserId);
  }
  
  // Manuelle Synchronisation mit dem Server
  async syncWithServer(): Promise<void> {
    console.log('🔄 DatabaseService: Manuelle Server-Synchronisation gestartet...');
    await this.loadTracksFromServer();
  }

  // GET: Track by ID
  getTrack(id: string): AudioTrack | undefined {
    return centralDB.getTrackById(id);
  }

  // GET: Database object (for direct access to maps)
  getDatabase(): any {
    return centralDB.getDatabase();
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
  async addCommentToTrack(trackId: string, comment: any): Promise<boolean> {
    // WICHTIG: Stelle sicher, dass trackId im Kommentar enthalten ist für Server-Speicherung!
    const commentWithTrackId = {
      ...comment,
      trackId: trackId // Stelle sicher, dass trackId gesetzt ist
    };
    
    // WICHTIG: Aktualisiere IMMER die lokale Datenbank, auch wenn Server erfolgreich ist!
    // Das stellt sicher, dass Kommentare sofort verfügbar sind
    let serverSuccess = false;
    try {
      // Server-first approach - sende Kommentar mit trackId zum Server
      const { serverDatabaseService } = await import('./serverDatabaseService');
      serverSuccess = await serverDatabaseService.addComment(commentWithTrackId);
      if (serverSuccess) {
        console.log('✅ DatabaseService: Server addComment erfolgreich (trackId:', trackId, ')');
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server addCommentToTrack failed, using local fallback:', error);
    }
    
    // WICHTIG: Aktualisiere IMMER die lokale Datenbank, unabhängig vom Server-Ergebnis!
    // Das stellt sicher, dass Kommentare sofort im UI sichtbar sind
    const localSuccess = centralDB.addCommentToTrack(trackId, comment);
    
    if (localSuccess) {
      console.log('✅ DatabaseService: Lokaler Kommentar hinzugefügt');
      this.notifyListeners();
    } else {
      console.error('❌ DatabaseService: Lokaler Kommentar konnte nicht hinzugefügt werden');
    }
    
    // WICHTIG: Wenn Server erfolgreich war, synchronisiere lokal mit Server-Daten
    if (serverSuccess) {
      console.log('✅ DatabaseService: Kommentar erfolgreich auf Server gespeichert');
      setTimeout(() => this.loadTracksFromServer(), 5000);
    }
    
    // Return true wenn Server ODER lokal erfolgreich war
    return serverSuccess || localSuccess;
  }

  // DELETE: Kommentar von Track löschen
  async deleteCommentFromTrack(trackId: string, commentId: string): Promise<boolean> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      const success = await serverDatabaseService.deleteComment(commentId);
      if (success) {
        this.notifyListeners();
      }
      return success;
    } catch (error) {
      console.error('❌ DatabaseService: Server deleteCommentFromTrack failed, using local fallback:', error);
      // Fallback to local
      const success = centralDB.deleteCommentFromTrack(trackId, commentId);
      if (success) {
        this.notifyListeners();
      }
      return success;
    }
  }

  // LIKE: Track liken/unliken
  async toggleLike(trackId: string, userId: string): Promise<boolean> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      
      // Check if like already exists
      let existingLike: any = null;
      try {
        existingLike = await serverDatabaseService.getLikeByUserAndTrack(userId, trackId);
      } catch (error) {
        console.warn('⚠️ DatabaseService: getLikeByUserAndTrack fehlgeschlagen, verwende lokalen Fallback:', error);
        // Falle direkt zum lokalen Fallback
        throw error;
      }
      
      let serverSuccess = false;
      
      if (existingLike) {
        // Remove like
        serverSuccess = await serverDatabaseService.removeLike(existingLike.id);
        if (serverSuccess) {
          console.log('✅ DatabaseService: Server removeLike erfolgreich');
        }
      } else {
        // Add like
        const like = {
          id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          trackId,
          userId,
          createdAt: new Date().toISOString()
        };
        serverSuccess = await serverDatabaseService.addLike(like);
        if (serverSuccess) {
          console.log('✅ DatabaseService: Server addLike erfolgreich');
        }
      }
      
      // WICHTIG: Aktualisiere IMMER die lokale Datenbank, auch wenn Server erfolgreich ist!
      // Das stellt sicher, dass Likes sofort im UI sichtbar sind
      const localSuccess = centralDB.toggleLike(trackId, userId);
      
      if (localSuccess) {
        console.log('✅ DatabaseService: Lokaler Like aktualisiert');
        this.notifyListeners();
      } else {
        console.error('❌ DatabaseService: Lokaler Like konnte nicht aktualisiert werden');
      }
      
      // WICHTIG: Wenn Server erfolgreich war, synchronisiere lokal mit Server-Daten
      // Das stellt sicher, dass lokale und Server-Daten übereinstimmen
      if (serverSuccess) {
        console.log('✅ DatabaseService: Like erfolgreich auf Server gespeichert');
        // Optional: Trigger periodische Sync, um sicherzustellen, dass alles synchronisiert ist
        setTimeout(() => this.loadTracksFromServer(), 5000);
      }
      
      // Return true wenn Server ODER lokal erfolgreich war
      return serverSuccess || localSuccess;
    } catch (error) {
      console.error('❌ DatabaseService: Server toggleLike failed, using local fallback:', error);
      // Fallback to local - WICHTIG: Dies ist die primäre Methode, da Server fehlschlägt
      console.log('📱 DatabaseService: Verwende lokalen Fallback für toggleLike');
      const success = centralDB.toggleLike(trackId, userId);
      console.log('📱 DatabaseService: Lokaler toggleLike Result:', success);
      
      if (success) {
        // WICHTIG: Warte kurz, damit saveToStorage() fertig ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Stelle sicher, dass die Daten gespeichert sind
        console.log('📱 DatabaseService: Prüfe Like-Daten nach Speicherung...');
        
        // Prüfe direkt in der Datenbank
        let trackLikes: Set<string> | undefined;
        try {
          const dbData = (centralDB as any).getDatabase?.();
          if (dbData?.likes) {
            trackLikes = dbData.likes.get(trackId);
          }
        } catch (error) {
          console.warn('⚠️ DatabaseService: getDatabase nicht verfügbar:', error);
        }
        console.log('📱 DatabaseService: Like-Daten direkt aus Map:', {
          trackId,
          hasLikesSet: !!trackLikes,
          likesSize: trackLikes?.size || 0,
          userIdInMap: trackLikes?.has(userId) || false,
          allUserIds: trackLikes ? Array.from(trackLikes) : []
        });
        
        const tracks = centralDB.getAllTracks(userId);
        const updatedTrack = tracks.find(t => t.id === trackId);
        if (updatedTrack) {
          console.log('📱 DatabaseService: Track nach toggleLike (via getAllTracks):', {
            trackId,
            isLiked: updatedTrack.isLiked,
            likes: updatedTrack.likes
          });
        } else {
          console.warn('⚠️ DatabaseService: Track nicht gefunden nach toggleLike:', trackId);
        }
        
        this.notifyListeners();
      }
      return success;
    }
  }

  // BOOKMARK: Track bookmarken/unbookmarken
  async toggleBookmark(trackId: string, userId: string): Promise<boolean> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      
      // Check if bookmark already exists
      let existingBookmark: any = null;
      try {
        existingBookmark = await serverDatabaseService.getBookmarkByUserAndTrack(userId, trackId);
      } catch (error) {
        console.warn('⚠️ DatabaseService: getBookmarkByUserAndTrack fehlgeschlagen, verwende lokalen Fallback:', error);
        throw error;
      }
      
      let serverSuccess = false;
      
      if (existingBookmark) {
        // Remove bookmark
        serverSuccess = await serverDatabaseService.removeBookmark(existingBookmark.id);
        if (serverSuccess) {
          console.log('✅ DatabaseService: Server removeBookmark erfolgreich');
        }
      } else {
        // Add bookmark
        const bookmark = {
          id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          trackId,
          userId,
          createdAt: new Date().toISOString()
        };
        serverSuccess = await serverDatabaseService.addBookmark(bookmark);
        if (serverSuccess) {
          console.log('✅ DatabaseService: Server addBookmark erfolgreich');
        }
      }
      
      // WICHTIG: Aktualisiere IMMER die lokale Datenbank, auch wenn Server erfolgreich ist!
      // Das stellt sicher, dass Bookmarks sofort im UI sichtbar sind
      const localSuccess = centralDB.toggleBookmark(trackId, userId);
      
      if (localSuccess) {
        console.log('✅ DatabaseService: Lokaler Bookmark aktualisiert');
        this.notifyListeners();
      } else {
        console.error('❌ DatabaseService: Lokaler Bookmark konnte nicht aktualisiert werden');
      }
      
      // WICHTIG: Wenn Server erfolgreich war, synchronisiere lokal mit Server-Daten
      if (serverSuccess) {
        console.log('✅ DatabaseService: Bookmark erfolgreich auf Server gespeichert');
        setTimeout(() => this.loadTracksFromServer(), 5000);
      }
      
      // Return true wenn Server ODER lokal erfolgreich war
      return serverSuccess || localSuccess;
    } catch (error) {
      console.error('❌ DatabaseService: Server toggleBookmark failed, using local fallback:', error);
      // Fallback to local - WICHTIG: Dies ist die primäre Methode, da Server fehlschlägt
      console.log('📱 DatabaseService: Verwende lokalen Fallback für toggleBookmark');
      const success = centralDB.toggleBookmark(trackId, userId);
      
      if (success) {
        // WICHTIG: Warte kurz, damit saveToStorage() fertig ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Stelle sicher, dass die Daten gespeichert sind
        console.log('📱 DatabaseService: Prüfe Bookmark-Daten nach Speicherung...');
        
        // Prüfe direkt in der Datenbank
        let trackBookmarks: Set<string> | undefined;
        try {
          const dbData = (centralDB as any).getDatabase?.();
          if (dbData?.bookmarks) {
            trackBookmarks = dbData.bookmarks.get(trackId);
          }
        } catch (error) {
          console.warn('⚠️ DatabaseService: getDatabase nicht verfügbar:', error);
        }
        
        console.log('📱 DatabaseService: Bookmark-Daten direkt aus Map:', {
          trackId,
          hasBookmarksSet: !!trackBookmarks,
          bookmarksSize: trackBookmarks?.size || 0,
          userIdInMap: trackBookmarks?.has(userId) || false,
          allUserIds: trackBookmarks ? Array.from(trackBookmarks) : []
        });
        
        const tracks = centralDB.getAllTracks(userId);
        const updatedTrack = tracks.find(t => t.id === trackId);
        if (updatedTrack) {
          console.log('📱 DatabaseService: Track nach toggleBookmark (via getAllTracks):', {
            trackId,
            isBookmarked: updatedTrack.isBookmarked
          });
        }
        
        this.notifyListeners();
      }
      return success;
    }
  }

  // PLAY: Play-Anzahl erhöhen
  async incrementPlay(trackId: string): Promise<boolean> {
    let serverSuccess = false;
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      serverSuccess = await serverDatabaseService.incrementPlay(trackId);
      if (serverSuccess) {
        console.log('✅ DatabaseService: Server incrementPlay erfolgreich für Track:', trackId);
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server incrementPlay failed, using local fallback:', error);
    }
    
    // WICHTIG: Aktualisiere IMMER die lokale Datenbank, auch wenn Server erfolgreich ist!
    // Das stellt sicher, dass Plays sofort im UI sichtbar sind
    const localSuccess = centralDB.incrementPlay(trackId);
    
    if (localSuccess) {
      console.log('✅ DatabaseService: Lokaler Play erhöht');
      this.notifyListeners();
    } else {
      console.error('❌ DatabaseService: Lokaler Play konnte nicht erhöht werden');
    }
    
    // WICHTIG: Wenn Server erfolgreich war, synchronisiere lokal mit Server-Daten
    if (serverSuccess) {
      console.log('✅ DatabaseService: Play erfolgreich auf Server gespeichert');
      setTimeout(() => this.loadTracksFromServer(), 5000);
    }
    
    // Return true wenn Server ODER lokal erfolgreich war
    return serverSuccess || localSuccess;
  }

  // GET: User's liked tracks
  async getUserLikedTracks(userId: string): Promise<AudioTrack[]> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      return await serverDatabaseService.getUserLikedTracks(userId);
    } catch (error) {
      console.error('❌ DatabaseService: Server getUserLikedTracks failed, using local fallback:', error);
      // Fallback to local
      return centralDB.getUserLikedTracks(userId);
    }
  }

  // GET: User's bookmarked tracks
  async getUserBookmarkedTracks(userId: string): Promise<AudioTrack[]> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      return await serverDatabaseService.getUserBookmarkedTracks(userId);
    } catch (error) {
      console.error('❌ DatabaseService: Server getUserBookmarkedTracks failed, using local fallback:', error);
      // Fallback to local
      return centralDB.getUserBookmarkedTracks(userId);
    }
  }

  // LIKE: Comment liken/unliken
  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      
      // Check if comment like already exists
      const existingLike = await serverDatabaseService.getCommentLikeByUserAndComment(userId, commentId);
      
      if (existingLike) {
        // Remove comment like
        const success = await serverDatabaseService.removeCommentLike(existingLike.id);
        if (success) {
          this.notifyListeners();
        }
        return success;
      } else {
        // Add comment like
        const commentLike = {
          id: `commentLike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          commentId,
          userId,
          createdAt: new Date().toISOString()
        };
        const success = await serverDatabaseService.addCommentLike(commentLike);
        if (success) {
          this.notifyListeners();
        }
        return success;
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server toggleCommentLike failed, using local fallback:', error);
      // Fallback to local
      const success = centralDB.toggleCommentLike(commentId, userId);
      if (success) {
        this.notifyListeners();
      }
      return success;
    }
  }

  // GET: Comment like status for user
  async isCommentLikedByUser(commentId: string, userId: string): Promise<boolean> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      return await serverDatabaseService.isCommentLikedByUser(commentId, userId);
    } catch (error) {
      console.error('❌ DatabaseService: Server isCommentLikedByUser failed, using local fallback:', error);
      // Fallback to local
      return centralDB.isCommentLikedByUser(commentId, userId);
    }
  }

  // GET: Comment like count
  async getCommentLikeCount(commentId: string): Promise<number> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      return await serverDatabaseService.getCommentLikeCount(commentId);
    } catch (error) {
      console.error('❌ DatabaseService: Server getCommentLikeCount failed, using local fallback:', error);
      // Fallback to local
      return centralDB.getCommentLikeCount(commentId);
    }
  }

  // FOLLOW: User folgen/entfolgen
  async toggleFollow(followerId: string, targetUserId: string): Promise<boolean> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      
      // Check if follow already exists
      const existingFollow = await serverDatabaseService.getFollowByUsers(followerId, targetUserId);
      
      if (existingFollow) {
        // Remove follow
        const success = await serverDatabaseService.removeFollow(existingFollow.id);
        if (success) {
          this.notifyListeners();
        }
        return success;
      } else {
        // Add follow
        const follow = {
          id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          followerId,
          followingId: targetUserId,
          createdAt: new Date().toISOString()
        };
        const success = await serverDatabaseService.addFollow(follow);
        if (success) {
          this.notifyListeners();
        }
        return success;
      }
    } catch (error) {
      console.error('❌ DatabaseService: Server toggleFollow failed, using local fallback:', error);
      // Fallback to local
      const success = centralDB.toggleFollow(followerId, targetUserId);
      if (success) {
        this.notifyListeners();
      }
      return success;
    }
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

  // GET: Alle Kommentare abrufen (server-first)
  async getComments(): Promise<any[]> {
    try {
      // Server-first approach
      const { serverDatabaseService } = await import('./serverDatabaseService');
      return await serverDatabaseService.getAllComments();
    } catch (error) {
      console.error('❌ DatabaseService: Server getComments failed, using local fallback:', error);
      // Fallback to local
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
