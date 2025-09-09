import { useEffect, useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

export const DebugPage = () => {
  const { tracks, users, comments, isLoading, getStats, toggleLike, toggleBookmark, addCommentToTrack } = useDatabase('user-1');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = () => {
      const currentStats = getStats();
      setStats(currentStats);
      console.log('🐛 DebugPage: Statistiken:', currentStats);
    };

    loadStats();
  }, [getStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Lade Debug-Daten...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🐛 Debug Page - Hauptseite Funktionen</h1>
      
      {/* Debug Info */}
      <div className="mb-8 bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Tracks geladen:</strong> {tracks.length}
          </div>
          <div>
            <strong>Users geladen:</strong> {users.length}
          </div>
          <div>
            <strong>Comments geladen:</strong> {comments.length}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? 'Ja' : 'Nein'}
          </div>
        </div>
      </div>

      {/* Statistiken */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Statistiken</h2>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-sm text-gray-400">Tracks</div>
              <div className="text-2xl font-bold">{stats.totalTracks}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-sm text-gray-400">Benutzer</div>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-sm text-gray-400">Kommentare</div>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-sm text-gray-400">Likes</div>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tracks mit Debug-Info */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Tracks Debug ({tracks.length})</h2>
        <div className="space-y-4">
          {tracks.map((track) => (
            <div key={track.id} className="bg-gray-800 p-4 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{track.title}</h3>
                  <p className="text-gray-400">{track.description}</p>
                  <p className="text-sm text-gray-500">
                    von {track.user.username} • {track.likes} Likes • {track.commentsCount || 0} Kommentare
                  </p>
                  
                  {/* Debug Info */}
                  <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                    <div><strong>ID:</strong> {track.id}</div>
                    <div><strong>isLiked:</strong> {track.isLiked ? '✅ Ja' : '❌ Nein'}</div>
                    <div><strong>isBookmarked:</strong> {track.isBookmarked ? '✅ Ja' : '❌ Nein'}</div>
                    <div><strong>Likes Count:</strong> {track.likes}</div>
                    <div><strong>Comments Count:</strong> {track.commentsCount || 0}</div>
                  </div>
                  
                  {/* Test Buttons */}
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => {
                        console.log('🐛 Debug: Like button clicked for track:', track.id);
                        const success = toggleLike(track.id, 'user-1');
                        console.log('🐛 Debug: Like result:', success);
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        track.isLiked 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {track.isLiked ? '❤️ Unlike' : '🤍 Like'} ({track.likes})
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('🐛 Debug: Bookmark button clicked for track:', track.id);
                        const success = toggleBookmark(track.id, 'user-1');
                        console.log('🐛 Debug: Bookmark result:', success);
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        track.isBookmarked 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {track.isBookmarked ? '🔖 Bookmarked' : '📖 Bookmark'}
                    </button>
                    
                    <button
                      onClick={() => {
                        const comment = {
                          id: `debug-comment-${Date.now()}`,
                          content: `Debug-Kommentar um ${new Date().toLocaleTimeString()}`,
                          user: { id: 'user-1', username: 'yevvo', email: 'yevvo@example.com' },
                          createdAt: new Date(),
                          likes: 0,
                          isLiked: false
                        };
                        console.log('🐛 Debug: Adding comment to track:', track.id);
                        const success = addCommentToTrack(track.id, comment);
                        console.log('🐛 Debug: Comment result:', success);
                      }}
                      className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                    >
                      💬 Debug-Kommentar
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-400 ml-4">
                  {new Date(track.createdAt).toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Console Logs */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Console Logs</h2>
        <div className="bg-black p-4 rounded text-green-400 text-sm font-mono">
          <p>Öffne die Browser-Konsole (F12) um Debug-Logs zu sehen.</p>
          <p>Alle Aktionen werden in der Konsole geloggt.</p>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
