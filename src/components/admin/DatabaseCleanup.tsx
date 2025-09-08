import React from 'react';
import { useFeedStore } from '../../stores/feedStore';
import { useUserStore } from '../../stores/userStore';
import { useActivityStore } from '../../stores/activityStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { database } from '../../database/simulatedDatabase';
import type { AudioTrack, User } from '../../types';

interface DatabaseCleanupProps {
  onCleanup: () => void;
}

export const DatabaseCleanup: React.FC<DatabaseCleanupProps> = ({ onCleanup }) => {
  const { setTracks } = useFeedStore();
  const { myTracks } = useUserStore();
  const { clearActivities, clearUserActivities } = useActivityStore();
  const { clearAll } = useNotificationsStore();

  const handleCreateHollaPost = () => {
    // Erstelle einen neuen zufälligen Post von hollladiewaldfee
    const postTemplates = [
      {
        title: 'Sanfte Abendgedanken',
        description: 'Ein ruhiger Moment am Ende des Tages mit warmen Gedanken',
        duration: 180,
        tags: ['Evening', 'Peaceful', 'Reflection', 'Calm']
      },
      {
        title: 'Morgentau',
        description: 'Frische Energie für den neuen Tag',
        duration: 120,
        tags: ['Morning', 'Fresh', 'Energy', 'New Day']
      },
      {
        title: 'Regentropfen',
        description: 'Die beruhigende Melodie des Regens',
        duration: 240,
        tags: ['Rain', 'Nature', 'Relaxing', 'Ambient']
      },
      {
        title: 'Sternenlicht',
        description: 'Träume unter dem Sternenhimmel',
        duration: 200,
        tags: ['Stars', 'Dreams', 'Night', 'Magic']
      },
      {
        title: 'Waldgeflüster',
        description: 'Die Geheimnisse des Waldes',
        duration: 160,
        tags: ['Forest', 'Nature', 'Whisper', 'Mystery']
      }
    ];

    const randomTemplate = postTemplates[Math.floor(Math.random() * postTemplates.length)];
    const silentAudioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT';

    const newTrack: AudioTrack = {
      id: `holla-new-${Date.now()}`,
      title: randomTemplate.title,
      description: randomTemplate.description,
      duration: randomTemplate.duration,
      url: silentAudioUrl,
      user: {
        id: '4',
        username: 'hollladiewaldfee',
        avatar: '/avatars/4.jpg',
        totalLikes: 42,
        totalUploads: 3,
        bio: 'Intime Flüsterstimmen und entspannende Momente 🌸',
        createdAt: new Date('2024-01-05'),
      },
      likes: 0,
      isLiked: false,
      comments: [],
      commentsCount: 0,
      createdAt: new Date(),
      tags: randomTemplate.tags,
      gender: 'Female',
      filename: `${randomTemplate.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
      fileSize: Math.floor(Math.random() * 3000000) + 1000000, // 1-4MB
      format: 'audio/wav'
    };

    // Füge den neuen Track zur Datenbank hinzu
    const file = {
      id: `file-${newTrack.id}`,
      filename: newTrack.filename,
      path: `/uploads/hollladiewaldfee/${newTrack.filename}`,
      size: newTrack.fileSize,
      uploadedAt: newTrack.createdAt,
      userId: newTrack.user.id
    };
    database.addTrack(newTrack, file);

    // Füge den Track zum Feed hinzu
    const { tracks } = useFeedStore.getState();
    useFeedStore.getState().setTracks([newTrack, ...tracks]);

    alert(`Neuer Post von hollladiewaldfee erstellt: "${newTrack.title}"`);
  };

  const handleCleanup = () => {
    if (confirm('Sind Sie sicher, dass Sie alle Audio-Dateien und Benachrichtigungen löschen möchten? (Nur hollladiewaldfee und Ihre eigenen Uploads bleiben erhalten)')) {
      // Lösche alle Daten aus der simulierten Datenbank
      const existingTracks = database.getAllTracks();
      existingTracks.forEach(track => {
        database.deleteTrack(track.id);
      });
      
      const allUsers = database.getAllUsers();
      allUsers.forEach(user => {
        database.deleteUser(user.id);
      });
      
      // Lösche auch alle Tracks aus dem Feed Store (außer eigenen Uploads)
      const { tracks } = useFeedStore.getState();
      const tracksToKeep = tracks.filter(track => 
        track.user.id === '4' || // hollladiewaldfee behalten
        myTracks.some(myTrack => myTrack.id === track.id) // eigene Uploads behalten
      );
      setTracks(tracksToKeep);
      
      // Erstelle Holladiewaldfee Tracks in der Datenbank
      const hollaTracks: AudioTrack[] = [
        {
          id: 'holla-1',
          title: 'Intime Flüsterstimme',
          description: 'Eine sanfte, beruhigende Stimme für entspannte Momente',
          duration: 195, // 3:15 Minuten
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          user: {
            id: '4',
            username: 'hollladiewaldfee',
            avatar: '/avatars/4.jpg',
            totalLikes: 42,
            totalUploads: 3,
            bio: 'Intime Flüsterstimmen und entspannende Momente 🌸',
            createdAt: new Date('2024-01-05'),
          },
          likes: 23,
          commentsCount: 5,
          createdAt: new Date(Date.now() - 86400000), // 1 Tag alt
          fileSize: 2560000, // 2.5MB
          comments: [
            {
              id: 'comment-h1-1',
              text: 'Wunderschöne Stimme!',
              user: {
                id: 'user-1',
                username: 'you',
                totalLikes: 0,
                totalUploads: 0,
                createdAt: new Date()
              },
              trackId: 'holla-1',
              createdAt: new Date(Date.now() - 3600000)
            },
            {
              id: 'comment-h1-2',
              text: 'Sehr entspannend, danke!',
              user: {
                id: 'user-1',
                username: 'you',
                totalLikes: 0,
                totalUploads: 0,
                createdAt: new Date()
              },
              trackId: 'holla-1',
              createdAt: new Date(Date.now() - 7200000)
            }
          ]
        },
        {
          id: 'holla-2',
          title: 'ASMR Entspannung',
          description: 'Sanfte Geräusche und Flüstern für tiefe Entspannung',
          duration: 420, // 7 Minuten
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          user: {
            id: '4',
            username: 'hollladiewaldfee',
            avatar: '/avatars/4.jpg',
            totalLikes: 42,
            totalUploads: 3,
            bio: 'Intime Flüsterstimmen und entspannende Momente 🌸',
            createdAt: new Date('2024-01-05'),
          },
          likes: 18,
          commentsCount: 3,
          createdAt: new Date(Date.now() - 172800000), // 2 Tage alt
          fileSize: 5120000, // 5MB
          comments: [
            {
              id: 'comment-h2-1',
              text: 'Perfekt zum Einschlafen!',
              user: {
                id: 'user-1',
                username: 'you',
                totalLikes: 0,
                totalUploads: 0,
                createdAt: new Date()
              },
              trackId: 'holla-2',
              createdAt: new Date(Date.now() - 14400000)
            }
          ]
        },
        {
          id: 'holla-3',
          title: 'Stille Momente',
          description: 'Eine ruhige, meditative Erfahrung',
          duration: 300, // 5 Minuten
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT',
          user: {
            id: '4',
            username: 'hollladiewaldfee',
            avatar: '/avatars/4.jpg',
            totalLikes: 42,
            totalUploads: 3,
            bio: 'Intime Flüsterstimmen und entspannende Momente 🌸',
            createdAt: new Date('2024-01-05'),
          },
          likes: 31,
          commentsCount: 7,
          createdAt: new Date(Date.now() - 259200000), // 3 Tage alt
          fileSize: 3840000, // 3.8MB
          comments: [
            {
              id: 'comment-h3-1',
              text: 'Absolut wundervoll!',
              user: {
                id: 'user-1',
                username: 'you',
                totalLikes: 0,
                totalUploads: 0,
                createdAt: new Date()
              },
              trackId: 'holla-3',
              createdAt: new Date(Date.now() - 21600000)
            },
            {
              id: 'comment-h3-2',
              text: 'Mein Favorit!',
              user: {
                id: 'user-1',
                username: 'you',
                totalLikes: 0,
                totalUploads: 0,
                createdAt: new Date()
              },
              trackId: 'holla-3',
              createdAt: new Date(Date.now() - 18000000)
            }
          ]
        }
      ];

      // Füge Holla-Tracks zur Datenbank hinzu
      hollaTracks.forEach(track => {
        const file = {
          id: `file-${track.id}`,
          filename: track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
          path: `/uploads/holladiewaldfee/${track.filename || `${track.title.toLowerCase().replace(/\s+/g, '_')}.wav`}`,
          size: track.fileSize || 0,
          uploadedAt: track.createdAt,
          userId: track.user.id
        };
        database.addTrack(track, file);
      });
      
      // Kombiniere Holla-Tracks mit den bereits gefilterten Tracks
      const finalTracks = [...hollaTracks, ...tracksToKeep];
      
      // Setze die bereinigten Tracks im Feed Store
      setTracks(finalTracks);
      
      // Lösche alle Benachrichtigungen und Aktivitäten
      clearActivities();
      clearUserActivities();
      clearAll();
      
      // Lösche alle localStorage-Daten außer den eigenen Uploads
      const keysToRemove = [
        'aural-activity-store',
        'aural-notifications-store'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Behalte nur die eigenen Uploads im userStore
      const userStoreData = localStorage.getItem('aural-user-store');
      if (userStoreData) {
        try {
          const parsed = JSON.parse(userStoreData);
          if (parsed.state && parsed.state.myTracks) {
            // Behalte nur die eigenen Tracks
            const cleanedData = {
              ...parsed,
              state: {
                ...parsed.state,
                myTracks: parsed.state.myTracks,
                // Setze andere Listen zurück
                likedTracks: [],
                bookmarkedTracks: [],
                followedUsers: [],
                activities: []
              }
            };
            localStorage.setItem('aural-user-store', JSON.stringify(cleanedData));
          }
        } catch (error) {
          console.error('Fehler beim Bereinigen der Benutzerdaten:', error);
        }
      }
      
      onCleanup();
      alert('Datenbank wurde erfolgreich bereinigt und synchronisiert! Die Seite wird neu geladen.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleCleanup}
        className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
      >
        Alle Benutzerinhalte löschen
      </button>
      
      <button
        onClick={handleCreateHollaPost}
        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        Neuen Post erstellen
      </button>
    </div>
  );
};
