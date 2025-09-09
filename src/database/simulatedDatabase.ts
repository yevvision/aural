import type { AudioTrack, User, Comment, ContentReport } from '../types';

// Simulierte Datei-Struktur
interface DatabaseFile {
  id: string;
  filename: string;
  path: string;
  size: number;
  uploadedAt: Date;
  userId: string;
}

// Simulierte Datenbank-Klasse
class SimulatedDatabase {
  private users: Map<string, User> = new Map();
  private tracks: Map<string, AudioTrack> = new Map();
  private files: Map<string, DatabaseFile> = new Map();
  private comments: Map<string, Comment> = new Map();
  private reports: Map<string, ContentReport> = new Map();
  private commentLikes: Map<string, Set<string>> = new Map(); // commentId -> Set of userIds who liked

  constructor() {
    this.loadFromLocalStorage();
    // Füge jochen-Daten hinzu, falls sie noch nicht existieren
    // WICHTIG: Nur einmal beim ersten Start erstellen
    this.ensureJochenData();
  }

  // Stelle sicher, dass jochen-Daten existieren
  private ensureJochenData() {
    const jochenUserId = 'jochen-1';
    
    // Prüfe, ob jochen bereits existiert
    if (this.users.has(jochenUserId)) {
      console.log('jochen-Daten bereits vorhanden, keine Änderungen');
      return;
    }
    
    // Prüfe, ob jochen-Daten bereits in localStorage existieren
    const jochenDataExists = localStorage.getItem('jochen-data-created');
    if (jochenDataExists) {
      console.log('jochen-Daten wurden bereits erstellt, überspringe');
      return;
    }
    
    // WICHTIG: Erstelle jochen-Daten nur einmal
    console.log('Erstelle neue jochen-Daten...');
    
    // Erstelle neuen jochen-Benutzer
    const jochenUser: User = {
      id: jochenUserId,
      username: 'jochen',
      email: 'jochen@example.com',
      totalLikes: 0,
      totalUploads: 2,
      createdAt: new Date(Date.now() - 86400000),
      isVerified: false
    };
    this.users.set(jochenUserId, jochenUser);
    
    // Erstelle erste jochen-Datei
    const jochenFile1: DatabaseFile = {
      id: 'file-jochen-1',
      filename: 'jochen_erste_aufnahme.wav',
      path: '/uploads/jochen/jochen_erste_aufnahme.wav',
      size: 1800000,
      uploadedAt: new Date(Date.now() - 86400000),
      userId: jochenUserId
    };
    this.files.set(jochenFile1.id, jochenFile1);
    
    // Erstelle zweite jochen-Datei
    const jochenFile2: DatabaseFile = {
      id: 'file-jochen-2',
      filename: 'jochen_zweite_aufnahme.wav',
      path: '/uploads/jochen/jochen_zweite_aufnahme.wav',
      size: 2200000,
      uploadedAt: new Date(Date.now() - 43200000), // 12 Stunden alt
      userId: jochenUserId
    };
    this.files.set(jochenFile2.id, jochenFile2);
    
    // Erstelle ersten jochen-Track
    const jochenTrack1: AudioTrack = {
      id: 'jochen-1',
      title: 'Jochens erste Aufnahme',
      description: 'Eine entspannende Aufnahme von Jochen',
      duration: 120,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
      user: jochenUser,
      likes: 5,
      commentsCount: 2,
      createdAt: new Date(Date.now() - 86400000),
      fileSize: 1800000,
      filename: 'jochen_erste_aufnahme.wav',
      comments: [
        {
          id: 'comment-j1-1',
          content: 'Sehr schöne Aufnahme!',
          user: {
            id: 'user-1',
            username: 'you',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date()
          },
          trackId: 'jochen-1',
          createdAt: new Date(Date.now() - 3600000)
        }
      ]
    };
    this.tracks.set(jochenTrack1.id, jochenTrack1);
    
    // Erstelle zweiten jochen-Track
    const jochenTrack2: AudioTrack = {
      id: 'jochen-2',
      title: 'Jochens zweite Aufnahme',
      description: 'Eine weitere tolle Aufnahme von Jochen',
      duration: 95,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
      user: jochenUser,
      likes: 3,
      commentsCount: 1,
      createdAt: new Date(Date.now() - 43200000),
      fileSize: 2200000,
      filename: 'jochen_zweite_aufnahme.wav',
      comments: []
    };
    this.tracks.set(jochenTrack2.id, jochenTrack2);
    
    // Speichere in localStorage
    this.saveToLocalStorage();
    
    // Setze Flag, dass jochen-Daten erstellt wurden
    localStorage.setItem('jochen-data-created', 'true');
    
    console.log('Neue jochen-Daten erfolgreich erstellt: 2 Tracks');
  }

