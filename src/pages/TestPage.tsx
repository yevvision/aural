import { useEffect, useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { useUserStore } from '../stores/userStore';

export const TestPage = () => {
  const { currentUser } = useUserStore();
  const { tracks, users, comments, isLoading, getStats, toggleLike, toggleBookmark, addCommentToTrack } = useDatabase(currentUser?.id);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = () => {
      const currentStats = getStats();
      setStats(currentStats);
      console.log('📊 TestPage: Statistiken:', currentStats);
    };

    loadStats();
  }, [getStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Datenbank Test</h1>
      
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

      {/* Tracks */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Tracks ({tracks.length})</h2>
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
                  
                  {/* Test Buttons */}
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => currentUser?.id && toggleLike(track.id, currentUser.id)}
                      className={`px-3 py-1 rounded text-sm ${
                        track.isLiked 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {track.isLiked ? '❤️ Unlike' : '🤍 Like'} ({track.likes})
                    </button>
                    
                    <button
                      onClick={() => currentUser?.id && toggleBookmark(track.id, currentUser.id)}
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
                          id: `test-comment-${Date.now()}`,
                          content: `Test-Kommentar um ${new Date().toLocaleTimeString()}`,
                          user: { id: 'user-1', username: 'yevvo', email: 'yevvo@example.com' },
                          createdAt: new Date(),
                          likes: 0,
                          isLiked: false
                        };
                        addCommentToTrack(track.id, comment);
                      }}
                      className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                    >
                      💬 Test-Kommentar
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

      {/* Benutzer */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Benutzer ({users.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => (
            <div key={user.id} className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold">{user.username}</h3>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-sm text-gray-500">
                {user.totalUploads} Uploads • {user.totalLikes} Likes
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Kommentare */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Kommentare ({comments.length})</h2>
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-300">{comment.content}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    von {comment.user.username}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestPage;