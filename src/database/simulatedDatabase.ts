import type { AudioTrack, User, Comment } from '../types';

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

  constructor() {
    this.initializeWithDemoData();
  }

  // Initialisiere mit Demo-Daten
  private initializeWithDemoData() {
    // Demo-Benutzer
    const demoUser: User = {
      id: 'user-holla',
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
        userId: 'user-holla'
      },
      {
        id: 'file-holla-2',
        filename: 'asmr_entspannung.wav',
        path: '/uploads/holladiewaldfee/asmr_entspannung.wav',
        size: 5120000, // 5MB
        uploadedAt: new Date(Date.now() - 172800000),
        userId: 'user-holla'
      },
      {
        id: 'file-holla-3',
        filename: 'stille_momente.wav',
        path: '/uploads/holladiewaldfee/stille_momente.wav',
        size: 3840000, // 3.8MB
        uploadedAt: new Date(Date.now() - 259200000),
        userId: 'user-holla'
      }
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
        createdAt: new Date(Date.now() - 86400000),
        fileSize: 2560000,
        filename: 'intime_fluesterstimme.wav',
        comments: [
          {
            id: 'comment-h1-1',
            text: 'Wunderschöne Stimme!',
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
            text: 'Sehr entspannend, danke!',
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
        createdAt: new Date(Date.now() - 172800000),
        fileSize: 5120000,
        filename: 'asmr_entspannung.wav',
        comments: [
          {
            id: 'comment-h2-1',
            text: 'Perfekt zum Einschlafen!',
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
        createdAt: new Date(Date.now() - 259200000),
        fileSize: 3840000,
        filename: 'stille_momente.wav',
        comments: [
          {
            id: 'comment-h3-1',
            text: 'Absolut wundervoll!',
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
            text: 'Mein Favorit!',
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
      }
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

  // Statistiken
  getStats() {
    const tracks = this.getAllTracks();
    const users = this.getAllUsers();
    const files = this.getAllFiles();
    
    return {
      totalUsers: users.length,
      totalTracks: tracks.length,
      totalComments: tracks.reduce((sum, track) => sum + (track.commentsCount || 0), 0),
      totalLikes: tracks.reduce((sum, track) => sum + track.likes, 0),
      totalFileSize: files.reduce((sum, file) => sum + file.size, 0)
    };
  }

  // Delete all user content except Holler die Waldfee (including yevvo)
  deleteAllUserContent(): void {
    const hollaUserId = 'user-holla';
    
    console.log('=== LÖSCHE ALLE BENUTZER-INHALTE (AUßER HOLLER DIE WALDFEE) ===');
    console.log('Vorher - Tracks:', Array.from(this.tracks.keys()));
    console.log('Vorher - Benutzer:', Array.from(this.users.keys()));
    
    // Get all tracks except Holler's (this includes yevvo's tracks)
    const tracksToDelete = Array.from(this.tracks.values())
      .filter(track => track.user.id !== hollaUserId);
    
    console.log('Tracks zum Löschen (inkl. yevvo):', tracksToDelete.map(t => ({ id: t.id, title: t.title, user: t.user.username })));
    
    // Delete tracks and their files (use internal methods to avoid multiple saves)
    tracksToDelete.forEach(track => {
      console.log('Lösche Track:', track.id, track.title, 'von Benutzer:', track.user.username);
      this.deleteTrackInternal(track.id);
    });
    
    // Get all users except Holler (this includes yevvo)
    const usersToDelete = Array.from(this.users.values())
      .filter(user => user.id !== hollaUserId);
    
    console.log('Benutzer zum Löschen (inkl. yevvo):', usersToDelete.map(u => ({ id: u.id, username: u.username })));
    
    // Delete users (use internal methods to avoid multiple saves)
    usersToDelete.forEach(user => {
      console.log('Lösche Benutzer:', user.id, user.username);
      this.deleteUserInternal(user.id);
    });
    
    console.log('Nachher - Tracks:', Array.from(this.tracks.keys()));
    console.log('Nachher - Benutzer:', Array.from(this.users.keys()));
    console.log('=== LÖSCHUNG ABGESCHLOSSEN (NUR HOLLER DIE WALDFEE BLEIBT) ===');
    
    // WICHTIG: Speichere die Änderungen in localStorage (nur einmal am Ende)
    this.saveToLocalStorage();
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
    const data = {
      users: Array.from(this.users.entries()),
      tracks: Array.from(this.tracks.entries()),
      files: Array.from(this.files.entries()),
      comments: Array.from(this.comments.entries())
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
        
        console.log('Datenbank aus localStorage geladen:', {
          users: this.users.size,
          tracks: this.tracks.size,
          files: this.files.size,
          comments: this.comments.size
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
  // Always clean all user content except Holler die Waldfee
  database.deleteAllUserContent();

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
        id: 'user-holla',
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
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO+eizEIHWq+8+OWT',
      user: {
        id: 'user-holla',
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
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO+eizEIHWq+8+OWT',
      user: {
        id: 'user-holla',
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
};

// Speichere Daten bei Änderungen
const originalAddUser = database.addUser.bind(database);
const originalDeleteUser = database.deleteUser.bind(database);
const originalAddTrack = database.addTrack.bind(database);
const originalDeleteTrack = database.deleteTrack.bind(database);
const originalUpdateTrack = database.updateTrack.bind(database);

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
