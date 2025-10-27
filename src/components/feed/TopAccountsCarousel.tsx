import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';
import { useUserStore } from '../../stores/userStore';
import { LiquidGlassEffect } from '../ui/LiquidGlassEffect';
import { StaggerWrapper, StaggerItem } from '../ui';

interface TopAccount {
  id: string;
  username: string;
  totalPlays: number;
  totalTracks: number;
  totalLikes: number;
  avatar?: string;
  isVerified?: boolean;
}

export const TopAccountsCarousel = () => {
  const { currentUser } = useUserStore();
  const { tracks, users } = useDatabase(currentUser?.id);
  const navigate = useNavigate();
  const [topAccounts, setTopAccounts] = useState<TopAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleAccountClick = (account: TopAccount) => {
    // Navigiere zum Profil des Accounts
    navigate(`/profile/${account.id}`);
  };


  useEffect(() => {
    const fetchTopAccounts = () => {
      try {
        setIsLoading(true);
        
        console.log('🎯 TopAccountsCarousel: Tracks from useDatabase:', tracks?.length);
        console.log('🎯 TopAccountsCarousel: Users from useDatabase:', users?.length);
        console.log('🎯 TopAccountsCarousel: Current User:', currentUser);
        
        if (!tracks || tracks.length === 0) {
          console.log('❌ TopAccountsCarousel: No tracks in database');
          return;
        }
        
        const dbTracks = tracks;
        const dbUsers = users || [];
        
        // Erstelle eine Map der Benutzer für schnellen Zugriff
        const userMap = new Map(dbUsers.map(user => [user.id, user]));
        
        // Fallback: Erstelle User-Map aus Tracks falls keine Users geladen wurden
        if (dbUsers.length === 0) {
          console.log('⚠️ TopAccountsCarousel: No users loaded, creating from tracks');
          dbTracks.forEach(track => {
            if (track.user && !userMap.has(track.user.id)) {
              userMap.set(track.user.id, track.user);
            }
          });
        }
        
        console.log('🎯 TopAccountsCarousel: UserMap after fallback:', Array.from(userMap.keys()));
        
        // Berechne Statistiken pro Benutzer (Plays, Likes, Tracks)
        const userStats = new Map<string, { 
          totalPlays: number; 
          totalTracks: number; 
          totalLikes: number;
          totalComments: number;
        }>();
        
        dbTracks.forEach(track => {
          const userId = track.userId || track.user.id;
          const plays = track.plays || 0;
          const likes = track.likes || 0;
          const comments = track.commentsCount || 0;
          
          if (!userStats.has(userId)) {
            userStats.set(userId, { 
              totalPlays: 0, 
              totalTracks: 0, 
              totalLikes: 0,
              totalComments: 0
            });
          }
          
          const current = userStats.get(userId)!;
          userStats.set(userId, {
            totalPlays: current.totalPlays + plays,
            totalTracks: current.totalTracks + 1,
            totalLikes: current.totalLikes + likes,
            totalComments: current.totalComments + comments
          });
        });
        
        console.log('🎯 TopAccountsCarousel: UserStats Map:', Array.from(userStats.entries()).map(([id, stats]) => ({ id, ...stats })));
        
        // Konvertiere zu Array und sortiere nach Gesamtlikes
        const accounts: TopAccount[] = Array.from(userStats.entries())
          .map(([userId, stats]) => {
            const user = userMap.get(userId);
            // Verwende den aktuellen User-Namen falls es der aktuelle User ist
            const username = userId === currentUser?.id 
              ? (currentUser?.username || currentUser?.email || 'You') 
              : (user?.username || user?.email || 'Unknown');
            
            return {
              id: userId,
              username: username,
              totalPlays: stats.totalPlays,
              totalTracks: stats.totalTracks,
              totalLikes: stats.totalLikes,
              avatar: user?.avatar,
              isVerified: user?.isVerified || false
            };
          })
          .filter(account => account.totalTracks > 0) // Nur Accounts mit Tracks
          .sort((a, b) => b.totalLikes - a.totalLikes) // Sortiere nach Anzahl Likes
          .slice(0, 10); // Top 10
        
        console.log('🎯 TopAccountsCarousel: Found accounts:', accounts);
        console.log('🎯 TopAccountsCarousel: Number of accounts:', accounts.length);
        
        // Fallback: Wenn keine Accounts gefunden werden, zeige alle Users mit Tracks
        if (accounts.length === 0) {
          console.log('⚠️ TopAccountsCarousel: No accounts with likes found, showing all users with tracks');
          const fallbackAccounts: TopAccount[] = Array.from(userStats.entries())
            .map(([userId, stats]) => {
              const user = userMap.get(userId);
              // Verwende den aktuellen User-Namen falls es der aktuelle User ist
              const username = userId === currentUser?.id 
                ? (currentUser?.username || currentUser?.email || 'You') 
                : (user?.username || user?.email || 'Unknown');
              
              return {
                id: userId,
                username: username,
                totalPlays: stats.totalPlays,
                totalTracks: stats.totalTracks,
                totalLikes: stats.totalLikes,
                avatar: user?.avatar,
                isVerified: user?.isVerified || false
              };
            })
            .filter(account => account.totalTracks > 0)
            .sort((a, b) => b.totalTracks - a.totalTracks) // Sortiere nach Track-Anzahl
            .slice(0, 10); // Top 10
          
          console.log('🎯 TopAccountsCarousel: Fallback accounts:', fallbackAccounts);
          console.log('🎯 TopAccountsCarousel: Number of fallback accounts:', fallbackAccounts.length);
          setTopAccounts(fallbackAccounts);
        } else {
          setTopAccounts(accounts);
        }
      } catch (error) {
        console.error('Error loading top accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopAccounts();
  }, [tracks, users, currentUser]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Hot This Week
          </h3>
        </div>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <div 
                className="bg-gray-800 animate-pulse"
                style={{ 
                  width: '104px', 
                  height: '104px', 
                  borderRadius: '50%' 
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topAccounts.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Hot This Week
          </h3>
        </div>
        <div className="text-center py-4">
          <p className="text-white/60 text-sm">No accounts found</p>
        </div>
      </div>
    );
  }

  return (
    <StaggerWrapper>
      <StaggerItem>
        <div className="mb-6" style={{ marginTop: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Hot This Week
            </h3>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2 pt-2 px-1">
            {topAccounts.map((account, index) => (
              <StaggerItem key={account.id}>
                <motion.div
                  className="flex-shrink-0 cursor-pointer group hover:-translate-y-0.5 transition-transform duration-200 hover:scale-100"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAccountClick(account)}
                >
                  {/* Dunkelgrauer Kreis mit Username */}
                  <div 
                    className="relative overflow-hidden true-black-card border border-white/10 group-hover:border-white/20 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      width: '104px', 
                      height: '104px', 
                      borderRadius: '50%' 
                    }}
                  >
                    {/* Avatar oder Username */}
                    {account.avatar ? (
                      <img
                        src={account.avatar}
                        alt={account.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center px-2">
                        <span 
                          className="text-white font-bold text-sm text-center leading-tight" 
                          style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            wordBreak: 'break-all',
                            whiteSpace: 'normal',
                            lineHeight: '1.1'
                          }}
                        >
                          {account.username}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </div>
        </div>
      </StaggerItem>
    </StaggerWrapper>
  );
};
