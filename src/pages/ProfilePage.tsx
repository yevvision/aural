import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useDatabase } from '../hooks/useDatabase';
import { DatabaseService } from '../services/databaseService';
import { Button } from '../components/ui/Button';
import { Panel, Card } from '../components/ui/glassmorphism';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Heading, Text, Label } from '../components/ui/Typography';
import { MultiToggle } from '../components/ui/Toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LiquidGlassEffect } from '../components/ui/LiquidGlassEffect';
import { AudioCard } from '../components/feed/AudioCard';
import { useFeedStore } from '../stores/feedStore';
import { Settings, Mic, Save, X } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, updateProfile } = useUserStore();
  const { tracks, users, isLoading: dbLoading } = useDatabase();
  const { audioItems } = useFeedStore();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userAudio, setUserAudio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'uploads' | 'liked' | 'bookmarked'>('uploads');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  
  // Berechne Stats aus den Audio-Tracks
  const totalPlays = userAudio.reduce((sum, track) => sum + (track.plays || 0), 0);
  const totalLikes = userAudio.reduce((sum, track) => sum + (track.likes || 0), 0);
  
  // Hole liked und bookmarked Tracks für den aktuellen User
  const likedTracks = DatabaseService.getUserLikedTracks(profileUser?.id || '');
  const bookmarkedTracks = DatabaseService.getUserBookmarkedTracks(profileUser?.id || '');
  
  // Bestimme die anzuzeigenden Tracks basierend auf dem aktiven Tab
  const getDisplayTracks = () => {
    switch (activeTab) {
      case 'liked':
        return likedTracks;
      case 'bookmarked':
        return bookmarkedTracks;
      case 'uploads':
      default:
        return userAudio;
    }
  };
  
  const displayTracks = getDisplayTracks();

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
  }, [id, currentUser?.id, tracks.length, users.length, dbLoading]); // Verwende .length statt die Arrays selbst

  const handleEditProfile = () => {
    if (isOwnProfile) {
      setIsEditing(true);
      setEditName(profileUser.username || '');
      setEditBio(profileUser.bio || '');
    }
  };

  const handleSaveProfile = () => {
    if (!profileUser?.id) {
      console.error('No user ID available for saving');
      return;
    }

    // Update profile data in database
    const success = DatabaseService.updateUser(profileUser.id, {
      username: editName,
      bio: editBio
    });

    if (success) {
      // Update local state
      const updatedUser = {
        ...profileUser,
        username: editName,
        bio: editBio
      };
      setProfileUser(updatedUser);
      
      // Update UserStore with new username (für zukünftige Uploads)
      if (currentUser && currentUser.id === profileUser.id) {
        updateProfile({
          username: editName,
          bio: editBio
        });
      }
      
      // Die zentrale Datenbank aktualisiert automatisch alle Tracks
      // Keine manuelle Track-Aktualisierung mehr nötig
      
      setIsEditing(false);
      console.log('Profile und UserStore global aktualisiert - alle Tracks werden automatisch aktualisiert:', updatedUser);
    } else {
      console.error('Failed to save profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(profileUser.username || '');
    setEditBio(profileUser.bio || '');
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
        {/* Header - Schwarze Karte ohne Schatten */}
        <div className="bg-black rounded-2xl p-6 mb-6 relative">
          {/* Settings Icon - ganz oben rechts in der Ecke, unabhängig vom Padding */}
          {isOwnProfile && !isEditing && (
            <Button 
              onClick={handleEditProfile} 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white absolute top-2 right-2"
            >
              <Settings size={16} />
            </Button>
          )}
          
          {/* Username */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex-1 text-center">
              {isEditing ? (
                <div className="w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={15}
                    className="w-full bg-gray-800/50 text-3xl md:text-4xl font-bold text-white placeholder-gray-400 border-2 border-gray-500 rounded-lg px-4 py-2 outline-none text-center focus:border-gray-400 focus:bg-gray-800/70 transition-all duration-200"
                    placeholder="Username (max 15 chars)"
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {editName.length}/15
                  </div>
                </div>
              ) : (
                <Heading level={1} className="text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                  {profileUser.username || 'you'}
                </Heading>
              )}
            </div>
          </div>
          
          {/* Bio */}
          <div style={{ marginBottom: '25px' }}>
            {isEditing ? (
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-gray-800/50 text-gray-300 placeholder-gray-400 border-2 border-gray-500 rounded-lg px-4 py-3 outline-none resize-none text-center focus:border-gray-400 focus:bg-gray-800/70 transition-all duration-200"
                placeholder="Beschreibung hinzufügen..."
                rows={3}
              />
            ) : (
              <div className="text-gray-300 text-center text-sm leading-tight">
                {profileUser.bio || 'Voice enthusiast sharing intimate audio experiences'}
              </div>
            )}
          </div>
          
          {/* Edit Controls */}
          {isEditing && (
            <div className="flex justify-center space-x-3 mb-4">
              <Button 
                onClick={handleCancelEdit} 
                variant="secondary" 
                size="sm"
                className="text-gray-300 hover:text-white border-gray-600 hover:border-gray-500"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                variant="primary" 
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          )}
          
          {/* Divider */}
          <div className="border-t border-gray-700 my-4"></div>
          
          {/* Stats */}
          <div className="flex justify-center space-x-12">
            <div className="text-center">
              <Heading level={3} className="text-white text-xl md:text-2xl font-bold leading-snug">
                {userAudio.length}
              </Heading>
              <div className="text-gray-400 text-sm">Recordings</div>
            </div>
            <div className="text-center">
              <Heading level={3} className="text-white text-xl md:text-2xl font-bold leading-snug">
                {totalPlays}
              </Heading>
              <div className="text-gray-400 text-sm">Plays</div>
            </div>
            <div className="text-center">
              <Heading level={3} className="text-white text-xl md:text-2xl font-bold leading-snug">
                {totalLikes}
              </Heading>
              <div className="text-gray-400 text-sm">Likes</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="tabs-container">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'uploads' | 'liked' | 'bookmarked')} className="w-full">
              <LiquidGlassEffect
                intensity={0.0}
                chromaticDispersion={0.015}
                borderRadius={26}
                backgroundBlur={30}
                mouseTracking={false}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 rounded-full p-1 h-[53px] items-center justify-center">
                  <TabsTrigger
                    value="uploads"
                    className="text-[11px] text-white/70 font-normal data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:!font-semibold rounded-full transition-all duration-300 h-[45px] flex items-center justify-center hover:text-white hover:bg-white/20"
                  >
                    Uploads
                  </TabsTrigger>
                  <TabsTrigger
                    value="liked"
                    className="text-[11px] text-white/70 font-normal data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:!font-semibold rounded-full transition-all duration-300 h-[45px] flex items-center justify-center hover:text-white hover:bg-white/20"
                  >
                    Liked
                  </TabsTrigger>
                  <TabsTrigger
                    value="bookmarked"
                    className="text-[11px] text-white/70 font-normal data-[state=active]:!bg-orange-500 data-[state=active]:!text-white data-[state=active]:!font-semibold rounded-full transition-all duration-300 h-[45px] flex items-center justify-center hover:text-white hover:bg-white/20"
                  >
                    Bookmarked
                  </TabsTrigger>
                </TabsList>
              </LiquidGlassEffect>
              <TabsContent value="uploads" className="mt-4">
              </TabsContent>
              <TabsContent value="liked" className="mt-4">
              </TabsContent>
              <TabsContent value="bookmarked" className="mt-4">
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        {/* Audio Tracks */}
        <div className="mb-8">
          {displayTracks.length === 0 ? (
            <Panel variant="secondary" className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <Heading level={4} className="mb-2">
                  {activeTab === 'uploads' && 'No recordings yet'}
                  {activeTab === 'liked' && 'No liked recordings yet'}
                  {activeTab === 'bookmarked' && 'No bookmarked recordings yet'}
                </Heading>
                <Text color="secondary" className="mb-6">
                  {activeTab === 'uploads' && 'Teile deine erste Sprachaufnahme!'}
                  {activeTab === 'liked' && 'Like some recordings to see them here!'}
                  {activeTab === 'bookmarked' && 'Bookmark some recordings to see them here!'}
                </Text>
                {activeTab === 'uploads' && (
                  <Button 
                    onClick={() => navigate('/record')} 
                    variant="primary" 
                    className="w-full"
                  >
                    Aufnahme starten
                  </Button>
                )}
              </div>
            </Panel>
          ) : (
            <div className="space-y-3">
              {displayTracks.map((audio, index) => (
                <AudioCard 
                  key={audio.id} 
                  track={audio} 
                  index={index}
                  showDeleteButton={isOwnProfile && audio.user?.id === profileUser?.id}
                  onDelete={(trackId) => {
                    // Delete from database
                    const success = DatabaseService.deleteTrack(trackId);
                    if (success) {
                      // Remove track from local state
                      setUserAudio(prev => prev.filter(track => track.id !== trackId));
                      console.log('Track deleted successfully:', trackId);
                    } else {
                      console.error('Failed to delete track:', trackId);
                    }
                  }}
                />
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

      </div>
    </div>
  );
};
