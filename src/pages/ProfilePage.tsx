import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, Settings, UserPlus, UserCheck, User } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { usePlayerStore } from '../stores/playerStore';
import { useActivityStore } from '../stores/activityStore';
import { useFeedStore } from '../stores/feedStore';
import { useDatabase } from '../hooks/useDatabase';
import { AudioCard } from '../components/feed/AudioCard';
import { formatSafeDate, sanitizeAudioTrack } from '../utils';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';


export const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, myTracks, updateProfile, followUser, unfollowUser, isUserFollowed } = useUserStore();
  const { tracks, users, getUserLikedTracks, getUserBookmarkedTracks } = useDatabase('user-1');
  const { setCurrentTrack } = usePlayerStore();
  const { addUserActivity } = useActivityStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bioText, setBioText] = useState('');
  const [usernameText, setUsernameText] = useState('');
  const [activeTab, setActiveTab] = useState<'uploads' | 'liked' | 'bookmarked'>('uploads');
  
  // Check if we should show back button based on navigation history
  const showBackButton = useMemo(() => {
    // Don't show back button if:
    // 1. User accessed profile directly via URL or bottom navigation
    // 2. User is on their own profile (/profile without ID)
    // 3. This is the first page accessed
    const isOwnProfile = !id || id === currentUser?.id;
    const isDirectProfileAccess = location.pathname === '/profile' && isOwnProfile;
    const hasReferrer = document.referrer && document.referrer !== window.location.href;
    const hasNavigationState = location.state !== null;
    
    // Show back button only when:
    // - Viewing someone else's profile AND
    // - There's either navigation state or a referrer (indicating navigation from within app)
    return !isOwnProfile && (Boolean(hasNavigationState || hasReferrer));
  }, [location, id, currentUser]);
  
  // Find user - either current user or from central database
  // Support both ID and username lookup
  const finalUser = useMemo(() => {
    const user = id ? 
      (id === currentUser?.id ? currentUser : 
       users.find(u => u.id === id) || 
       users.find(u => u.username === id)) :
      currentUser; // If no ID parameter, show current user's profile
    
    // If user not found in users, try to find from tracks
    const userFromTracks = !user && id ? tracks.find(t => t.user.id === id || t.user.username === id)?.user : null;
    return user || userFromTracks;
  }, [id, currentUser, users, tracks]);
  
  const isOwnProfile = useMemo(() => !id || id === currentUser?.id, [id, currentUser?.id]);
  const userTracks = useMemo(() => {
    return isOwnProfile ? myTracks : tracks.filter(t => t.user.id === id || t.user.username === id);
  }, [isOwnProfile, myTracks, tracks, id]);
  
  // Get liked and bookmarked tracks directly from database (already enriched)
  const likedTracks = useMemo(() => getUserLikedTracks('user-1'), [tracks, users]);
  const bookmarkedTracks = useMemo(() => getUserBookmarkedTracks('user-1'), [tracks, users]);
  
  // Get tracks based on active tab using useMemo to prevent unnecessary recalculations
  const displayTracks = useMemo(() => {
    if (!isOwnProfile) return userTracks; // For other profiles, always show uploads
    
    switch (activeTab) {
      case 'uploads':
        return userTracks;
      case 'liked':
        return likedTracks;
      case 'bookmarked':
        return bookmarkedTracks;
      default:
        return userTracks;
    }
  }, [isOwnProfile, activeTab, userTracks, likedTracks, bookmarkedTracks]);
  
  // Calculate total likes for all tracks uploaded by this user
  const totalLikes = useMemo(() => {
    return userTracks.reduce((sum, track) => sum + track.likes, 0);
  }, [userTracks]);
  
  // Calculate total plays for all tracks uploaded by this user
  const totalPlays = useMemo(() => {
    return userTracks.reduce((sum, track) => sum + (track.plays || 0), 0);
  }, [userTracks]);
  
  // Initialize bio and username text when user changes
  useEffect(() => {
    if (finalUser) {
      setBioText(finalUser.bio || '');
      setUsernameText(finalUser.username || '');
    }
  }, [finalUser]);
  
  if (!finalUser) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <div className="text-center">
            <h2 className="text-lg font-medium text-text-primary mb-2">Benutzer nicht gefunden</h2>
            <button 
              onClick={() => navigate('/')}
              className="text-accent-blue hover:underline"
            >
              Zurück zum Feed
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  // displayTracks is now defined above based on activeTab
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleSaveProfile = () => {
    if (isOwnProfile) {
      updateProfile({ 
        username: usernameText,
        bio: bioText 
      });
    }
    setIsEditingProfile(false);
  };
  
  const handleCancelProfileEdit = () => {
    if (finalUser) {
      setUsernameText(finalUser.username || '');
      setBioText(finalUser.bio || '');
    }
    setIsEditingProfile(false);
  };

  const handleFollowToggle = () => {
    if (!finalUser || !currentUser) return;
    
    if (isUserFollowed(finalUser.id)) {
      unfollowUser(finalUser.id);
    } else {
      followUser(finalUser.id);
      
      // Add follow activity
      addUserActivity({
        type: 'my_follow',
        trackId: '', // Not applicable for follow activities
        trackTitle: '', // Not applicable for follow activities
        followedUser: users.find(u => u.id === 'user-1')
      });
    }
  };
  
  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {showBackButton && (
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center 
                         hover:bg-white/20 transition-colors duration-200"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-text-primary" />
              </button>
            </div>
          )}

          {/* Profile Header */}
          <RevealOnScroll direction="up">
            <div className="true-black-card relative">
              {/* Edit button - Always visible in top right corner for own profile */}
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 
                             transition-colors"
                  aria-label="Settings"
                >
                  <Settings size={16} className="text-gray-400 hover:text-gray-300" />
                </button>
              )}
              
              {/* Username - Left aligned, 20% larger */}
              <div className="mb-2">
                {isOwnProfile && isEditingProfile ? (
                  <div className="space-y-3">
                    <input
                      value={usernameText}
                      onChange={(e) => setUsernameText(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-text-primary 
                               focus:outline-none focus:ring-2 focus:ring-gradient-strong"
                      placeholder="Benutzername"
                      maxLength={30}
                    />
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-text-primary text-center">
                    {finalUser.username}
                  </h2>
                )}
              </div>
              
              {/* Bio - Improved editing functionality without hover edit icon */}
              <div className="mb-4">
                {isOwnProfile && isEditingProfile ? (
                  <div className="space-y-3">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-text-primary 
                               focus:outline-none focus:ring-2 focus:ring-gradient-strong resize-none"
                      rows={3}
                      placeholder="Erzähle etwas über dich..."
                      maxLength={200}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-secondary">
                        {bioText.length}/200 Zeichen
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-sm text-text-secondary leading-relaxed text-center">
                      {finalUser.bio || (
                        isOwnProfile 
                          ? 'Füge eine Bio hinzu, um anderen von dir zu erzählen' 
                          : 'Stimmenkünstler und Geschichtenerzähler...'
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action buttons when editing */}
              {isOwnProfile && isEditingProfile && (
                <div className="flex justify-center space-x-2 mt-4">
                  <button
                    onClick={handleCancelProfileEdit}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-text-primary"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 rounded-full bg-gradient-primary hover:opacity-90 transition-opacity text-white"
                  >
                    Speichern
                  </button>
                </div>
              )}
              
              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>
              
              {/* Stats Row - Recordings, Plays, Likes */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary mb-1">
                    {userTracks.length}
                  </div>
                  <div className="text-xs text-text-secondary">Recordings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary mb-1">
                    {totalPlays}
                  </div>
                  <div className="text-xs text-text-secondary">Plays</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary mb-1">
                    {totalLikes}
                  </div>
                  <div className="text-xs text-text-secondary">Likes</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Toggle for own profile */}
          {isOwnProfile && (
            <RevealOnScroll direction="up" delay={0.1}>
              <div className="glass-surface rounded-full p-1">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('uploads')}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeTab === 'uploads'
                        ? 'bg-gradient-primary text-white shadow-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    Uploads
                  </button>
                  <button
                    onClick={() => setActiveTab('liked')}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeTab === 'liked'
                        ? 'bg-gradient-primary text-white shadow-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    Liked
                  </button>
                  <button
                    onClick={() => setActiveTab('bookmarked')}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeTab === 'bookmarked'
                        ? 'bg-gradient-primary text-white shadow-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    Bookmarked
                  </button>
                </div>
              </div>
            </RevealOnScroll>
          )}

          {/* Follow Button - Only show for other users' profiles */}
          {!isOwnProfile && finalUser && currentUser && (
            <RevealOnScroll direction="up" delay={0.05}>
              <button
                onClick={handleFollowToggle}
                className={`w-full py-4 px-6 rounded-full font-medium text-lg transition-all duration-200 
                           flex items-center justify-center space-x-2 ${
                  isUserFollowed(finalUser.id)
                    ? 'bg-white/10 text-text-primary border border-white/20 hover:bg-white/20'
                    : 'bg-gradient-primary text-white hover:opacity-90 shadow-primary'
                }`}
              >
                {isUserFollowed(finalUser.id) ? (
                  <>
                    <UserCheck size={20} />
                    <span>Gefolgt</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </RevealOnScroll>
          )}
          
          
          {/* Content */}
          <RevealOnScroll direction="up" delay={0.2}>
            <div className="space-y-3">
              {displayTracks.length === 0 ? (
                <div className="true-black-card text-center py-12">
                  {isOwnProfile ? (
                    <>
                      {activeTab === 'uploads' ? (
                        <>
                          <div className="text-4xl mb-4">🎙️</div>
                          <h3 className="text-lg font-medium text-text-primary mb-2">
                            No recordings yet
                          </h3>
                          <p className="text-text-secondary mb-4">
                            Teile deine erste Sprachaufnahme!
                          </p>
                          <button
                            onClick={() => navigate('/record')}
                            className="px-6 py-2 bg-gradient-primary rounded-lg text-white font-medium 
                                     hover:scale-105 active:scale-95 transition-transform duration-200"
                          >
                            Aufnahme starten
                          </button>
                        </>
                      ) : activeTab === 'liked' ? (
                        <>
                          <div className="text-4xl mb-4">❤️</div>
                          <h3 className="text-lg font-medium text-text-primary mb-2">
                            No liked recordings
                          </h3>
                          <p className="text-text-secondary">
                            Du hast noch keine Aufnahmen geliked.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-4">🔖</div>
                          <h3 className="text-lg font-medium text-text-primary mb-2">
                            No bookmarked recordings
                          </h3>
                          <p className="text-text-secondary">
                            Du hast noch keine Aufnahmen bookmarkt.
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <User size={48} className="text-text-secondary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">
                        No public recordings
                      </h3>
                      <p className="text-text-secondary">
                        Dieser Benutzer hat noch keine Audios geteilt.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <StaggerWrapper className="space-y-2">
                  {displayTracks.map((track, index) => {
                    const safeTrack = sanitizeAudioTrack(track);
                    return (
                      <StaggerItem key={safeTrack.id}>
                        <AudioCard
                          track={safeTrack}
                          index={index}
                          showDeleteButton={isOwnProfile}
                          onDelete={isOwnProfile ? (trackId) => {
                            // Delete from user store
                            useUserStore.getState().deleteMyTrack(trackId);
                            // Delete from feed store
                            useFeedStore.getState().setTracks(
                              useFeedStore.getState().tracks.filter(t => t.id !== trackId)
                            );
                          } : undefined}
                        />
                      </StaggerItem>
                    );
                  })}
                </StaggerWrapper>
              )}
            </div>
          </RevealOnScroll>

        </motion.div>
      </div>
    </PageTransition>
  );
};