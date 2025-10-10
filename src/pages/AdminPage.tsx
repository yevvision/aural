import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, Plus, BarChart3, Users, Upload, MessageSquare, Flag, ChevronDown, ChevronUp, Play, Pause, Heart, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import type { AudioTrack, User } from '../types';
import { MiniPlayer } from '../components/audio/MiniPlayer';
import { useGlobalAudioManager } from '../hooks/useGlobalAudioManager';
import { useDatabase } from '../hooks/useDatabase';
import { Button } from '../components/ui/Button';
import { Heading, Body, Caption } from '../components/ui/Typography';
import { AdminTabs } from '../components/admin/AdminTabs';
import { AdminFilters } from '../components/admin/AdminFilters';
import { AdminUploadsTable } from '../components/admin/AdminUploadsTable';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { AdminCommentsModal } from '../components/admin/AdminCommentsModal';
import { DatabaseCleanup } from '../components/admin/DatabaseCleanup';
import { ReportsTable } from '../components/admin/ReportsTable';
import { AdminStatistics } from '../components/admin/AdminStatistics';
import { PendingUploadsQueue } from '../components/admin/PendingUploadsQueue';

interface AdminStats {
  totalUsers: number;
  totalTracks: number;
  totalComments: number;
  totalLikes: number;
  totalFileSize: number;
  totalReports: number;
  pendingReports: number;
}

type SortField = 'title' | 'user' | 'likes' | 'date' | 'fileSize' | 'duration';
type SortOrder = 'asc' | 'desc';

