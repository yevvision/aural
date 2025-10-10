import { useState, useEffect, useRef, useCallback } from 'react';
import DatabaseService from '../services/databaseService';
import type { AudioTrack, ContentReport } from '../types';

// Custom Hook für Datenbank-Zugriff
// Alle Komponenten verwenden DIESEN Hook
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

  // Tracks und Benutzer von der Datenbank laden
  const loadData = useCallback(() => {
    setIsLoading(true);
    
    try {
      // Lade aus zentraler Datenbank (bereits mit Like/Bookmark-Daten angereichert)
      const dbTracks = DatabaseService.getTracks(currentUserId);
      
      // Lade auch aus localStorage als Backup (zentrale DB verwendet 'aural-central-database')
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
      
      // Kombiniere und dedupliziere Tracks
      const allTracksMap = new Map();
      
      // Füge DB-Tracks hinzu (bereits angereichert)
      dbTracks.forEach(track => {
        allTracksMap.set(track.id, track);
      });
      
      // Füge angereicherte localStorage-Tracks hinzu (überschreibt DB-Tracks)
      enrichedLocalTracks.forEach(track => {
        allTracksMap.set(track.id, track);
      });
      
      const allTracks = Array.from(allTracksMap.values());
      
      const allUsers = DatabaseService.getUsers();
      const allComments = DatabaseService.getComments();
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
      
      setTracks(allTracks);
      setUsers(allUsers);
      setComments(allComments);
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

  // Beim ersten Laden und bei Änderungen
  useEffect(() => {
    loadData();

    // Listener für Datenbank-Änderungen
    const removeListener = DatabaseService.addListener(() => {
      loadData();
    });

    // Event Listener für Track Approval
    const handleTrackApproved = () => {
      loadData();
    };

    window.addEventListener('trackApproved', handleTrackApproved);

    // Cleanup
    return () => {
      removeListener();
      window.removeEventListener('trackApproved', handleTrackApproved);
    };
  }, [currentUserId]); // Nur currentUserId als dependency

  // Separater useEffect für Polling - ohne tracks.length dependency
  useEffect(() => {
    const interval = setInterval(() => {
      const centralDBData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
      const localTracks = Array.isArray(centralDBData.tracks) ? centralDBData.tracks : [];
      const dbTracks = DatabaseService.getTracks(currentUserId);
      
      // Prüfe auf neue Tracks in localStorage oder DB
      // Verwende ref um den aktuellen Wert zu bekommen ohne infinite loops
      const currentTracksLength = tracksLengthRef.current;
      if (localTracks.length > currentTracksLength || dbTracks.length > currentTracksLength) {
        console.log('🔄 useDatabase: Neue Tracks erkannt, lade Daten neu...');
        loadData();
      }
    }, 10000); // Erhöhe Intervall auf 10 Sekunden um infinite loops zu vermeiden

    return () => clearInterval(interval);
  }, [currentUserId]); // Nur currentUserId als dependency

  // =============================================================================
  // TRACK OPERATIONEN
  // =============================================================================

  const addTrack = (track: AudioTrack): boolean => {
    return DatabaseService.addTrack(track);
  };

  const deleteTrack = (trackId: string): boolean => {
    return DatabaseService.deleteTrack(trackId);
  };

  const updateTrack = (trackId: string, updates: Partial<AudioTrack>): boolean => {
    return DatabaseService.updateTrack(trackId, updates);
  };

  const addCommentToTrack = (trackId: string, comment: any): boolean => {
    const success = DatabaseService.addCommentToTrack(trackId, comment);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const deleteCommentFromTrack = (trackId: string, commentId: string): boolean => {
    const success = DatabaseService.deleteCommentFromTrack(trackId, commentId);
    if (success) {
      // Nur die Kommentare aktualisieren, nicht alle Daten neu laden
      const updatedComments = DatabaseService.getComments();
      setComments(updatedComments);
    }
    return success;
  };

  // =============================================================================
  // LIKES & BOOKMARKS
  // =============================================================================

  const toggleLike = (trackId: string, userId: string): boolean => {
    const success = DatabaseService.toggleLike(trackId, userId);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const toggleBookmark = (trackId: string, userId: string): boolean => {
    const success = DatabaseService.toggleBookmark(trackId, userId);
    if (success) {
      // Lade alle Daten neu, um sicherzustellen, dass alle Komponenten aktualisiert werden
      loadData();
    }
    return success;
  };

  const getUserLikedTracks = (userId: string): AudioTrack[] => {
    return DatabaseService.getUserLikedTracks(userId);
  };

  const getUserBookmarkedTracks = (userId: string): AudioTrack[] => {
    return DatabaseService.getUserBookmarkedTracks(userId);
  };

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  const toggleCommentLike = (commentId: string, userId: string): boolean => {
    return DatabaseService.toggleCommentLike(commentId, userId);
  };

  const isCommentLikedByUser = (commentId: string, userId: string): boolean => {
    return DatabaseService.isCommentLikedByUser(commentId, userId);
  };

  const getCommentLikeCount = (commentId: string): number => {
    return DatabaseService.getCommentLikeCount(commentId);
  };

  // =============================================================================
  // FOLLOW OPERATIONS
  // =============================================================================

  const toggleFollow = (followerId: string, targetUserId: string): boolean => {
    const success = DatabaseService.toggleFollow(followerId, targetUserId);
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

  const incrementPlay = (trackId: string): boolean => {
    const success = DatabaseService.incrementPlay(trackId);
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
    debug,
    
    // Additional utility functions
    getUserActivities: (userId: string) => DatabaseService.getUserActivities(userId),
    getUserNotifications: (userId: string) => DatabaseService.getUserNotifications(userId),
    forceAddHollaTracks: () => DatabaseService.forceAddHollaTracks()
  };
};

export default useDatabase;