  // Initialisiere mit Demo-Daten
  private initializeWithDemoData() {
    // Demo-Benutzer
    const demoUser: User = {
      id: '4',
      username: 'holladiewaldfee',
      email: 'holla@example.com',
      totalLikes: 0,
      totalUploads: 3,
      createdAt: new Date(Date.now() - 172800000),
      isVerified: true
    };

    this.users.set(demoUser.id, demoUser);

    // Demo-Audio-Tracks
    const demoFiles: DatabaseFile[] = [
      {
        id: 'file-holla-1',
        filename: 'intime_fluesterstimme.wav',
        path: '/uploads/holladiewaldfee/intime_fluesterstimme.wav',
        size: 2560000, // 2.5MB
        uploadedAt: new Date(Date.now() - 86400000),
        userId: '4'
      },
      {
        id: 'file-holla-2',
        filename: 'asmr_entspannung.wav',
        path: '/uploads/holladiewaldfee/asmr_entspannung.wav',
        size: 5120000, // 5MB
        uploadedAt: new Date(Date.now() - 172800000),
        userId: '4'
      },
      {
        id: 'file-holla-3',
        filename: 'stille_momente.wav',
        path: '/uploads/holladiewaldfee/stille_momente.wav',
        size: 3840000, // 3.8MB
        uploadedAt: new Date(Date.now() - 259200000),
        userId: '4'
      },
    ];

    // Speichere Dateien
    demoFiles.forEach(file => {
      this.files.set(file.id, file);
    });

    // Demo-Audio-Tracks
    const demoTracks: AudioTrack[] = [
      {
        id: 'holla-1',
        title: 'Intime Flüsterstimme',
        description: 'Eine sanfte, beruhigende Stimme für entspannte Momente',
        duration: 195, // 3:15 Minuten
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        user: demoUser,
        likes: 23,
        commentsCount: 5,
        createdAt: new Date(Date.now() - 86400000), // 1 Tag alt
        fileSize: 2560000,
        filename: 'intime_fluesterstimme.wav',
        comments: [
        {
          id: 'comment-h1-1',
          content: 'Wunderschöne Stimme!',
          user: {
            id: 'user-1',
            username: 'you',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date()
          },
          trackId: 'holla-1',
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          id: 'comment-h1-2',
          content: 'Sehr entspannend, danke!',
          user: {
            id: 'user-1',
            username: 'you',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date()
          },
          trackId: 'holla-1',
          createdAt: new Date(Date.now() - 7200000)
        }
        ]
      },
      {
        id: 'holla-2',
        title: 'ASMR Entspannung',
        description: 'Sanfte Geräusche und Flüstern für tiefe Entspannung',
        duration: 420, // 7 Minuten
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        user: demoUser,
        likes: 18,
        commentsCount: 3,
        createdAt: new Date(Date.now() - 172800000), // 2 Tage alt
        fileSize: 5120000,
        filename: 'asmr_entspannung.wav',
        comments: [
        {
          id: 'comment-h2-1',
          content: 'Perfekt zum Einschlafen!',
          user: {
            id: 'user-1',
            username: 'you',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date()
          },
          trackId: 'holla-2',
          createdAt: new Date(Date.now() - 14400000)
        }
        ]
      },
      {
        id: 'holla-3',
        title: 'Stille Momente',
        description: 'Eine ruhige, meditative Erfahrung',
        duration: 300, // 5 Minuten
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
        user: demoUser,
        likes: 31,
        commentsCount: 7,
        createdAt: new Date(Date.now() - 259200000), // 3 Tage alt
        fileSize: 3840000,
        filename: 'stille_momente.wav',
        comments: [
        {
          id: 'comment-h3-1',
          content: 'Absolut wundervoll!',
          user: {
            id: 'user-1',
            username: 'you',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date()
          },
          trackId: 'holla-3',
          createdAt: new Date(Date.now() - 21600000)
        },
        {
          id: 'comment-h3-2',
          content: 'Mein Favorit!',
          user: {
            id: 'user-1',
            username: 'you',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date()
          },
          trackId: 'holla-3',
          createdAt: new Date(Date.now() - 18000000)
        }
        ]
      },
    ];

    // Speichere Tracks
    demoTracks.forEach(track => {
      this.tracks.set(track.id, track);
    });

    // Speichere Kommentare
    demoTracks.forEach(track => {
      if (track.comments) {
        track.comments.forEach(comment => {
          this.comments.set(comment.id, comment);
        });
      }
    });
  }

