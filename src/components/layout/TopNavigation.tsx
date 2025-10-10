import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, MessageCircle, User, Mic, Search, ArrowLeft } from 'lucide-react';
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
  { to: '/', icon: Home, label: 'Home', color: 'accent-pink' },
  { to: '/news', icon: MessageCircle, label: 'News', color: 'accent-violet', badge: true },
  { to: '/profile', icon: User, label: 'Profile', color: 'accent-turquoise' },
  { to: '/search', icon: Search, label: 'Search', color: 'accent-blue' },
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
            {/* Back button or Logo */}
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
                <Link 
                  to="/" 
                  className="relative group"
                >
                  <motion.div
                    transition={{ duration: 0.2 }}
                  >
                    <Logo width={100} height={24} className="text-white" />
                  </motion.div>
                  
                </Link>
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
                        {/* Active background for each icon */}
                        {active && (
                          <motion.div 
                            className="nav-gradient-background absolute inset-0 glass-surface"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30
                            }}
                          />
                        )}
                        
                        <Link
                          to={to}
                          className={`flex items-center justify-center w-full h-full transition-all duration-300 relative z-10 ${
                            active 
                              ? 'text-white' 
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

              {/* Record icon with red circle - always visible, positioned at far right */}
              <motion.div
                className="flex items-center justify-center w-9 h-9 relative z-10 ml-1"
                transition={{ duration: 0.2 }}
              >
                {/* Red circle background - always visible */}
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-80"></div>
                
                <Link
                  to={recordItem.to}
                  className="flex items-center justify-center w-full h-full transition-all duration-300 relative z-10 text-white"
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