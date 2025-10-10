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
};

export function useWaveformEditor({ container, audioBlob, barWidth = 2, height = 200 }: UseWaveformEditorOpts) {
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

  // Debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`🔍 useWaveformEditor: ${logMessage}`, data || '');
  };

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
        // Better touch handling
        backend: isMobile ? 'WebAudio' : 'MediaElement',  // WebAudio auf Mobile für bessere Performance
        mediaControls: false,
        // Enhanced mobile touch support
        cursorWidth: isMobile ? 2 : 3,            // Dünnerer Cursor auf Mobile
        hideScrollbar: true,
        // Drag Selection für Touch-Screens aktivieren
        dragSelection: true,       // Ermöglicht Drag-to-Select auf Touch-Screens
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
      const regions = ws.registerPlugin(RegionsPlugin.create({
        // Mobile-optimierte Region-Konfiguration
        dragSelection: {
          slop: 5, // Größerer Bereich für Touch-Selection
        },
        regions: {
          // Griffe: 24px breit und hoch, 50% über Kante, orange, kein Border, kein Springen
          handleStyle: {
            left: {
              backgroundColor: '#f97316',
              border: 'none',
              borderRadius: '3px',
              width: '24px',
              height: '24px',
              cursor: 'col-resize',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
            right: {
              backgroundColor: '#f97316',
              border: 'none',
              borderRadius: '3px',
              width: '24px',
              height: '24px',
              cursor: 'col-resize',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }
          },
          // Mindestlänge für Touch-Bedienung
          minLength: 0.5, // 0.5 Sekunden Minimum
          // Orange Region-Markierung wie die Buttons
          color: 'rgba(249, 115, 22, 0.25)',
          border: '2px solid #f97316',
          borderRadius: '4px',
        }
      }));

      // Zoom plugin für Schieberegler-Steuerung
      const zoom = ws.registerPlugin(ZoomPlugin.create({
        scale: 0.5, // 50% Vergrößerung pro Scroll-Schritt
        maxZoom: 1000, // Maximale Zoom-Stufe
      }));

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
        }

        /* Cursor Styling - rot */
        .wavesurfer-container ::part(cursor) {
          height: 180px;
          width: 3px;
          background: #c9242c;
        }

        /* Region-Markierung - orange wie die Buttons */
        .wavesurfer-container ::part(region) {
          background-color: rgba(249, 115, 22, 0.25) !important;
          border: 2px solid #f97316 !important;
          border-radius: 4px !important;
        }

        /* Region-Handles - 24px breit und hoch, 50% über Kante, vertikal mittig, orange */
        .wavesurfer-container ::part(region-handle-left),
        .wavesurfer-container ::part(region-handle-right) {
          width: 24px !important;
          height: 24px !important;
          background: #f97316 !important;
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
          background: #f97316 !important;
          box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4) !important;
        }

        /* Active/Click-Zustand - verhindert Springen, orange */
        .wavesurfer-container ::part(region-handle-left):active,
        .wavesurfer-container ::part(region-handle-right):active {
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: #f97316 !important;
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

        /* Region Hover-Effekt */
        .wavesurfer-container ::part(region):hover {
          background-color: rgba(249, 115, 22, 0.4) !important;
          border-color: #ea580c !important;
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.3) !important;
        }

        /* Active State für Touch */
        .wavesurfer-container ::part(region-handle-left):active,
        .wavesurfer-container ::part(region-handle-right):active {
          background: #e5e7eb !important;
          transform: scale(1.05) !important;
        }

        /* Scrollbar Styling - blau */
        .wavesurfer-container ::part(scroll) {
          background: transparent !important;
          height: 100% !important;
          border-radius: 4px !important;
        }

        /* Fallback für ältere Browser - direkte Klassen */
        .wavesurfer-region {
          background: rgba(249, 115, 22, 0.25) !important;
          border: 2px solid #f97316 !important;
          border-radius: 4px !important;
        }
        
        .wavesurfer-region-handle {
          width: 24px !important;
          height: 24px !important;
          background: #f97316 !important;
          border: none !important;
          border-radius: 3px !important;
          cursor: col-resize !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        /* Fallback-Positionierung für ältere Browser */
        .wavesurfer-region-handle-left {
          left: -12px !important;
        }
        
        .wavesurfer-region-handle-right {
          right: -12px !important;
        }

        /* Timeline Styling */
        .wavesurfer-container ::part(timeline) {
          color: #9ca3af !important;
          font-size: 12px !important;
          font-family: monospace !important;
        }
        
        .wavesurfer-container ::part(timeline-marker) {
          color: #6b7280 !important;
        }
      `;
      document.head.appendChild(style);
      
      // Touch: regions are draggable/resizable by default
      regions.on('region-created', (r: any) => {
        console.log('Region created:', r);
        const newRegion = { start: r.start, end: r.end, id: r.id };
        setAllRegions(prev => [...prev, newRegion]);
        setSelection({ start: r.start, end: r.end });
        
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
      });
      
      // Touch-optimierte Drag Selection
      regions.on('region-clicked', (r: any, e: MouseEvent) => {
        e.stopPropagation();
        console.log('Region clicked (touch-friendly):', r);
        setSelection({ start: r.start, end: r.end });
        // Haptic Feedback für Touch
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      });
      regions.on('region-removed', (r: any) => {
        console.log('Region removed:', r);
        setAllRegions(prev => prev.filter(region => region.id !== r.id));
      });

      // Zoom-Event-Listener für Schieberegler
      ws.on('zoom', (minPxPerSec: number) => {
        setZoomLevel(minPxPerSec);
        console.log('Zoom changed to:', minPxPerSec, 'px/sec');
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
          ws.zoom(pixelsPerSecond);
          setZoomLevel(pixelsPerSecond);
          
          const initialRegion = regions.addRegion({
            start: 0,
            end: validDuration,
            color: 'rgba(249, 115, 22, 0.25)',
            border: '2px solid #f97316'
          });
          console.log('Initial region created for entire duration:', validDuration);
          console.log('Zoom set to show entire audio:', pixelsPerSecond, 'px/sec');
          setAllRegions([{ start: 0, end: validDuration, id: initialRegion.id }]);
          setSelection({ start: 0, end: validDuration });
          
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
            addDebugLog('Audio validation timeout after 20 seconds');
            reject(new Error('Audio loading timeout'));
          }, 20000);
          
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
      color: 'rgba(249, 115, 22, 0.4)', // Helleres Orange mit mehr Deckkraft
      drag: true,
      resize: true,
    });
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
      color: 'rgba(249, 115, 22, 0.4)', // Helleres Orange mit mehr Deckkraft
      drag: true,
      resize: true,
    });
    
    console.log('Added new region:', { start: s, end: e, id: region.id });
    setSelection({ start: s, end: e });
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

  const zoom = useCallback((pxPerSec: number) => {
    if (!wsRef.current) return;
    wsRef.current.zoom(pxPerSec);
  }, []);

  const play = useCallback(() => {
    wsRef.current?.play();
    setCurrentPlayingRegionId(null); // Allgemeine Wiedergabe
  }, []);

  const pause = useCallback(() => {
    wsRef.current?.pause();
    setCurrentPlayingRegionId(null);
  }, []);

  const playRegion = useCallback((region: { start: number; end: number; id: string }) => {
    if (wsRef.current) {
      wsRef.current.play(region.start, region.end);
      setCurrentPlayingRegionId(region.id);
    }
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
    if (wsRef.current) {
      wsRef.current.zoom(level);
    }
  }, []);

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 100, 1000); // Fester Schritt +100
    setZoom(newZoom);
  }, [zoomLevel, setZoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 100, 1); // Fester Schritt -100
    setZoom(newZoom);
  }, [zoomLevel, setZoom]);

  return {
    wavesurfer: wsRef,
    duration,
    selection,
    isReady,
    allRegions,
    zoomLevel,
    currentPlayingRegionId,
    isPlaying,
    addOrReplaceRegion,
    addNewRegion,
    removeRegion,
    removeRegionById,
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