  // Benutzer-Operationen
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  deleteUser(userId: string): boolean {
    // Lösche alle Tracks des Benutzers
    const userTracks = Array.from(this.tracks.values()).filter(track => track.user.id === userId);
    userTracks.forEach(track => {
      this.deleteTrack(track.id);
    });

    // Lösche alle Dateien des Benutzers
    const userFiles = Array.from(this.files.values()).filter(file => file.userId === userId);
    userFiles.forEach(file => {
      this.files.delete(file.id);
    });

    // Lösche den Benutzer
    return this.users.delete(userId);
  }

  // Track-Operationen
  getAllTracks(): AudioTrack[] {
    const tracks = Array.from(this.tracks.values());
    
    // Aktualisiere Dateigröße aus den Dateien
    return tracks.map(track => {
      const file = Array.from(this.files.values()).find(f => 
        f.userId === track.user.id && f.filename === track.filename
      );
      
      if (file) {
        return {
          ...track,
          fileSize: file.size,
          filename: file.filename
        };
      }
      
      return track;
    });
  }

  getTrackById(id: string): AudioTrack | undefined {
    return this.tracks.get(id);
  }

  addTrack(track: AudioTrack, file: DatabaseFile): void {
    // Ensure track has fileSize from file
    const trackWithFileSize = {
      ...track,
      fileSize: file.size,
      filename: file.filename
    };
    this.tracks.set(track.id, trackWithFileSize);
    this.files.set(file.id, file);
  }

  deleteTrack(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (track) {
      // Lösche alle Kommentare des Tracks
      if (track.comments) {
        track.comments.forEach(comment => {
          this.comments.delete(comment.id);
        });
      }

      // Lösche die zugehörige Datei
      const file = Array.from(this.files.values()).find(f => f.userId === track.user.id && f.filename === track.filename);
      if (file) {
        this.files.delete(file.id);
      }

      // Lösche den Track
      return this.tracks.delete(trackId);
    }
    return false;
  }

  updateTrack(trackId: string, updates: Partial<AudioTrack>): boolean {
    const track = this.tracks.get(trackId);
    if (track) {
      const updatedTrack = { ...track, ...updates };
      this.tracks.set(trackId, updatedTrack);
      return true;
    }
    return false;
  }

  // Datei-Operationen
  getAllFiles(): DatabaseFile[] {
    return Array.from(this.files.values());
  }

