import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, Bell, User, Mic, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActivityStore } from '../../stores/activityStore';
import { useUserStore } from '../../stores/userStore';
import { useDatabase } from '../../hooks/useDatabase';
import { useBackNavigation } from './AppLayout';
import { Logo } from '../ui/Logo';

// German spec: Navigation items as specified (Home, Comments/Notifications, Profile, Upload/Record, Search)
interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color: string;
  badge?: boolean; // For notifications badge
}

const navItems: NavItem[] = [
  { to: '/news', icon: Bell, label: 'News', color: 'accent-violet', badge: true },
  { to: '/profile', icon: User, label: 'Profile', color: 'accent-turquoise' },
];

const recordItem: NavItem = { to: '/record', icon: Mic, label: 'Record', color: 'accent-red' };

export const TopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activities } = useActivityStore();
  const { currentUser } = useUserStore();
  const { notifications: dbNotifications, isLoading, loadData } = useDatabase(currentUser?.id);
  
  // Verwende Daten aus der zentralen Datenbank
  const userNotifications = dbNotifications || [];
  const unreadCount = userNotifications.filter(a => !a.isRead).length;
  
  // Debug-Log für Navigation
  console.log('🔔 TopNavigation - DB notifications:', userNotifications.length);
  console.log('🔔 TopNavigation - unreadCount:', unreadCount);
  console.log('🔔 TopNavigation - isLoading:', isLoading);
  const { showBackButton } = useBackNavigation();

  // Listen for track approval events and notification read events to refresh notifications
  useEffect(() => {
    const handleTrackApproved = (event: CustomEvent) => {
      console.log('📢 TopNavigation: Track approved event received:', event.detail);
      // The useActivityStore will automatically provide the updated activities
    };

    const handleNotificationsMarkedAsRead = (event: CustomEvent) => {
      console.log('📢 TopNavigation: Notifications marked as read:', event.detail);
      // Lade Daten neu, um die aktualisierten Notifications zu bekommen
      if (loadData) {
        loadData();
      }
    };

    const handleUserActivitiesMarkedAsRead = (event: CustomEvent) => {
      console.log('📢 TopNavigation: User activities marked as read:', event.detail);
      // Lade Daten neu, um die aktualisierten Activities zu bekommen
      if (loadData) {
        loadData();
      }
    };

    const handleReloadDatabaseData = (event: CustomEvent) => {
      console.log('📢 TopNavigation: Reload database data requested:', event.detail);
      // Lade alle Daten neu
      if (loadData) {
        loadData();
      }
    };

    const handleNewNotification = (event: CustomEvent) => {
      console.log('📢 TopNavigation: New notification received:', event.detail);
      // Reload data to show the new notification
      if (loadData) {
        loadData();
      }
    };

    window.addEventListener('trackApproved', handleTrackApproved as EventListener);
    window.addEventListener('notificationsMarkedAsRead', handleNotificationsMarkedAsRead as EventListener);
    window.addEventListener('userActivitiesMarkedAsRead', handleUserActivitiesMarkedAsRead as EventListener);
    window.addEventListener('reloadDatabaseData', handleReloadDatabaseData as EventListener);
    window.addEventListener('newNotification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('trackApproved', handleTrackApproved as EventListener);
      window.removeEventListener('notificationsMarkedAsRead', handleNotificationsMarkedAsRead as EventListener);
      window.removeEventListener('userActivitiesMarkedAsRead', handleUserActivitiesMarkedAsRead as EventListener);
      window.removeEventListener('reloadDatabaseData', handleReloadDatabaseData as EventListener);
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
    };
  }, [loadData]); // Füge loadData als Dependency hinzu
  

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/profile') {
      // Only active for own profile, not for other users' profiles
      return location.pathname === '/profile';
    }
    if (path === '/news') {
      // Handle the renamed route
      return location.pathname.startsWith('/news');
    }
    return location.pathname.startsWith(path);
  };

  // Check if we're on any recording/upload related page
  const isOnRecordPage = location.pathname.startsWith('/record') || 
                        location.pathname.startsWith('/upload') || 
                        location.pathname.startsWith('/audio-editor');

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 safe-area-top"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Transparent navigation background */}
      <div className="transparent-nav">
        <div className="max-w-md mx-auto px-5 py-4 safe-area-padding">
          <div className="flex items-center justify-between relative">
            {/* Back button or Home Button */}
            <div className="ml-4">
              {showBackButton ? (
                <motion.button
                  onClick={handleBack}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center 
                           transition-colors duration-200"
                  aria-label="Go back"
                  transition={{ duration: 0.2 }}
                >
                  <ArrowLeft size={17} className="text-text-primary" />
                </motion.button>
              ) : (
                <div className="flex items-center space-x-1">
                  {/* Custom Home Button with SVG */}
                  <motion.div
                    className="flex items-center justify-center w-9 h-9 relative z-10"
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to="/"
                      className={`flex items-center justify-center w-full h-full transition-all duration-300 relative z-10 ${
                        isActive('/') 
                          ? 'text-[#ff4e3a]' 
                          : 'text-text-secondary'
                      }`}
                      aria-label="Home"
                    >
                      <svg 
                        version="1.1" 
                        id="Ebene_1" 
                        xmlns="http://www.w3.org/2000/svg" 
                        xmlnsXlink="http://www.w3.org/1999/xlink" 
                        x="0px" 
                        y="0px"
                        viewBox="0 0 87.733 86.526" 
                        style={{ enableBackground: 'new 0 0 87.733 86.526' } as any} 
                        xmlSpace="preserve"
                        width={23}
                        height={23}
                        className="transition-all duration-300"
                      >
                        <g>
                          <g>
                            <g>
                              <circle 
                                style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '5.15625', strokeMiterlimit: '10' }} 
                                cx="43.866" 
                                cy="42.242" 
                                r="40.577"
                              />
                            </g>
                            <path 
                              style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '4.6875', strokeMiterlimit: '10' }} 
                              d="M51.459,25.293l-4.025-4.025
                                c-4.387-4.387-11.5-4.387-15.887,0s-4.387,11.5,0,15.887l4.025,4.025l-4.025,4.025c-4.387,4.387-4.387,11.5,0,15.887
                                s11.5,4.387,15.887,0l4.025-4.025L67.346,41.18L51.459,25.293z"
                            />
                          </g>
                        </g>
                      </svg>
                    </Link>
                  </motion.div>
                  
                  <Link 
                    to="/"
                    className="relative group"
                  >
                    <motion.div
                      transition={{ duration: 0.2 }}
                      style={{ transform: 'translateY(-3px)' }}
                    >
                      <svg 
                        version="1.1" 
                        id="Ebene_1" 
                        xmlns="http://www.w3.org/2000/svg" 
                        xmlnsXlink="http://www.w3.org/1999/xlink" 
                        x="0px" 
                        y="0px"
                        viewBox="0 0 349.228 100.983" 
                        style={{ enableBackground: 'new 0 0 349.228 100.983' } as any} 
                        xmlSpace="preserve"
                        width={80}
                        height={23}
                        className="text-white"
                      >
                        <g>
                          <path 
                            style={{ fill: 'currentColor' }} 
                            d="M36.364,100.983c-10.148,0-18.686-3.783-25.597-11.344C3.85,82.078,0.395,72.921,0.395,62.178
                              S3.85,42.277,10.767,34.717c6.911-7.561,15.449-11.344,25.597-11.344c5.071,0,9.747,1.123,14.028,3.358
                              c4.275,2.241,7.561,4.949,9.85,8.138V24.867h16.415V99.49H60.242V89.488c-2.289,3.188-5.575,5.897-9.85,8.138
                              C46.111,99.86,41.435,100.983,36.364,100.983z M23.38,79.194c4.178,4.573,9.498,6.862,15.965,6.862
                              c6.468,0,11.793-2.289,15.971-6.862c4.178-4.579,6.267-10.251,6.267-17.016s-2.089-12.437-6.267-17.016
                              c-4.178-4.573-9.504-6.862-15.971-6.862c-6.468,0-11.787,2.289-15.965,6.862c-4.184,4.579-6.273,10.251-6.273,17.016
                              S19.196,74.615,23.38,79.194z"
                          />
                          <path 
                            style={{ fill: 'currentColor' }} 
                            d="M125.61,100.983c-8.563,0-15.328-2.86-20.301-8.581s-7.457-13.36-7.457-22.913V24.867h16.415v41.939
                              c0,5.97,1.294,10.67,3.881,14.101c2.587,3.437,6.267,5.15,11.046,5.15c5.569,0,9.996-2.113,13.281-6.34
                              c3.279-4.233,4.925-10.275,4.925-18.133V24.867h16.415V99.49h-16.416V89.342C143.021,97.103,135.757,100.983,125.61,100.983z"
                          />
                          <path 
                            style={{ fill: 'currentColor' }} 
                            d="M185.907,99.489V24.867h16.415v13.281c1.391-4.178,3.953-7.561,7.688-10.148
                              c3.729-2.587,7.731-3.881,12.012-3.881c2.587,0,4.725,0.2,6.419,0.595v16.87c-2.387-0.899-5.125-1.348-8.21-1.348
                              c-4.974,0-9.206,2.016-12.686,6.049c-3.486,4.026-5.223,9.625-5.223,16.785v36.419H185.907z"
                          />
                          <path 
                            style={{ fill: 'currentColor' }} 
                            d="M270.677,100.983c-10.148,0-18.686-3.783-25.597-11.344c-6.917-7.561-10.372-16.718-10.372-27.461
                              s3.455-19.901,10.372-27.461c6.911-7.561,15.449-11.344,25.597-11.344c5.071,0,9.747,1.123,14.028,3.358
                              c4.275,2.241,7.561,4.949,9.85,8.138V24.867h16.415V99.49h-16.415V89.488c-2.289,3.188-5.575,5.897-9.85,8.138
                              C280.424,99.86,275.748,100.983,270.677,100.983z M257.693,79.194c4.178,4.573,9.498,6.862,15.965,6.862s11.793-2.289,15.971-6.862
                              c4.178-4.579,6.267-10.251,6.267-17.016s-2.089-12.437-6.267-17.016c-4.178-4.573-9.504-6.862-15.971-6.862
                              c-6.468,0-11.787,2.289-15.965,6.862c-4.184,4.579-6.273,10.251-6.273,17.016S253.509,74.615,257.693,79.194z"
                          />
                          <path 
                            style={{ fill: 'currentColor' }} 
                            d="M333.208,99.489V0h16.415v99.489H333.208z"
                          />
                        </g>
                      </svg>
                    </motion.div>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Navigation icons with individual background states */}
            <div className="flex items-center justify-end space-x-0 relative h-12 w-full pr-3">
              {/* Regular navigation items - right aligned - hide for recorder only */}
              {!location.pathname.startsWith('/record/recorder') && (
                <>
                  {navItems.map(({ to, icon: Icon, label, badge }) => {
                    const active = isActive(to);
                    const showBadge = badge && to === '/news' && unreadCount > 0;
                    
                    return (
                      <motion.div
                        key={to}
                        className="flex items-center justify-center w-9 h-9 relative z-10 mx-0.5"
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          to={to}
                          className={`flex items-center justify-center w-full h-full transition-all duration-300 relative z-10 ${
                            active 
                              ? 'text-[#ff4e3a]' 
                              : 'text-text-secondary'
                          }`}
                          aria-label={label}
                        >
                          <Icon 
                            size={20} 
                            className="transition-all duration-300"
                          />
                          
                          {/* Notification badge - small red circle without number */}
                          {showBadge && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </>
              )}

              {/* Record icon - red when on record page, red bubble as CTA on other pages */}
              <motion.div
                className="flex items-center justify-center w-9 h-9 relative z-10 ml-1"
                transition={{ duration: 0.2 }}
              >
                {/* Red circle background - only visible as CTA when NOT on record page */}
                {!isOnRecordPage && (
                  <div className="absolute inset-0 bg-red-500 rounded-full opacity-80"></div>
                )}
                
                <Link
                  to={recordItem.to}
                  className={`flex items-center justify-center w-full h-full transition-all duration-300 relative z-10 ${
                    isOnRecordPage 
                      ? 'text-red-500' 
                      : 'text-white'
                  }`}
                  aria-label={recordItem.label}
                >
                  <recordItem.icon 
                    size={20} 
                    className="transition-all duration-300"
                  />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};