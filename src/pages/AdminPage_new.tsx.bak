import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Music, 
  MessageCircle, 
  Heart, 
  Bookmark, 
  Trash2, 
  RefreshCw,
  Database,
  Activity,
  Bell
} from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { DatabaseCleanup } from '../components/admin/DatabaseCleanup';
import { AdminTabs } from '../components/admin/AdminTabs';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { AdminUploadsTable } from '../components/admin/AdminUploadsTable';
import { AdminCommentsModal } from '../components/admin/AdminCommentsModal';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll,
  Button,
  Card
} from '../components/ui';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'uploads' | 'comments' | 'cleanup'>('overview');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  
  // Verwende den neuen useDatabase Hook
  const { 
    tracks, 
    users, 
    comments, 
    activities, 
    notifications,
    isLoading, 
    getStats, 
    deleteAllUserContent,
    loadData,
    debug
  } = useDatabase();

  const [stats, setStats] = useState<any>(null);

  // Lade Statistiken
  useEffect(() => {
    const loadStats = () => {
      const currentStats = getStats();
      setStats(currentStats);
      console.log('📊 AdminPage: Statistiken geladen:', currentStats);
    };

    loadStats();
    
    // Lade Statistiken alle 5 Sekunden neu
    const interval = setInterval(loadStats, 5000);
    
    return () => clearInterval(interval);
  }, [getStats]);

  const handleDeleteAllUserContent = () => {
    if (window.confirm('⚠️ WARNUNG: Alle Benutzerinhalte werden gelöscht (außer Holler die Waldfee)!')) {
      const success = deleteAllUserContent();
      if (success) {
        console.log('✅ AdminPage: Alle Benutzerinhalte gelöscht');
        loadData(); // Lade Daten neu
      } else {
        console.error('❌ AdminPage: Fehler beim Löschen der Benutzerinhalte');
      }
    }
  };

  const handleRefresh = () => {
    console.log('🔄 AdminPage: Lade Daten neu...');
    loadData();
  };

  const handleDebug = () => {
    console.log('🐛 AdminPage: Debug-Informationen:');
    debug();
  };

  const handleShowComments = (track: any) => {
    setSelectedTrack(track);
    setShowCommentsModal(true);
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }: any) => (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Lade Admin-Daten...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400">Zentrale Datenbank-Verwaltung</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDebug}
                  className="text-white hover:bg-white/10"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Debug
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Aktualisieren
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Admin Tabs */}
          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <StaggerWrapper>
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StaggerItem index={0}>
                    <RevealOnScroll>
                      <StatCard
                        title="Benutzer"
                        value={stats?.totalUsers || 0}
                        icon={Users}
                        color="blue"
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                  
                  <StaggerItem index={1}>
                    <RevealOnScroll>
                      <StatCard
                        title="Audio Tracks"
                        value={stats?.totalTracks || 0}
                        icon={Music}
                        color="green"
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                  
                  <StaggerItem index={2}>
                    <RevealOnScroll>
                      <StatCard
                        title="Kommentare"
                        value={stats?.totalComments || 0}
                        icon={MessageCircle}
                        color="purple"
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                  
                  <StaggerItem index={3}>
                    <RevealOnScroll>
                      <StatCard
                        title="Likes"
                        value={stats?.totalLikes || 0}
                        icon={Heart}
                        color="red"
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StaggerItem index={4}>
                    <RevealOnScroll>
                      <StatCard
                        title="Bookmarks"
                        value={stats?.totalBookmarks || 0}
                        icon={Bookmark}
                        color="yellow"
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                  
                  <StaggerItem index={5}>
                    <RevealOnScroll>
                      <StatCard
                        title="Aktivitäten"
                        value={stats?.totalActivities || 0}
                        icon={Activity}
                        color="indigo"
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                  
                  <StaggerItem index={6}>
                    <RevealOnScroll>
                      <StatCard
                        title="Benachrichtigungen"
                        value={stats?.totalNotifications || 0}
                        icon={Bell}
                        color="pink"
                      />
                    </RevealOnScroll>
                  </StaggerItem>
                </div>

                {/* Database Info */}
                <StaggerItem index={7}>
                  <RevealOnScroll>
                    <Card className="p-6 bg-white/5 border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Datenbank-Informationen</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Gesamtdateigröße</p>
                          <p className="text-white font-medium">
                            {stats?.totalFileSize ? `${(stats.totalFileSize / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Datenbank-Status</p>
                          <p className="text-green-400 font-medium">✅ Online</p>
                        </div>
                      </div>
                    </Card>
                  </RevealOnScroll>
                </StaggerItem>

                {/* Quick Actions */}
                <StaggerItem index={8}>
                  <RevealOnScroll>
                    <Card className="p-6 bg-white/5 border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Schnellaktionen</h3>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => setActiveTab('users')}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Benutzer verwalten
                        </Button>
                        <Button
                          onClick={() => setActiveTab('uploads')}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                        >
                          <Music className="w-4 h-4 mr-2" />
                          Uploads verwalten
                        </Button>
                        <Button
                          onClick={() => setActiveTab('comments')}
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Kommentare verwalten
                        </Button>
                        <Button
                          onClick={handleDeleteAllUserContent}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Alle Inhalte löschen
                        </Button>
                      </div>
                    </Card>
                  </RevealOnScroll>
                </StaggerItem>
              </div>
            </StaggerWrapper>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <AdminUsersTable users={users} />
          )}

          {/* Uploads Tab */}
          {activeTab === 'uploads' && (
            <AdminUploadsTable 
              tracks={tracks} 
              onShowComments={handleShowComments}
            />
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <Card className="p-8 text-center bg-white/5 border-white/10">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Keine Kommentare</h3>
                  <p className="text-gray-400">Es wurden noch keine Kommentare erstellt.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <StaggerItem key={comment.id} index={index}>
                      <RevealOnScroll>
                        <Card className="p-4 bg-white/5 border-white/10">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-white">{comment.user.username}</span>
                                <span className="text-gray-400 text-sm">
                                  {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                                </span>
                              </div>
                              <p className="text-gray-300">{comment.content}</p>
                              {comment.trackTitle && (
                                <p className="text-gray-500 text-sm mt-2">
                                  Track: {comment.trackTitle}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </RevealOnScroll>
                    </StaggerItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cleanup Tab */}
          {activeTab === 'cleanup' && (
            <DatabaseCleanup 
              onCleanup={handleRefresh}
              onDeleteAllUserContent={handleDeleteAllUserContent}
            />
          )}
        </div>

        {/* Comments Modal */}
        {showCommentsModal && selectedTrack && (
          <AdminCommentsModal
            track={selectedTrack}
            onClose={() => setShowCommentsModal(false)}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default AdminPage;