  getFileById(id: string): DatabaseFile | undefined {
    return this.files.get(id);
  }

  getFilesByUser(userId: string): DatabaseFile[] {
    return Array.from(this.files.values()).filter(file => file.userId === userId);
  }

  // Sortierung und Filterung
  getTracksSorted(sortBy: string, order: 'asc' | 'desc' = 'desc'): AudioTrack[] {
    const tracks = this.getAllTracks();
    
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
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'fileSize':
          aValue = a.fileSize || 0;
          bValue = b.fileSize || 0;
          break;
        case 'likes':
          aValue = a.likes;
          bValue = b.likes;
          break;
        case 'comments':
          aValue = a.commentsCount || 0;
          bValue = b.commentsCount || 0;
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

  searchTracks(query: string): AudioTrack[] {
    const tracks = this.getAllTracks();
    const lowerQuery = query.toLowerCase();
    
    return tracks.filter(track => 
      track.title.toLowerCase().includes(lowerQuery) ||
      track.user.username.toLowerCase().includes(lowerQuery) ||
      (track.description && track.description.toLowerCase().includes(lowerQuery))
    );
  }

  // Report-Operationen
  getAllReports(): ContentReport[] {
    return Array.from(this.reports.values());
  }

  getReportById(id: string): ContentReport | undefined {
    return this.reports.get(id);
  }

  addReport(report: ContentReport): void {
    this.reports.set(report.id, report);
  }

  updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string): boolean {
    const report = this.reports.get(reportId);
    if (report) {
      const updatedReport = {
        ...report,
        status,
        reviewedAt: new Date(),
        reviewedBy
      };
      this.reports.set(reportId, updatedReport);
      return true;
    }
    return false;
  }

  deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  // LIKE: Comment liken/unliken
  toggleCommentLike(commentId: string, userId: string): boolean {
    console.log('❤️ SimulatedDB: toggleCommentLike()', commentId, userId);
    
    // Hole oder erstelle Set für diesen Kommentar
    if (!this.commentLikes.has(commentId)) {
      this.commentLikes.set(commentId, new Set());
    }
    
    const commentLikes = this.commentLikes.get(commentId)!;
    const wasLiked = commentLikes.has(userId);
    
    if (wasLiked) {
      // Unlike
      commentLikes.delete(userId);
      console.log('💔 SimulatedDB: Comment like entfernt');
    } else {
      // Like
      commentLikes.add(userId);
      console.log('❤️ SimulatedDB: Comment like hinzugefügt');
    }
    
    return true;
  }

  // GET: Comment like status for user
  isCommentLikedByUser(commentId: string, userId: string): boolean {
    const commentLikes = this.commentLikes.get(commentId);
    return commentLikes ? commentLikes.has(userId) : false;
  }

  // GET: Comment like count
  getCommentLikeCount(commentId: string): number {
    const commentLikes = this.commentLikes.get(commentId);
    return commentLikes ? commentLikes.size : 0;
  }

  // Statistiken
  getStats() {
    const tracks = this.getAllTracks();
    const users = this.getAllUsers();
    const files = this.getAllFiles();
    const reports = this.getAllReports();
    
    return {
      totalUsers: users.length,
      totalTracks: tracks.length,
      totalComments: tracks.reduce((sum, track) => sum + (track.commentsCount || 0), 0),
      totalLikes: tracks.reduce((sum, track) => sum + track.likes, 0),
      totalFileSize: files.reduce((sum, file) => sum + file.size, 0),
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length
    };
  }

