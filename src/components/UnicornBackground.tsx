import React, { useEffect, useRef } from 'react';

interface UnicornBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const UnicornBackground: React.FC<UnicornBackgroundProps> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Debug function
    const debugLog = (message: string, data: any = null) => {
      console.log(`[Unicorn Background Debug] ${message}`, data || '');
    };

    // Load the local Unicorn Studio SDK only once
    const loadUnicornStudio = async () => {
      try {
        debugLog('Starting to load Unicorn Studio SDK...');
        
        // Check if SDK is already loaded
        if (window.UnicornStudio) {
          debugLog('SDK already loaded, initializing...');
          if (!isInitialized.current) {
            initializeUnicornStudio();
          }
          return;
        }

        // Create the script element for local Unicorn Studio SDK
        const script = document.createElement('script');
        script.src = '/unicornStudio.umd.js';
        script.async = true;
        
        script.onload = () => {
          debugLog('SDK script loaded successfully');
          if (!isInitialized.current) {
            initializeUnicornStudio();
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load Unicorn Studio SDK');
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Unicorn Studio:', error);
      }
    };

    const initializeUnicornStudio = () => {
      if (window.UnicornStudio && !isInitialized.current) {
        debugLog('Initializing Unicorn Studio...');
        isInitialized.current = true;
        
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          window.UnicornStudio.init().then((scenes: any) => {
            debugLog('Unicorn Studio initialized successfully:', scenes);
          }).catch((err: any) => {
            console.error('Unicorn Studio initialization error:', err);
          });
        }, 100);
      }
    };

    loadUnicornStudio();

    // Cleanup function
    return () => {
      // Don't destroy on unmount as it's used globally
    };
  }, []);

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Unicorn Studio Canvas Container - Full Background */}
      <div
        ref={containerRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
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
          width: '100vw',
          height: '100vh',
          zIndex: -1
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// TypeScript declaration for UnicornStudio
declare global {
  interface Window {
    UnicornStudio: {
      init: () => Promise<any>;
      destroy: () => void;
    };
  }
}

export default UnicornBackground;
