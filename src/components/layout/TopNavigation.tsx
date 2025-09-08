import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, User, Mic, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActivityStore } from '../../stores/activityStore';
import { useUserStore } from '../../stores/userStore';
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
  { to: '/profile', icon: User, label: 'Profil', color: 'accent-turquoise' },
  { to: '/record', icon: Mic, label: 'Aufnehmen', color: 'accent-red' },
  { to: '/search', icon: Search, label: 'Suche', color: 'accent-blue' },
];

export const TopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activities } = useActivityStore();
  const { currentUser } = useUserStore();
  // Only show notification dots for activities from others (notifications), not for user's own activities
  const unreadCount = activities.filter(a => !a.isRead).length;
  const { showBackButton } = useBackNavigation();
  

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
                           hover:bg-white/20 transition-colors duration-200"
                  aria-label="Go back"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Logo width={100} height={24} className="text-white" />
                  </motion.div>
                  
                  {/* Subtle glow effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-primary rounded-lg opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"
                    initial={false}
                  />
                </Link>
              )}
            </div>
            
            {/* Navigation icons with individual background states - hide for recorder only */}
            {!location.pathname.startsWith('/record/recorder') && (
              <div className="flex items-center justify-end space-x-0 relative h-12 w-full pr-3">
                {navItems.map(({ to, icon: Icon, label, badge }) => {
                  const active = isActive(to);
                  const showBadge = badge && to === '/news' && unreadCount > 0;
                  
                  return (
                    <motion.div
                      key={to}
                      className="flex items-center justify-center w-9 h-9 relative z-10 mx-0.5"
                      whileHover={{ scale: active ? 1 : 1.1 }}
                      whileTap={{ scale: active ? 1 : 0.95 }}
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
                            : 'text-text-secondary hover:text-text-primary'
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
                
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};