  // Delete all user content except first 3 tracks from Holler die Waldfee
  deleteAllUserContent(): void {
    const hollaUserId = '4';
    
    console.log('=== LÖSCHE ALLE BENUTZER-INHALTE (AUßER ERSTE 3 VON HOLLER DIE WALDFEE) ===');
    console.log('Vorher - Tracks:', Array.from(this.tracks.keys()));
    console.log('Vorher - Benutzer:', Array.from(this.users.keys()));
    
    // Hole alle aktuellen Tracks
    const allTracks = Array.from(this.tracks.values());
    
    // Finde Holler die Waldfee Tracks und sortiere sie nach Datum (neueste zuerst)
    const hollaTracks = allTracks
      .filter(track => track.user.id === hollaUserId)
      .sort((a, b) => {
        // Sortiere nach ID als Fallback, falls Datum gleich ist
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (dateA === dateB) {
          return a.id.localeCompare(b.id);
        }
        return dateB - dateA;
      });
    
    console.log('Gefundene Holler-Tracks:', hollaTracks.length);
    
    // Behalte nur die ersten 3 (neuesten) Holler-Tracks
    const tracksToKeep = hollaTracks.slice(0, 3);
    console.log('Behalte Holler-Tracks:', tracksToKeep.map(t => t.id));
    console.log('Lösche Holler-Tracks:', hollaTracks.slice(3).map(t => t.id));
    
    // Lösche ALLE Tracks und Benutzer
    this.tracks.clear();
    this.users.clear();
    this.files.clear();
    this.comments.clear();
    this.reports.clear();
    this.commentLikes.clear();
    
    // Alle Tracks wurden bereits gelöscht durch clear()
    
    console.log('Alle Daten gelöscht');
    
    // Erstelle Holler die Waldfee Benutzer neu
    const hollaUser: User = {
      id: '4',
      username: 'holladiewaldfee',
      email: 'holla@example.com',
      totalLikes: 0,
      totalUploads: tracksToKeep.length,
      createdAt: new Date(Date.now() - 172800000),
      isVerified: true
    };
    this.users.set(hollaUser.id, hollaUser);
    
    // Füge nur die ersten 3 Holler-Tracks zur Datenbank hinzu
    tracksToKeep.forEach(track => {
      // Aktualisiere den User-Referenz
      const updatedTrack = {
        ...track,
        user: hollaUser
      };
      this.tracks.set(track.id, updatedTrack);
      
      // Erstelle auch die Datei-Einträge
      const file = {
        id: `file-${track.id}`,
        filename: track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
        path: `/uploads/holladiewaldfee/${track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`}`,
        size: track.fileSize || 0,
        uploadedAt: track.createdAt,
        userId: track.user.id
      };
      this.files.set(file.id, file);
    });
    
    console.log('Nachher - Tracks:', Array.from(this.tracks.keys()));
    console.log('Nachher - Benutzer:', Array.from(this.users.keys()));
    console.log('=== LÖSCHUNG ABGESCHLOSSEN (NUR ERSTE 3 HOLLER-TRACKS BLEIBEN) ===');
    
    // WICHTIG: Speichere die Änderungen in localStorage (nur einmal am Ende)
    this.saveToLocalStorage();
    
    // Lösche auch die Initialisierungs-Flags, damit Daten nicht wieder erstellt werden
    localStorage.removeItem('jochen-data-created');
    localStorage.removeItem('database-initialized');
    
    console.log('Änderungen in localStorage gespeichert');
  }

  // Interne Methoden ohne automatisches Speichern
  private deleteTrackInternal(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (track) {
      // Lösche alle Kommentare des Tracks
      if (track.comments) {
        track.comments.forEach(comment => {
          this.comments.delete(comment.id);
        });
      }

      // Lösche die zugehörige Datei
      const file = Array.from(this.files.values()).find(f => f.userId === track.user.id && f.filename === track.filename);
      if (file) {
        this.files.delete(file.id);
      }

      // Lösche den Track
      return this.tracks.delete(trackId);
    }
    return false;
  }

  private deleteUserInternal(userId: string): boolean {
    // Lösche alle Tracks des Benutzers
    const userTracks = Array.from(this.tracks.values()).filter(track => track.user.id === userId);
    userTracks.forEach(track => {
      this.deleteTrackInternal(track.id);
    });

    // Lösche alle Dateien des Benutzers
    const userFiles = Array.from(this.files.values()).filter(file => file.userId === userId);
    userFiles.forEach(file => {
      this.files.delete(file.id);
    });

    // Lösche den Benutzer
    return this.users.delete(userId);
  }

  // Persistierung (simuliert)
  saveToLocalStorage(): void {
    // Konvertiere commentLikes Map zu serialisierbarem Format
    const commentLikesArray = Array.from(this.commentLikes.entries()).map(([commentId, userIds]) => ({
      commentId,
      userIds: Array.from(userIds)
    }));

    const data = {
      users: Array.from(this.users.entries()),
      tracks: Array.from(this.tracks.entries()),
      files: Array.from(this.files.entries()),
      comments: Array.from(this.comments.entries()),
      reports: Array.from(this.reports.entries()),
      commentLikes: commentLikesArray
    };
    localStorage.setItem('simulated-database', JSON.stringify(data));
  }

  loadFromLocalStorage(): void {
    const data = localStorage.getItem('simulated-database');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        
        // Konvertiere Arrays zurück zu Maps
        this.users = new Map(parsed.users || []);
        this.tracks = new Map(parsed.tracks || []);
        this.files = new Map(parsed.files || []);
        this.comments = new Map(parsed.comments || []);
        this.reports = new Map(parsed.reports || []);
        
        // Konvertiere commentLikes Array zurück zu Map
        this.commentLikes = new Map<string, Set<string>>();
        if (parsed.commentLikes && Array.isArray(parsed.commentLikes)) {
          parsed.commentLikes.forEach((item: { commentId: string; userIds: string[] }) => {
            if (item && item.commentId && Array.isArray(item.userIds)) {
              this.commentLikes.set(item.commentId, new Set(item.userIds));
            }
          });
        }
        
        console.log('Datenbank aus localStorage geladen:', {
          users: this.users.size,
          tracks: this.tracks.size,
          files: this.files.size,
          comments: this.comments.size,
          reports: this.reports.size,
          commentLikes: this.commentLikes.size
        });
      } catch (error) {
        console.error('Fehler beim Laden der Datenbank:', error);
        this.initializeWithDemoData();
      }
    } else {
      console.log('Keine Daten in localStorage gefunden, initialisiere mit Demo-Daten');
      this.initializeWithDemoData();
    }
  }
}

// Singleton-Instanz
export const database = new SimulatedDatabase();

  // Lade Daten beim Start
database.loadFromLocalStorage();

// Funktion zum Bereinigen der Datenbank beim Start
export const initializeCleanDatabase = () => {
  // NICHT automatisch löschen - nur manuell über roten Button
  console.log('Datenbank initialisiert - keine automatische Löschung');

  // WICHTIG: Prüfe, ob die Datenbank bereits initialisiert wurde
  const isInitialized = localStorage.getItem('database-initialized');
  if (isInitialized) {
    console.log('Datenbank bereits initialisiert, überspringe');
    return;
  }

  // Check if Holler tracks exist, if not add them
  const existingTracks = database.getAllTracks();
  const hasHollaTracks = existingTracks.some(track => track.user.username === 'holladiewaldfee');
  
  if (!hasHollaTracks) {
    // Add Holladiewaldfee tracks
    const hollaTracks: AudioTrack[] = [
    {
      id: 'holla-1',
      title: 'Intime Flüsterstimme',
      description: 'Eine sanfte, beruhigende Stimme für entspannte Momente',
      duration: 195,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
      user: {
        id: '4',
        username: 'holladiewaldfee',
        email: 'holla@example.com',
        totalLikes: 0,
        totalUploads: 3,
        createdAt: new Date(Date.now() - 172800000),
        isVerified: true
      },
      likes: 23,
      commentsCount: 5,
      createdAt: new Date(Date.now() - 86400000),
      fileSize: 2560000,
      filename: 'intime_fluesterstimme.wav',
      comments: []
    },
    {
      id: 'holla-2',
      title: 'ASMR Entspannung',
      description: 'Sanfte Geräusche und Flüstern für tiefe Entspannung',
      duration: 420,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
      user: {
        id: '4',
        username: 'holladiewaldfee',
        email: 'holla@example.com',
        totalLikes: 0,
        totalUploads: 3,
        createdAt: new Date(Date.now() - 172800000),
        isVerified: true
      },
      likes: 18,
      commentsCount: 3,
      createdAt: new Date(Date.now() - 172800000),
      fileSize: 5120000,
      filename: 'asmr_entspannung.wav',
      comments: []
    },
    {
      id: 'holla-3',
      title: 'Stille Momente',
      description: 'Eine ruhige, meditative Erfahrung',
      duration: 300,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
      user: {
        id: '4',
        username: 'holladiewaldfee',
        email: 'holla@example.com',
        totalLikes: 0,
        totalUploads: 3,
        createdAt: new Date(Date.now() - 172800000),
        isVerified: true
      },
      likes: 31,
      commentsCount: 7,
      createdAt: new Date(Date.now() - 259200000),
      fileSize: 3840000,
      filename: 'stille_momente.wav',
      comments: []
    }
  ];
  
  // Füge Holla-Tracks zur Datenbank hinzu
  hollaTracks.forEach(track => {
    const file = {
      id: `file-${track.id}`,
      filename: track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
      path: `/uploads/holladiewaldfee/${track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`}`,
      size: track.fileSize || 0,
      uploadedAt: track.createdAt,
      userId: track.user.id
    };
      database.addTrack(track, file);
    });
  }
  
