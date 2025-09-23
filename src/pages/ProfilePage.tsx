import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useDatabase } from '../hooks/useDatabase';
import { Button } from '../components/ui/Button';
import { Panel, Card } from '../components/ui/glassmorphism';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Heading, Text, Label } from '../components/ui/Typography';
import { MultiToggle } from '../components/ui/Toggle';
import { AudioCard } from '../components/feed/AudioCard';
import { useFeedStore } from '../stores/feedStore';
import { Settings, Mic } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn } = useUserStore();
  const { tracks, users, isLoading: dbLoading } = useDatabase();
  const { audioItems } = useFeedStore();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userAudio, setUserAudio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'uploads' | 'liked' | 'bookmarked'>('uploads');

  useEffect(() => {
    const loadProfile = () => {
      try {
        setLoading(true);
        
        // Determine which user's profile to show
        const targetUserId = id || currentUser?.id;
        
        if (targetUserId) {
          // Load user data from users array
          const user = users.find(u => u.id === targetUserId) || currentUser;
          setProfileUser(user);
          
          // Check if this is the current user's own profile
          setIsOwnProfile(currentUser?.id === targetUserId);
          
          // Load user's audio items from tracks array
          const audio = tracks.filter(track => track.user?.id === targetUserId);
          setUserAudio(audio || []);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!dbLoading) {
      loadProfile();
    }
  }, [id, currentUser?.id, tracks, users, dbLoading]);

  const handleEditProfile = () => {
    // Navigate to profile edit page or show edit modal
    console.log('Edit profile clicked');
  };

  const handleFollow = () => {
    // Implement follow functionality
    console.log('Follow clicked');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-full flex items-center justify-center">
        <Panel variant="primary" className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-strong mx-auto"></div>
          <Text className="mt-4" color="secondary">Profil wird geladen...</Text>
        </Panel>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-full flex items-center justify-center">
        <Panel variant="primary" className="p-8 text-center">
          <Heading level={2} className="mb-4">Profil nicht gefunden</Heading>
          <Text color="secondary" className="mb-6">Das angeforderte Profil konnte nicht gefunden werden.</Text>
          <Button onClick={() => navigate('/')} variant="primary">
            Zurück zur Startseite
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-full">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <Panel variant="primary" className="p-6 mb-6">
          {/* Username and Settings */}
          <div className="flex items-center justify-center mb-4">
            <Heading level={1} gradient className="text-center">
              {profileUser.username || 'you'}
            </Heading>
            <Button onClick={handleEditProfile} variant="ghost" size="sm" className="ml-2">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Bio */}
          <Text color="secondary" className="text-center mb-4">
            {profileUser.bio || 'Voice enthusiast sharing intimate audio experiences'}
          </Text>
          
          {/* Divider */}
          <div className="border-t border-white/20 my-4"></div>
          
          {/* Stats */}
          <div className="flex justify-center space-x-12">
            <div className="text-center">
              <Heading level={3} gradient>
                {userAudio.length}
              </Heading>
              <Label color="secondary">Recordings</Label>
            </div>
            <div className="text-center">
              <Heading level={3} gradient>
                {profileUser.plays || 0}
              </Heading>
              <Label color="secondary">Plays</Label>
            </div>
            <div className="text-center">
              <Heading level={3} gradient>
                {profileUser.likes || 0}
              </Heading>
              <Label color="secondary">Likes</Label>
            </div>
          </div>
        </Panel>

        {/* Tab Navigation */}
        <div className="mb-6">
          <MultiToggle
            options={[
              { value: 'uploads', label: 'Uploads' },
              { value: 'liked', label: 'Liked' },
              { value: 'bookmarked', label: 'Bookmarked' }
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'uploads' | 'liked' | 'bookmarked')}
            variant="segmented"
            size="sm"
          />
        </div>

        {/* Content */}
        {/* Audio Tracks */}
        <div className="mb-8">
          {userAudio.length === 0 ? (
            <Panel variant="secondary" className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <Heading level={4} className="mb-2">No recordings yet</Heading>
                <Text color="secondary" className="mb-6">
                  Teile deine erste Sprachaufnahme!
                </Text>
                <Button 
                  onClick={() => navigate('/record')} 
                  variant="primary" 
                  className="w-full"
                >
                  Aufnahme starten
                </Button>
              </div>
            </Panel>
          ) : (
            <div className="space-y-3">
              {userAudio.map((audio, index) => (
                <AudioCard key={audio.id} track={audio} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        {profileUser.tags && profileUser.tags.length > 0 && (
          <Panel variant="glass" className="p-6">
            <Heading level={3} className="mb-3">Interessen</Heading>
            <div className="flex flex-wrap gap-2">
              {profileUser.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </Panel>
        )}

        {/* Footer */}
        <footer className="mt-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center space-x-4 text-sm">
              <Text variant="body-sm" color="tertiary">Privacy Policy</Text>
              <Text variant="body-sm" color="tertiary">Community Guidelines</Text>
              <Text variant="body-sm" color="tertiary">About Us</Text>
            </div>
            <div className="flex justify-center space-x-4 text-sm">
              <Text variant="body-sm" color="tertiary">Terms of Service</Text>
              <Text variant="body-sm" color="tertiary">Safety & Report</Text>
              <Text variant="body-sm" color="tertiary">Contact</Text>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
