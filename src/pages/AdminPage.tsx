import React, { useState, useEffect } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { useUserStore } from '../stores/userStore';
import type { AudioTrack, User } from '../types';
import { MiniPlayer } from '../components/audio/MiniPlayer';
import { useGlobalAudioManager } from '../hooks/useGlobalAudioManager';
import { useDatabaseSync } from '../hooks/useDatabaseSync';
import { AdminTabs } from '../components/admin/AdminTabs';
import { AdminFilters } from '../components/admin/AdminFilters';
import { AdminUploadsTable } from '../components/admin/AdminUploadsTable';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { AdminCommentsModal } from '../components/admin/AdminCommentsModal';
import { DatabaseCleanup } from '../components/admin/DatabaseCleanup';

interface AdminStats {
  totalUsers: number;
  totalTracks: number;
  totalComments: number;
  totalLikes: number;
  totalFileSize: number;
}

type SortField = 'title' | 'user' | 'likes' | 'comments' | 'date' | 'fileSize' | 'duration';
type SortOrder = 'asc' | 'desc';

export const AdminPage: React.FC = () => {
  const { tracks, deleteTracksByUser } = useFeedStore();
  const { currentUser, myTracks } = useUserStore();
  const { play, currentTrack, isPlaying, pause, toggle } = useGlobalAudioManager();
  const { 
    deleteTrack, 
    deleteUser, 
    getAllUsers, 
    getTracksSorted, 
    searchTracks, 
    getStats,
    deleteAllUserContent
  } = useDatabaseSync();
  
  const [activeTab, setActiveTab] = useState<'uploads' | 'users' | 'comments'>('uploads');
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
    totalFileSize: 0
  });

  // Benutzer aus der Datenbank laden
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Lade Daten aus der Datenbank
  useEffect(() => {
    const users = getAllUsers();
    setAllUsers(users);
    
    const dbStats = getStats();
    setStats(dbStats);
  }, [getAllUsers, getStats]);

  // Alle Tracks aus der Datenbank laden
  const getAllTracks = (): AudioTrack[] => {
    // Verwende Datenbank-Funktionen für Sortierung und Suche
    let dbTracks = getTracksSorted(sortField, sortOrder);
    
    // Kombiniere mit eigenen Tracks
    let allTracks = [...dbTracks, ...myTracks];
    
    // Benutzer-Filter anwenden
    if (userFilter !== 'all') {
      allTracks = allTracks.filter(track => track.user.id === userFilter);
    }
    
    // Suchfilter anwenden
    if (searchQuery) {
      const searchResults = searchTracks(searchQuery);
      allTracks = searchResults.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
    }
    
    return allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600">Sie haben keine Berechtigung, diese Seite zu besuchen.</p>
        </div>
      </div>
    );
  }

  const handleDeleteTrack = (trackId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Track löschen möchten?')) {
      const success = deleteTrack(trackId);
      if (success) {
        // Aktualisiere Statistiken
        setTimeout(() => {
          const dbStats = getStats();
          setStats(dbStats);
        }, 100);
      }
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Benutzer und alle seine Uploads löschen möchten?')) {
      const success = deleteUser(userId);
      if (success) {
        // Aktualisiere Benutzerliste und Statistiken
        const users = getAllUsers();
        setAllUsers(users);
        const dbStats = getStats();
        setStats(dbStats);
      }
    }
  };

  const handleDeleteAllUserContent = () => {
    console.log('=== ADMIN BUTTON GEDRÜCKT ===');
    if (confirm('Sind Sie sicher, dass Sie ALLE Benutzer-Inhalte löschen möchten? (Nur Holler die Waldfee bleibt erhalten - auch yevvo wird gelöscht)')) {
      console.log('Bestätigung erhalten, starte Löschung...');
      deleteAllUserContent();
      
      // Aktualisiere alle Daten und UI-State
      setTimeout(() => {
        console.log('Aktualisiere Daten nach Löschung...');
        const users = getAllUsers();
        const dbStats = getStats();
        console.log('Neue Benutzer:', users);
        console.log('Neue Statistiken:', dbStats);
        setAllUsers(users);
        setStats(dbStats);
        
        // Setze auch die UI-Filter zurück
        setSearchQuery('');
        setUserFilter('all');
        setSortField('date');
        setSortOrder('desc');
        
        console.log('UI-State zurückgesetzt');
      }, 100);
    } else {
      console.log('Löschung abgebrochen');
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
    const users = getAllUsers();
    setAllUsers(users);
    const dbStats = getStats();
    setStats(dbStats);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Verwalten Sie Benutzer, Uploads und Inhalte</p>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">U</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Benutzer</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">T</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tracks</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTracks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Kommentare</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalComments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">L</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Likes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalLikes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">S</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Speicher</p>
                <p className="text-2xl font-semibold text-gray-900">{formatFileSize(stats.totalFileSize)}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Datenbank-Bereinigung */}
        <DatabaseCleanup onCleanup={handleCleanup} />

        {/* Tabs */}
        <AdminTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          uploadsCount={tracks.length}
          usersCount={allUsers.length}
          commentsCount={0}
        />

        {/* Filter und Suche */}
        <AdminFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortField={sortField}
          onSortFieldChange={setSortField}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          userFilter={userFilter}
          onUserFilterChange={setUserFilter}
          allUsers={allUsers}
        />

        {/* Inhalt basierend auf aktivem Tab */}
        {activeTab === 'uploads' && (
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
        )}

        {activeTab === 'users' && (
          <AdminUsersTable
            users={allUsers}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'comments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Kommentare</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">Wählen Sie einen Track aus der Uploads-Tabelle, um dessen Kommentare anzuzeigen.</p>
            </div>
          </div>
        )}

        {/* Kommentare Modal */}
        {showCommentsModal && selectedTrack && (
          <AdminCommentsModal
            track={selectedTrack}
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
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