  // Setze Flag, dass Datenbank initialisiert wurde
  localStorage.setItem('database-initialized', 'true');
  console.log('Datenbank initialisiert - Flag gesetzt');
};

// Speichere Daten bei Änderungen
const originalAddUser = database.addUser.bind(database);
const originalDeleteUser = database.deleteUser.bind(database);
const originalAddTrack = database.addTrack.bind(database);
const originalDeleteTrack = database.deleteTrack.bind(database);
const originalUpdateTrack = database.updateTrack.bind(database);
const originalAddReport = database.addReport.bind(database);
const originalUpdateReportStatus = database.updateReportStatus.bind(database);
const originalDeleteReport = database.deleteReport.bind(database);
const originalToggleCommentLike = database.toggleCommentLike.bind(database);

database.addUser = function(user: User) {
  originalAddUser(user);
  this.saveToLocalStorage();
};

database.deleteUser = function(userId: string) {
  const result = originalDeleteUser(userId);
  this.saveToLocalStorage();
  return result;
};

database.addTrack = function(track: AudioTrack, file: DatabaseFile) {
  originalAddTrack(track, file);
  this.saveToLocalStorage();
};

database.deleteTrack = function(trackId: string) {
  const result = originalDeleteTrack(trackId);
  this.saveToLocalStorage();
  return result;
};

database.updateTrack = function(trackId: string, updates: Partial<AudioTrack>) {
  const result = originalUpdateTrack(trackId, updates);
  this.saveToLocalStorage();
  return result;
};

database.addReport = function(report: ContentReport) {
  originalAddReport(report);
  this.saveToLocalStorage();
};

database.updateReportStatus = function(reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string) {
  const result = originalUpdateReportStatus(reportId, status, reviewedBy);
  this.saveToLocalStorage();
  return result;
};

database.deleteReport = function(reportId: string) {
  const result = originalDeleteReport(reportId);
  this.saveToLocalStorage();
  return result;
};

database.toggleCommentLike = function(commentId: string, userId: string) {
  const result = originalToggleCommentLike(commentId, userId);
  this.saveToLocalStorage();
  return result;
};
