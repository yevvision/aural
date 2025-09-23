import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Helper functions
const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const toRGBA = (h: number, s: number, l: number, a = 1) => {
  // h[0..360], s/l [0..100]
  h = (h % 360 + 360) % 360;
  s = clamp(s, 0, 100);
  l = clamp(l, 0, 100);
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const X = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = X; b = 0; }
  else if (h < 120) { r = X; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = X; }
  else if (h < 240) { r = 0; g = X; b = c; }
  else if (h < 300) { r = X; g = 0; b = c; }
  else { r = c; g = 0; b = X; }
  return `rgba(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)},${a})`;
};

// Smooth noise for organic drift
const n1 = (t: number, seed: number) => Math.sin(t * 0.9 + seed * 1.7) * 0.6 + Math.sin(t * 0.53 + seed * 3.1) * 0.4;

// Blob creator
const makeBlob = (x: number, y: number, r: number, sx: number, sy: number, rot: number, h: number, s: number, l: number, a: number) => 
  ({ x, y, r, sx, sy, rot, h, s, l, a });

// State definitions (6 states, each with 12 blobs)
// State 0: Komplett schwarz (für Aufnahme)
const state0 = () => {
  // Create 12 blobs with zero alpha and minimal size so they do not render
  const arr = [];
  for(let i=0;i<12;i++){
    arr.push(makeBlob(0.5, 0.5, 0.1, 1, 1, 0, 0, 0, 10, 0));
  }
  return arr;
};

// State 4: News-Hintergrund - Große rot-orange Inseln unten, dunkle Bereiche oben (aus HTML State 3)
const state4 = () => [
  // Dunkle obere Bereiche (mobile portrait)
  makeBlob(0.50,0.05,0.90, 2.0,0.6, 0.00, 8,30,2,0.95),
  makeBlob(0.20,0.08,0.60, 1.5,1.0, 0.00, 6,25,1,0.90),
  makeBlob(0.80,0.08,0.60, 1.5,1.0, 0.00, 7,35,2,0.90),
  // Große rot-orange Insel unten
  makeBlob(0.50,0.70,0.80, 1.6,1.2, 0.00, 12,85,50,0.90),
  // Rot-orange Inseln
  makeBlob(0.30,0.45,0.50, 1.3,1.1, 0.00, 14,80,45,0.85),
  makeBlob(0.70,0.55,0.45, 1.2,1.0, 0.00, 10,85,48,0.88),
  makeBlob(0.20,0.60,0.40, 1.1,1.2, 0.00, 16,75,42,0.80),
  makeBlob(0.80,0.40,0.40, 1.1,1.2, 0.00, 15,80,45,0.80),
  // Dunkle untere Bereiche (mobile portrait)
  makeBlob(0.50,0.95,0.90, 2.0,0.6, 0.00, 8,30,2,0.95),
  makeBlob(0.15,0.92,0.50, 1.2,1.0, 0.00, 6,25,1,0.90),
  makeBlob(0.85,0.92,0.50, 1.2,1.0, 0.00, 7,35,2,0.90),
  // Kleine Highlights
  makeBlob(0.50,0.30,0.20, 1.0,1.0, 0.00, 15,80,35,0.70),
];

// State 5: Mobile-optimiert - Rot-orange Keil unten-rechts mit dunklen Rändern (für /profile)
const state5 = () => [
  // Dunkle obere Bereiche (mobile portrait)
  makeBlob(0.50,0.05,0.90, 2.0,0.6, 0.00, 8,30,2,0.95),
  makeBlob(0.20,0.08,0.60, 1.5,1.0, 0.00, 6,25,1,0.90),
  makeBlob(0.80,0.08,0.60, 1.5,1.0, 0.00, 7,35,2,0.90),
  // Rot-orange Keil unten-rechts
  makeBlob(0.75,0.85,0.80, 1.6,1.3, 0.00, 12,85,50,0.90),
  // Große rot-orange Fläche links
  makeBlob(0.30,0.50,0.70, 1.4,1.2, 0.00, 14,80,45,0.85),
  // Orange Akzente
  makeBlob(0.50,0.60,0.50, 1.3,1.1, 0.00, 16,75,48,0.88),
  makeBlob(0.40,0.40,0.45, 1.2,1.0, 0.00, 18,70,42,0.80),
  makeBlob(0.60,0.70,0.40, 1.1,1.2, 0.00, 15,80,45,0.80),
  // Dunkle untere Bereiche (mobile portrait)
  makeBlob(0.50,0.95,0.90, 2.0,0.6, 0.00, 8,30,2,0.95),
  makeBlob(0.15,0.92,0.50, 1.2,1.0, 0.00, 6,25,1,0.90),
  makeBlob(0.85,0.92,0.50, 1.2,1.0, 0.00, 7,35,2,0.90),
  // Kleine Highlights
  makeBlob(0.50,0.30,0.20, 1.0,1.0, 0.00, 15,80,35,0.70),
];

