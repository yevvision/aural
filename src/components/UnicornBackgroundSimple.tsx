import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// TypeScript declaration for UnicornStudio
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => Promise<any>;
    };
    unicornScenes?: any;
  }
}

interface UnicornBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const UnicornBackgroundSimple: React.FC<UnicornBackgroundProps> = ({ children, className = '' }) => {
  const location = useLocation();
  
  // Check if we're on the record page or player page
  const isRecordPage = location.pathname === '/record' || location.pathname === '/aural/record';
  const isPlayerPage = location.pathname.startsWith('/player/');
  const isBlackBackgroundPage = isRecordPage || isPlayerPage;

  useEffect(() => {
    // Only load Unicorn Studio for non-black background pages
    if (isBlackBackgroundPage) {
      console.log('🎨 UnicornBackgroundSimple: Skipping Unicorn Studio for black background page');
      // Immediately hide any existing unicorn canvas
      const existingCanvas = document.querySelector('.unicorn-background-container');
      if (existingCanvas) {
        (existingCanvas as HTMLElement).style.display = 'none';
      }
      return;
    }
    
    console.log('🎨 UnicornBackgroundSimple: Initializing or re-initializing...');
    
    // Always ensure the script is loaded and working
    const loadUnicornStudio = () => {
      if (window.UnicornStudio && window.UnicornStudio.isInitialized) {
        console.log('🎨 UnicornBackgroundSimple: Unicorn Studio already initialized, ensuring visibility');
        // Force re-initialization to ensure canvas is visible
        setTimeout(() => {
          const unicornElements = document.querySelectorAll('[data-us-project]');
          unicornElements.forEach(element => {
            (element as HTMLElement).style.display = 'block';
            (element as HTMLElement).style.opacity = '0.8';
          });
          
          // Also try to re-initialize the canvas
          if (window.UnicornStudio && window.UnicornStudio.init) {
            window.UnicornStudio.init().then((scenes) => {
              console.log('🎨 Unicorn Studio re-initialized:', scenes);
              window.unicornScenes = scenes;
            }).catch((err) => {
              console.error('🎨 Unicorn Studio re-initialization error:', err);
            });
          }
        }, 100);
        return;
      }
      
      // Load the script if not already loaded
      const existingScript = document.querySelector('script[src="/unicornStudio.umd.js"]');
      if (existingScript) {
        console.log('🎨 UnicornBackgroundSimple: Script already exists, triggering load');
        // Script exists but might not be loaded yet, trigger the load
        const event = new Event('load');
        existingScript.dispatchEvent(event);
        return;
      }
      
      // Use the exact same script loading as the working HTML version
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `!function(){if(!window.UnicornStudio){window.UnicornStudio={isInitialized:!1};var i=document.createElement("script");i.src="/unicornStudio.umd.js",i.onload=function(){console.log('🎨 Unicorn Studio script loaded');window.UnicornStudio.isInitialized||(console.log('🎨 Initializing Unicorn Studio...'),UnicornStudio.init().then((scenes)=>{console.log('🎨 Unicorn Studio initialized:',scenes);window.unicornScenes=scenes;console.log('🎨 Unicorn Studio ready');}).catch((err)=>{console.error('🎨 Unicorn Studio error:',err)}),window.UnicornStudio.isInitialized=!0)},(document.head || document.body).appendChild(i)}}();`;
      
      document.head.appendChild(script);
      console.log('🎨 UnicornBackgroundSimple: Script added to head');
    };
    
    loadUnicornStudio();
    
    return () => {
      // No cleanup needed as we want to keep the script loaded
    };
  }, [isBlackBackgroundPage]);

