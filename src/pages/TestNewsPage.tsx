import React from 'react';
import { motion } from 'framer-motion';
import { useDatabase } from '../hooks/useDatabase';
import { useUserStore } from '../stores/userStore';
import { Button } from '../components/ui/Button';
import { 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';
import { Heading, Body, Caption } from '../components/ui/Typography';

export const TestNewsPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const { 
    activities, 
    notifications, 
    forceCreateDemoData,
    debugShowAllData,
    resetDatabase,
    testPersistence,
    getUserActivities,
    getUserNotifications 
  } = useDatabase(currentUser?.id);

  const handleForceCreateDemo = () => {
    console.log('🔔 TestNewsPage: Erstelle Demo-Daten...');
    forceCreateDemoData();
    
    // Lade Daten neu
    setTimeout(() => {
      const userActivities = getUserActivities(currentUser?.id || 'user-1');
      const userNotifications = getUserNotifications(currentUser?.id || 'user-1');
      console.log('🔔 TestNewsPage: Nach Demo-Erstellung:');
      console.log('  - Activities:', userActivities.length);
      console.log('  - Notifications:', userNotifications.length);
    }, 100);
  };

  const handleDebugData = () => {
    console.log('🔍 TestNewsPage: Zeige alle Daten...');
    debugShowAllData();
  };

  const handleResetDatabase = () => {
    console.log('🔄 TestNewsPage: Reset Database...');
    resetDatabase();
    
    // Lade Daten neu
    setTimeout(() => {
      const userActivities = getUserActivities(currentUser?.id || 'user-1');
      const userNotifications = getUserNotifications(currentUser?.id || 'user-1');
      console.log('🔄 TestNewsPage: Nach Reset:');
      console.log('  - Activities:', userActivities.length);
      console.log('  - Notifications:', userNotifications.length);
    }, 100);
  };

  const handleTestPersistence = () => {
    console.log('🧪 TestNewsPage: Teste Persistierung...');
    testPersistence();
  };

  return (
    <div className="w-full">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Header Section */}
        <RevealOnScroll direction="up" className="mb-6">
          <motion.div 
            className="glass-surface rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <Heading level={1} className="mb-2">
                News & Activities
              </Heading>
              <Body color="secondary" className="text-sm leading-relaxed">
                Stay updated with the latest activities and notifications from the Aural community.
              </Body>
            </div>
          </motion.div>
        </RevealOnScroll>

        {/* Current Data Section */}
        <RevealOnScroll direction="up" className="mb-6">
          <motion.div 
            className="glass-surface rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Heading level={3} className="mb-4">
              Current Data
            </Heading>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Body color="secondary">Activities:</Body>
                <Caption className="text-gradient-strong font-semibold">{activities.length}</Caption>
              </div>
              <div className="flex justify-between items-center">
                <Body color="secondary">Notifications:</Body>
                <Caption className="text-gradient-strong font-semibold">{notifications.length}</Caption>
              </div>
              <div className="flex justify-between items-center">
                <Body color="secondary">Current User:</Body>
                <Caption className="text-gradient-strong font-semibold">{currentUser?.id || 'Not logged in'}</Caption>
              </div>
            </div>
          </motion.div>
        </RevealOnScroll>

        {/* Action Buttons */}
        <RevealOnScroll direction="up" className="mb-6">
          <motion.div 
            className="glass-surface rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Heading level={3} className="mb-4">
              Database Actions
            </Heading>
            <div className="space-y-3">
              <Button 
                onClick={handleForceCreateDemo}
                variant="primary"
                className="w-full"
              >
                Force Create Demo Data
              </Button>
              
              <Button 
                onClick={handleDebugData}
                variant="secondary"
                className="w-full"
              >
                Debug Show All Data
              </Button>
              
              <Button 
                onClick={handleResetDatabase}
                variant="destructive"
                className="w-full"
              >
                Reset Database
              </Button>
              
              <Button 
                onClick={handleTestPersistence}
                variant="secondary"
                className="w-full"
              >
                Test Persistence
              </Button>
            </div>
          </motion.div>
        </RevealOnScroll>

        {/* Debug Info */}
        <RevealOnScroll direction="up">
          <motion.div 
            className="glass-surface rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Heading level={3} className="mb-4">
              Debug Information
            </Heading>
            <Body color="secondary" className="text-sm">
              Check browser console for detailed logs and debugging information.
            </Body>
          </motion.div>
        </RevealOnScroll>
      </div>
    </div>
  );
};