// State 6: Mobile-optimiert - Rot-orange zentrale Komposition mit dunklen Rändern (für Startseite)
const state6 = () => [
  // Dunkle obere Bereiche (mobile portrait)
  makeBlob(0.50,0.05,0.80, 2.0,0.8, 0.00, 8,30,2,0.95),
  makeBlob(0.20,0.08,0.60, 1.5,1.0, 0.00, 6,25,1,0.90),
  makeBlob(0.80,0.08,0.60, 1.5,1.0, 0.00, 7,35,2,0.90),
  // Zentraler rot-orange Bereich
  makeBlob(0.50,0.50,0.70, 1.4,1.2, 0.00, 12,85,50,0.90),
  makeBlob(0.35,0.45,0.50, 1.2,1.0, -0.20, 14,80,45,0.85),
  makeBlob(0.65,0.55,0.45, 1.3,1.1, 0.15, 10,85,48,0.88),
  // Orange Akzente
  makeBlob(0.25,0.35,0.35, 1.1,1.2, 0.00, 16,75,40,0.80),
  makeBlob(0.75,0.65,0.35, 1.1,1.2, 0.00, 18,70,42,0.80),
  // Dunkle untere Bereiche (mobile portrait)
  makeBlob(0.50,0.95,0.80, 2.0,0.8, 0.00, 8,30,2,0.95),
  makeBlob(0.15,0.92,0.50, 1.2,1.0, 0.00, 6,25,1,0.90),
  makeBlob(0.85,0.92,0.50, 1.2,1.0, 0.00, 7,35,2,0.90),
  // Kleine Highlights
  makeBlob(0.50,0.25,0.20, 1.0,1.0, 0.00, 15,80,35,0.70),
];

// State 13 entfernt - nicht verwendet

// State 1: Komplett schwarz (aus HTML State 1) - für /news
// State 1 entfernt - nicht verwendet

// Nur die tatsächlich verwendeten States
const states = [state0(), state5(), state6()];