  // Additional effect to immediately hide/show unicorn canvas when switching pages
  useEffect(() => {
    if (isBlackBackgroundPage) {
      // Force hide any unicorn studio elements
      const unicornElements = document.querySelectorAll('[data-us-project]');
      unicornElements.forEach(element => {
        (element as HTMLElement).style.display = 'none';
        (element as HTMLElement).style.opacity = '0';
      });
    } else {
      // Force show unicorn studio elements when leaving black background page
      console.log('🎨 UnicornBackgroundSimple: Showing unicorn elements after leaving black background page');
      
      // Immediate visibility
      const unicornElements = document.querySelectorAll('[data-us-project]');
      unicornElements.forEach(element => {
        (element as HTMLElement).style.display = 'block';
        (element as HTMLElement).style.opacity = '0.8';
      });
      
      // Also ensure the unicorn background container is visible
      const unicornContainer = document.querySelector('.unicorn-background-container');
      if (unicornContainer) {
        (unicornContainer as HTMLElement).style.display = 'block';
        (unicornContainer as HTMLElement).style.opacity = '0.8';
      }
      
      // Force re-render of unicorn studio if it exists
      if (window.UnicornStudio && window.UnicornStudio.init) {
        console.log('🎨 UnicornBackgroundSimple: Forcing Unicorn Studio re-initialization');
        setTimeout(() => {
          window.UnicornStudio!.init().then((scenes) => {
            console.log('🎨 Unicorn Studio forced re-initialization successful:', scenes);
            window.unicornScenes = scenes;
          }).catch((err) => {
            console.error('🎨 Unicorn Studio forced re-initialization failed:', err);
          });
        }, 200);
      }
    }
  }, [isBlackBackgroundPage]);

  // Third effect specifically for ensuring canvas visibility after leaving black background page
  useEffect(() => {
    if (!isBlackBackgroundPage) {
      console.log('🎨 UnicornBackgroundSimple: Ensuring canvas visibility after page change');
      
      // Multiple attempts to ensure visibility
      const ensureVisibility = () => {
        const unicornElements = document.querySelectorAll('[data-us-project]');
        const unicornContainer = document.querySelector('.unicorn-background-container');
        
        console.log('🎨 UnicornBackgroundSimple: Found elements:', {
          unicornElements: unicornElements.length,
          unicornContainer: !!unicornContainer,
          windowUnicornStudio: !!window.UnicornStudio,
          isInitialized: window.UnicornStudio?.isInitialized
        });
        
        if (unicornElements.length > 0) {
          unicornElements.forEach(element => {
            (element as HTMLElement).style.display = 'block';
            (element as HTMLElement).style.opacity = '0.8';
            (element as HTMLElement).style.visibility = 'visible';
          });
        }
        
        if (unicornContainer) {
          (unicornContainer as HTMLElement).style.display = 'block';
          (unicornContainer as HTMLElement).style.opacity = '0.8';
          (unicornContainer as HTMLElement).style.visibility = 'visible';
        }
      };
      
      // Immediate attempt
      ensureVisibility();
      
      // Delayed attempts to ensure it works
      setTimeout(ensureVisibility, 100);
      setTimeout(ensureVisibility, 500);
      setTimeout(ensureVisibility, 1000);
    }
  }, [isBlackBackgroundPage]);

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Black Background - Always present, but only visible on black background pages */}
      <div 
        className={`fixed inset-0 w-full h-full pointer-events-none background-transition ${
          isBlackBackgroundPage ? 'record-page' : 'non-record-page'
        }`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          minWidth: '100vw',
          minHeight: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          zIndex: 2, // Higher z-index than unicorn background
          backgroundColor: '#000000'
        }}
      />
      
      {/* Unicorn Studio Background - Only visible on non-black background pages */}
      {!isBlackBackgroundPage && (
        <div
          className={`fixed inset-0 w-full h-full pointer-events-none unicorn-background-container ${
            isBlackBackgroundPage ? 'hide' : 'restore'
          }`}
          data-us-project="3Z7rqYRTDAvnqc3BpTTz"
          data-us-scale="1"
          data-us-dpi="1.5"
          data-us-lazyload="true"
          data-us-production="true"
          data-us-fps="60"
          data-us-alttext="Raycast Hintergrund Szene"
          data-us-arialabel="Interaktive 3D Raycast Hintergrund Animation"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            minWidth: '100vw',
            minHeight: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            zIndex: 1,
            opacity: 0.8,
            transform: 'scale(1) rotate(0deg)',
            filter: 'blur(0px) brightness(1)',
            objectFit: 'cover',
            objectPosition: 'center center',
            transformOrigin: 'center center'
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Mobile Viewport Fixes */}
      <style>{`
        /* Mobile Viewport Fixes */
        @media screen and (max-width: 768px) {
          .unicorn-background-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            min-width: 100vw !important;
            min-height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            transform-origin: center center !important;
          }
        }
        
        /* iOS Safari Viewport Fix */
        @supports (-webkit-touch-callout: none) {
          .unicorn-background-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            min-width: 100vw !important;
            min-height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            transform-origin: center center !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UnicornBackgroundSimple;
