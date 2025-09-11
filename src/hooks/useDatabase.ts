import { useState, useEffect } from 'react';
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

  // Tracks und Benutzer von der Datenbank laden
  const loadData = () => {
    console.log('🎯 useDatabase: loadData()', currentUserId ? `für User: ${currentUserId}` : '');
    setIsLoading(true);
    
    try {
      // Lade aus zentraler Datenbank
      const dbTracks = DatabaseService.getTracks(currentUserId);
      
      // Lade auch aus localStorage als Backup (zentrale DB verwendet 'aural-central-database')
      const centralDBData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
      const localTracks = Array.isArray(centralDBData.tracks) ? centralDBData.tracks : [];
      
      // Kombiniere und dedupliziere Tracks
      const allTracksMap = new Map();
      
      // Füge DB-Tracks hinzu
      dbTracks.forEach(track => {
        allTracksMap.set(track.id, track);
      });
      
      // Füge localStorage-Tracks hinzu (überschreibt DB-Tracks)
      localTracks.forEach(track => {
        allTracksMap.set(track.id, track);
      });
      
      const allTracks = Array.from(allTracksMap.values());
      
      const allUsers = DatabaseService.getUsers();
      const allComments = DatabaseService.getComments();
      const allActivities = currentUserId ? DatabaseService.getUserActivities(currentUserId) : [];
      const allNotifications = currentUserId ? DatabaseService.getUserNotifications(currentUserId) : [];
      const allReports = DatabaseService.getReports();
      
      setTracks(allTracks);
      setUsers(allUsers);
      setComments(allComments);
      setActivities(allActivities);
      setNotifications(allNotifications);
      setReports(allReports);
      
      console.log('✅ useDatabase: Daten geladen - Tracks:', allTracks.length, 'DB-Tracks:', dbTracks.length, 'Local-Tracks:', localTracks.length, 'Users:', allUsers.length, 'Comments:', allComments.length, 'Activities:', allActivities.length, 'Notifications:', allNotifications.length, 'Reports:', allReports.length);
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
  };

  // Beim ersten Laden und bei Änderungen
  useEffect(() => {
    console.log('🎯 useDatabase: useEffect - Initiales Laden');
    loadData();

    // Listener für Datenbank-Änderungen
    const removeListener = DatabaseService.addListener(() => {
      console.log('🔄 useDatabase: Datenbank-Änderung erkannt, lade neu...');
      loadData();
    });

    // Zusätzlicher Polling für localStorage-Änderungen
    const interval = setInterval(() => {
      const centralDBData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
      const localTracks = Array.isArray(centralDBData.tracks) ? centralDBData.tracks : [];
      const dbTracks = DatabaseService.getTracks(currentUserId);
      
      // Prüfe auf neue Tracks in localStorage oder DB
      if (localTracks.length > tracks.length || dbTracks.length > tracks.length) {
        console.log('🔄 useDatabase: Neue Tracks gefunden (localStorage:', localTracks.length, 'DB:', dbTracks.length, 'Current:', tracks.length, '), lade neu...');
        loadData();
      }
    }, 1000); // Reduziere Intervall auf 1 Sekunde für schnellere Reaktion

    // Event Listener für Track Approval
    const handleTrackApproved = () => {
      console.log('🔄 useDatabase: Track approved event received, reloading...');
      loadData();
    };

    window.addEventListener('trackApproved', handleTrackApproved);

    // Cleanup
    return () => {
      removeListener();
      clearInterval(interval);
      window.removeEventListener('trackApproved', handleTrackApproved);
    };
  }, [currentUserId]);

  // =============================================================================
  // TRACK OPERATIONEN
  // =============================================================================

  const addTrack = (track: AudioTrack): boolean => {
    console.log('➕ useDatabase: addTrack()', track.id, track.title);
    return DatabaseService.addTrack(track);
  };

  const deleteTrack = (trackId: string): boolean => {
    console.log('🗑️ useDatabase: deleteTrack()', trackId);
    return DatabaseService.deleteTrack(trackId);
  };

  const updateTrack = (trackId: string, updates: Partial<AudioTrack>): boolean => {
    console.log('🔄 useDatabase: updateTrack()', trackId);
    return DatabaseService.updateTrack(trackId, updates);
  };

  const addCommentToTrack = (trackId: string, comment: any): boolean => {
    console.log('💬 useDatabase: addCommentToTrack()', trackId);
    const success = DatabaseService.addCommentToTrack(trackId, comment);
    if (success) {
      // Nur die Kommentare aktualisieren, nicht alle Daten neu laden
      const updatedComments = DatabaseService.getComments();
      setComments(updatedComments);
    }
    return success;
  };

  const deleteCommentFromTrack = (trackId: string, commentId: string): boolean => {
    console.log('🗑️ useDatabase: deleteCommentFromTrack()', trackId, commentId);
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
    console.log('❤️ useDatabase: toggleLike()', trackId, userId);
    const success = DatabaseService.toggleLike(trackId, userId);
    if (success) {
      // Nur die Tracks aktualisieren, nicht alle Daten neu laden
      const updatedTracks = DatabaseService.getTracks(currentUserId);
      const centralDBData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
      const localTracks = Array.isArray(centralDBData.tracks) ? centralDBData.tracks : [];
      
      const allTracksMap = new Map();
      updatedTracks.forEach(track => allTracksMap.set(track.id, track));
      localTracks.forEach(track => allTracksMap.set(track.id, track));
      
      setTracks(Array.from(allTracksMap.values()));
    }
    return success;
  };

  const toggleBookmark = (trackId: string, userId: string): boolean => {
    console.log('🔖 useDatabase: toggleBookmark()', trackId, userId);
    const success = DatabaseService.toggleBookmark(trackId, userId);
    if (success) {
      // Nur die Tracks aktualisieren, nicht alle Daten neu laden
      const updatedTracks = DatabaseService.getTracks(currentUserId);
      const centralDBData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
      const localTracks = Array.isArray(centralDBData.tracks) ? centralDBData.tracks : [];
      
      const allTracksMap = new Map();
      updatedTracks.forEach(track => allTracksMap.set(track.id, track));
      localTracks.forEach(track => allTracksMap.set(track.id, track));
      
      setTracks(Array.from(allTracksMap.values()));
    }
    return success;
  };

  const getUserLikedTracks = (userId: string): AudioTrack[] => {
    console.log('❤️ useDatabase: getUserLikedTracks()', userId);
    return DatabaseService.getUserLikedTracks(userId);
  };

  const getUserBookmarkedTracks = (userId: string): AudioTrack[] => {
    console.log('🔖 useDatabase: getUserBookmarkedTracks()', userId);
    return DatabaseService.getUserBookmarkedTracks(userId);
  };

  // =============================================================================
  // COMMENT LIKES
  // =============================================================================

  const toggleCommentLike = (commentId: string, userId: string): boolean => {
    console.log('❤️ useDatabase: toggleCommentLike()', commentId, userId);
    return DatabaseService.toggleCommentLike(commentId, userId);
  };

  const isCommentLikedByUser = (commentId: string, userId: string): boolean => {
    console.log('❤️ useDatabase: isCommentLikedByUser()', commentId, userId);
    return DatabaseService.isCommentLikedByUser(commentId, userId);
  };

  const getCommentLikeCount = (commentId: string): number => {
    console.log('❤️ useDatabase: getCommentLikeCount()', commentId);
    return DatabaseService.getCommentLikeCount(commentId);
  };

  // =============================================================================
  // ACTIVITY & NOTIFICATIONS
  // =============================================================================

  const addUserActivity = (activity: any): boolean => {
    console.log('📝 useDatabase: addUserActivity()', activity.type);
    return DatabaseService.addUserActivity(activity);
  };

  const addNotification = (notification: any): boolean => {
    console.log('🔔 useDatabase: addNotification()', notification.type);
    return DatabaseService.addNotification(notification);
  };

  const markActivityAsRead = (activityId: string): boolean => {
    console.log('📝 useDatabase: markActivityAsRead()', activityId);
    return DatabaseService.markActivityAsRead(activityId);
  };

  const markNotificationAsRead = (notificationId: string): boolean => {
    console.log('🔔 useDatabase: markNotificationAsRead()', notificationId);
    return DatabaseService.markNotificationAsRead(notificationId);
  };

  // =============================================================================
  // REPORT OPERATIONEN
  // =============================================================================

  const addReport = (report: ContentReport): boolean => {
    console.log('🚨 useDatabase: addReport()', report.id);
    return DatabaseService.addReport(report);
  };

  const updateReportStatus = (reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string): boolean => {
    console.log('🔄 useDatabase: updateReportStatus()', reportId, status);
    return DatabaseService.updateReportStatus(reportId, status, reviewedBy);
  };

  const deleteReport = (reportId: string): boolean => {
    console.log('🗑️ useDatabase: deleteReport()', reportId);
    return DatabaseService.deleteReport(reportId);
  };

  // =============================================================================
  // ADMIN OPERATIONEN
  // =============================================================================

  const deleteAllUserContent = (): boolean => {
    console.log('🧹 useDatabase: deleteAllUserContent()');
    const success = DatabaseService.deleteAllUserContent();
    
    if (success) {
      // Lade Daten neu nach der Löschung
      console.log('🧹 useDatabase: Löschung erfolgreich, lade Daten neu...');
      loadData();
    }
    
    return success;
  };

  const getStats = () => {
    console.log('📊 useDatabase: getStats()');
    return DatabaseService.getStats();
  };

  // =============================================================================
  // SEARCH & FILTER
  // =============================================================================

  const searchTracks = (query: string): AudioTrack[] => {
    console.log('🔍 useDatabase: searchTracks()', query);
    return DatabaseService.searchTracks(query);
  };

  const getTracksSorted = (
    sortBy: 'title' | 'user' | 'date' | 'likes' | 'duration' = 'date',
    order: 'asc' | 'desc' = 'desc'
  ): AudioTrack[] => {
    console.log('📋 useDatabase: getTracksSorted()', sortBy, order);
    return DatabaseService.getTracksSorted(sortBy, order);
  };

  // =============================================================================
  // DEBUG
  // =============================================================================

  const debug = () => {
    console.log('🐛 useDatabase: debug()');
    DatabaseService.debug();
    console.log('🐛 useDatabase: Hook-State:', {
      tracksCount: tracks.length,
      isLoading,
      tracks: tracks.map(t => ({ id: t.id, title: t.title, user: t.user.username }))
    });
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
    
    // Comment Likes
    toggleCommentLike,
    isCommentLikedByUser,
    getCommentLikeCount,
    
    // Activity & Notifications
    addUserActivity,
    addNotification,
    markActivityAsRead,
    markNotificationAsRead,
    
    // Report Operations
    addReport,
    updateReportStatus,
    deleteReport,
    
    // Admin Operations
    deleteAllUserContent,
    getStats,
    
    // Search & Filter
    searchTracks,
    getTracksSorted,
    
    // Utility
    loadData,
    debug
  };
};

export default useDatabase;
