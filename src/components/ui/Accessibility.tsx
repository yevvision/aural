import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

// Screen Reader Only Component
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
};

// Skip Navigation Link
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="absolute -top-10 left-1/2 transform -translate-x-1/2 
                 bg-gradient-primary text-white px-4 py-2 rounded-md
                 focus:top-4 transition-all duration-200 z-[100]
                 focus:outline-none focus:ring-2 focus:ring-gradient-strong focus:ring-offset-2"
    >
      {children}
    </a>
  );
};

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ 
  children, 
  isActive, 
  className 
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const firstFocusableRef = React.useRef<HTMLElement>(null);
  const lastFocusableRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0] as HTMLElement;
      lastFocusableRef.current = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      firstFocusableRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Accessible Button with proper ARIA
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  pressed?: boolean; // For toggle buttons
  expanded?: boolean; // For expandable buttons
  controls?: string; // aria-controls
  describedBy?: string; // aria-describedby
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  loading = false,
  pressed,
  expanded,
  controls,
  describedBy,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'focus-visible',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-describedby={describedBy}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <ScreenReaderOnly>Loading...</ScreenReaderOnly>
      )}
      {children}
    </button>
  );
};

// Live Region for Dynamic Content
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false,
  className
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
};

// Accessible Audio Player Controls
interface AccessibleAudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  trackTitle?: string;
  className?: string;
}

export const AccessibleAudioControls: React.FC<AccessibleAudioControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  trackTitle,
  className
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const [announceTime, setAnnounceTime] = React.useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    onSeek(newTime);
    setAnnounceTime(true);
    setTimeout(() => setAnnounceTime(false), 1000);
  };

  return (
    <div className={cn('space-y-4', className)} role="region" aria-label="Audio player controls">
      {trackTitle && (
        <h3 className="font-medium text-text-primary" id="track-title">
          Now playing: {trackTitle}
        </h3>
      )}
      
      <div className="flex items-center space-x-4">
        <AccessibleButton
          onClick={onTogglePlay}
          aria-label={isPlaying ? `Pause ${trackTitle || 'audio'}` : `Play ${trackTitle || 'audio'}`}
          aria-describedby={trackTitle ? 'track-title' : undefined}
          className="w-12 h-12 rounded-full bg-gradient-primary text-white"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </AccessibleButton>

        <div className="flex-1 space-y-2">
          <label htmlFor="audio-progress" className="sr-only">
            Audio progress: {formatTime(currentTime)} of {formatTime(duration)}
          </label>
          <input
            id="audio-progress"
            type="range"
            min="0"
            max="100"
            value={progressPercent}
            onChange={handleProgressChange}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-gradient-primary
                       [&::-webkit-slider-thumb]:cursor-pointer"
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          />
          <div className="flex justify-between text-sm text-text-secondary" aria-hidden="true">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {announceTime && (
        <LiveRegion>
          Seeked to {formatTime(currentTime)}
        </LiveRegion>
      )}
    </div>
  );
};

// Accessible Modal Dialog
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <FocusTrap isActive={isOpen}>
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            'relative bg-surface-primary rounded-xl shadow-glass max-w-md w-full mx-4',
            'focus:outline-none',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <div className="p-6">
            <h2 id={titleId} className="text-xl font-bold text-text-primary mb-4">
              {title}
            </h2>
            {children}
            <div className="mt-6 flex justify-end space-x-3">
              <AccessibleButton
                onClick={onClose}
                className="px-4 py-2 text-text-secondary hover:text-text-primary"
              >
                Close
              </AccessibleButton>
            </div>
          </div>
        </motion.div>
      </FocusTrap>
    </motion.div>
  );
};

// Accessible Form Field
interface AccessibleFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactElement;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  children
}) => {
  const fieldId = React.useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const childProps = {
    id: fieldId,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': [
      hint && hintId,
      error && errorId
    ].filter(Boolean).join(' ') || undefined
  };

  return (
    <div className="space-y-2">
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-text-primary"
      >
        {label}
        {required && (
          <span className="text-gradient-strong ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-text-secondary">
          {hint}
        </p>
      )}
      
      {React.cloneElement(children, childProps)}
      
      {error && (
        <p id={errorId} className="text-sm text-gradient-deep" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Performance Optimized Image with Lazy Loading
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback = '/placeholder.jpg',
  className,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setImageSrc(fallback);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-surface-secondary animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        {...props}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
          <span className="text-text-tertiary text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};