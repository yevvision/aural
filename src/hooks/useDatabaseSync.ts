import { useEffect } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { useUserStore } from '../stores/userStore';
import { database } from '../database/simulatedDatabase';
import type { AudioTrack } from '../types';

export const useDatabaseSync = () => {
  const { setTracks, deleteTracksByUser, tracks: feedTracks } = useFeedStore();
  const { myTracks, clearAllTracksExceptHoller } = useUserStore();

  // Synchronisiere Datenbank mit Stores beim Laden
  useEffect(() => {
    const syncData = () => {
      // WICHTIG: Verwende nur Datenbank-Tracks für Konsistenz
      const allTracks = database.getAllTracks();
      
      console.log('useDatabaseSync: Lade Tracks aus Datenbank:', allTracks.length);
      console.log('useDatabaseSync: Tracks:', allTracks.map(t => ({ id: t.id, title: t.title, user: t.user.username })));
      
      // Setze die synchronisierten Tracks (nur aus Datenbank)
      setTracks(allTracks);
    };

    syncData();
  }, [setTracks]);

  // Funktionen für Admin-Operationen
  const deleteTrack = (trackId: string) => {
    console.log('=== HOOK: deleteTrack aufgerufen für:', trackId);
    const success = database.deleteTrack(trackId);
    if (success) {
      console.log('Track erfolgreich gelöscht, synchronisiere...');
      
      // Synchronisiere nach dem Löschen
      const allTracks = database.getAllTracks();
      
      console.log('Hook: Setze Tracks nach Löschung:', allTracks.length);
      setTracks(allTracks);
      
      // Lösche auch aus localStorage für FeedStore
      localStorage.removeItem('aural-feed-store');
      console.log('FeedStore localStorage gelöscht');
      
      // Zusätzlich: Lade die Tracks aus der Datenbank neu
      setTimeout(() => {
        console.log('Hook: Lade Tracks aus Datenbank neu...');
        const { loadTracksFromDatabase } = useFeedStore.getState();
        loadTracksFromDatabase();
      }, 100);
    } else {
      console.log('Fehler beim Löschen des Tracks');
    }
    return success;
  };

  const deleteUser = (userId: string) => {
    const success = database.deleteUser(userId);
    if (success) {
      // Synchronisiere nach dem Löschen
      const allTracks = database.getAllTracks();
      setTracks(allTracks);
    }
    return success;
  };

  const updateTrack = (trackId: string, updates: any) => {
    const success = database.updateTrack(trackId, updates);
    if (success) {
      // Synchronisiere nach dem Update
      const allTracks = database.getAllTracks();
      setTracks(allTracks);
    }
    return success;
  };

  const getAllUsers = () => {
    return database.getAllUsers();
  };

  const getAllTracks = () => {
    return database.getAllTracks();
  };

  const getTracksSorted = (sortBy: 'title' | 'user' | 'date' | 'likes' | 'duration' | 'fileSize', order: 'asc' | 'desc' = 'desc') => {
    return database.getTracksSorted(sortBy, order);
  };

  const searchTracks = (query: string) => {
    return database.searchTracks(query);
  };

  const getStats = () => {
    return database.getStats();
  };

  const addTrackToDatabase = (track: AudioTrack) => {
    console.log('useDatabaseSync: Füge Track zur Datenbank hinzu:', track.id, track.title);
    console.log('useDatabaseSync: Track-Details:', {
      id: track.id,
      title: track.title,
      user: track.user.username,
      url: track.url?.substring(0, 50) + '...',
      fileSize: track.fileSize
    });
    
    // Erstelle eine Datei-Eintrag für den Track
    const file = {
      id: `file-${track.id}`,
      filename: track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
      path: `/uploads/${track.user.username}/${track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`}`,
      size: track.fileSize || 0,
      uploadedAt: track.createdAt,
      userId: track.user.id
    };
    
    // Füge Track zur Datenbank hinzu
    database.addTrack(track, file);
    
    // WICHTIG: Prüfe, ob Track wirklich in der Datenbank ist
    const allTracks = database.getAllTracks();
    const addedTrack = allTracks.find(t => t.id === track.id);
    console.log('useDatabaseSync: Track in Datenbank gefunden:', !!addedTrack);
    console.log('useDatabaseSync: Alle Tracks in Datenbank:', allTracks.length);
    
    // Synchronisiere FeedStore mit der Datenbank
    setTracks(allTracks);
    
    console.log('useDatabaseSync: Track zur Datenbank hinzugefügt, FeedStore synchronisiert');
    return true;
  };

  const deleteAllUserContent = () => {
    console.log('=== HOOK: deleteAllUserContent aufgerufen ===');
    
    // Lösche alle Inhalte aus der Datenbank
    database.deleteAllUserContent();
    
    // WICHTIG: Lösche ALLE myTracks (auch yevvo's Tracks)
    // Nur Holler die Waldfee Tracks bleiben erhalten
    const hollaUserId = '4';
    const filteredMyTracks = myTracks.filter(track => track.user.id === hollaUserId);
    
    // Bereinige UserStore - behalte nur Holler-Tracks
    clearAllTracksExceptHoller();
    
    console.log('UserStore: Vorher myTracks:', myTracks.length);
    console.log('UserStore: Nachher myTracks (nur Holler):', filteredMyTracks.length);
    
    // WICHTIG: Bereinige auch FeedStore - lösche alle Tracks außer Holler
    // Finde alle Benutzer-IDs außer Holler (aus beiden Stores)
    const allUserIds = [...new Set([
      ...myTracks.map(track => track.user.id),
      ...feedTracks.map(track => track.user.id)
    ])];
    const nonHollaUserIds = allUserIds.filter(id => id !== hollaUserId);
    
    // Lösche alle Tracks von anderen Benutzern aus dem FeedStore
    nonHollaUserIds.forEach(userId => {
      deleteTracksByUser(userId);
      console.log(`FeedStore: Tracks von Benutzer ${userId} gelöscht`);
    });
    
    // WICHTIG: Lösche auch alle Tracks von anderen Benutzern aus der Datenbank
    // (außer den ersten 3 von Holler, die bereits von deleteAllUserContent behandelt wurden)
    const allDbTracks = database.getAllTracks();
    const nonHollaDbTracks = allDbTracks.filter(track => track.user.id !== hollaUserId);
    nonHollaDbTracks.forEach(track => {
      database.deleteTrack(track.id);
      console.log(`Datenbank: Track ${track.id} von Benutzer ${track.user.id} gelöscht`);
    });
    
    console.log('User Store gefiltert, behalte nur Holler-Tracks:', filteredMyTracks.length);
    console.log('FeedStore bereinigt, alle anderen Benutzer-Tracks (inkl. yevvo) wurden gelöscht');
    
    // Synchronisiere nach dem Löschen
    const allTracks = database.getAllTracks();
    console.log('Hook: Tracks nach Löschung:', allTracks.length);
    
    // Verwende nur Datenbank-Tracks
    console.log('Hook: Setze Tracks:', allTracks.length);
    setTracks(allTracks);
    
    // Lösche auch localStorage für FeedStore
    localStorage.removeItem('aural-feed-store');
    console.log('FeedStore localStorage gelöscht');
    
    // Zusätzlich: Lade die Tracks aus der Datenbank neu
    setTimeout(() => {
      console.log('Hook: Lade Tracks aus Datenbank neu...');
      const { loadTracksFromDatabase } = useFeedStore.getState();
      loadTracksFromDatabase();
      
      // WICHTIG: Erzwinge eine vollständige Neuinitialisierung des FeedStore
      setTimeout(() => {
        console.log('Hook: Erzwinge vollständige Neuinitialisierung...');
        const { setTracks } = useFeedStore.getState();
        const freshDbTracks = database.getAllTracks();
        console.log('Hook: Frische DB-Tracks:', freshDbTracks.length);
        setTracks(freshDbTracks);
        
        // Lösche localStorage komplett und speichere neue Daten
        localStorage.removeItem('aural-feed-store');
        localStorage.setItem('aural-feed-store', JSON.stringify({
          state: { tracks: freshDbTracks, isLoading: false },
          version: 0
        }));
        console.log('Hook: FeedStore localStorage komplett neu geschrieben');
      }, 200);
    }, 100);
    
    return true; // Erfolgreich ausgeführt
  };

  return {
    deleteTrack,
    deleteUser,
    updateTrack,
    getAllUsers,
    getAllTracks,
    getTracksSorted,
    searchTracks,
    getStats,
    deleteAllUserContent,
    addTrackToDatabase
  };
};
