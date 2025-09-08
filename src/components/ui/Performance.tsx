import React from 'react';
import { motion } from 'framer-motion';

// Virtualized List for Performance
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className = '',
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Intersection Observer Hook for Lazy Loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  { threshold = 0, root = null, rootMargin = '0%' } = {}
) => {
  const [entry, setEntry] = React.useState<IntersectionObserverEntry>();

  React.useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, threshold, root, rootMargin]);

  return entry;
};

// Lazy Loaded Component
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <div className="animate-pulse bg-surface-secondary h-20 rounded" />,
  className = '',
  rootMargin = '100px'
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(ref, { rootMargin });
  const isVisible = !!entry?.isIntersecting;

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Debounced Input Hook
export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled Function Hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = React.useRef(Date.now());

  return React.useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Optimized Audio Waveform
interface OptimizedWaveformProps {
  audioData?: Float32Array;
  width?: number;
  height?: number;
  bars?: number;
  isPlaying?: boolean;
  progress?: number;
  className?: string;
}

export const OptimizedWaveform: React.FC<OptimizedWaveformProps> = React.memo(({
  audioData,
  width = 300,
  height = 60,
  bars = 50,
  isPlaying = false,
  progress = 0,
  className = ''
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationRef = React.useRef<number | undefined>(undefined);

  const waveformData = React.useMemo(() => {
    if (audioData) {
      const samplesPerBar = Math.floor(audioData.length / bars);
      return Array.from({ length: bars }, (_, i) => {
        const start = i * samplesPerBar;
        const end = start + samplesPerBar;
        const slice = audioData.slice(start, end);
        return slice.reduce((sum, val) => sum + Math.abs(val), 0) / slice.length;
      });
    }
    return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
  }, [audioData, bars]);

  const draw = React.useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / bars;
    const activeBarIndex = Math.floor(progress * bars);

    waveformData.forEach((amplitude, index) => {
      const isActive = isPlaying && index <= activeBarIndex;
      const barHeight = amplitude * height * 0.8;
      
      // Add slight animation to active bars
      const animatedHeight = isActive && isPlaying
        ? barHeight * (0.8 + 0.2 * Math.sin(timestamp * 0.005 + index * 0.2))
        : barHeight;

      ctx.fillStyle = isActive ? '#FF6A3A' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(
        index * barWidth + barWidth * 0.1,
        height - animatedHeight,
        barWidth * 0.8,
        animatedHeight
      );
    });

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [waveformData, width, height, bars, isPlaying, progress]);

  React.useEffect(() => {
    draw(0);
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ width, height }}
    />
  );
});

OptimizedWaveform.displayName = 'OptimizedWaveform';

// Memory Efficient Image Gallery
interface ImageGalleryProps {
  images: Array<{ src: string; alt: string; id: string }>;
  onImageClick?: (id: string) => void;
  className?: string;
}

export const MemoryEfficientGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImageClick,
  className = ''
}) => {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());

  const handleImageLoad = React.useCallback((id: string) => {
    setLoadedImages(prev => new Set(prev).add(id));
  }, []);

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {images.map((image, index) => (
        <LazyComponent key={image.id} rootMargin="200px">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="aspect-square rounded-lg overflow-hidden bg-surface-secondary cursor-pointer"
            onClick={() => onImageClick?.(image.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              onLoad={() => handleImageLoad(image.id)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                loadedImages.has(image.id) ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!loadedImages.has(image.id) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gradient-strong border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        </LazyComponent>
      ))}
    </div>
  );
};

// Optimized Search Component
interface OptimizedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const OptimizedSearch: React.FC<OptimizedSearchProps> = ({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  className = ''
}) => {
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  React.useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2 bg-surface-secondary text-text-primary 
                 border border-white/10 rounded-lg focus:border-gradient-strong 
                 focus:outline-none transition-colors ${className}`}
    />
  );
};

// Efficient Animation Manager
interface AnimationManagerProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export const AnimationManager: React.FC<AnimationManagerProps> = ({
  children,
  disabled = false
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const shouldDisableAnimations = disabled || prefersReducedMotion;

  return (
    <div data-animations-disabled={shouldDisableAnimations}>
      {children}
    </div>
  );
};

// Battery Status Hook for Performance Optimization
export const useBatteryStatus = () => {
  const [batteryLevel, setBatteryLevel] = React.useState<number | null>(null);
  const [isCharging, setIsCharging] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);

        const updateBatteryInfo = () => {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
        };

        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);

        return () => {
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
        };
      });
    }
  }, []);

  return { batteryLevel, isCharging };
};

// Performance-aware component wrapper
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.memo((props: P) => {
    const { batteryLevel } = useBatteryStatus();
    const isLowBattery = batteryLevel !== null && batteryLevel < 0.2;

    return (
      <AnimationManager disabled={isLowBattery}>
        <Component {...props} />
      </AnimationManager>
    );
  });
};