export const AdminPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const { play, currentTrack, isPlaying, pause, toggle } = useGlobalAudioManager();
  const { 
    tracks,
    users,
    comments,
    reports,
    isLoading,
    deleteTrack, 
    deleteAllUserContent,
    forceDeleteTrack,
    getStats,
    getTracksSorted,
    searchTracks,
    updateReportStatus,
    deleteReport,
    deleteCommentFromTrack,
    getCommentLikeCount,
    debug
  } = useDatabase();
  
  const [activeTab, setActiveTab] = useState<'uploads' | 'users' | 'comments' | 'reports' | 'statistics' | 'pending'>('uploads');
  const [pendingCount, setPendingCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTracks: 0,
    totalComments: 0,
    totalLikes: 0,
    totalFileSize: 0,
    totalReports: 0,
    pendingReports: 0
  });

  // Lade Statistiken
  useEffect(() => {
    console.log('🎯 AdminPage: Lade Statistiken...');
    const dbStats = getStats();
    setStats(dbStats);
  }, [tracks]); // Aktualisiere Statistiken wenn sich Tracks ändern

  // Lade Pending Count
  useEffect(() => {
    loadPendingCount();
  }, []);

  // Load pending count
  const loadPendingCount = () => {
    try {
      const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
      if (pendingUploadsData) {
        const uploads = JSON.parse(pendingUploadsData);
        const pendingList = Object.values(uploads).filter((upload: any) => 
          upload.status === 'pending_review'
        );
        setPendingCount(pendingList.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Failed to load pending count:', error);
      setPendingCount(0);
    }
  };

  // Alle Tracks mit Filter und Sortierung (Admin sieht alle Tracks, auch inaktive)
  const getAllTracks = (): AudioTrack[] => {
    console.log('🎯 AdminPage: getAllTracks() mit Filtern...');
    
    // Admin sieht alle Tracks (auch die in der Warteschlange)
    let filteredTracks = tracks;
    
    // Benutzer-Filter anwenden
    if (userFilter !== 'all') {
      filteredTracks = filteredTracks.filter(track => track.user.id === userFilter);
      console.log('🎯 AdminPage: Nach Benutzer-Filter:', filteredTracks.length);
    }
    
    // Suchfilter anwenden
    if (searchQuery) {
      const searchResults = searchTracks(searchQuery);
      filteredTracks = searchResults;
      console.log('🎯 AdminPage: Nach Suchfilter:', filteredTracks.length);
    } else {
      // Sortierung anwenden (nur wenn keine Suche aktiv)
      filteredTracks = getTracksSorted(sortField as "user" | "duration" | "title" | "likes" | "date", sortOrder);
      console.log('🎯 AdminPage: Nach Sortierung:', filteredTracks.length);
      
      // Benutzer-Filter nochmal anwenden nach Sortierung
      if (userFilter !== 'all') {
        filteredTracks = filteredTracks.filter(track => track.user.id === userFilter);
      }
    }
    
    console.log('🎯 AdminPage: Finale Tracks:', filteredTracks.length);
    return filteredTracks;
  };

  // Formatierung der Dateigröße
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatierung der Dauer
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Admin-Berechtigung prüfen
  const isAdmin = true; // Für Testzwecke immer true

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl mb-4">Zugriff verweigert</Heading>
          <Body color="secondary">Sie haben keine Berechtigung, diese Seite zu besuchen.</Body>
        </div>
      </div>
    );
  }

  const handleDeleteTrack = (trackId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Track löschen möchten?')) {
      console.log('🎯 AdminPage: Lösche Track:', trackId);
      const success = deleteTrack(trackId);
      
      if (success) {
        console.log('✅ AdminPage: Track erfolgreich gelöscht');
        // Statistiken werden automatisch über useEffect aktualisiert
      } else {
        console.error('❌ AdminPage: Fehler beim Löschen des Tracks');
        alert('Fehler beim Löschen des Tracks. Bitte versuchen Sie es erneut.');
      }
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Benutzer und alle seine Uploads löschen möchten?')) {
      console.log('🎯 AdminPage: Lösche Benutzer:', userId);
      
      // Lösche alle Tracks des Benutzers
      const userTracks = tracks.filter(track => track.user.id === userId);
      let deletedCount = 0;
      
      userTracks.forEach(track => {
        const success = deleteTrack(track.id);
        if (success) deletedCount++;
      });
      
      console.log(`✅ AdminPage: ${deletedCount} Tracks von Benutzer ${userId} gelöscht`);
      // Statistiken werden automatisch über useEffect aktualisiert
    }
  };

  const handleDeleteAllUserContent = () => {
    console.log('🎯 AdminPage: === ADMIN BUTTON GEDRÜCKT ===');
    if (confirm('Sind Sie sicher, dass Sie ALLE Benutzer-Inhalte löschen möchten? (Nur die ersten 3 Aufnahmen von Holler die Waldfee bleiben erhalten - auch Ihre eigenen Aufnahmen werden gelöscht!)')) {
      console.log('🎯 AdminPage: Bestätigung erhalten, starte Löschung...');
      
      const success = deleteAllUserContent();
      
      if (success) {
        console.log('✅ AdminPage: Löschung erfolgreich');
        
        // Setze UI-Filter zurück
        setSearchQuery('');
        setUserFilter('all');
        setSortField('date');
        setSortOrder('desc');
        
        // Statistiken werden automatisch über useEffect aktualisiert
        console.log('🎯 AdminPage: UI-State zurückgesetzt');
        
        // Zeige Erfolgsmeldung
        alert('Alle Benutzer-Inhalte wurden erfolgreich gelöscht! Nur die ersten 3 Aufnahmen von Holler die Waldfee sind erhalten geblieben.');
      } else {
        console.error('❌ AdminPage: Fehler bei der Löschung');
        alert('Fehler beim Löschen der Inhalte. Bitte versuchen Sie es erneut.');
      }
    } else {
      console.log('🎯 AdminPage: Löschung abgebrochen');
    }
  };

  const handleForceDeleteTrack = () => {
    console.log('🎯 AdminPage: === FORCE DELETE TRACK BUTTON GEDRÜCKT ===');
    if (confirm('Sind Sie sicher, dass Sie den Track "naaa" von "yev_cloud" löschen möchten?')) {
      console.log('🎯 AdminPage: Bestätigung erhalten, lösche Track...');
      
      const success = forceDeleteTrack('naaa', 'yev_cloud');
      
      if (success) {
        console.log('✅ AdminPage: Track erfolgreich gelöscht');
        alert('Track "naaa" von "yev_cloud" wurde erfolgreich gelöscht!');
      } else {
        console.error('❌ AdminPage: Fehler beim Löschen des Tracks');
        alert('Fehler beim Löschen des Tracks. Möglicherweise existiert er nicht in der aktuellen Datenbank.');
      }
    } else {
      console.log('🎯 AdminPage: Track-Löschung abgebrochen');
    }
  };

  const handlePlayTrack = (track: AudioTrack) => {
    if (currentTrack?.id === track.id) {
      toggle();
    } else {
      play(track);
    }
  };

  const handleShowComments = (track: AudioTrack) => {
    setSelectedTrack(track);
    setShowCommentsModal(true);
  };

  const handleCleanup = () => {
    // Aktualisiere Daten nach der Bereinigung
    const dbStats = getStats();
    setStats(dbStats);
  };

  const handleUpdateReportStatus = (reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string) => {
    console.log('🎯 AdminPage: Update report status:', reportId, status);
    const success = updateReportStatus(reportId, status, reviewedBy);
    
    if (success) {
      console.log('✅ AdminPage: Report status updated successfully');
      // Statistiken werden automatisch über useEffect aktualisiert
    } else {
      console.error('❌ AdminPage: Failed to update report status');
      alert('Failed to update report status. Please try again.');
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      console.log('🎯 AdminPage: Delete report:', reportId);
      const success = deleteReport(reportId);
      
      if (success) {
        console.log('✅ AdminPage: Report deleted successfully');
        // Statistiken werden automatisch über useEffect aktualisiert
      } else {
        console.error('❌ AdminPage: Failed to delete report');
        alert('Failed to delete report. Please try again.');
      }
    }
  };

  const handleDeleteComment = (trackId: string, commentId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Kommentar löschen möchten?')) {
      console.log('🎯 AdminPage: Delete comment:', commentId, 'from track:', trackId);
      const success = deleteCommentFromTrack(trackId, commentId);
      
      if (success) {
        console.log('✅ AdminPage: Comment deleted successfully');
        // Statistiken werden automatisch über useEffect aktualisiert
      } else {
        console.error('❌ AdminPage: Failed to delete comment');
        alert('Fehler beim Löschen des Kommentars. Bitte versuchen Sie es erneut.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heading level={1} className="text-4xl mb-2">Admin Dashboard</Heading>
          <Body color="secondary">Verwalten Sie Benutzer, Uploads und Inhalte</Body>
        </motion.div>

        {/* Statistiken */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="panel-floating p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <Caption color="secondary">Benutzer</Caption>
                <Body className="text-2xl font-semibold text-white">{stats.totalUsers}</Body>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="panel-floating p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <Caption color="secondary">Tracks</Caption>
                <Body className="text-2xl font-semibold text-white">{stats.totalTracks}</Body>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="panel-floating p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <Caption color="secondary">Kommentare</Caption>
                <Body className="text-2xl font-semibold text-white">{stats.totalComments}</Body>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="panel-floating p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <Caption color="secondary">Likes</Caption>
                <Body className="text-2xl font-semibold text-white">{stats.totalLikes}</Body>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="panel-floating p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <Caption color="secondary">Speicher</Caption>
                <Body className="text-2xl font-semibold text-white">{formatFileSize(stats.totalFileSize)}</Body>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="panel-floating p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <Caption color="secondary">Reports</Caption>
                <Body className="text-2xl font-semibold text-white">{stats.totalReports}</Body>
                {stats.pendingReports > 0 && (
                  <Caption className="text-gradient-strong">{stats.pendingReports} pending</Caption>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Subtile Admin-Buttons */}
        <motion.div 
          className="flex justify-end gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            onClick={() => {/* TODO: Implement create post */}}
            variant="glass"
            size="md"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neuen Post erstellen
          </Button>
          
          <Button
            onClick={handleDeleteAllUserContent}
            variant="glass"
            size="md"
            className="flex items-center gap-2 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Alle Benutzerinhalte löschen
          </Button>
          
          <Button
            onClick={handleForceDeleteTrack}
            variant="glass"
            size="md"
            className="flex items-center gap-2 hover:text-orange-400"
          >
            <Trash2 className="w-4 h-4" />
            "naaa" von yev_cloud löschen
          </Button>
        </motion.div>

        {/* Toggle-Menü für Tabs */}
        <motion.div 
          className="panel-floating mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-wrap gap-2 p-4">
            {[
              { id: 'uploads', label: 'Uploads', count: tracks.length, icon: Upload },
              { id: 'users', label: 'Benutzer', count: users.length, icon: Users },
              { id: 'comments', label: 'Kommentare', count: comments.length, icon: MessageSquare },
              { id: 'reports', label: 'Reports', count: reports.length, icon: Flag },
              { id: 'pending', label: 'Warteschlange', count: pendingCount, icon: Clock },
              { id: 'statistics', label: 'Statistiken', count: 0, icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? 'primary' : 'glass'}
                  size="sm"
                  className={`flex items-center gap-2 ${tab.id === 'pending' && tab.count > 0 ? 'border-2 border-red-500/50 bg-red-500/10' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label} ({tab.count})
                  {tab.id === 'pending' && tab.count > 0 && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Suchfunktion */}
        <motion.div 
          className="panel-floating mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-white/20 rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-gradient-strong transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Inhalt basierend auf aktivem Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'uploads' && (
            <motion.div
              key="uploads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminUploadsTable
                tracks={getAllTracks()}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onDeleteTrack={handleDeleteTrack}
                onPlayTrack={handlePlayTrack}
                onShowComments={handleShowComments}
                formatFileSize={formatFileSize}
                formatDuration={formatDuration}
              />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminUsersTable
                users={users}
                onDeleteUser={handleDeleteUser}
              />
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="panel-floating">
                <div className="px-6 py-4 border-b border-white/10">
                  <Heading level={3} className="text-lg">Kommentare ({comments.length})</Heading>
                </div>
                <div className="p-6">
                  {comments.length === 0 ? (
                    <Body color="secondary" className="text-center py-8">Keine Kommentare vorhanden.</Body>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border-b border-white/10 pb-4 last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Body className="text-white mb-2">{comment.content}</Body>
                              <div className="text-sm text-text-secondary">
                                <span className="font-medium">{comment.user.username}</span>
                                <span className="mx-2">•</span>
                                <span>Track: {comment.trackTitle}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(comment.createdAt).toLocaleDateString('de-DE')}</span>
                                <span className="mx-2">•</span>
                                <span>{getCommentLikeCount(comment.id)} Likes</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDeleteComment(comment.trackId, comment.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              Löschen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReportsTable
                reports={reports}
                onUpdateStatus={handleUpdateReportStatus}
                onDeleteReport={handleDeleteReport}
              />
            </motion.div>
          )}

          {activeTab === 'statistics' && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminStatistics onBack={() => setActiveTab('uploads')} />
            </motion.div>
          )}

          {activeTab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <Button
                  onClick={() => {
                    // loadData();
                    loadPendingCount();
                    // Manual refresh triggered
                  }}
                  variant="primary"
                  size="md"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🔄 Daten aktualisieren
                </Button>
              </div>
              <PendingUploadsQueue
                onUploadProcessed={(uploadId, action) => {
                  console.log(`Upload ${action}: ${uploadId}`);
                  // Aktualisiere Pending-Count nach Verarbeitung
                  loadPendingCount();
                  // Lade Daten neu um freigegebene Tracks zu zeigen
                  setTimeout(() => {
                    // loadData();
                  }, 100);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kommentare Modal */}
        {showCommentsModal && selectedTrack && (
          <AdminCommentsModal
            track={selectedTrack}
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            getCommentLikeCount={getCommentLikeCount}
          />
        )}

        {/* Mini Player */}
        {currentTrack && (
          <MiniPlayer />
        )}
      </div>
    </div>
  );
};