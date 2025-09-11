import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Upload, Calendar, ArrowLeft, Flame, Edit3, UserPlus, UserCheck } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useFeedStore } from '../stores/feedStore';
import { usePlayerStore } from '../stores/playerStore';
import { useActivityStore } from '../stores/activityStore';
import { AudioCard } from '../components/feed/AudioCard';
import { createDummyUsers, formatSafeDate, sanitizeAudioTrack } from '../utils';
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
  const { tracks } = useFeedStore();
  const { setCurrentTrack } = usePlayerStore();
  const { addUserActivity } = useActivityStore();
  const [showBackButton, setShowBackButton] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bioText, setBioText] = useState('');
  const [usernameText, setUsernameText] = useState('');
  
  // Check if we should show back button based on navigation history
  useEffect(() => {
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
    setShowBackButton(!isOwnProfile && (Boolean(hasNavigationState || hasReferrer)));
  }, [location, id, currentUser]);
  
  // Find user - either current user or from dummy data
  const user = id ? 
    (id === currentUser?.id ? currentUser : createDummyUsers().find(u => u.id === id)) :
    currentUser; // If no ID parameter, show current user's profile
  
  // If user not found in dummy users, try to find from tracks
  const userFromTracks = !user && id ? tracks.find(t => t.user.id === id)?.user : null;
  const finalUser = user || userFromTracks;
  
  const userTracks = (!id || id === currentUser?.id) ? myTracks : tracks.filter(t => t.user.id === id);
  
  // Calculate total likes for all tracks uploaded by this user
  const totalLikes = userTracks.reduce((sum, track) => sum + track.likes, 0);
  
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
  
  const isOwnProfile = !id || user?.id === currentUser?.id;
  const displayTracks = userTracks; // Always show uploads, no more tabs
  
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
        followedUser: user
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
                  className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 
                             transition-colors"
                  aria-label="Profil bearbeiten"
                >
                  <Edit3 size={16} className="text-text-secondary" />
                </button>
              )}
              
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                {finalUser.avatar ? (
                  <img 
                    src={finalUser.avatar} 
                    alt={finalUser.username} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={28} className="text-white" />
                )}
              </div>
              
              {/* Username - Added editing functionality */}
              <div className="mb-2">
                {isOwnProfile && isEditingProfile ? (
                  <div className="space-y-3">
                    <input
                      value={usernameText}
                      onChange={(e) => setUsernameText(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-text-primary 
                               focus:outline-none focus:ring-2 focus:ring-gradient-strong text-center"
                      placeholder="Benutzername"
                      maxLength={30}
                    />
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-text-primary">
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
                    <p className="text-text-secondary leading-relaxed">
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
              
              {/* Stats Row - Updated to use calculated total likes */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Flame size={16} className="text-accent-red" />
                    <span className="text-lg font-bold text-text-primary">
                      {totalLikes}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary">Total Likes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Upload size={16} className="text-gradient-strong" />
                    <span className="text-lg font-bold text-text-primary">
                      {finalUser.totalUploads}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary">Recordings</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Calendar size={16} className="text-accent-turquoise" />
                    <span className="text-sm font-bold text-text-primary">
                      {formatSafeDate(finalUser.createdAt, { month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary">Joined</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

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