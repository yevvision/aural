import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';
import { LiquidGlassEffect } from './LiquidGlassEffect';

// Toggle Variants
type ToggleVariant = 'default' | 'pill' | 'segmented';
type ToggleSize = 'sm' | 'md' | 'lg';

interface ToggleProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ToggleVariant;
  size?: ToggleSize;
  children: React.ReactNode;
  active?: boolean;
  onToggle?: (active: boolean) => void;
  disabled?: boolean;
  useLiquidGlass?: boolean;
  liquidGlassIntensity?: number;
  liquidGlassDispersion?: number;
}

/**
 * Toggle Component
 * For binary on/off states and segmented controls
 * Distinct from buttons (actions) and tags (selection)
 */
export const Toggle: React.FC<ToggleProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  active = false,
  onToggle,
  disabled = false,
  useLiquidGlass = false,
  liquidGlassIntensity = 0.02,
  liquidGlassDispersion = 0.008,
  ...props
}) => {
  // Base toggle classes - different from buttons and tags
  const baseClasses = cn(
    'inline-flex items-center justify-center font-normal',
    'transition-all duration-300 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-gradient-strong focus:ring-offset-1',
    'cursor-pointer relative overflow-hidden',
    disabled && 'cursor-not-allowed opacity-50'
  );

  // Size variants - between tags and buttons
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-full min-h-[36px]',
    md: 'px-6 py-3 text-base rounded-full min-h-[44px]',
    lg: 'px-8 py-4 text-lg rounded-full min-h-[52px]'
  };

  // Variant styles
  const variantClasses = {
    default: active
      ? cn(
          'bg-white/20 backdrop-blur-md text-white font-normal',
          'shadow-lg border border-white/30',
          'hover:bg-white/30'
        )
      : cn(
          'bg-white/5 text-text-secondary border border-white/10',
          'hover:bg-white/10 hover:text-text-primary hover:border-white/20'
        ),
    pill: active
      ? cn(
          'bg-white/20 backdrop-blur-md text-white font-normal',
          'shadow-md border border-white/30'
        )
      : cn(
          'bg-surface-secondary text-text-secondary border border-white/10',
          'hover:bg-white/5 hover:text-text-primary'
        ),
    segmented: active
      ? cn(
          'bg-white/20 backdrop-blur-md text-white font-semibold z-10',
          'shadow-lg border border-white/30'
        )
      : cn(
          'bg-transparent text-text-secondary',
          'hover:bg-white/5 hover:text-text-primary'
        )
  };

  const handleClick = () => {
    if (!disabled && onToggle) {
      onToggle(!active);
    }
  };

  const buttonContent = (
    <motion.button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      layout
      {...props}
    >
      {/* Background animation for active state */}
      {active && variant === 'default' && (
        <motion.div
          className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-full opacity-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );

  // Wrap with Liquid Glass Effect if enabled
  if (useLiquidGlass) {
    return (
      <LiquidGlassEffect
        intensity={0.0}
        chromaticDispersion={liquidGlassDispersion}
        mouseTracking={false}
        borderRadius={size === 'sm' ? 18 : size === 'lg' ? 26 : 22}
        backgroundBlur={15}
        className="inline-block"
      >
        {buttonContent}
      </LiquidGlassEffect>
    );
  }

  return buttonContent;
};


// Binary Toggle (Switch-style)
interface BinaryToggleProps {
  active: boolean;
  onToggle: (active: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const BinaryToggle: React.FC<BinaryToggleProps> = ({
  active,
  onToggle,
  disabled = false,
  size = 'md',
  label,
  className
}) => {
  const sizeMap = {
    sm: { track: 'w-10 h-5', thumb: 'w-4 h-4' },
    md: { track: 'w-12 h-6', thumb: 'w-5 h-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6' }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {label && (
        <span className="text-sm font-normal text-text-primary">{label}</span>
      )}
      <motion.button
        className={cn(
          'relative rounded-full border-2 transition-colors duration-200 backdrop-blur-md',
          sizeMap[size].track,
          active
            ? 'bg-white/20 border-white/40'
            : 'bg-surface-secondary border-white/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && onToggle(!active)}
        disabled={disabled}
      >
        <motion.div
          className={cn(
            'absolute top-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm',
            sizeMap[size].thumb
          )}
          animate={{
            x: active ? 'calc(100% + 2px)' : '2px'
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
};

// Multi-Option Toggle with single selection and sliding indicator
interface MultiToggleProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  variant?: ToggleVariant;
  size?: ToggleSize;
  className?: string;
  useLiquidGlass?: boolean;
  liquidGlassIntensity?: number;
  liquidGlassDispersion?: number;
}

export const MultiToggle: React.FC<MultiToggleProps> = ({
  options,
  value,
  onChange,
  variant = 'segmented',
  size = 'md',
  className,
  useLiquidGlass = false,
  liquidGlassIntensity = 0.02,
  liquidGlassDispersion = 0.008
}) => {
  const activeIndex = options.findIndex(option => option.value === value);
  const widthPercentage = 100 / options.length;

  const toggleContent = (
    <div
      className={cn(
        'relative flex rounded-full p-1',
        'w-full max-w-full overflow-hidden', // Ensure proper width constraints
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Sliding solid orange indicator - perfectly centered */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-full z-0"
        style={{
          width: `calc(${widthPercentage}% - 2px)`,
          left: '1px',
          background: '#f97316', // Solid orange background
          border: 'none', // No border for solid look
          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)', // Stronger orange shadow
        }}
        animate={{
          x: `calc(${activeIndex * 100}% + ${activeIndex * 2}px)`
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
      />
      
      {/* Toggle buttons */}
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => !option.disabled && onChange(option.value)}
          disabled={option.disabled}
          className={cn(
            'flex-1 relative z-10 py-2 px-2 sm:px-4 text-xs sm:text-sm font-normal transition-all duration-200 rounded-full',
            'min-w-0 flex-shrink-0 bg-transparent', // Prevent text overflow and ensure equal distribution
            value === option.value
              ? 'text-white font-medium'
              : 'text-text-secondary hover:text-text-primary',
            option.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="truncate">{option.label}</span>
        </button>
      ))}
    </div>
  );

  // Wrap with Liquid Glass Effect if enabled
  if (useLiquidGlass) {
    return (
      <LiquidGlassEffect
        intensity={0.0}
        chromaticDispersion={liquidGlassDispersion}
        mouseTracking={false}
        borderRadius={size === 'sm' ? 20 : size === 'lg' ? 28 : 24}
        backgroundBlur={20}
        className="w-full"
      >
        {toggleContent}
      </LiquidGlassEffect>
    );
  }

  return toggleContent;
};
