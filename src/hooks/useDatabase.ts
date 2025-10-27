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
      
      if (cachedTracks && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
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
    const success = await DatabaseService.addCommentToTrack(trackId, comment);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const deleteCommentFromTrack = async (trackId: string, commentId: string): Promise<boolean> => {
    const success = await DatabaseService.deleteCommentFromTrack(trackId, commentId);
    if (success) {
      // Nur die Kommentare aktualisieren, nicht alle Daten neu laden
      const updatedComments = await DatabaseService.getComments();
      setComments(updatedComments);
    }
    return success;
  };

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

  const toggleLike = async (trackId: string, userId: string): Promise<boolean> => {
    const success = await DatabaseService.toggleLike(trackId, userId);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const toggleBookmark = async (trackId: string, userId: string): Promise<boolean> => {
    const success = await DatabaseService.toggleBookmark(trackId, userId);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
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
