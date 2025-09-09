import React from 'react';
import { useUserStore } from '../../stores/userStore';
import { useActivityStore } from '../../stores/activityStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import DatabaseService from '../../services/databaseService';
import type { AudioTrack, User } from '../../types';

interface DatabaseCleanupProps {
  onCleanup: () => void;
  onDeleteAllUserContent?: () => void;
}

export const DatabaseCleanup: React.FC<DatabaseCleanupProps> = ({ onCleanup, onDeleteAllUserContent }) => {
  const { myTracks, addMyTrack } = useUserStore();
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

    console.log('🎯 DatabaseCleanup: Neuer Holla-Post erstellt:', newTrack);

    // Track zur zentralen Datenbank hinzufügen
    const success = DatabaseService.addTrack(newTrack);
    
    if (success) {
      console.log('✅ DatabaseCleanup: Post erfolgreich zur Datenbank hinzugefügt');
      
      // Activity hinzufügen für Benachrichtigungen
      const { addActivity } = useActivityStore.getState();
      addActivity({
        type: 'upload',
        trackId: newTrack.id,
        user: newTrack.user,
        isRead: false
      });

      alert(`Neuer Post von hollladiewaldfee erstellt: "${newTrack.title}"`);
    } else {
      console.error('❌ DatabaseCleanup: Fehler beim Hinzufügen zur Datenbank');
      alert('Fehler beim Erstellen des Posts. Bitte versuchen Sie es erneut.');
    }
  };

  const handleCleanup = () => {
    // Diese Funktion wird nicht mehr verwendet - die Löschung erfolgt über AdminPage.tsx
    console.log('DatabaseCleanup: handleCleanup aufgerufen - aber nicht mehr verwendet');
      onCleanup();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onDeleteAllUserContent || handleCleanup}
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
