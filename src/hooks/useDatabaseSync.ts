import { useEffect } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { useUserStore } from '../stores/userStore';
import { database } from '../database/simulatedDatabase';

export const useDatabaseSync = () => {
  const { setTracks } = useFeedStore();
  const { myTracks, filterMyTracksByUser } = useUserStore();

  // Synchronisiere Datenbank mit Stores beim Laden
  useEffect(() => {
    const syncData = () => {
      // Lade alle Tracks aus der Datenbank
      const allTracks = database.getAllTracks();
      
      // Kombiniere mit eigenen Tracks (falls vorhanden)
      const combinedTracks = [...allTracks, ...myTracks];
      
      // Entferne Duplikate basierend auf ID
      const uniqueTracks = combinedTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
      
      // Setze die synchronisierten Tracks
      setTracks(uniqueTracks);
    };

    syncData();
  }, [setTracks, myTracks]);

  // Funktionen für Admin-Operationen
  const deleteTrack = (trackId: string) => {
    const success = database.deleteTrack(trackId);
    if (success) {
      // Synchronisiere nach dem Löschen
      const allTracks = database.getAllTracks();
      const combinedTracks = [...allTracks, ...myTracks];
      const uniqueTracks = combinedTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
      setTracks(uniqueTracks);
    }
    return success;
  };

  const deleteUser = (userId: string) => {
    const success = database.deleteUser(userId);
    if (success) {
      // Synchronisiere nach dem Löschen
      const allTracks = database.getAllTracks();
      const combinedTracks = [...allTracks, ...myTracks];
      const uniqueTracks = combinedTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
      setTracks(uniqueTracks);
    }
    return success;
  };

  const updateTrack = (trackId: string, updates: any) => {
    const success = database.updateTrack(trackId, updates);
    if (success) {
      // Synchronisiere nach dem Update
      const allTracks = database.getAllTracks();
      const combinedTracks = [...allTracks, ...myTracks];
      const uniqueTracks = combinedTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
      setTracks(uniqueTracks);
    }
    return success;
  };

  const getAllUsers = () => {
    return database.getAllUsers();
  };

  const getAllTracks = () => {
    return database.getAllTracks();
  };

  const getTracksSorted = (sortBy: string, order: 'asc' | 'desc' = 'desc') => {
    return database.getTracksSorted(sortBy, order);
  };

  const searchTracks = (query: string) => {
    return database.searchTracks(query);
  };

  const getStats = () => {
    return database.getStats();
  };

  const deleteAllUserContent = () => {
    console.log('=== HOOK: deleteAllUserContent aufgerufen ===');
    database.deleteAllUserContent();
    
    // WICHTIG: Filtere die myTracks im User Store, behalte nur Holler die Waldfee
    const hollaUserId = 'user-holla';
    const filteredMyTracks = myTracks.filter(track => track.user.id === hollaUserId);
    filterMyTracksByUser(hollaUserId);
    console.log('User Store gefiltert, behalte nur Holler-Tracks:', filteredMyTracks.length);
    
    // Synchronisiere nach dem Löschen
    const allTracks = database.getAllTracks();
    console.log('Hook: Tracks nach Löschung:', allTracks.length);
    
    // Verwende die bereits gefilterten Tracks
    const combinedTracks = [...allTracks, ...filteredMyTracks];
    const uniqueTracks = combinedTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    console.log('Hook: Setze Tracks:', uniqueTracks.length);
    setTracks(uniqueTracks);
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
    deleteAllUserContent
  };
};
