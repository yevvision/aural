import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

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
  ...props
}) => {
  // Base toggle classes - different from buttons and tags
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium',
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
          'bg-gradient-primary text-white font-semibold',
          'shadow-primary border-0',
          'glow-primary'
        )
      : cn(
          'bg-white/5 text-text-secondary border border-white/10',
          'hover:bg-white/10 hover:text-text-primary hover:border-white/20'
        ),
    pill: active
      ? cn(
          'bg-gradient-primary text-white font-semibold',
          'shadow-md border-0'
        )
      : cn(
          'bg-surface-secondary text-text-secondary border border-white/10',
          'hover:bg-white/5 hover:text-text-primary'
        ),
    segmented: active
      ? cn(
          'bg-gradient-primary text-white font-semibold z-10',
          'shadow-lg'
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

  return (
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
          className="absolute inset-0 bg-gradient-primary rounded-full opacity-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
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
        <span className="text-sm font-medium text-text-primary">{label}</span>
      )}
      <motion.button
        className={cn(
          'relative rounded-full border-2 transition-colors duration-200',
          sizeMap[size].track,
          active
            ? 'bg-gradient-primary border-gradient-strong'
            : 'bg-surface-secondary border-white/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && onToggle(!active)}
        disabled={disabled}
      >
        <motion.div
          className={cn(
            'absolute top-0.5 rounded-full bg-white shadow-sm',
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
}

export const MultiToggle: React.FC<MultiToggleProps> = ({
  options,
  value,
  onChange,
  variant = 'segmented',
  size = 'md',
  className
}) => {
  const activeIndex = options.findIndex(option => option.value === value);
  const widthPercentage = 100 / options.length;

  return (
    <div
      className={cn(
        'relative flex bg-surface-secondary/20 rounded-full p-1 backdrop-blur-sm border border-white/10',
        className
      )}
    >
      {/* Sliding orange indicator - perfectly centered */}
      <motion.div
        className="absolute top-1 bottom-1 bg-gradient-primary rounded-full shadow-md"
        style={{
          width: `calc(${widthPercentage}% - 2px)`,
          left: '1px'
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
            'flex-1 relative z-10 py-2 px-4 text-sm font-medium transition-all duration-200 rounded-full',
            value === option.value
              ? 'text-white'
              : 'text-text-secondary hover:text-text-primary',
            option.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
