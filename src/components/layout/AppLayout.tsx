import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopNavigation } from './TopNavigation';
import { Footer } from './Footer';
import { MiniPlayer } from '../audio/MiniPlayer';
import { usePlayerStore } from '../../stores/playerStore';
import { useRecordingStore } from '../../stores/userStore';
import { initializeGlobalAudioManager, useGlobalAudioManager } from '../../hooks/useGlobalAudioManager';
import { useEffect, useState, useCallback } from 'react';
import UnicornBackgroundSimple from '../UnicornBackgroundSimple';
import { motion } from 'framer-motion';
import { useScrollBlur } from '../../hooks/useScrollBlur';
import { createContext, useContext } from 'react';
import { audioPersistenceManager } from '../../services/audioPersistenceManager';
// AudioDebugConsole removed
import type { PlayerVisibilityContext } from '../../types';

// Create context for back navigation
interface BackNavigationContextType {
  showBackButton: boolean;
  setShowBackButton: (show: boolean) => void;
}

const BackNavigationContext = createContext<BackNavigationContextType | undefined>(undefined);
const PlayerVisibilityContext = createContext<PlayerVisibilityContext | undefined>(undefined);

export const useBackNavigation = () => {
  const context = useContext(BackNavigationContext);
  if (!context) {
    throw new Error('useBackNavigation must be used within a BackNavigationProvider');
  }
  return context;
};

