import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { validateAudioBlob, repairAudioBlob } from '../utils/audioValidation';

type UseWaveformEditorOpts = {
  container: HTMLElement | null;
  audioBlob: Blob | null;
  barWidth?: number;
  height?: number;
  onRegionClick?: (region: { start: number; end: number; id: string }) => void;
  onRegionUpdate?: (region: { start: number; end: number; id: string }) => void;
  onRegionActivated?: (region: { start: number; end: number; id: string }) => void;
};

export function useWaveformEditor({ container, audioBlob, barWidth = 2, height = 200, onRegionClick, onRegionUpdate, onRegionActivated }: UseWaveformEditorOpts) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<ReturnType<typeof RegionsPlugin['create']> | null>(null);
  const [duration, setDuration] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [allRegions, setAllRegions] = useState<{ start: number; end: number; id: string }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPlayingRegionId, setCurrentPlayingRegionId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasShownDemo, setHasShownDemo] = useState(false);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  // Debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`🔍 useWaveformEditor: ${logMessage}`, data || '');
  };

  // Function to force remove borders from all regions
  const forceRemoveBorders = useCallback(() => {
    if (!regionsRef.current) return;
    
    const currentRegions = regionsRef.current.getRegions();
    console.log('🔄 Force removing borders from all regions:', currentRegions.length);
    
    currentRegions.forEach((region: any, index: number) => {
      try {
        if (region.element) {
          console.log(`🔄 Processing region ${index + 1}:`, {
            id: region.id,
            currentStyles: {
              background: region.element.style.background,
              border: region.element.style.border,
              opacity: region.element.style.opacity
            }
          });
          
          // Set green background for inactive regions
          region.element.style.background = 'rgba(34, 197, 94, 0.2)';
          region.element.style.opacity = '0.7';
          
          // Force remove all border-related styles
          region.element.style.border = 'none';
          region.element.style.outline = 'none';
          region.element.style.boxShadow = 'none';
          region.element.style.borderWidth = '0';
          region.element.style.borderStyle = 'none';
          region.element.style.borderColor = 'transparent';
          
          // Hide all handles
          if (region.handleLeft && region.handleLeft.element) {
            region.handleLeft.element.style.display = 'none';
          }
          if (region.handleRight && region.handleRight.element) {
            region.handleRight.element.style.display = 'none';
          }
          
          console.log(`✅ Region ${index + 1} processed:`, {
            newStyles: {
              background: region.element.style.background,
              border: region.element.style.border,
              opacity: region.element.style.opacity
            }
          });
        } else {
          console.warn(`❌ Region ${index + 1} has no element`);
        }
      } catch (error) {
        console.warn('❌ Error force removing borders:', error);
      }
    });
  }, []);

  // Function to set region as active - EINFACH UND DIREKT
  const setRegionActive = useCallback((regionId: string) => {
    console.log('🎯 Setting region as active:', regionId);
    setActiveRegionId(regionId);
    
    // Direkt nach kurzer Zeit anwenden
    setTimeout(() => {
      const currentRegions = regionsRef.current?.getRegions() || [];
      
      currentRegions.forEach((region: any) => {
        if (region.element) {
          if (region.id === regionId) {
            // Set as active (orange with border and handles)
            region.element.style.setProperty('background', 'rgba(255, 78, 58, 0.25)', 'important');
            region.element.style.setProperty('background-color', 'rgba(255, 78, 58, 0.25)', 'important');
            region.element.style.setProperty('border', '2px solid #f97316', 'important');
            region.element.style.setProperty('opacity', '1', 'important');
            region.element.classList.add('active');
            
            // Show handles
            if (region.handleLeft && region.handleLeft.element) {
              region.handleLeft.element.style.display = 'block';
              region.handleLeft.element.style.width = '24px';
              region.handleLeft.element.style.height = '24px';
              region.handleLeft.element.style.background = '#f97316';
            }
            if (region.handleRight && region.handleRight.element) {
              region.handleRight.element.style.display = 'block';
              region.handleRight.element.style.width = '24px';
              region.handleRight.element.style.height = '24px';
              region.handleRight.element.style.background = '#f97316';
            }
            
            console.log('✅ Region set as active (orange):', region.id);
            
            // Callback für Active Region Anzeige aufrufen
            if (onRegionActivated) {
              onRegionActivated({ start: region.start, end: region.end, id: region.id });
            }
          } else {
            // Set as inactive (orange without border and handles)
            region.element.style.setProperty('background', 'rgba(255, 78, 58, 0.2)', 'important');
            region.element.style.setProperty('background-color', 'rgba(255, 78, 58, 0.2)', 'important');
            region.element.style.setProperty('border', 'none', 'important');
            region.element.style.setProperty('opacity', '0.7', 'important');
            region.element.classList.remove('active');
            
            // Hide handles
            if (region.handleLeft && region.handleLeft.element) {
              region.handleLeft.element.style.display = 'none';
            }
            if (region.handleRight && region.handleRight.element) {
              region.handleRight.element.style.display = 'none';
            }
            
            console.log('✅ Region set as inactive (orange):', region.id);
          }
        }
      });
    }, 100);
  }, []);

  // AGGRESSIVE Funktion: Setze alle Regionen als inaktiv
  const setAllRegionsInactive = useCallback(() => {
    if (!regionsRef.current) return;
    
    console.log('🔥 AGGRESSIVE: Setting all regions as inactive');
    setActiveRegionId(null);
    
    const currentRegions = regionsRef.current.getRegions();
    
    currentRegions.forEach((region: any) => {
      if (region.element) {
        // RADIKALE Überschreibung
        region.element.style.setProperty('background', 'rgba(255, 78, 58, 0.2)', 'important');
        region.element.style.setProperty('background-color', 'rgba(255, 78, 58, 0.2)', 'important');
        region.element.style.setProperty('border', 'none', 'important');
        region.element.style.setProperty('border-width', '0', 'important');
        region.element.style.setProperty('border-style', 'none', 'important');
        region.element.style.setProperty('border-color', 'transparent', 'important');
        region.element.style.setProperty('opacity', '0.7', 'important');
        
        region.element.classList.remove('active');
        region.element.setAttribute('data-status', 'inactive');
        
        // Hide handles
        if (region.handleLeft && region.handleLeft.element) {
          region.handleLeft.element.style.display = 'none';
        }
        if (region.handleRight && region.handleRight.element) {
          region.handleRight.element.style.display = 'none';
        }
        
        console.log('🔥 Region AGGRESSIVELY set as inactive (green):', region.id);
      }
    });
  }, []);

  // Function to update region active state (legacy compatibility)
  const updateRegionActiveState = useCallback((regionId: string | null) => {
    if (regionId) {
      setRegionActive(regionId);
    } else {
      setAllRegionsInactive();
    }
  }, [setRegionActive, setAllRegionsInactive]);

  // Function to force region visual update without recreating them
  const forceRegionVisualUpdate = useCallback(() => {
    if (!regionsRef.current) {
      console.log('No regions ref available');
      return;
    }

    const currentRegions = regionsRef.current.getRegions();
    console.log('Forcing visual update for regions:', currentRegions.length, 'regions');

    currentRegions.forEach((region: any) => {
      try {
        // Force region to redraw by accessing its internal properties
        if (region.element) {
          // Trigger a reflow by temporarily hiding and showing the element
          region.element.style.display = 'none';
          region.element.offsetHeight; // Force reflow
          region.element.style.display = '';
        }

        // Force update of region handles
        if (region.handleLeft && region.handleLeft.element) {
          region.handleLeft.element.style.display = 'none';
          region.handleLeft.element.offsetHeight;
          region.handleLeft.element.style.display = '';
        }
        if (region.handleRight && region.handleRight.element) {
          region.handleRight.element.style.display = 'none';
          region.handleRight.element.offsetHeight;
          region.handleRight.element.style.display = '';
        }

        // Force region to recalculate its position
        if (typeof region.update === 'function') {
          region.update({
            start: region.start,
            end: region.end
          });
        }

        console.log('Region visual update forced:', region.id);
      } catch (error) {
        console.warn('Error forcing region visual update:', error);
      }
    });
  }, []);

  // Animation function to show region is draggable
  const animateRegionDemo = useCallback(async (region: any, duration: number) => {
    // Prüfe ob Demo bereits gezeigt wurde (localStorage)
    const demoShown = localStorage.getItem('region-demo-shown');
    if (demoShown || hasShownDemo) return;
    
    setHasShownDemo(true);
    localStorage.setItem('region-demo-shown', 'true');
    console.log('🎬 Starting region demo animation');
    
    // Berechne 20% der Gesamtaufnahme
    const moveDistance = duration * 0.2;
    
    // Originale Positionen
    const originalStart = region.start;
    const originalEnd = region.end;
    
    // Neue Positionen (20% nach links)
    const newStart = Math.max(0, originalStart - moveDistance);
    const newEnd = Math.max(newStart + 1, originalEnd - moveDistance);
    
    // Animation nach links (1 Sekunde)
    await animateRegionMove(region, newStart, newEnd, 1000);
    
    // Kurze Pause
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Animation zurück nach rechts (1 Sekunde)
    await animateRegionMove(region, originalStart, originalEnd, 1000);
    
    console.log('🎬 Region demo animation completed');
  }, [hasShownDemo]);

  // Helper function for smooth region animation
  const animateRegionMove = useCallback((region: any, targetStart: number, targetEnd: number, duration: number) => {
    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      const startStart = region.start;
      const startEnd = region.end;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentStart = startStart + (targetStart - startStart) * easeProgress;
        const currentEnd = startEnd + (targetEnd - startEnd) * easeProgress;
        
        region.setStart(currentStart);
        region.setEnd(currentEnd);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }, []);

  const create = useCallback(() => {
    if (!container) {
      addDebugLog('Container not available, skipping WaveSurfer creation');
      return;
    }
    
    // Detect mobile device for optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    window.innerWidth <= 768 || 
                    ('ontouchstart' in window);
    
    try {
      addDebugLog('Creating WaveSurfer instance', { 
        container: container.tagName, 
        barWidth, 
        height,
        hasPreviousInstance: !!wsRef.current,
        isMobile,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth
      });
      
      // Destroy previous instance if any
      if (wsRef.current) {
        addDebugLog('Destroying previous WaveSurfer instance');
        wsRef.current.destroy();
      }

      const ws = WaveSurfer.create({
        container,
        height,
        barWidth: isMobile ? 2 : 3,               // Dünnere Balken auf Mobile für bessere Performance
        barGap: isMobile ? 0.5 : 1,               // Weniger Gap auf Mobile
        barRadius: isMobile ? 2 : 3,              // Kleinere Radius auf Mobile
        waveColor: '#4c4c4c',      // Dunkles Grau für die Waveform
        progressColor: '#ffffff',  // Weiß für den abgespielten Bereich
        cursorColor: '#ffffff',
        interact: true,
        normalize: true,
        minPxPerSec: 1,                           // Sehr niedrige Auflösung für vollständige Sichtbarkeit
        autoScroll: true,
        autoCenter: true,
        // Mobile-specific optimizations
        fillParent: true,
        // Better touch handling - use MediaElement for better audio playback on mobile
        backend: 'MediaElement',  // MediaElement für bessere Audio-Wiedergabe auf Mobile
        mediaControls: false,     // Media-Controls ausgeblendet - eigene Buttons verwenden
        // Enhanced mobile touch support
        cursorWidth: isMobile ? 2 : 3,            // Dünnerer Cursor auf Mobile
        hideScrollbar: true,
        // Drag Selection für Touch-Screens aktivieren
        // dragSelection: true,       // Ermöglicht Drag-to-Select auf Touch-Screens - nicht unterstützt in dieser Version
        // Mobile performance optimizations
        ...(isMobile && {
          // Mobile-spezifische Optimierungen
          renderer: 'Canvas',      // Canvas Renderer für bessere Mobile Performance
          forceDecode: false,      // Kein forciertes Decoding auf Mobile
          skipLength: 1,           // Weniger Detail auf Mobile
        }),
        // Better touch responsiveness
        // pixelRatio: window.devicePixelRatio || 1, // Not supported in current version
      });

      // Regions plugin with mobile optimizations
      const regions = ws.registerPlugin(RegionsPlugin.create());

      // Zoom plugin für Schieberegler-Steuerung
      const zoom = ws.registerPlugin(ZoomPlugin.create({
        scale: 0.5, // 50% Vergrößerung pro Scroll-Schritt
        maxZoom: 1000, // Maximale Zoom-Stufe
      }));

      // Add error handling for zoom plugin - note: zoom plugin may not have error event
      // We'll handle zoom errors in the main WaveSurfer error handler instead

      // Timeline plugin für Zeitmarkierungen
      const timeline = ws.registerPlugin(TimelinePlugin.create());
      
      // Custom styling via CSS basierend auf WaveSurfer.js Beispielen
      const style = document.createElement('style');
      style.textContent = `
        /* Waveform Container - schwarzer Hintergrund */
        .wavesurfer-container ::part(wrapper) {
          --box-size: 10px;
          background: #000000 !important;
          background-image: 
            linear-gradient(transparent calc(var(--box-size) - 1px), #3b82f6 var(--box-size), transparent var(--box-size)), 
            linear-gradient(90deg, transparent calc(var(--box-size) - 1px), #3b82f6 var(--box-size), transparent var(--box-size));
          background-size: 100% var(--box-size), var(--box-size) 100%;
          border-radius: 0px;
          height: 120px !important;
          width: 100% !important;
          position: relative !important;
          overflow: visible !important;
        }

        /* Waveform Container selbst - overflow visible für Cursor-Extension */
        .wavesurfer-container {
          overflow: visible !important;
          position: relative !important;
        }

        /* Alle internen WaveSurfer Container - overflow visible, keine Scrollbar */
        .wavesurfer-container > *,
        .wavesurfer-container > * > *,
        .wavesurfer-container > * > * > *,
        .wavesurfer-container > * > * > * > *,
        .wavesurfer-container [class*="scroll"],
        .wavesurfer-container [style*="overflow"],
        .wavesurfer-container [class*="viewport"],
        .wavesurfer-container [class*="wave"],
        .wavesurfer-container [class*="canvas"],
        .wavesurfer-container div[role="region"],
        .wavesurfer-container svg {
          overflow: visible !important;
        }

        /* Viewport Container spezifisch */
        .wavesurfer-container ::part(viewport),
        .wavesurfer-container ::part(view),
        .wavesurfer-container ::part(wave) {
          overflow: visible !important;
        }

        /* Scrollbar verstecken */
        .wavesurfer-container ::part(scroll)::-webkit-scrollbar,
        .wavesurfer-container ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        .wavesurfer-container ::part(scroll),
        .wavesurfer-container [class*="scroll"] {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        /* Cursor Styling - rot, 63px nach oben verschoben */
        .wavesurfer-container ::part(cursor) {
          height: 63px !important;
          width: 3px;
          background: #c9242c;
          position: relative;
          z-index: 100 !important;
          pointer-events: auto !important;
          margin-top: -63px !important;
        }

        /* Cursor-Verlängerung nach oben - ragt über Waveform hinaus */
        .wavesurfer-container ::part(cursor)::before {
          content: '' !important;
          position: absolute !important;
          bottom: 100% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 3px !important;
          height: 63px !important;
          background: #c9242c !important;
          z-index: 100 !important;
          pointer-events: auto !important;
        }

        /* Greifbarer Kreis ganz oben am Cursor - über allem */
        .wavesurfer-container ::part(cursor)::after {
          content: '' !important;
          position: absolute !important;
          bottom: calc(100% + 63px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 13px !important;
          height: 13px !important;
          background: #c9242c !important;
          border-radius: 50% !important;
          border: none !important;
          cursor: grab !important;
          z-index: 101 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
          pointer-events: auto !important;
        }

        /* Cursor aktiv beim Greifen */
        .wavesurfer-container ::part(cursor):active::after,
        .wavesurfer-container ::part(cursor):hover::after {
          cursor: grabbing !important;
          transform: translateX(-50%) scale(1.15) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        }

        /* Region-Markierung - ENTFERNT - wird durch .wavesurfer-region CSS gesteuert */
        .wavesurfer-container ::part(region) {
          /* Keine Styles hier - wird durch .wavesurfer-region CSS gesteuert */
        }

        /* Region-Handles - 24px breit und hoch, 50% über Kante, vertikal mittig, orange */
        .wavesurfer-container ::part(region-handle-left),
        .wavesurfer-container ::part(region-handle-right) {
          width: 24px !important;
          height: 24px !important;
          background: #ff4e3a !important;
          border: none !important;
          border-radius: 3px !important;
          cursor: col-resize !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Erweiterte Greiffläche für Region-Handles - transparente Fläche oberhalb und unterhalb */
        .wavesurfer-container ::part(region-handle-left)::before,
        .wavesurfer-container ::part(region-handle-right)::before {
          content: '' !important;
          position: absolute !important;
          top: -50px !important;
          left: -10px !important;
          width: 44px !important;
          height: 100px !important;
          background: transparent !important;
          cursor: col-resize !important;
          z-index: 10 !important;
        }

        /* Spezifische Positionierung für linken Griff */
        .wavesurfer-container ::part(region-handle-left) {
          left: -12px !important;
        }

        /* Spezifische Positionierung für rechten Griff */
        .wavesurfer-container ::part(region-handle-right) {
          right: -12px !important;
        }

        /* Hover-Effekte für Handles - orange */
        .wavesurfer-container ::part(region-handle-left):hover,
        .wavesurfer-container ::part(region-handle-right):hover {
          background: #ff4e3a !important;
          box-shadow: 0 4px 8px rgba(255, 78, 58, 0.4) !important;
        }

        /* Active/Click-Zustand - verhindert Springen, orange */
        .wavesurfer-container ::part(region-handle-left):active,
        .wavesurfer-container ::part(region-handle-right):active {
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: #ff4e3a !important;
        }

        /* Focus-Zustand - verhindert Springen */
        .wavesurfer-container ::part(region-handle-left):focus,
        .wavesurfer-container ::part(region-handle-right):focus {
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        /* Touch-Events - verhindert Springen auf mobilen Geräten */
        .wavesurfer-container ::part(region-handle-left):active,
        .wavesurfer-container ::part(region-handle-right):active,
        .wavesurfer-container ::part(region-handle-left):focus,
        .wavesurfer-container ::part(region-handle-right):focus {
          top: 50% !important;
          transform: translateY(-50%) !important;
          position: absolute !important;
        }

        /* Zusätzliche Stabilität für alle Zustände */
        .wavesurfer-container ::part(region-handle-left),
        .wavesurfer-container ::part(region-handle-right) {
          will-change: transform !important;
          backface-visibility: hidden !important;
        }

        /* Überschreibt WaveSurfer's eigene Styles - höchste Spezifität */
        .wavesurfer-container ::part(region-handle-left),
        .wavesurfer-container ::part(region-handle-right),
        .wavesurfer-container ::part(region-handle-left):hover,
        .wavesurfer-container ::part(region-handle-right):hover,
        .wavesurfer-container ::part(region-handle-left):active,
        .wavesurfer-container ::part(region-handle-right):active,
        .wavesurfer-container ::part(region-handle-left):focus,
        .wavesurfer-container ::part(region-handle-right):focus {
          top: 50% !important;
          transform: translateY(-50%) !important;
          position: absolute !important;
          margin: 0 !important;
          padding: 0 !important;
          vertical-align: top !important;
        }

        /* Zusätzliche Überschreibung für alle möglichen Zustände */
        .wavesurfer-container ::part(region-handle-left):not(:hover):not(:active):not(:focus),
        .wavesurfer-container ::part(region-handle-right):not(:hover):not(:active):not(:focus) {
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        /* Spezifische Regeln für Maus-Events (Desktop) */
        .wavesurfer-container ::part(region-handle-left):hover:active,
        .wavesurfer-container ::part(region-handle-right):hover:active {
          top: 50% !important;
          transform: translateY(-50%) !important;
          position: absolute !important;
        }

        /* Überschreibt WaveSurfer's Maus-Drag-Styles */
        .wavesurfer-container ::part(region-handle-left)[style*="top"],
        .wavesurfer-container ::part(region-handle-right)[style*="top"] {
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        /* Verhindert Position-Änderungen während Drag */
        .wavesurfer-container ::part(region-handle-left):is(:hover, :active, :focus),
        .wavesurfer-container ::part(region-handle-right):is(:hover, :active, :focus) {
          top: 50% !important;
          transform: translateY(-50%) !important;
          position: absolute !important;
        }

        /* Region Hover-Effekt - ENTFERNT - wird durch .wavesurfer-region CSS gesteuert */
        .wavesurfer-container ::part(region):hover {
          /* Keine Styles hier - wird durch .wavesurfer-region CSS gesteuert */
        }

        /* Active State für Touch */
        .wavesurfer-container ::part(region-handle-left):active,
        .wavesurfer-container ::part(region-handle-right):active {
          background: #e5e7eb !important;
          transform: scale(1.05) !important;
        }

        /* Scrollbar Styling - versteckt, overflow visible */
        .wavesurfer-container ::part(scroll) {
          background: transparent !important;
          height: 100% !important;
          border-radius: 4px !important;
          overflow: visible !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .wavesurfer-container ::part(scroll)::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        /* RADIKALE LÖSUNG: Überschreibe ALLE WaveSurfer-Styles */
        .wavesurfer-region,
        .wavesurfer-region[style*="background"],
        .wavesurfer-region[style*="border"],
        .wavesurfer-region[style*="color"] {
          background: rgba(255, 78, 58, 0.2) !important;
          background-color: rgba(255, 78, 58, 0.2) !important;
          border: none !important;
          border-width: 0 !important;
          border-style: none !important;
          border-color: transparent !important;
          border-radius: 4px !important;
          opacity: 0.7 !important;
          outline: none !important;
          box-shadow: none !important;
          z-index: 10 !important;
          pointer-events: auto !important;
        }
        
        /* AKTIVE MARKER - ORANGE */
        .wavesurfer-region.active,
        .wavesurfer-region.active[style*="background"],
        .wavesurfer-region.active[style*="border"],
        .wavesurfer-region.active[style*="color"] {
          background: rgba(255, 78, 58, 0.25) !important;
          background-color: rgba(255, 78, 58, 0.25) !important;
          border: 1px solid #ff4e3a !important;
          border-width: 1px !important;
          border-style: solid !important;
          border-color: #ff4e3a !important;
          opacity: 1 !important;
          z-index: 10 !important;
          pointer-events: auto !important;
        }
        
        /* INAKTIVE MARKER - ORANGE OHNE RAHMEN - ÜBERSCHREIBT ALLES */
        .wavesurfer-region:not(.active),
        .wavesurfer-region:not(.active)[style*="background"],
        .wavesurfer-region:not(.active)[style*="border"],
        .wavesurfer-region:not(.active)[style*="color"] {
          background: rgba(255, 78, 58, 0.2) !important;
          background-color: rgba(255, 78, 58, 0.2) !important;
          border: none !important;
          border-width: 0 !important;
          border-style: none !important;
          border-color: transparent !important;
          opacity: 0.7 !important;
        }
        
        /* Alle Greifer standardmäßig verstecken */
        .wavesurfer-region-handle {
          display: none !important;
        }
        
        /* Aktive Marker - orange mit Border und Greifern */
        .wavesurfer-region.active {
          background: rgba(255, 78, 58, 0.25) !important;
          border: 1px solid #ff4e3a !important;
          border-radius: 4px !important;
          opacity: 1 !important;
        }
        
        /* Aktive Marker - Greifer anzeigen */
        .wavesurfer-region.active .wavesurfer-region-handle {
          display: block !important;
          width: 24px !important;
          height: 24px !important;
          background: #ff4e3a !important;
          border: none !important;
          border-radius: 3px !important;
          cursor: col-resize !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }
        
        /* Zusätzliche Spezifität für Greifer in aktiven Regionen */
        .wavesurfer-region.active .wavesurfer-region-handle-left,
        .wavesurfer-region.active .wavesurfer-region-handle-right {
          display: block !important;
          width: 24px !important;
          height: 24px !important;
          background: #ff4e3a !important;
          border: none !important;
          border-radius: 3px !important;
          cursor: col-resize !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        /* Erweiterte Greiffläche für Fallback-Styles */
        .wavesurfer-region-handle::before {
          content: '' !important;
          position: absolute !important;
          top: -50px !important;
          left: -10px !important;
          width: 44px !important;
          height: 100px !important;
          background: transparent !important;
          cursor: col-resize !important;
          z-index: 10 !important;
        }

        /* Fallback-Positionierung für ältere Browser */
        .wavesurfer-region-handle-left {
          left: -12px !important;
        }
        
        .wavesurfer-region-handle-right {
          right: -12px !important;
        }

        /* Timeline Styling - versteckt */
        .wavesurfer-container ::part(timeline) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        
        .wavesurfer-container ::part(timeline-marker) {
          display: none !important;
          visibility: hidden !important;
        }

        /* Timeline komplett ausblenden */
        .wavesurfer-container [class*="timeline"],
        .wavesurfer-container [data-name="timeline"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }

        /* Hide system media controls */
        .wavesurfer-container audio {
          display: none !important;
        }
        
        .wavesurfer-container video {
          display: none !important;
        }
        
        /* Hide any media element controls */
        .wavesurfer-container ::part(media) {
          display: none !important;
        }
        
        /* Ensure media element is hidden */
        .wavesurfer-container audio[controls] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      // Touch: regions are draggable/resizable by default
      regions.on('region-created', (r: any) => {
        console.log('Region created:', r);
        const newRegion = { start: r.start, end: r.end, id: r.id };
        setAllRegions(prev => [...prev, newRegion]);
        setSelection({ start: r.start, end: r.end });
        
        // Neue Region als aktiv (orange) setzen, alle anderen als inaktiv (grün)
        console.log('🔍 DEBUG: Region created, will set active in 50ms:', r.id);
        // Warte kurz bis die Region im DOM ist
        setTimeout(() => {
          console.log('🔍 DEBUG: About to set region active:', r.id);
          setRegionActive(r.id);
          console.log('🎯 New region set as active (orange):', r.id);
        }, 50);
        
        // Verhindert Springen der Griffe nach Region-Erstellung
        setTimeout(() => {
          const handles = container.querySelectorAll('.wavesurfer-region-handle');
          handles.forEach((handle: any) => {
            handle.style.top = '50%';
            handle.style.transform = 'translateY(-50%)';
            handle.style.position = 'absolute';
          });
        }, 10);
      });
      
      // Drag Selection Events für Touch-Screens
      regions.on('region-updated', (r: any) => {
        console.log('Region updated via drag selection:', r);
        setAllRegions(prev => prev.map(region => 
          region.id === r.id ? { ...region, start: r.start, end: r.end } : region
        ));
        setSelection({ start: r.start, end: r.end });
        
        // Callback für Region-Update aufrufen
        if (onRegionUpdate) {
          onRegionUpdate({ start: r.start, end: r.end, id: r.id });
        }
      });
      
      // Touch-optimierte Drag Selection
      regions.on('region-clicked', (r: any, e: MouseEvent) => {
        e.stopPropagation();
        console.log('Region clicked (touch-friendly):', r);
        setSelection({ start: r.start, end: r.end });
        
        // Markiere diese Region als aktiv
        setRegionActive(r.id);
        
        // Callback für Region-Click aufrufen
        if (onRegionClick) {
          onRegionClick({ start: r.start, end: r.end, id: r.id });
        }
        
        // Haptic Feedback für Touch
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      });
      regions.on('region-removed', (r: any) => {
        console.log('Region removed:', r);
        setAllRegions(prev => prev.filter(region => region.id !== r.id));
      });

      // Zoom-Level Referenz für Cursor-Drag
      let currentZoomLevelRef = zoomLevel;
      
      // Zoom-Event-Listener für Schieberegler
      ws.on('zoom', (minPxPerSec: number) => {
        setZoomLevel(minPxPerSec);
        currentZoomLevelRef = minPxPerSec; // Update Referenz für Cursor-Drag
        console.log('Zoom changed to:', minPxPerSec, 'px/sec');
        
        // Force region visual update after zoom
        setTimeout(() => {
          forceRegionVisualUpdate();
        }, 100); // Wait for WaveSurfer to complete zoom
      });

      // Error handling for zoom operations
      ws.on('error', (error: any) => {
        if (error && error.message && error.message.includes('No audio loaded')) {
          addDebugLog('WaveSurfer zoom error - no audio loaded', { 
            error: error.message,
            isReady,
            hasAudio: !!ws.getDuration() || ws.getDuration() > 0
          });
          console.warn('WaveSurfer zoom error - no audio loaded:', error);
        }
      });

      // Play/Pause Event-Listener
      ws.on('play', () => {
        console.log('Audio started playing');
        setIsPlaying(true);
      });

      ws.on('pause', () => {
        console.log('Audio paused');
        setIsPlaying(false);
        setCurrentPlayingRegionId(null);
      });

      ws.on('finish', () => {
        console.log('Audio finished');
        setIsPlaying(false);
        setCurrentPlayingRegionId(null);
      });

      ws.on('ready', () => {
        const duration = ws.getDuration();
        addDebugLog('WaveSurfer ready event fired', { duration, isFinite: isFinite(duration) });
        console.log('WaveSurfer: Ready, duration:', duration);
        
        // Mobile-specific audio initialization
        if (isMobile) {
          addDebugLog('Mobile device detected, initializing audio for mobile playback');
          // Ensure audio context is resumed for mobile devices
          if (ws.getMediaElement()) {
            const mediaElement = ws.getMediaElement();
            if (mediaElement) {
              mediaElement.setAttribute('playsinline', 'true');
              mediaElement.setAttribute('webkit-playsinline', 'true');
              addDebugLog('Mobile audio attributes set', { 
                hasMediaElement: !!mediaElement,
                playsinline: mediaElement.getAttribute('playsinline'),
                webkitPlaysinline: mediaElement.getAttribute('webkit-playsinline')
              });
            }
          }
        }
        
        // Behebe Infinity Duration Problem
        const validDuration = isFinite(duration) && duration > 0 ? duration : 0;
        if (!isFinite(duration) || duration <= 0) {
          console.warn('Audio duration is invalid:', duration, 'Using fallback duration: 0');
        }
        
        setIsReady(true);
        setDuration(validDuration);
        
        // Initial: Gesamte Aufnahme als Region markieren und vollständig sichtbar machen
        if (validDuration > 0) {
          // Zoom so einstellen, dass die gesamte Aufnahme sichtbar ist
          const containerWidth = container.offsetWidth;
          const pixelsPerSecond = containerWidth / validDuration;
          
          // Safe zoom with error handling
          try {
            ws.zoom(pixelsPerSecond);
            setZoomLevel(pixelsPerSecond);
          } catch (error) {
            addDebugLog('Initial zoom failed', { 
              error: error.message || error,
              pixelsPerSecond,
              containerWidth,
              validDuration
            });
            console.warn('Initial zoom failed:', error);
            // Set a default zoom level
            setZoomLevel(1);
          }
          
          const initialRegion = regions.addRegion({
            start: 0,
            end: validDuration,
            color: 'rgba(255, 78, 58, 0.2)',
            // border: '2px solid #f97316' // Nicht unterstützt in dieser Version
          });
          console.log('Initial region created for entire duration:', validDuration);
          console.log('Zoom set to show entire audio:', pixelsPerSecond, 'px/sec');
          setAllRegions([{ start: 0, end: validDuration, id: initialRegion.id }]);
          setSelection({ start: 0, end: validDuration });
          
          // Erste Region als aktiv (orange) setzen
          setTimeout(() => {
            if (initialRegion && initialRegion.id) {
              setRegionActive(initialRegion.id);
              console.log('🎯 Initial region set as active (orange):', initialRegion.id);
            }
          }, 200);
          
          // Animation: Zeige dem User, dass die Markierung verschiebbar ist
          setTimeout(() => {
            animateRegionDemo(initialRegion, validDuration);
          }, 1000); // 1 Sekunde nach dem Laden
        }
        
        // Add mobile touch event listeners
        if (container) {
          addDebugLog('Adding mobile touch event listeners');
          // Enhanced haptic feedback for touch interactions
          const triggerHaptic = (intensity: 'light' | 'medium' | 'strong' = 'medium') => {
            if ('vibrate' in navigator) {
              const patterns = {
                light: [5],
                medium: [15],
                strong: [25]
              };
              navigator.vibrate(patterns[intensity]);
            }
          };
          
          // Funktion zum Korrigieren der Griff-Position
          const fixHandlePositions = () => {
            const handles = container.querySelectorAll('.wavesurfer-region-handle');
            handles.forEach((handle: any) => {
              handle.style.top = '50%';
              handle.style.transform = 'translateY(-50%)';
              handle.style.position = 'absolute';
            });
          };

          // Kontinuierliche Korrektur während Drag (Desktop)
          let dragInterval: NodeJS.Timeout | null = null;
          
          // Touch start for haptic feedback
          container.addEventListener('touchstart', () => triggerHaptic('light'), { passive: true });
          
          // Touch end for region interactions
          container.addEventListener('touchend', () => {
            triggerHaptic('medium');
            // Korrigiert Position nach Touch-Events
            setTimeout(fixHandlePositions, 5);
          }, { passive: true });
          
          // Mouse down - startet kontinuierliche Korrektur
          container.addEventListener('mousedown', (e) => {
            // Prüft ob es ein Handle ist
            if (e.target && (e.target as any).classList.contains('wavesurfer-region-handle')) {
              // Startet kontinuierliche Korrektur während Drag
              dragInterval = setInterval(fixHandlePositions, 16); // 60fps
            }
            setTimeout(fixHandlePositions, 5);
          });
          
          // Mouse up - stoppt kontinuierliche Korrektur
          container.addEventListener('mouseup', () => {
            if (dragInterval) {
              clearInterval(dragInterval);
              dragInterval = null;
            }
            setTimeout(fixHandlePositions, 5);
          });
          
          // Mouse leave - stoppt auch die Korrektur
          container.addEventListener('mouseleave', () => {
            if (dragInterval) {
              clearInterval(dragInterval);
              dragInterval = null;
            }
          });
          
          // Click events für Desktop
          container.addEventListener('click', () => {
            setTimeout(fixHandlePositions, 5);
          });

          // MutationObserver - überwacht Änderungen an Handle-Styles
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target as HTMLElement;
                if (target.classList.contains('wavesurfer-region-handle')) {
                  // Korrigiert sofort wenn Style geändert wird
                  setTimeout(fixHandlePositions, 1);
                }
              }
            });
          });

          // Startet Überwachung der Handle-Elemente
          const handles = container.querySelectorAll('.wavesurfer-region-handle');
          handles.forEach((handle) => {
            observer.observe(handle, { attributes: true, attributeFilter: ['style'] });
          });
          
          // Enhanced double tap to zoom with better mobile UX
          let lastTap = 0;
          let tapCount = 0;
          container.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 400 && tapLength > 0) {
              tapCount++;
              if (tapCount === 2) {
              // Double tap detected - zoom in/out
              const currentZoom = ws.getScroll();
              const newZoom = currentZoom > 1 ? 1 : 2;
                ws.zoom(newZoom * 100); // Höhere Zoom-Stufe für bessere mobile Bedienung
                triggerHaptic('strong');
                tapCount = 0;
              }
            } else {
              tapCount = 1;
            }
            lastTap = currentTime;
          }, { passive: true });
          
          // Cursor Drag-Funktionalität
          let isDraggingCursor = false;
          
          // Hilfsfunktion: Berechne Zeit aus X-Position (funktioniert auch außerhalb des Containers)
          const getTimeFromX = (x: number): number => {
            if (!ws || !container) return 0;
            
            const rect = container.getBoundingClientRect();
            const viewport = container.querySelector('[part="viewport"]') as HTMLElement;
            if (!viewport) return 0;
            
            // X-Position kann auch außerhalb des Containers sein (z.B. beim Kreis oben)
            // Verwende relative Position zum Container
            const relativeX = x - rect.left;
            const scrollLeft = viewport.scrollLeft || 0;
            // Auch negative Werte sind erlaubt (außerhalb des Containers links)
            // Positive Werte über Container-Breite sind auch erlaubt (außerhalb rechts)
            const absoluteX = Math.max(0, relativeX) + scrollLeft;
            
            // Konvertiere Pixel zu Zeit basierend auf Zoom-Level
            const pixelsPerSecond = currentZoomLevelRef;
            const scrollTime = ws.getScroll(); // Start-Zeit des sichtbaren Bereichs
            const time = scrollTime + (absoluteX / pixelsPerSecond);
            
            const duration = ws.getDuration();
            return Math.max(0, Math.min(duration, time));
          };
          
          const handleCursorDragStart = (e: MouseEvent | TouchEvent) => {
            if (!ws || !container) return;
            
            const rect = container.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            const currentTime = ws.getCurrentTime();
            const duration = ws.getDuration();
            
            if (duration <= 0) return;
            
            // Container hat paddingTop: 73px (angepasst für 63px Cursor + etwas Spielraum)
            // Der Kreis liegt bei etwa Y = -73px relativ zum Container-Top
            // Berücksichtige das Padding: clickYRelative kann negativ sein
            const paddingTop = 73; // Entspricht paddingTop im WaveformVisualizer (angepasst für 63px Cursor)
            const clickYRelative = clientY - (rect.top - paddingTop); // Berücksichtige Padding für Bereich oberhalb
            const clickXRelative = clientX - rect.left;
            
            // Berechne die Zeit an der Klick-Position
            const clickedTime = getTimeFromX(clientX);
            
            // Prüfe, ob der Klick nahe am Cursor ist (innerhalb von 0.2 Sekunden)
            const timeDifference = Math.abs(clickedTime - currentTime);
            
            // Berechne die X-Position des Cursors
            const viewport = container.querySelector('[part="viewport"]') as HTMLElement;
            if (!viewport) return;
            
            const scrollTime = ws.getScroll();
            const pixelsPerSecond = currentZoomLevelRef;
            const cursorPixelX = (currentTime - scrollTime) * pixelsPerSecond;
            const viewportScrollLeft = viewport.scrollLeft || 0;
            const cursorAbsoluteX = cursorPixelX + viewportScrollLeft;
            const cursorXInContainer = cursorAbsoluteX;
            const distanceXFromCursor = Math.abs(clickXRelative - cursorXInContainer);
            
            // Bedingungen prüfen
            const isNearCursorInTime = timeDifference <= 0.3; // Etwas größere Toleranz
            const isNearCursorInXForStrich = distanceXFromCursor <= 10; // Toleranz für Strich
            const isNearCursorInXForKreis = distanceXFromCursor <= 25; // Größere Toleranz für Kreis (13px + etwas Spielraum)
            
            // Bereich des roten Kreises: ganz oben, außerhalb des sichtbaren Containers
            // Der Kreis ist bei Y = -73px bis -60px relativ zum Container (63px über Cursor-Ende)
            // Mit Padding-Berücksichtigung: clickYRelative sollte zwischen -83 und -60 liegen
            const isInKreisArea = clickYRelative >= -83 && clickYRelative <= -60;
            
            // Bereich des Cursor-Strichs: oberhalb der Waveform aber innerhalb des sichtbaren Bereichs
            // Cursor beginnt bei Y = -63px und geht bis Y = 0px (dann beginnt Waveform)
            const isInStrichArea = clickYRelative >= -73 && clickYRelative < 80 && !isInKreisArea;
            
            // Für den Kreis: prüfe nur ob X nahe ist (größere Toleranz) UND Y ganz oben
            // Für den Strich: prüfe ob X nahe ist (kleinere Toleranz) UND Y im Strich-Bereich
            const canDragKreis = isNearCursorInTime && isNearCursorInXForKreis && isInKreisArea;
            const canDragStrich = isNearCursorInTime && isNearCursorInXForStrich && isInStrichArea;
            
            // Debug für Kreis-Erkennung
            if (isInKreisArea && distanceXFromCursor <= 50) {
              console.log('Kreis-Klick erkannt:', {
                clickYRelative,
                clickXRelative,
                cursorXInContainer,
                distanceXFromCursor,
                timeDifference,
                isNearCursorInTime,
                isNearCursorInXForKreis,
                canDragKreis
              });
            }
            
            if (canDragKreis || canDragStrich) {
              isDraggingCursor = true;
              
              console.log('Drag gestartet!', {
                canDragKreis,
                canDragStrich,
                isDraggingCursor,
                clickYRelative,
                clickXRelative
              });
              
              // Verhindere Text-Selektion und andere Drag-Events
              e.preventDefault();
              e.stopPropagation();
              
              // Verhindere, dass WaveSurfer's Click-Handler den Cursor verschiebt
              e.stopImmediatePropagation();
              
              // Haptic Feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(10);
              }
            }
          };
          
          const handleCursorDrag = (e: MouseEvent | TouchEvent) => {
            if (!isDraggingCursor || !ws || !container) return;
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const duration = ws.getDuration();
            
            if (duration <= 0) return;
            
            // Berechne die neue Zeit direkt aus der Mausposition
            // Wichtig: Diese Funktion muss auch außerhalb des Containers funktionieren
            const newTime = getTimeFromX(clientX);
            
            // Debug-Ausgabe beim Drag
            console.log('Cursor-Drag:', {
              clientX,
              newTime,
              duration,
              isDraggingCursor
            });
            
            // Setze die neue Zeit
            ws.setTime(newTime);
          };
          
          const handleCursorDragEnd = (e: MouseEvent | TouchEvent) => {
            if (isDraggingCursor) {
              isDraggingCursor = false;
              e.preventDefault();
              e.stopPropagation();
            }
          };
          
          // Finde Parent-Element, das auch den Bereich oberhalb abdeckt (mit paddingTop)
          const parentElement = container.parentElement;
          
          // Mouse Events für Desktop - auf Parent-Element für Bereich oberhalb
          if (parentElement) {
            parentElement.addEventListener('mousedown', handleCursorDragStart, { capture: true });
          } else {
            container.addEventListener('mousedown', handleCursorDragStart, { capture: true });
          }
          window.addEventListener('mousemove', handleCursorDrag);
          window.addEventListener('mouseup', handleCursorDragEnd);
          
          // Touch Events für Mobile - auf Parent-Element für Bereich oberhalb
          if (parentElement) {
            parentElement.addEventListener('touchstart', handleCursorDragStart, { passive: false, capture: true });
          } else {
            container.addEventListener('touchstart', handleCursorDragStart, { passive: false, capture: true });
          }
          window.addEventListener('touchmove', handleCursorDrag, { passive: false });
          window.addEventListener('touchend', handleCursorDragEnd, { passive: false });
        }
      });

      ws.on('error', (error: any) => {
        addDebugLog('WaveSurfer error event', { 
          error: error.message || error, 
          isMobile,
          userAgent: navigator.userAgent,
          screenWidth: window.innerWidth
        });
        console.error('WaveSurfer error:', error);
        
        // Mobile-specific error handling
        if (isMobile) {
          addDebugLog('Mobile-specific error handling', { 
            errorType: typeof error,
            errorMessage: error.message,
            errorStack: error.stack
          });
        }
      });

      wsRef.current = ws;
      regionsRef.current = regions;
      addDebugLog('WaveSurfer instance created successfully', { 
        hasWaveSurfer: !!wsRef.current, 
        hasRegions: !!regionsRef.current 
      });
    } catch (error) {
      addDebugLog('Failed to create WaveSurfer instance', { error: error.message || error });
      console.error('Failed to create WaveSurfer instance:', error);
    }
  }, [container, barWidth, height]);

  useEffect(() => {
    if (!container) return;
    create();
    return () => { wsRef.current?.destroy(); wsRef.current = null; };
  }, [container]); // Remove create from dependencies to prevent infinite loop

  useEffect(() => {
    if (!audioBlob || !wsRef.current) {
      if (audioBlob && !wsRef.current) {
        addDebugLog('Audio blob available but WaveSurfer not ready', { 
          blobSize: audioBlob.size, 
          hasWaveSurfer: !!wsRef.current 
        });
      }
      return;
    }

    addDebugLog('Starting audio blob loading process', { 
      blobSize: audioBlob.size, 
      blobType: audioBlob.type,
      hasWaveSurfer: !!wsRef.current 
    });
    console.log('WaveSurfer: Loading audio blob, size:', audioBlob.size);
    
    // Validate and fix audio blob before loading
    const validateAndLoadAudio = async () => {
      try {
        addDebugLog('Starting audio validation before WaveSurfer loading');
        // First, validate the audio blob by creating an Audio element
        const audio = new Audio();
        const url = URL.createObjectURL(audioBlob);
        audio.src = url;
        addDebugLog('Created audio element for validation', { url });
        
        const loadPromise = new Promise<boolean>((resolve, reject) => {
          const timeout = setTimeout(() => {
            addDebugLog('Audio validation timeout after 30 seconds');
            reject(new Error('Audio loading timeout'));
          }, 30000);
          
          audio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
            addDebugLog('Audio metadata loaded in validation', { duration: audio.duration });
            console.log('Audio metadata loaded, duration:', audio.duration);
            
            // Check if duration is valid (not Infinity or NaN)
            if (isFinite(audio.duration) && audio.duration > 0) {
              addDebugLog('Audio validation successful, proceeding to WaveSurfer', { duration: audio.duration });
              console.log('Audio duration is valid:', audio.duration);
              URL.revokeObjectURL(url);
              resolve(true);
            } else {
              addDebugLog('Audio duration is invalid in validation', { duration: audio.duration });
              console.warn('Audio duration is invalid:', audio.duration);
              URL.revokeObjectURL(url);
              
              // Try to fix the duration by waiting for the audio to load completely
              console.log('Attempting to fix duration by waiting for canplaythrough...');
              audio.addEventListener('canplaythrough', () => {
                console.log('Audio can play through, new duration:', audio.duration);
                if (isFinite(audio.duration) && audio.duration > 0) {
                  console.log('Duration fixed, proceeding with valid duration:', audio.duration);
                  resolve(true);
                } else {
                  console.log('Duration still invalid, but continuing anyway - WaveSurfer might handle it');
                  resolve(true);
                }
              }, { once: true });
              
              // Fallback: continue anyway after a short delay
              setTimeout(() => {
                console.log('Continuing despite invalid duration - WaveSurfer might handle it better');
                resolve(true);
              }, 1000);
            }
          });
          
          audio.addEventListener('error', (e) => {
            clearTimeout(timeout);
            addDebugLog('Audio validation error', { error: e });
            console.error('Audio loading error:', e);
            URL.revokeObjectURL(url);
            reject(new Error('Audio loading failed'));
          });
          
          // Force load
          addDebugLog('Starting audio load for validation');
          audio.load();
        });
        
        await loadPromise;
        
        // If validation passed, load into WaveSurfer
        addDebugLog('Validation passed, loading blob into WaveSurfer');
        if (wsRef.current) {
          wsRef.current.loadBlob(audioBlob);
        }
        
      } catch (error) {
        addDebugLog('Audio validation failed, attempting to fix blob', { error: error.message || error });
        console.error('Failed to validate or load audio blob:', error);
        
        // Try to fix the audio blob by converting it
        try {
          addDebugLog('Attempting to fix audio blob using AudioContext');
          console.log('Attempting to fix audio blob...');
          const fixedBlob = await fixAudioBlob(audioBlob);
          if (fixedBlob && wsRef.current) {
            addDebugLog('Audio blob fixed successfully, loading into WaveSurfer', { 
              originalSize: audioBlob.size, 
              fixedSize: fixedBlob.size 
            });
            console.log('Audio blob fixed, loading into WaveSurfer');
            wsRef.current.loadBlob(fixedBlob);
          } else {
            addDebugLog('Failed to fix audio blob, trying direct load');
            console.error('Failed to fix audio blob, trying direct load');
            // Last resort: try to load the original blob directly
            if (wsRef.current) {
              console.log('Attempting direct blob load as fallback');
              wsRef.current.loadBlob(audioBlob);
            } else {
              throw new Error('Could not fix audio blob and WaveSurfer not available');
            }
          }
        } catch (fixError) {
          addDebugLog('Audio blob fix failed, trying direct load', { error: fixError.message || fixError });
          console.error('Failed to fix audio blob:', fixError);
          
          // Last resort: try to load the original blob directly
          if (wsRef.current) {
            console.log('Attempting direct blob load as final fallback');
            try {
              wsRef.current.loadBlob(audioBlob);
            } catch (directLoadError) {
              console.error('Direct blob load also failed:', directLoadError);
              throw new Error('Could not load audio blob in any way');
            }
          } else {
            throw new Error('Could not validate or fix audio blob');
          }
        }
      }
    };
    
    validateAndLoadAudio();
  }, [audioBlob]);

  // Helper function to fix audio blob
  const fixAudioBlob = async (blob: Blob): Promise<Blob | null> => {
    try {
      // Create a new AudioContext to process the audio
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('Audio buffer decoded successfully, duration:', audioBuffer.duration);
      
      // Convert back to WAV format
      const wavBlob = await audioBufferToWav(audioBuffer);
      await audioContext.close();
      
      return wavBlob;
    } catch (error) {
      console.error('Failed to fix audio blob:', error);
      return null;
    }
  };

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Create WAV header
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const addOrReplaceRegion = useCallback((start = 0, end?: number) => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    // Clear existing regions
    const existingRegions = regionsRef.current.getRegions();
    existingRegions.forEach((region: any) => region.remove());

    const dur = wsRef.current.getDuration();
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const s = clamp(start, 0, dur);
    const e = clamp(end ?? s + Math.min(5, dur - s), s, dur);

    const region = regionsRef.current.addRegion({
      start: s,
      end: e,
      color: 'rgba(255, 78, 58, 0.2)', // Orange Farbe für inaktive Regionen
      drag: true,
      resize: true,
    });
    
    // Ensure region is properly bound to time coordinates
    console.log('Created region with time coordinates:', { start: s, end: e, id: region.id });
    
    
    setSelection({ start: s, end: e });
    // Seek to start for immediate feedback
    wsRef.current.setTime(s);
  }, [isReady]);

  const addNewRegion = useCallback((start = 0, end?: number) => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    
    const dur = wsRef.current.getDuration();
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    
    // Finde den letzten Bereich und setze den Start mit einer Lücke
    let s = start;
    if (allRegions.length > 0) {
      const lastRegion = allRegions[allRegions.length - 1];
      // Berechne 2,5% der Gesamtaufnahme als Lücke
      const gap = dur * 0.025; // 2,5% der Gesamtaufnahme
      // Setze Start nach dem Ende des letzten Bereichs plus Lücke
      s = lastRegion.end + gap;
    }
    
    s = clamp(s, 0, dur);
    const e = clamp(end ?? s + Math.min(5, dur - s), s, dur);

    // Mobile-optimierte Region mit besserer Sichtbarkeit
    const region = regionsRef.current.addRegion({
      start: s,
      end: e,
      color: 'rgba(255, 78, 58, 0.2)', // Orange Farbe für inaktive Regionen
      drag: true,
      resize: true,
    });
    
    // Ensure region is properly bound to time coordinates
    console.log('Added new region with time coordinates:', { start: s, end: e, id: region.id });
    
    // Update regions state
    setAllRegions(prev => [...prev, { start: s, end: e, id: region.id }]);
    setSelection({ start: s, end: e });
    
    // Neue Region als aktiv (orange) setzen, alle anderen als inaktiv (grün)
    // Warte kurz bis die Region im DOM ist
    setTimeout(() => {
      setRegionActive(region.id);
      console.log('🎯 New region set as active (orange):', region.id);
    }, 100);
  }, [isReady, allRegions]);

  const removeRegion = useCallback((start: number, end: number) => {
    if (!regionsRef.current) return;
    
    const regions = regionsRef.current.getRegions();
    const regionToRemove = regions.find((region: any) => 
      Math.abs(region.start - start) < 0.01 && Math.abs(region.end - end) < 0.01
    );
    
    if (regionToRemove) {
      regionToRemove.remove();
      console.log('Removed region:', { start, end });
    }
  }, []);

  const removeRegionById = useCallback((regionId: string) => {
    if (!regionsRef.current) return;
    
    const regions = regionsRef.current.getRegions();
    const regionToRemove = regions.find((region: any) => region.id === regionId);
    
    if (regionToRemove) {
      regionToRemove.remove();
      console.log('Removed region by ID:', regionId);
    }
  }, []);

  // Auto-create initial region when audio is ready
  useEffect(() => {
    if (isReady && duration > 0 && allRegions.length === 0) {
      // Create initial region covering the first 5 seconds or full duration if shorter
      const initialEnd = Math.min(5, duration);
      addNewRegion(0, initialEnd);
    }
  }, [isReady, duration, allRegions.length, addNewRegion]);

  // Ensure all regions are inactive when component mounts or regions change
  useEffect(() => {
    if (isReady && allRegions.length > 0) {
      // Set all regions as inactive (green) when regions change
      setTimeout(() => {
        setAllRegionsInactive();
        console.log('🎯 All regions set to inactive (green) on mount/change');
      }, 100);
    }
  }, [isReady, allRegions.length, setAllRegionsInactive]);

  // MutationObserver to watch for new regions and immediately style them
  useEffect(() => {
    if (!isReady || !container) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          console.log('🔍 DOM mutation detected:', mutation.addedNodes.length, 'nodes added');
          mutation.addedNodes.forEach((node, index) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              console.log(`🔍 Checking node ${index + 1}:`, {
                tagName: element.tagName,
                classList: Array.from(element.classList),
                isRegion: element.classList.contains('wavesurfer-region')
              });
              
              if (element.classList.contains('wavesurfer-region')) {
                console.log('🎯 New region detected by MutationObserver!');
                // New region detected, immediately style it as inactive (green)
                setTimeout(() => {
                  console.log('🎨 Styling new region as green...');
                  element.style.background = 'rgba(34, 197, 94, 0.2)';
                  element.style.border = 'none';
                  element.style.outline = 'none';
                  element.style.boxShadow = 'none';
                  element.style.opacity = '0.7';
                  element.classList.remove('active');
                  element.setAttribute('data-status', 'inactive');
                  
                  // Hide handles
                  const handles = element.querySelectorAll('.wavesurfer-region-handle');
                  console.log('🔧 Found handles:', handles.length);
                  handles.forEach((handle: any) => {
                    handle.style.display = 'none';
                  });
                  
                  console.log('✅ New region immediately styled as green (inactive)');
                }, 10);
              }
            }
          });
        }
      });
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [isReady, container]);

  // KONTINUIERLICHER MONITOR: Korrigiere nur wenn activeRegionId gesetzt ist
  useEffect(() => {
    if (!isReady || allRegions.length === 0 || !activeRegionId) return;

    const interval = setInterval(() => {
      const currentRegions = regionsRef.current?.getRegions() || [];
      
      currentRegions.forEach((region: any) => {
        if (region.element) {
          if (region.id === activeRegionId) {
            // AKTIVE REGION - ORANGE
            region.element.style.setProperty('background', 'rgba(255, 78, 58, 0.25)', 'important');
            region.element.style.setProperty('background-color', 'rgba(255, 78, 58, 0.25)', 'important');
            region.element.style.setProperty('border', '2px solid #f97316', 'important');
            region.element.style.setProperty('opacity', '1', 'important');
            region.element.classList.add('active');
          } else {
            // INAKTIVE REGION - ORANGE OHNE RAHMEN
            region.element.style.setProperty('background', 'rgba(255, 78, 58, 0.2)', 'important');
            region.element.style.setProperty('background-color', 'rgba(255, 78, 58, 0.2)', 'important');
            region.element.style.setProperty('border', 'none', 'important');
            region.element.style.setProperty('opacity', '0.7', 'important');
            region.element.classList.remove('active');
          }
        }
      });
    }, 100); // ALLE 100ms korrigieren

    return () => clearInterval(interval);
  }, [isReady, allRegions.length, activeRegionId]);

  const zoom = useCallback((pxPerSec: number) => {
    if (!wsRef.current || !isReady) {
      addDebugLog('Zoom called but WaveSurfer not ready', { 
        hasWaveSurfer: !!wsRef.current, 
        isReady,
        pxPerSec 
      });
      return;
    }
      try {
        wsRef.current.zoom(pxPerSec);
        
        // Force region visual update after manual zoom
        setTimeout(() => {
          forceRegionVisualUpdate();
        }, 100);
        
      } catch (error) {
        addDebugLog('Zoom failed', { error: error.message || error, pxPerSec });
      console.warn('Zoom failed:', error);
    }
  }, [isReady]);

  const play = useCallback(() => {
    if (!wsRef.current) return;
    
    // Mobile-specific play handling
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    window.innerWidth <= 768 || 
                    ('ontouchstart' in window);
    
    if (isMobile) {
      addDebugLog('Mobile play triggered, ensuring audio context is active');
      // Resume audio context for mobile devices
      if (wsRef.current.getMediaElement()) {
        const mediaElement = wsRef.current.getMediaElement();
        if (mediaElement) {
          mediaElement.setAttribute('playsinline', 'true');
          mediaElement.setAttribute('webkit-playsinline', 'true');
          // Force play on mobile
          mediaElement.play().catch(error => {
            addDebugLog('Mobile audio play failed', { error: error.message });
            console.warn('Mobile audio play failed:', error);
          });
        }
      }
    }
    
    wsRef.current.play();
    setCurrentPlayingRegionId(null); // Allgemeine Wiedergabe
  }, []);

  const pause = useCallback(() => {
    wsRef.current?.pause();
    setCurrentPlayingRegionId(null);
  }, []);

  const playRegion = useCallback((region: { start: number; end: number; id: string }) => {
    if (!wsRef.current) return;
    
    // Mobile-specific play handling
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    window.innerWidth <= 768 || 
                    ('ontouchstart' in window);
    
    if (isMobile) {
      addDebugLog('Mobile region play triggered', { region: region.id, start: region.start, end: region.end });
      // Resume audio context for mobile devices
      if (wsRef.current.getMediaElement()) {
        const mediaElement = wsRef.current.getMediaElement();
        if (mediaElement) {
          mediaElement.setAttribute('playsinline', 'true');
          mediaElement.setAttribute('webkit-playsinline', 'true');
          // Force play on mobile
          mediaElement.play().catch(error => {
            addDebugLog('Mobile region audio play failed', { error: error.message, region: region.id });
            console.warn('Mobile region audio play failed:', error);
          });
        }
      }
    }
    
    wsRef.current.play(region.start, region.end);
    setCurrentPlayingRegionId(region.id);
  }, []);

  const pauseRegion = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.pause();
      setCurrentPlayingRegionId(null);
    }
  }, []);

  const playAllRegions = useCallback(async () => {
    if (!wsRef.current || allRegions.length === 0) return;
    
    // Sortiere Regionen nach Start-Zeit
    const sortedRegions = [...allRegions].sort((a, b) => a.start - b.start);
    
    // Spiele alle Regionen nacheinander ab
    for (let i = 0; i < sortedRegions.length; i++) {
      const region = sortedRegions[i];
      setCurrentPlayingRegionId(region.id);
      
      // Warte bis die Region fertig ist
      await new Promise<void>((resolve) => {
        const checkFinished = () => {
          if (!wsRef.current?.isPlaying()) {
            resolve();
          } else {
            setTimeout(checkFinished, 100);
          }
        };
        
        wsRef.current?.play(region.start, region.end);
        setTimeout(checkFinished, 100);
      });
      
      // Kurze Pause zwischen den Regionen
      if (i < sortedRegions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setCurrentPlayingRegionId(null);
  }, [allRegions]);

  const playing = useCallback(() => {
    return isPlaying;
  }, [isPlaying]);

  const setTime = useCallback((t: number) => {
    wsRef.current?.setTime(t);
  }, []);

  const setZoom = useCallback((level: number) => {
    if (!wsRef.current || !isReady) {
      addDebugLog('SetZoom called but WaveSurfer not ready', { 
        hasWaveSurfer: !!wsRef.current, 
        isReady,
        level 
      });
      return;
    }
    try {
      wsRef.current.zoom(level);
    } catch (error) {
      addDebugLog('SetZoom failed', { error: error.message || error, level });
      console.warn('SetZoom failed:', error);
    }
  }, [isReady]);

  const zoomIn = useCallback(() => {
    if (!isReady) {
      addDebugLog('ZoomIn called but WaveSurfer not ready', { isReady, zoomLevel });
      return;
    }
    const newZoom = Math.min(zoomLevel + 100, 1000); // Fester Schritt +100
    setZoom(newZoom);
  }, [zoomLevel, setZoom, isReady]);

  const zoomOut = useCallback(() => {
    if (!isReady) {
      addDebugLog('ZoomOut called but WaveSurfer not ready', { isReady, zoomLevel });
      return;
    }
    const newZoom = Math.max(zoomLevel - 100, 1); // Fester Schritt -100
    setZoom(newZoom);
  }, [zoomLevel, setZoom, isReady]);

  return {
    wavesurfer: wsRef,
    duration,
    selection,
    isReady,
    allRegions,
    zoomLevel,
    currentPlayingRegionId,
    isPlaying,
    activeRegionId,
    addOrReplaceRegion,
    addNewRegion,
    removeRegion,
    removeRegionById,
    updateRegionActiveState,
    setRegionActive,
    setAllRegionsInactive,
    forceRemoveBorders,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    play,
    pause,
    playRegion,
    pauseRegion,
    playAllRegions,
    playing,
    setTime,
  };
}