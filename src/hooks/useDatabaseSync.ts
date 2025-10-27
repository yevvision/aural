import { useEffect } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { useUserStore } from '../stores/userStore';
import { centralDB } from '../database/centralDatabase_simple';
import type { AudioTrack } from '../types';

export const useDatabaseSync = () => {
  const { setTracks, deleteTracksByUser, tracks: feedTracks } = useFeedStore();
  const { myTracks, clearAllTracksExceptHoller } = useUserStore();

  // Synchronisiere Datenbank mit Stores beim Laden
  useEffect(() => {
    const syncData = async () => {
      try {
        // OPTION C: SYNCHRONISIERUNG - Server-first, dann lokal
        console.log('🔄 useDatabaseSync: Lade Tracks server-first...');
        
        // Versuche Server-Daten zu laden
        const { serverDatabaseService } = await import('../services/serverDatabaseService');
        const serverTracks = await serverDatabaseService.getAllTracks();
        
        if (serverTracks && serverTracks.length > 0) {
          console.log('🌐 useDatabaseSync: Loaded tracks from server:', serverTracks.length);
          console.log('🌐 useDatabaseSync: Server tracks:', serverTracks.map(t => ({ id: t.id, title: t.title, user: t.user.username })));
          
          // Setze die Server-Tracks
          setTracks(serverTracks);
          
          // WICHTIG: Keine lokale Synchronisation mehr!
          // upload.php speichert bereits auf dem Server, UploadPage synchronisiert lokal
          // Hier würden wir nur Duplikate erstellen
          console.log('✅ useDatabaseSync: Server tracks geladen - keine lokale Synchronisation nötig');
        } else {
          // Fallback zu lokaler Datenbank
          const allTracks = centralDB.getAllTracks();
          console.log('📱 useDatabaseSync: Fallback to local database:', allTracks.length);
          console.log('📱 useDatabaseSync: Local tracks:', allTracks.map(t => ({ id: t.id, title: t.title, user: t.user.username })));
          
          // Setze die lokalen Tracks
          setTracks(allTracks);
        }
      } catch (error) {
        console.error('❌ useDatabaseSync: Server load failed, using local database:', error);
        // Fallback zu lokaler Datenbank
        const allTracks = centralDB.getAllTracks();
        console.log('📱 useDatabaseSync: Fallback to local database:', allTracks.length);
        setTracks(allTracks);
      }
    };

    syncData();
  }, [setTracks]);

  // Funktionen für Admin-Operationen
  const deleteTrack = (trackId: string) => {
    console.log('=== HOOK: deleteTrack aufgerufen für:', trackId);
    const success = centralDB.deleteTrack(trackId);
    if (success) {
      console.log('Track erfolgreich gelöscht, synchronisiere...');
      
      // Synchronisiere nach dem Löschen
      const allTracks = centralDB.getAllTracks();
      
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
    const success = centralDB.deleteUser ? centralDB.deleteUser(userId) : false;
    if (success) {
      // Synchronisiere nach dem Löschen
      const allTracks = centralDB.getAllTracks();
      setTracks(allTracks);
    }
    return success;
  };

  const updateTrack = (trackId: string, updates: any) => {
    const success = centralDB.updateTrack(trackId, updates);
    if (success) {
      // Synchronisiere nach dem Update
      const allTracks = centralDB.getAllTracks();
      setTracks(allTracks);
    }
    return success;
  };

  const getAllUsers = () => {
    return centralDB.getAllUsers();
  };

  const getAllTracks = () => {
    return centralDB.getAllTracks();
  };

  const getTracksSorted = (sortBy: 'title' | 'user' | 'date' | 'likes' | 'duration' | 'fileSize', order: 'asc' | 'desc' = 'desc') => {
    return centralDB.getTracksSorted ? centralDB.getTracksSorted(sortBy, order) : [];
  };

  const searchTracks = (query: string) => {
    return centralDB.searchTracks ? centralDB.searchTracks(query) : [];
  };

  const getStats = () => {
    return centralDB.getStats();
  };

  const addTrackToDatabase = async (track: AudioTrack) => {
    console.log('🔄 useDatabaseSync: OPTION C - Synchronisiere Track:', track.id, track.title);
    console.log('🔄 useDatabaseSync: Track-Details:', {
      id: track.id,
      title: track.title,
      user: track.user.username,
      url: track.url?.substring(0, 50) + '...',
      fileSize: track.fileSize
    });
    
    // OPTION C: SYNCHRONISIERUNG - upload.php hat bereits gespeichert, nur lokal synchronisieren
    console.log('🔄 useDatabaseSync: upload.php hat bereits gespeichert, synchronisiere lokal...');
    
    // Lokal hinzufügen für sofortige Anzeige (upload.php hat bereits auf Server gespeichert)
    centralDB.addTrack(track);
    
    // WICHTIG: Prüfe, ob Track wirklich in der lokalen Datenbank ist
    const allTracks = centralDB.getAllTracks();
    const addedTrack = allTracks.find(t => t.id === track.id);
    console.log('✅ useDatabaseSync: Track in lokaler Datenbank gefunden:', !!addedTrack);
    console.log('✅ useDatabaseSync: Alle Tracks in lokaler Datenbank:', allTracks.length);
    
    // Synchronisiere FeedStore mit der lokalen Datenbank
    setTracks(allTracks);
    
    console.log('✅ useDatabaseSync: Track lokal synchronisiert - upload.php hat bereits auf Server gespeichert');
    return true;
  };

  const deleteAllUserContent = () => {
    console.log('=== HOOK: deleteAllUserContent aufgerufen ===');
    
    // Lösche alle Inhalte aus der Datenbank
    centralDB.deleteAllUserContent();
    
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
    const allDbTracks = centralDB.getAllTracks();
    const nonHollaDbTracks = allDbTracks.filter(track => track.user.id !== hollaUserId);
    nonHollaDbTracks.forEach(track => {
      centralDB.deleteTrack(track.id);
      console.log(`Datenbank: Track ${track.id} von Benutzer ${track.user.id} gelöscht`);
    });
    
    console.log('User Store gefiltert, behalte nur Holler-Tracks:', filteredMyTracks.length);
    console.log('FeedStore bereinigt, alle anderen Benutzer-Tracks (inkl. yevvo) wurden gelöscht');
    
    // Synchronisiere nach dem Löschen
    const allTracks = centralDB.getAllTracks();
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
        const freshDbTracks = centralDB.getAllTracks();
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