export const AppLayout = () => {
  const { currentTrack } = usePlayerStore();
  const { isRecording } = useRecordingStore();
  const location = useLocation();
  const [visibleAudioCardIds, setVisibleAudioCardIdsState] = useState<Set<string>>(new Set());
  const [expandedAudioCardId, setExpandedAudioCardIdState] = useState<string | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  
  // Create a stable wrapper function that matches the expected signature
  const setVisibleAudioCardIds = useCallback((update: (prev: Set<string>) => Set<string>) => {
    setVisibleAudioCardIdsState(update);
  }, []);
  
  const setExpandedAudioCardId = useCallback((trackId: string | null) => {
    setExpandedAudioCardIdState(trackId);
  }, []);
  
  const [showBackButton, setShowBackButton] = useState(false);
  // Debug console removed
  
  // Add scroll blur effect
  const isScrolled = useScrollBlur(10);
  
  // Initialize the global audio manager and persistence manager once at the app level
  useEffect(() => {
    initializeGlobalAudioManager();
    
    // Initialisiere den AudioPersistenceManager
    console.log('🎵 AppLayout: Initializing audio persistence manager...');
    
    // Starte automatische Reparatur nach kurzer Verzögerung
    setTimeout(() => {
      audioPersistenceManager.autoRepairAllAudioUrls().then(() => {
        console.log(`✅ AppLayout: Audio URLs repair process completed`);
      }).catch(console.error);
    }, 2000);
  }, []);

  // Load content after background is ready
  useEffect(() => {
    // Minimal delay to ensure background is rendered first
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 50); // Reduced to 50ms delay to minimize white flash

    return () => clearTimeout(timer);
  }, []);
  
  // Use the audio manager to handle state changes
  useGlobalAudioManager();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    // Show back button for category pages, player page, recorder page, audio editor page, upload page, and report page
    setShowBackButton(
      location.pathname.startsWith('/category/') || 
      location.pathname.startsWith('/player/') ||
      location.pathname.startsWith('/record/recorder') ||
      location.pathname.startsWith('/audio-editor') ||
      location.pathname.startsWith('/upload') ||
      location.pathname.startsWith('/report')
    );
  }, [location.pathname]);

  // Check if the current track is visible (any instance of it)
  const isCurrentTrackVisible = currentTrack && Array.from(visibleAudioCardIds).some(cardInstanceId => 
    cardInstanceId.startsWith(currentTrack.id + '-')
  );

  // Reset visibility tracking when changing routes
  useEffect(() => {
    // Clear visibility tracking when changing routes
    setVisibleAudioCardIdsState(new Set());
    setExpandedAudioCardIdState(null);
  }, [location.pathname]);

  // Check if we're on the record page, player page, upload page, audio editor page, or report page for mobile layout
  const isRecordPage = location.pathname === '/record' || location.pathname === '/aural/record';
  const isPlayerPage = location.pathname.startsWith('/player/');
  const isUploadPage = location.pathname === '/upload' || location.pathname === '/aural/upload';
  const isAudioEditorPage = location.pathname === '/audio-editor' || location.pathname === '/aural/audio-editor';
  const isReportPage = location.pathname === '/report' || location.pathname === '/aural/report';
  const isDemoPage = location.pathname.startsWith('/demo') || location.pathname.startsWith('/aural/demo');
  
  // Alle Seiten sollen schwarzen Hintergrund haben (kein Fall-Hintergrund mehr)
  const isBlackBackgroundPage = true;
  
  // Render Report Page without Unicorn background
  if (isReportPage) {
    return (
      <BackNavigationContext.Provider value={{ showBackButton, setShowBackButton }}>
        <div className="min-h-screen bg-black">
          {/* Top Navigation */}
          <TopNavigation />
          
          {/* Main Content with reduced top padding for category/subpages */}
          <main className={`flex-1 overflow-hidden ${showBackButton ? 'pt-2' : 'pt-20'} ${currentTrack && !location.pathname.startsWith('/player/') && !isCurrentTrackVisible && !isRecording ? 'pb-24' : 'pb-0'} ${isScrolled ? 'content-blur' : ''} ${currentTrack && !location.pathname.startsWith('/player/') && !isCurrentTrackVisible && !isRecording ? 'content-blur-bottom' : ''} ${isRecordPage ? 'pb-0' : ''}`}>
            <div style={{ minHeight: '100%' }}>
              <Outlet context={{ visibleAudioCardIds, setVisibleAudioCardIds, expandedAudioCardId, setExpandedAudioCardId }} />
            </div>
          </main>
          
          {/* Mini Player - fixed at bottom of screen when there's a current track and it's not visible */}
          {currentTrack && !location.pathname.startsWith('/player/') && !isCurrentTrackVisible && !isRecording && (
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <MiniPlayer displayMode="fixed" />
            </div>
          )}

          {/* Footer */}
          <Footer />
        </div>
      </BackNavigationContext.Provider>
    );
  }

  return (
    <BackNavigationContext.Provider value={{ showBackButton, setShowBackButton }}>
      <UnicornBackgroundSimple className={`min-h-screen ${isBlackBackgroundPage ? `mobile-record-layout record-page-background ${isPlayerPage ? 'player-page-background' : ''} ${isUploadPage ? 'upload-page-background' : ''} ${isAudioEditorPage ? 'audio-editor-page-background' : ''}` : ''}`}>
        {/* Content loads after background is ready */}
        {isContentReady && (
          <div className="min-h-screen flex flex-col text-text-primary relative">
            {/* Top Navigation */}
            <TopNavigation />
            
            {/* Main Content with reduced top padding for category/subpages */}
            <main className={`flex-1 overflow-hidden ${showBackButton ? 'pt-2' : 'pt-20'} ${currentTrack && !location.pathname.startsWith('/player/') && !isCurrentTrackVisible && !isRecording ? 'pb-24' : 'pb-0'} ${isScrolled ? 'content-blur' : ''} ${currentTrack && !location.pathname.startsWith('/player/') && !isCurrentTrackVisible && !isRecording ? 'content-blur-bottom' : ''} ${isRecordPage ? 'pb-0' : ''}`}>
              <div style={{ minHeight: '100%' }}>
                <Outlet context={{ visibleAudioCardIds, setVisibleAudioCardIds, expandedAudioCardId, setExpandedAudioCardId }} />
              </div>
            </main>
            
            {/* Mini Player - fixed at bottom of screen when there's a current track and it's not visible */}
            {currentTrack && !location.pathname.startsWith('/player/') && !isCurrentTrackVisible && !isRecording && (
              <div className="fixed bottom-0 left-0 right-0 z-50">
                <MiniPlayer displayMode="fixed" />
              </div>
            )}

            {/* Footer */}
            <Footer />
          </div>
        )}
      </UnicornBackgroundSimple>
      
      {/* Audio Debug Console removed */}
    </BackNavigationContext.Provider>
  );
};

export default AppLayout;