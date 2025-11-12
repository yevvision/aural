import { useState, useEffect, useRef, useCallback } from 'react';
import DatabaseService from '../services/databaseService';
import type { AudioTrack, ContentReport } from '../types';

// Custom Hook für Datenbank-Zugriff - Server-first für Kern-Funktionalität
// Nur Tracks und Pending Uploads sind server-first, Rest bleibt lokal
export const useDatabase = (currentUserId?: string) => {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref um den aktuellen tracks.length Wert zu tracken ohne infinite loops
  const tracksLengthRef = useRef(0);

  // Tracks und Benutzer von der Datenbank laden - MIT CACHING
  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // CACHE-CHECK: Nur laden wenn noch nicht gecacht
      const cacheKey = 'aural-tracks-cache';
      const cachedTracks = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
      const now = Date.now();
      const CACHE_DURATION = 30 * 1000; // 30 Sekunden Cache (reduziert für bessere UX)
      
      // Prüfe, ob die zentrale DB aktueller ist als der Cache
      const centralRaw = localStorage.getItem('aural-central-database');
      let isCentralNewerThanCache = false;
      try {
        if (centralRaw) {
          const central = JSON.parse(centralRaw);
          const centralTs = new Date(central.timestamp || 0).getTime();
          const cacheTsNum = cacheTimestamp ? parseInt(cacheTimestamp) : 0;
          if (centralTs && centralTs > cacheTsNum) {
            isCentralNewerThanCache = true;
          }
        }
      } catch {}

      if (!isCentralNewerThanCache && cachedTracks && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
        console.log('✅ useDatabase: Using cached tracks (fast!)');
        const allTracks = JSON.parse(cachedTracks);
        setTracks(allTracks);
        setIsLoading(false);
        return;
      }
      
      console.log('🔄 useDatabase: Lade Tracks server-first...');
      
      let allTracks: AudioTrack[] = [];
      
      try {
        // Versuche Server-Daten zu laden
        const { serverDatabaseService } = await import('../services/serverDatabaseService');
        const serverTracks = await serverDatabaseService.getAllTracks();
        
        if (serverTracks && serverTracks.length > 0) {
          console.log('🌐 useDatabase: Loaded tracks from server:', serverTracks.length);
          
          // Setze die Server-Tracks
          allTracks = serverTracks;
          
  // CACHE SPEICHERN
  localStorage.setItem(cacheKey, JSON.stringify(allTracks));
  localStorage.setItem(`${cacheKey}-timestamp`, now.toString());
  console.log('✅ useDatabase: Tracks cached for 30 seconds');
        } else {
          // Fallback zu lokaler Datenbank
          console.log('📱 useDatabase: Fallback to local database');
          allTracks = DatabaseService.getTracks(currentUserId);
        }
      } catch (error) {
        console.error('❌ useDatabase: Server load failed, using local database:', error);
        // Fallback zu lokaler Datenbank
        allTracks = DatabaseService.getTracks(currentUserId);
      }
      
      // Nur wenn keine Server-Tracks vorhanden sind, lade aus localStorage als Backup
      if (allTracks.length === 0) {
        console.log('📱 useDatabase: Keine Server-Tracks, lade aus localStorage...');
        const centralDBData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
        const localTracks = Array.isArray(centralDBData.tracks) ? centralDBData.tracks : [];
        
        // Bereichere localStorage-Tracks mit aktuellen Like/Bookmark-Daten
        const enrichedLocalTracks = localTracks.map(track => {
          const trackLikes = new Set(centralDBData.likes?.find((l: any) => l.trackId === track.id)?.userIds || []);
          const trackBookmarks = new Set(centralDBData.bookmarks?.find((b: any) => b.trackId === track.id)?.userIds || []);
          
          // Berechne commentsCount aus den Kommentaren im Track
          const commentsCount = track.comments ? track.comments.length : 0;
          const plays = centralDBData.playsMap?.[track.id] || 0;
          
          return {
            ...track,
            isLiked: currentUserId ? trackLikes.has(currentUserId) : false,
            isBookmarked: currentUserId ? trackBookmarks.has(currentUserId) : false,
            likes: trackLikes.size,
            commentsCount,
            plays
          };
        });
        
        allTracks = enrichedLocalTracks;
      }
      
      // WICHTIG: Dedupliziere Tracks basierend auf ID
      const uniqueTracksMap = new Map();
      allTracks.forEach(track => {
        if (!uniqueTracksMap.has(track.id)) {
          uniqueTracksMap.set(track.id, track);
        }
      });
      allTracks = Array.from(uniqueTracksMap.values());
      
      const allUsers = DatabaseService.getUsers();
      const allComments = await DatabaseService.getComments();
      const allActivities = currentUserId ? DatabaseService.getUserActivities(currentUserId) : [];
      const allNotifications = currentUserId ? DatabaseService.getUserNotifications(currentUserId) : [];
      
      console.log('🔔 useDatabase - currentUserId:', currentUserId);
      console.log('🔔 useDatabase - allActivities:', allActivities.length);
      console.log('🔔 useDatabase - allNotifications:', allNotifications.length);
      
      // Füge Demo-Daten hinzu, wenn keine vorhanden sind
      let finalActivities = allActivities;
      let finalNotifications = allNotifications;
      
      console.log('🔔 useDatabase - Vor Demo-Check:', {
        allActivities: allActivities.length,
        allNotifications: allNotifications.length,
        currentUserId
      });
      
      // WICHTIG: Nur Demo-Daten hinzufügen, wenn wirklich KEINE Aktivitäten vorhanden sind
      // Das verhindert, dass Demo-Daten echte Aktivitäten überschreiben
      if (allActivities.length === 0 && allNotifications.length === 0) {
        console.log('🔔 useDatabase - Keine Aktivitäten gefunden, füge Demo-Daten hinzu...');
        DatabaseService.addDemoActivitiesAndNotifications();
        // Lade Daten neu
        finalActivities = currentUserId ? DatabaseService.getUserActivities(currentUserId) : [];
        finalNotifications = currentUserId ? DatabaseService.getUserNotifications(currentUserId) : [];
        console.log('🔔 useDatabase - Nach Demo-Daten: Activities:', finalActivities.length, 'Notifications:', finalNotifications.length);
      } else {
        console.log('🔔 useDatabase - Aktivitäten bereits vorhanden, verwende bestehende');
      }
      const allReports = DatabaseService.getReports();
      
      console.log('🔄 useDatabase: Finale Tracks:', allTracks.length);
      
      setTracks(allTracks);
      setUsers(allUsers);
      setComments(await allComments);
      setActivities(finalActivities);
      setNotifications(finalNotifications);
      setReports(allReports);
      
      // Update ref mit der aktuellen tracks.length
      tracksLengthRef.current = allTracks.length;
      
    } catch (error) {
      console.error('❌ useDatabase: Fehler beim Laden der Daten:', error);
      setTracks([]);
      setUsers([]);
      setComments([]);
      setActivities([]);
      setNotifications([]);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]); // currentUserId als Dependency

  // Interne Cache-Invalidierung für Trackliste
  const invalidateTracksCache = () => {
    try {
      const cacheKey = 'aural-tracks-cache';
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}-timestamp`);
    } catch {}
  };

  // Cache leeren nach Upload
  const clearCache = useCallback(() => {
    const cacheKey = 'aural-tracks-cache';
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}-timestamp`);
    console.log('🗑️ useDatabase: Cache cleared, will reload data');
    loadData();
  }, [loadData]);

  // Beim ersten Laden und bei Änderungen
  useEffect(() => {
    loadData();

    // Database Listener DEAKTIVIERT - verursacht UI-Flash beim Track-Wechsel
    // const removeListener = DatabaseService.addListener(() => {
    //   loadData();
    // });

    // Event Listener für Track Approval
    const handleTrackApproved = () => {
      loadData();
    };

    window.addEventListener('trackApproved', handleTrackApproved);

    // Cleanup
    return () => {
      // removeListener(); // DEAKTIVIERT
      window.removeEventListener('trackApproved', handleTrackApproved);
    };
  }, [currentUserId, loadData]); // loadData als dependency hinzufügen

  // Polling DEAKTIVIERT - verursacht UI-Flash beim Track-Wechsel
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const currentTracksLength = tracksLengthRef.current;
  //     if (currentTracksLength === 0) {
  //       console.log('🔄 useDatabase: Keine Tracks vorhanden, lade Daten neu...');
  //       loadData();
  //     }
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, [currentUserId, loadData]);

  // =============================================================================
  // TRACK OPERATIONEN
  // =============================================================================

  const addTrack = async (track: AudioTrack): Promise<boolean> => {
    // OPTION C: SYNCHRONISIERUNG - upload.php hat bereits gespeichert, nur lokal synchronisieren
    console.log('🔄 useDatabase: OPTION C - Synchronisiere Track:', track.id, track.title);
    
    // Lokal hinzufügen für sofortige Anzeige (upload.php hat bereits auf Server gespeichert)
    const success = await DatabaseService.addTrack(track);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const deleteTrack = async (trackId: string): Promise<boolean> => {
    const success = await DatabaseService.deleteTrack(trackId);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const updateTrack = (trackId: string, updates: Partial<AudioTrack>): boolean => {
    const success = DatabaseService.updateTrack(trackId, updates);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const addCommentToTrack = async (trackId: string, comment: any): Promise<boolean> => {
    console.log('💬 useDatabase.addCommentToTrack: Start für Track', trackId, 'Kommentar:', comment.content?.substring(0, 50));
    
    const success = await DatabaseService.addCommentToTrack(trackId, comment);
    console.log('💬 useDatabase.addCommentToTrack: DatabaseService Result:', success);
    
    if (success) {
      // Cache invalidieren
      invalidateTracksCache();
      
      // WICHTIG: Warte kurz, damit die Datenbank Zeit hat zu speichern
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // WICHTIG: Aktualisiere feedStore direkt mit den korrekten Daten aus der Datenbank
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        const { centralDB } = await import('../database/centralDatabase_simple');
        
        // WICHTIG: Hole Track DIREKT aus centralDB, nicht über DatabaseService.getTracks()
        // Das stellt sicher, dass wir die neuesten Kommentare bekommen
        const dbData = centralDB.getDatabase();
        const trackInDb = dbData.tracks.find((t: any) => t.id === trackId);
        
        if (trackInDb && trackInDb.comments && Array.isArray(trackInDb.comments)) {
          const commentsCount = trackInDb.comments.length;
          const comments = trackInDb.comments;
          
          console.log('🔍 useDatabase: Track aus DB gefunden:', {
            trackId,
            commentsCount,
            commentsLength: comments.length,
            allComments: comments.map(c => ({ id: c.id, content: c.content?.substring(0, 30) }))
          });
          
          // WICHTIG: Stelle sicher, dass comments ein neues Array ist (nicht Referenz)
          const commentsCopy = [...comments];
          
          // Update den spezifischen Track im feedStore mit KOPIE der Kommentare
          useFeedStore.getState().updateTrack(trackId, {
            comments: commentsCopy,
            commentsCount: commentsCount
          });
          
          // WICHTIG: Aktualisiere auch currentTrack im playerStore, falls es derselbe Track ist
          try {
            const { usePlayerStore } = await import('../stores/playerStore');
            const playerStore = usePlayerStore.getState();
            if (playerStore.currentTrack?.id === trackId) {
              playerStore.setCurrentTrack({
                ...playerStore.currentTrack,
                comments: commentsCopy,
                commentsCount: commentsCount
              });
              console.log('✅ useDatabase: currentTrack im playerStore aktualisiert');
            }
          } catch (error) {
            console.warn('⚠️ useDatabase: Fehler beim Aktualisieren des playerStore:', error);
          }
          
          // Prüfe nach dem Update, ob die Kommentare wirklich gesetzt wurden
          const afterUpdate = useFeedStore.getState().tracks.find(t => t.id === trackId);
          console.log('✅ useDatabase: FeedStore Track nach Kommentar aktualisiert:', {
            trackId,
            commentsCount,
            commentsLength: comments.length,
            afterUpdateCommentsCount: afterUpdate?.comments?.length || 0,
            afterUpdateCommentsCountProp: afterUpdate?.commentsCount,
            erfolgreich: (afterUpdate?.comments?.length || 0) === comments.length
          });
          
          if ((afterUpdate?.comments?.length || 0) !== comments.length) {
            console.error('❌ useDatabase: Kommentare wurden NICHT korrekt aktualisiert!', {
              erwartet: comments.length,
              erhalten: afterUpdate?.comments?.length || 0,
              afterUpdateTrack: afterUpdate
            });
          }
        } else {
          console.warn('⚠️ useDatabase: Track nicht in DB gefunden oder hat keine Kommentare:', {
            trackId,
            trackExists: !!trackInDb,
            hasComments: trackInDb?.comments ? 'ja' : 'nein'
          });
          
          // Fallback: Verwende DatabaseService.getTracks()
          const { DatabaseService } = await import('../services/databaseService');
          const updatedTracks = DatabaseService.getTracks(currentUserId);
          const updatedTrack = updatedTracks.find(t => t.id === trackId);
          
          if (updatedTrack) {
            useFeedStore.getState().updateTrack(trackId, {
              comments: updatedTrack.comments || [],
              commentsCount: updatedTrack.commentsCount || (updatedTrack.comments?.length || 0)
            });
          }
        }
      } catch (error) {
        console.error('❌ useDatabase: Fehler beim Aktualisieren des feedStore nach Kommentar:', error);
        // Fallback: Lade alle Daten neu
        loadData();
      }
    }
    
    return success;
  };

  const deleteCommentFromTrack = async (trackId: string, commentId: string): Promise<boolean> => {
    const success = await DatabaseService.deleteCommentFromTrack(trackId, commentId);
    if (success) {
      // Cache invalidieren, dann neu laden
      invalidateTracksCache();
      loadData();
    }
    return success;
  };

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

  const toggleLike = async (trackId: string, userId: string): Promise<boolean> => {
    console.log('🔄 useDatabase.toggleLike: Start für Track', trackId, 'User', userId);
    
    // Optimistisches Update für sofortige UI-Reaktion
    try {
      const { useFeedStore } = await import('../stores/feedStore');
      const feedStore = useFeedStore.getState();
      const currentTrack = feedStore.tracks.find(t => t.id === trackId);
      
      if (currentTrack) {
        const newIsLiked = !currentTrack.isLiked;
        const newLikesCount = currentTrack.likes + (newIsLiked ? 1 : -1);
        
        console.log('📝 useDatabase: Optimistisches Update:', {
          trackId,
          oldLikes: currentTrack.likes,
          newLikes: newLikesCount,
          oldIsLiked: currentTrack.isLiked,
          newIsLiked
        });
        
        // Optimistisches Update
        feedStore.updateTrack(trackId, {
          isLiked: newIsLiked,
          likes: Math.max(0, newLikesCount) // Stelle sicher, dass likes nicht negativ wird
        });
        
        console.log('✅ useDatabase: Optimistisches Update abgeschlossen');
      } else {
        console.warn('⚠️ useDatabase: Track nicht im feedStore gefunden:', trackId);
      }
    } catch (error) {
      console.error('❌ useDatabase: Fehler beim optimistischen Update:', error);
    }
    
    const success = await DatabaseService.toggleLike(trackId, userId);
    console.log('🔄 useDatabase.toggleLike: DatabaseService Result:', success);
    
    if (success) {
      // Cache invalidieren
      invalidateTracksCache();
      
      // WICHTIG: Warte länger, damit die Datenbank-Zeit hat, den Like zu speichern
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Aktualisiere feedStore mit den korrekten Daten aus der Datenbank
      // WICHTIG: Hole die Daten DIREKT aus centralDB, nicht über loadData()
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        const { centralDB } = await import('../database/centralDatabase_simple');
        
        // WICHTIG: Prüfe zuerst direkt in der Datenbank-Map, bevor wir getAllTracks aufrufen
        // Verwende eine Hilfsmethode, um auf die Likes-Map zuzugreifen
        let trackLikes: Set<string> | undefined;
        let likesInMap = 0;
        let isLikedInMap = false;
        
        try {
          // Verwende DatabaseService.getDatabase() für direkten Zugriff auf Maps
          const dbData = DatabaseService.getDatabase();
          if (dbData && dbData.likes && typeof dbData.likes.get === 'function') {
            trackLikes = dbData.likes.get(trackId);
            if (trackLikes) {
              likesInMap = trackLikes.size || 0;
              isLikedInMap = trackLikes.has(userId) || false;
            }
          }
        } catch (error) {
          console.error('❌ useDatabase: Fehler beim Zugriff auf Datenbank-Map:', error);
          // Ignoriere den Fehler und verwende getAllTracks als Fallback
        }
        
        console.log('🔍 useDatabase: Prüfe Like-Daten direkt in Map:', {
          trackId,
          likesInMap: `${likesInMap}`,
          isLikedInMap: `${isLikedInMap}`,
          userId,
          hasLikesSet: !!trackLikes,
          allUserIds: trackLikes ? Array.from(trackLikes) : []
        });
        console.log(`📊 useDatabase: Map-Daten für Track ${trackId}: likes=${likesInMap}, isLiked=${isLikedInMap}`);
        
        // Hole die aktualisierte Like-Zählung direkt aus der Datenbank
        // getAllTracks bereichert die Tracks bereits mit Like-Daten aus der Map
        const updatedTracks = DatabaseService.getTracks(userId);
        const updatedTrack = updatedTracks.find(t => t.id === trackId);
        
        // Debug: Prüfe Like-Daten für diesen Track
        if (updatedTrack) {
          console.log('🔍 useDatabase: Prüfe Like-Daten in Datenbank für Track:', {
            trackId,
            likes: `${updatedTrack.likes}`,
            isLiked: `${updatedTrack.isLiked}`,
            userId,
            mapLikes: `${likesInMap}`,
            mapIsLiked: `${isLikedInMap}`,
            // Detaillierter Vergleich
            matchLikes: updatedTrack.likes === likesInMap,
            matchIsLiked: updatedTrack.isLiked === isLikedInMap
          });
          console.log(`📊 useDatabase: getAllTracks-Daten für Track ${trackId}: likes=${updatedTrack.likes}, isLiked=${updatedTrack.isLiked}`);
        } else {
          console.warn('⚠️ useDatabase: Track nicht in getAllTracks gefunden:', trackId);
        }
        
        if (updatedTrack) {
          // WICHTIG: Wenn getAllTracks falsche Daten zurückgibt, verwende die Map-Daten direkt
          // Oder wenn Map-Daten verfügbar sind und getAllTracks 0 zeigt, verwende Map-Daten
          let finalLikes = updatedTrack.likes;
          let finalIsLiked = updatedTrack.isLiked;
          
          // Wenn Map-Daten verfügbar sind und von getAllTracks abweichen, bevorzuge Map
          if (likesInMap > 0 || isLikedInMap) {
            if (updatedTrack.likes === 0 && likesInMap > 0) {
              finalLikes = likesInMap;
              finalIsLiked = isLikedInMap;
              console.warn('⚠️ useDatabase: getAllTracks zeigt likes: 0, aber Map zeigt likes:', likesInMap, '- verwende Map-Daten');
            } else if (updatedTrack.isLiked !== isLikedInMap && isLikedInMap) {
              finalIsLiked = isLikedInMap;
              console.warn('⚠️ useDatabase: getAllTracks zeigt isLiked falsch, verwende Map-Daten');
            }
          }
          
          console.log('🔄 useDatabase: Aktualisiere Track mit korrekten Like-Daten:', {
            trackId,
            isLiked: `${finalIsLiked}`,
            likes: `${finalLikes}`,
            quelle: likesInMap > 0 ? 'Map' : 'getAllTracks'
          });
          console.log(`📊 useDatabase: Finale Daten für Track ${trackId}: likes=${finalLikes}, isLiked=${finalIsLiked} (Quelle: ${likesInMap > 0 ? 'Map' : 'getAllTracks'})`);
          
          // WICHTIG: Prüfe, ob die Daten wirklich anders sind als im FeedStore
          const currentFeedTrack = useFeedStore.getState().tracks.find(t => t.id === trackId);
          if (currentFeedTrack) {
            console.log('🔍 useDatabase: Vergleich FeedStore vs Final-Daten:', {
              feedStore: { isLiked: currentFeedTrack.isLiked, likes: currentFeedTrack.likes },
              final: { isLiked: finalIsLiked, likes: finalLikes },
              aenderungErforderlich: currentFeedTrack.likes !== finalLikes || currentFeedTrack.isLiked !== finalIsLiked
            });
          }
          
          // Update den spezifischen Track im feedStore mit korrekten Daten
          useFeedStore.getState().updateTrack(trackId, {
            isLiked: finalIsLiked,
            likes: finalLikes
          });
          
          // Prüfe nach dem Update, ob es wirklich gesetzt wurde
          const afterUpdate = useFeedStore.getState().tracks.find(t => t.id === trackId);
          console.log('✅ useDatabase: FeedStore Track aktualisiert:', {
            trackId,
            isLiked: `${afterUpdate?.isLiked}`,
            likes: `${afterUpdate?.likes}`,
            erfolgreich: afterUpdate?.likes === finalLikes && afterUpdate?.isLiked === finalIsLiked
          });
          console.log(`📊 useDatabase: FeedStore nach Update für Track ${trackId}: likes=${afterUpdate?.likes}, isLiked=${afterUpdate?.isLiked}, erfolgreich=${afterUpdate?.likes === finalLikes && afterUpdate?.isLiked === finalIsLiked}`);
          
          // WICHTIG: NICHT loadData() oder loadTracksFromDatabase() aufrufen!
          // Das würde die Like-Daten überschreiben
        } else {
          console.warn('⚠️ useDatabase: Aktualisierter Track nicht in Datenbank gefunden:', trackId);
          // Fallback: Verwende Map-Daten direkt
          if (likesInMap > 0 || isLikedInMap) {
            console.log('🔧 useDatabase: Verwende Map-Daten als Fallback');
            useFeedStore.getState().updateTrack(trackId, {
              isLiked: isLikedInMap,
              likes: likesInMap
            });
          }
        }
      } catch (error) {
        console.error('❌ useDatabase: Fehler beim Aktualisieren des feedStore:', error);
        // Fallback: Versuche es nochmal mit loadTracksFromDatabase
        try {
          const { useFeedStore } = await import('../stores/feedStore');
          useFeedStore.getState().loadTracksFromDatabase();
        } catch (fallbackError) {
          console.error('❌ useDatabase: Fallback auch fehlgeschlagen:', fallbackError);
        }
      }
    } else {
      console.error('❌ useDatabase: toggleLike fehlgeschlagen, setze feedStore zurück');
      // Falls fehlgeschlagen, feedStore zurücksetzen durch Neuladen
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        useFeedStore.getState().loadTracksFromDatabase();
      } catch (error) {
        console.error('❌ useDatabase: Fehler beim Zurücksetzen des feedStore:', error);
      }
    }
    
    console.log('🔄 useDatabase.toggleLike: Ende, Result:', success);
    return success;
  };

  const toggleBookmark = async (trackId: string, userId: string): Promise<boolean> => {
    console.log('🔖 useDatabase.toggleBookmark: Start für Track', trackId, 'User', userId);
    
    // Optimistisches Update für sofortige UI-Reaktion
    try {
      const { useFeedStore } = await import('../stores/feedStore');
      const feedStore = useFeedStore.getState();
      const currentTrack = feedStore.tracks.find(t => t.id === trackId);
      
      if (currentTrack) {
        const newIsBookmarked = !currentTrack.isBookmarked;
        
        console.log('📝 useDatabase: Optimistisches Bookmark-Update:', {
          trackId,
          oldIsBookmarked: currentTrack.isBookmarked,
          newIsBookmarked
        });
        
        // Optimistisches Update - NUR isBookmarked ändern, Like-Daten NICHT anfassen!
        feedStore.updateTrack(trackId, {
          isBookmarked: newIsBookmarked
        });
        
        console.log('✅ useDatabase: Optimistisches Bookmark-Update abgeschlossen');
      } else {
        console.warn('⚠️ useDatabase: Track nicht im feedStore gefunden:', trackId);
      }
    } catch (error) {
      console.error('❌ useDatabase: Fehler beim optimistischen Bookmark-Update:', error);
    }
    
    const success = await DatabaseService.toggleBookmark(trackId, userId);
    console.log('🔖 useDatabase.toggleBookmark: DatabaseService Result:', success);
    
    if (success) {
      // Cache invalidieren
      invalidateTracksCache();
      
      // WICHTIG: Warte kurz, damit die Datenbank-Zeit hat, das Bookmark zu speichern
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Aktualisiere feedStore mit den korrekten Daten aus der Datenbank
      // WICHTIG: Hole die Daten DIREKT aus centralDB, nicht über loadData()
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        const { centralDB } = await import('../database/centralDatabase_simple');
        
        // Hole die aktualisierte Bookmark-Zählung direkt aus der Datenbank
        const updatedTracks = DatabaseService.getTracks(userId);
        const updatedTrack = updatedTracks.find(t => t.id === trackId);
        
        if (updatedTrack) {
          console.log('🔖 useDatabase: Aktualisiere Track mit korrekten Bookmark-Daten:', {
            trackId,
            isBookmarked: updatedTrack.isBookmarked,
            // WICHTIG: Behalte Like-Daten vom aktuellen Track im Store!
            isLiked: useFeedStore.getState().tracks.find(t => t.id === trackId)?.isLiked ?? updatedTrack.isLiked,
            likes: useFeedStore.getState().tracks.find(t => t.id === trackId)?.likes ?? updatedTrack.likes
          });
          
          // WICHTIG: Update NUR isBookmarked, behalte alle anderen Daten (besonders Likes)!
          const currentFeedTrack = useFeedStore.getState().tracks.find(t => t.id === trackId);
          useFeedStore.getState().updateTrack(trackId, {
            isBookmarked: updatedTrack.isBookmarked,
            // Behalte Like-Daten vom aktuellen Track, falls vorhanden
            ...(currentFeedTrack && {
              isLiked: currentFeedTrack.isLiked,
              likes: currentFeedTrack.likes
            })
          });
          
          // Prüfe nach dem Update
          const afterUpdate = useFeedStore.getState().tracks.find(t => t.id === trackId);
          console.log('✅ useDatabase: FeedStore Track aktualisiert:', {
            trackId,
            isBookmarked: afterUpdate?.isBookmarked,
            isLiked: afterUpdate?.isLiked,
            likes: afterUpdate?.likes
          });
          
          // WICHTIG: NICHT loadData() oder loadTracksFromDatabase() aufrufen!
          // Das würde die Like-Daten überschreiben
        } else {
          console.warn('⚠️ useDatabase: Aktualisierter Track nicht in Datenbank gefunden:', trackId);
        }
      } catch (error) {
        console.error('❌ useDatabase: Fehler beim Aktualisieren des feedStore:', error);
        // Fallback: Versuche es nochmal, aber BEHALTE Like-Daten
        try {
          const { useFeedStore } = await import('../stores/feedStore');
          const currentTrack = useFeedStore.getState().tracks.find(t => t.id === trackId);
          if (currentTrack) {
            // Lade nur Bookmark-Daten neu, behalte Like-Daten
            const { centralDB } = await import('../database/centralDatabase_simple');
            const updatedTracks = DatabaseService.getTracks(userId);
            const updatedTrack = updatedTracks.find(t => t.id === trackId);
            if (updatedTrack) {
              useFeedStore.getState().updateTrack(trackId, {
                isBookmarked: updatedTrack.isBookmarked,
                // Behalte Like-Daten
                isLiked: currentTrack.isLiked,
                likes: currentTrack.likes
              });
            }
          }
        } catch (fallbackError) {
          console.error('❌ useDatabase: Fallback auch fehlgeschlagen:', fallbackError);
        }
      }
    } else {
      console.error('❌ useDatabase: toggleBookmark fehlgeschlagen, setze feedStore zurück');
      // Falls fehlgeschlagen, feedStore zurücksetzen - aber BEHALTE Like-Daten
      try {
        const { useFeedStore } = await import('../stores/feedStore');
        const currentTrack = useFeedStore.getState().tracks.find(t => t.id === trackId);
        if (currentTrack) {
          // Setze nur Bookmark zurück, behalte Like-Daten
          useFeedStore.getState().updateTrack(trackId, {
            isBookmarked: !currentTrack.isBookmarked // Zurück zum alten Zustand
          });
        }
      } catch (error) {
        console.error('❌ useDatabase: Fehler beim Zurücksetzen des feedStore:', error);
      }
    }
    
    console.log('🔖 useDatabase.toggleBookmark: Ende, Result:', success);
    return success;
  };

  const getUserLikedTracks = async (userId: string): Promise<AudioTrack[]> => {
    return await DatabaseService.getUserLikedTracks(userId);
  };

  const getUserBookmarkedTracks = async (userId: string): Promise<AudioTrack[]> => {
    return await DatabaseService.getUserBookmarkedTracks(userId);
  };

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  const toggleCommentLike = async (commentId: string, userId: string): Promise<boolean> => {
    return await DatabaseService.toggleCommentLike(commentId, userId);
  };

  const isCommentLikedByUser = async (commentId: string, userId: string): Promise<boolean> => {
    return await DatabaseService.isCommentLikedByUser(commentId, userId);
  };

  const getCommentLikeCount = async (commentId: string): Promise<number> => {
    return await DatabaseService.getCommentLikeCount(commentId);
  };

  // =============================================================================
  // FOLLOW OPERATIONS
  // =============================================================================

  const toggleFollow = async (followerId: string, targetUserId: string): Promise<boolean> => {
    const success = await DatabaseService.toggleFollow(followerId, targetUserId);
    if (success) {
      loadData();
    }
    return success;
  };

  // =============================================================================
  // ACTIVITY & NOTIFICATIONS
  // =============================================================================

  const addUserActivity = (activity: any): boolean => {
    const success = DatabaseService.addUserActivity(activity);
    if (success) {
      // Lade Daten neu, um sicherzustellen, dass die neue Aktivität verfügbar ist
      loadData();
    }
    return success;
  };

  const addNotification = (notification: any): boolean => {
    const success = DatabaseService.addNotification(notification);
    if (success) {
      // Lade Daten neu, um sicherzustellen, dass die neue Benachrichtigung verfügbar ist
      loadData();
    }
    return success;
  };

  const markActivityAsRead = (activityId: string): boolean => {
    const success = DatabaseService.markActivityAsRead(activityId);
    if (success) {
      // Lade Daten neu, um sicherzustellen, dass die Navigation aktualisiert wird
      loadData();
    }
    return success;
  };

  const markNotificationAsRead = (notificationId: string): boolean => {
    const success = DatabaseService.markNotificationAsRead(notificationId);
    if (success) {
      // Lade Daten neu, um sicherzustellen, dass die Navigation aktualisiert wird
      loadData();
    }
    return success;
  };

  // =============================================================================
  // REPORT OPERATIONEN
  // =============================================================================

  const addReport = (report: ContentReport): boolean => {
    return DatabaseService.addReport(report);
  };

  const updateReportStatus = (reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string): boolean => {
    return DatabaseService.updateReportStatus(reportId, status, reviewedBy);
  };

  const deleteReport = (reportId: string): boolean => {
    return DatabaseService.deleteReport(reportId);
  };

  // =============================================================================
  // ADMIN OPERATIONEN
  // =============================================================================

  const deleteAllUserContent = (): boolean => {
    return DatabaseService.deleteAllUserContent();
  };

  const forceDeleteTrack = (trackTitle: string, username: string): boolean => {
    return DatabaseService.forceDeleteTrack(trackTitle, username);
  };

  const getStats = () => {
    return DatabaseService.getStats();
  };

  // =============================================================================
  // SEARCH & FILTER
  // =============================================================================

  const searchTracks = (query: string): AudioTrack[] => {
    return DatabaseService.searchTracks(query);
  };

  const getTracksSorted = (
    sortBy: 'title' | 'user' | 'date' | 'likes' | 'duration' = 'date',
    order: 'asc' | 'desc' = 'desc'
  ): AudioTrack[] => {
    return DatabaseService.getTracksSorted(sortBy, order);
  };

  // =============================================================================
  // DEBUG
  // =============================================================================

  const debug = () => {
    // Debug method - logs removed for performance
  };

  const incrementPlay = async (trackId: string): Promise<boolean> => {
    const success = await DatabaseService.incrementPlay(trackId);
    if (success) {
      loadData();
    }
    return success;
  };

  return {
    // State
    tracks,
    users,
    comments,
    activities,
    notifications,
    reports,
    isLoading,
    
    // Track Operations
    addTrack,
    deleteTrack,
    updateTrack,
    addCommentToTrack,
    deleteCommentFromTrack,
    
    // Likes & Bookmarks
    toggleLike,
    toggleBookmark,
    getUserLikedTracks,
    getUserBookmarkedTracks,
    
    // Plays
    incrementPlay,
    
    // Comment Likes
    toggleCommentLike,
    isCommentLikedByUser,
    getCommentLikeCount,
    
    // Follow Operations
    toggleFollow,
    
    // Activity & Notifications
    addUserActivity,
    addNotification,
    markActivityAsRead,
    markNotificationAsRead,
    addDemoActivitiesAndNotifications: DatabaseService.addDemoActivitiesAndNotifications,
    forceCreateDemoData: DatabaseService.forceCreateDemoData,
    debugShowAllData: DatabaseService.debugShowAllData,
    resetDatabase: DatabaseService.resetDatabase,
    testPersistence: DatabaseService.testPersistence,
    
    // Report Operations
    addReport,
    updateReportStatus,
    deleteReport,
    
    // Admin Operations
    deleteAllUserContent,
    forceDeleteTrack,
    getStats,
    
    // Search & Filter
    searchTracks,
    getTracksSorted,
    
    // Utility
    loadData,
    clearCache,
    debug,
    
    // Additional utility functions
    getUserActivities: (userId: string) => DatabaseService.getUserActivities(userId),
    getUserNotifications: (userId: string) => DatabaseService.getUserNotifications(userId),
    forceAddHollaTracks: () => DatabaseService.forceAddHollaTracks()
  };
};

export default useDatabase;
