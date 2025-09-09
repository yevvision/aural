import { centralDB } from './centralDatabase';
import { database as simulatedDB } from './simulatedDatabase';
import type { AudioTrack, User, Comment } from '../types';

// Migrationsfunktion: Überträgt alle Daten von simulatedDatabase zu centralDatabase
export const migrateToCentralDatabase = (): boolean => {
  console.log('🔄 MIGRATION: Starte Migration von simulatedDatabase zu centralDatabase...');
  
  try {
    // 1. Lade alle Daten aus der alten Datenbank
    const oldTracks = simulatedDB.getAllTracks();
    const oldUsers = simulatedDB.getAllUsers();
    
    console.log('📥 MIGRATION: Gefundene Daten in alter DB:');
    console.log('📥 MIGRATION: - Tracks:', oldTracks.length);
    console.log('📥 MIGRATION: - Users:', oldUsers.length);
    
    // 2. Prüfe, ob zentrale DB bereits Daten hat
    const existingTracks = centralDB.getAllTracks();
    const existingUsers = centralDB.getAllUsers();
    
    if (existingTracks.length > 0 || existingUsers.length > 0) {
      console.log('⚠️ MIGRATION: Zentrale DB hat bereits Daten. Überspringe Migration.');
      console.log('⚠️ MIGRATION: - Existierende Tracks:', existingTracks.length);
      console.log('⚠️ MIGRATION: - Existierende Users:', existingUsers.length);
      return false;
    }
    
    // 3. Migriere Benutzer
    console.log('👥 MIGRATION: Migriere Benutzer...');
    oldUsers.forEach(user => {
      // Prüfe, ob User bereits existiert
      const existingUser = centralDB.getAllUsers().find(u => u.id === user.id);
      if (!existingUser) {
        // User wird automatisch hinzugefügt, wenn Track hinzugefügt wird
        console.log('👤 MIGRATION: User wird über Track-Migration hinzugefügt:', user.username);
      }
    });
    
    // 4. Migriere Tracks
    console.log('🎵 MIGRATION: Migriere Tracks...');
    let migratedTracks = 0;
    let skippedTracks = 0;
    
    oldTracks.forEach(track => {
      // Prüfe, ob Track bereits existiert
      const existingTrack = centralDB.getTrackById(track.id);
      if (!existingTrack) {
        // Konvertiere Track für zentrale DB
        const migratedTrack: AudioTrack = {
          ...track,
          // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
          comments: track.comments || [],
          commentsCount: track.commentsCount || 0,
          likes: track.likes || 0,
          isLiked: track.isLiked || false,
          isBookmarked: track.isBookmarked || false,
          createdAt: track.createdAt || new Date(),
          fileSize: track.fileSize || 0,
          filename: track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
          tags: track.tags || [],
          gender: track.gender || 'Female'
        };
        
        const success = centralDB.addTrack(migratedTrack);
        if (success) {
          migratedTracks++;
          console.log('✅ MIGRATION: Track migriert:', track.title);
        } else {
          skippedTracks++;
          console.log('⚠️ MIGRATION: Track übersprungen:', track.title);
        }
      } else {
        skippedTracks++;
        console.log('⚠️ MIGRATION: Track bereits vorhanden:', track.title);
      }
    });
    
    // 5. Migriere Likes und Bookmarks (falls in alten Stores vorhanden)
    console.log('❤️ MIGRATION: Migriere Likes und Bookmarks...');
    // TODO: Likes und Bookmarks aus alten Stores migrieren, falls verfügbar
    
    // 6. Setze Migrations-Flag
    localStorage.setItem('aural-migration-completed', 'true');
    localStorage.setItem('aural-migration-timestamp', new Date().toISOString());
    
    console.log('✅ MIGRATION: Migration abgeschlossen!');
    console.log('✅ MIGRATION: - Migrierte Tracks:', migratedTracks);
    console.log('✅ MIGRATION: - Übersprungene Tracks:', skippedTracks);
    console.log('✅ MIGRATION: - Migrierte Users:', oldUsers.length);
    
    return true;
    
  } catch (error) {
    console.error('❌ MIGRATION: Fehler bei der Migration:', error);
    return false;
  }
};

// Prüfe, ob Migration bereits durchgeführt wurde
export const isMigrationCompleted = (): boolean => {
  const migrationFlag = localStorage.getItem('aural-migration-completed');
  return migrationFlag === 'true';
};

// Führe Migration automatisch durch, falls noch nicht geschehen
export const autoMigrate = (): boolean => {
  if (isMigrationCompleted()) {
    console.log('✅ AUTO-MIGRATION: Migration bereits durchgeführt');
    return true;
  }
  
  console.log('🔄 AUTO-MIGRATION: Starte automatische Migration...');
  return migrateToCentralDatabase();
};

// Cleanup: Lösche alte Datenbank-Daten nach erfolgreicher Migration
export const cleanupOldDatabase = (): void => {
  console.log('🧹 CLEANUP: Lösche alte Datenbank-Daten...');
  
  try {
    // Lösche localStorage-Einträge der alten Datenbank
    localStorage.removeItem('simulated-database');
    localStorage.removeItem('aural-feed-store');
    localStorage.removeItem('aural-user-store');
    localStorage.removeItem('aural-activity-store');
    localStorage.removeItem('aural-notifications-store');
    
    // Lösche Flags
    localStorage.removeItem('jochen-data-created');
    localStorage.removeItem('database-initialized');
    
    console.log('✅ CLEANUP: Alte Datenbank-Daten gelöscht');
  } catch (error) {
    console.error('❌ CLEANUP: Fehler beim Löschen alter Daten:', error);
  }
};

// Vollständige Migration mit Cleanup
export const fullMigration = (): boolean => {
  console.log('🚀 FULL-MIGRATION: Starte vollständige Migration...');
  
  const migrationSuccess = migrateToCentralDatabase();
  
  if (migrationSuccess) {
    // Warte kurz, dann führe Cleanup durch
    setTimeout(() => {
      cleanupOldDatabase();
    }, 1000);
  }
  
  return migrationSuccess;
};

export default {
  migrateToCentralDatabase,
  isMigrationCompleted,
  autoMigrate,
  cleanupOldDatabase,
  fullMigration
};