export const OrganicOrangeMorphBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const location = useLocation();
  const currentRef = useRef(states[0].map(b => ({ ...b }))); // Initialize with black screen (state 0)
  const targetRef = useRef(states[0].map(b => ({ ...b }))); // Initialize with black screen (state 0)
  const transStartRef = useRef(0);
  const transDurRef = useRef(1600); // ms
  const animationRef = useRef<number>(0);
  const t0Ref = useRef(performance.now());
  const initialLoadRef = useRef(true); // Track initial page load
  const [isBackgroundReady, setIsBackgroundReady] = useState(false); // Track background readiness

  // Map routes to background states (3 states for different pages)
  const getStateIndex = () => {
    // State 0: Schwarzer Hintergrund (für Record, Audio Editor, Upload, Search, Player)
    // State 1: State 5 - Profile (Keil mit großer Fläche)
    // State 2: State 6 - Startseite (zentrale Komposition)
    
    if (location.pathname === '/') return 2; // Startseite -> State 6 (zentrale Komposition)
    if (location.pathname.startsWith('/profile')) return 1; // Profile -> State 5 (Keil mit großer Fläche)
    if (location.pathname.startsWith('/record')) return 0; // Record -> State 0 (schwarzer Hintergrund)
    if (location.pathname.startsWith('/audio-editor')) return 0; // Audio Editor -> State 0 (schwarzer Hintergrund)
    if (location.pathname.startsWith('/upload')) return 0; // Upload -> State 0 (schwarzer Hintergrund)
    if (location.pathname.startsWith('/search')) return 0; // Search -> State 0 (schwarzer Hintergrund)
    if (location.pathname.startsWith('/player') || location.pathname.startsWith('/aufnahme')) return 0; // Player/Aufnahme -> State 0 (schwarz)
    return 2; // default to State 6 (Startseite)
  };

  // Change state smoothly from wherever we are
  const goTo = (index: number) => {
    const idx = Math.max(0, Math.min(states.length - 1, index | 0));
    // Snapshot current
    snapshotCurrent();
    targetRef.current = states[idx].map(b => ({ ...b }));
    transStartRef.current = performance.now();
  };

  // Sample eased interpolation at now to keep continuity
  const snapshotCurrent = () => {
    const now = performance.now();
    const tt = clamp((now - transStartRef.current) / transDurRef.current, 0, 1);
    const e = easeInOutCubic(tt);
    for (let i = 0; i < currentRef.current.length; i++) {
      const c = currentRef.current[i];
      const g = targetRef.current[i];
      c.x = lerp(c.x, g.x, e);
      c.y = lerp(c.y, g.y, e);
      c.r = lerp(c.r, g.r, e);
      c.sx = lerp(c.sx, g.sx, e);
      c.sy = lerp(c.sy, g.sy, e);
      c.rot = lerp(c.rot, g.rot, e);
      c.h = lerp(c.h, g.h, e);
      c.s = lerp(c.s, g.s, e);
      c.l = lerp(c.l, g.l, e);
      c.a = lerp(c.a, g.a, e);
    }
    transStartRef.current = now;
  };

  // Draw one blob
  const drawBlob = (ctx: CanvasRenderingContext2D, b: any, time: number, W: number, H: number, isMobile: boolean) => {
    // Organic drift amplitude
    const driftAmp = 0.012;
    const ox = driftAmp * n1(time * 0.0007, 3.7 + b.h * 0.1);
    const oy = driftAmp * n1(time * 0.0009, -1.2 + b.s * 0.1);
    const x = (b.x + ox) * W;
    const y = (b.y + oy) * H;
    
    // Universal mobile optimization: prevent squashing on all mobile devices
    // Use aspect ratio to determine the best base calculation
    const aspectRatio = W / H;
    const isPortrait = aspectRatio < 1;
    
    let base;
    if (isMobile) {
      if (isPortrait) {
        // Portrait mode: use width as primary dimension to prevent horizontal squashing
        base = W * 0.8;
      } else {
        // Landscape mode: use height as primary dimension
        base = H * 0.8;
      }
    } else {
      base = Math.min(W, H);
    }
    const r = b.r * base;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.rot);
    
    // Universal mobile optimization: reduce extreme scaling to prevent squashing
    if (isMobile) {
      // More conservative scaling limits for mobile devices
      const maxScale = 1.5; // Reduced from 2.0
      const minScale = 0.7; // Increased from 0.5
      
      // Apply different limits based on orientation
      const aspectRatio = W / H;
      const isPortrait = aspectRatio < 1;
      
      let sx, sy;
      if (isPortrait) {
        // Portrait: limit horizontal scaling more aggressively
        sx = Math.max(minScale, Math.min(maxScale * 0.8, b.sx));
        sy = Math.max(minScale, Math.min(maxScale, b.sy));
      } else {
        // Landscape: limit vertical scaling more aggressively
        sx = Math.max(minScale, Math.min(maxScale, b.sx));
        sy = Math.max(minScale, Math.min(maxScale * 0.8, b.sy));
      }
      ctx.scale(sx, sy);
    } else {
      ctx.scale(b.sx, b.sy);
    }

    // Radial gradient (inner -> outer)
    // Reduce lightness offsets to prevent near‑white highlights. Previously +20/+5/-25
    // produced very bright areas. Now use +7/+2/-18 to cap brightness around #f4b16c.
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, toRGBA(b.h, b.s, clamp(b.l + 7, 0, 100), b.a * 0.95));
    grad.addColorStop(0.25, toRGBA(b.h, b.s, clamp(b.l + 2, 0, 100), b.a * 0.90));
    grad.addColorStop(1, toRGBA(b.h, b.s, clamp(b.l - 18, 0, 100), 0));

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Draw vignette
  const drawVignette = (ctx: CanvasRenderingContext2D, W: number, H: number, isMobile: boolean) => {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    
    // Mobile optimization: adjust vignette for better proportions
    const centerX = W * 0.5;
    const centerY = isMobile ? H * 0.5 : H * 0.55; // Center vertically on mobile
    const innerRadius = isMobile ? Math.sqrt(W * H) * 0.4 : Math.min(W, H) * 0.3;
    const outerRadius = isMobile ? Math.sqrt(W * H) * 1.2 : Math.max(W, H) * 0.9;
    
    const g = ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, outerRadius
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  // Main animation loop
  const loop = (now: number) => {
    const dt = now - t0Ref.current;
    t0Ref.current = now;

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PR = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    
    // Detect iOS Chrome for special handling
    const isIOSChrome = /CriOS/.test(navigator.userAgent) || 
                       (/iPhone|iPad|iPod/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent));
    
    // Mobile optimization: limit device pixel ratio to prevent excessive scaling
    const isMobile = W < 768 || H < 768;
    const effectivePR = isMobile ? Math.min(PR, isIOSChrome ? 1.5 : 2) : PR; // Even lower DPR for iOS Chrome
    
    canvas.width = Math.round(W * effectivePR);
    canvas.height = Math.round(H * effectivePR);
    ctx.setTransform(effectivePR, 0, 0, effectivePR, 0, 0);

    // Compute interpolation fraction
    const tt = clamp((now - transStartRef.current) / transDurRef.current, 0, 1);
    const e = easeInOutCubic(tt);

    // Clear & apply blur
    ctx.clearRect(0, 0, W, H);
    // Universal mobile blur optimization
    const aspectRatio = W / H;
    const isPortrait = aspectRatio < 1;
    
    let blurPx;
    if (isMobile) {
      if (isPortrait) {
        // Portrait mode: use width-based blur to prevent horizontal stretching
        blurPx = W * 0.05;
      } else {
        // Landscape mode: use height-based blur
        blurPx = H * 0.05;
      }
    } else {
      blurPx = Math.max(W, H) * 0.14;
    }
    ctx.filter = `blur(${blurPx}px)`;

    // Draw blobs with interpolation
    for (let i = 0; i < currentRef.current.length; i++) {
      const c = currentRef.current[i];
      const g = targetRef.current[i];
      // Update current state by interpolation
      c.x = lerp(c.x, g.x, e);
      c.y = lerp(c.y, g.y, e);
      c.r = lerp(c.r, g.r, e);
      c.sx = lerp(c.sx, g.sx, e);
      c.sy = lerp(c.sy, g.sy, e);
      c.rot = lerp(c.rot, g.rot, e);
      c.h = lerp(c.h, g.h, e);
      c.s = lerp(c.s, g.s, e);
      c.l = lerp(c.l, g.l, e);
      c.a = lerp(c.a, g.a, e);

      drawBlob(ctx, c, now, W, H, isMobile);
    }
    ctx.filter = 'none';

    drawVignette(ctx, W, H, isMobile);

    animationRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    // Immediately set background as ready and transition to the correct state
    setIsBackgroundReady(true);
    
    // Only transition after initial render
    if (initialLoadRef.current) {
      // Set transition duration for initial animation
      transDurRef.current = 2000; // 2 seconds for initial transition
      
      // Immediately transition to the actual state without delay
      const stateIndex = getStateIndex();
      goTo(stateIndex);
      initialLoadRef.current = false; // Reset the initial load flag
    } else {
      // Normal transition for subsequent route changes
      transDurRef.current = 1600; // Reset to normal transition speed
      const stateIndex = getStateIndex();
      goTo(stateIndex);
    }
  }, [location.pathname]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(loop);
    
    // Debounce resize events to prevent flickering
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      // Check if mobile for debounce timing
      const isMobileResize = window.innerWidth < 768 || window.innerHeight < 768;
      resizeTimeout = setTimeout(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const PR = window.devicePixelRatio || 1;
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        
        // Mobile optimization: limit device pixel ratio to prevent excessive scaling
        const isMobileResize = W < 768 || H < 768;
        const effectivePR = isMobileResize ? Math.min(PR, 2) : PR; // Cap at 2x on mobile
        
        // Only resize if dimensions actually changed
        const newWidth = Math.round(W * effectivePR);
        const newHeight = Math.round(H * effectivePR);
        
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          // For mobile, skip content preservation to avoid performance issues
          if (isMobileResize) {
            canvas.width = newWidth;
            canvas.height = newHeight;
          } else {
            // Preserve the current canvas content before resizing (desktop only)
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Save current content
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Resize canvas
              canvas.width = newWidth;
              canvas.height = newHeight;
              
              // Restore content with scaling
              if (imageData.width > 0 && imageData.height > 0) {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                  tempCanvas.width = imageData.width;
                  tempCanvas.height = imageData.height;
                  tempCtx.putImageData(imageData, 0, 0);
                  
                  // Scale and draw the preserved content
                  ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
                }
              }
            }
          }
        }
      }, isMobileResize ? 100 : 16); // Longer debounce on mobile for better performance
    };
    
    const resizeObserver = new ResizeObserver(handleResize);
    
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="morph-background-canvas"
      className="fixed inset-0 w-full h-full z-0"
      style={{ 
        background: '#000000',
        imageRendering: 'auto',
        willChange: 'transform',
        // Mobile optimizations
        WebkitTransform: 'translateZ(0)', // Hardware acceleration
        transform: 'translateZ(0)', // Hardware acceleration
        backfaceVisibility: 'hidden', // Prevent flickering
        WebkitBackfaceVisibility: 'hidden' // Safari support
      }} // True black background with optimized rendering
    />
  );
};