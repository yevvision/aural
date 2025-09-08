import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

// Button Variants
type ButtonVariant = 'primary' | 'glass' | 'voice' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Primary Button Component
 * Implements the Aural Design System button specifications
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled = false,
  loading = false,
  fullWidth = false,
  ...props
}) => {
  // Base button classes
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium',
    'transition-all duration-200 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-gradient-strong focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'touch-target',
    fullWidth && 'w-full'
  );

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px]',
    md: 'px-6 py-3 text-base rounded-xl min-h-[44px]',
    lg: 'px-8 py-4 text-lg rounded-xl min-h-[52px]',
    xl: 'px-10 py-5 text-xl rounded-2xl min-h-[60px]'
  };

  // Variant styles
  const variantClasses = {
    primary: cn(
      'bg-gradient-primary text-white font-semibold',
      'shadow-primary border-0',
      'hover:bg-gradient-primary-hover hover:shadow-primary-hover hover:-translate-y-0.5',
      'active:scale-[0.98]',
      'glow-primary'
    ),
    glass: cn(
      'glass-button text-white font-medium',
      'border border-surface-glass-border',
      'hover:bg-white/10 hover:border-white/30',
      'active:scale-[0.98]'
    ),
    voice: cn(
      'bg-gradient-primary text-white font-bold',
      'rounded-full aspect-square p-0',
      'shadow-voice border-0',
      'hover:bg-gradient-primary-hover hover:shadow-voice hover:scale-105',
      'active:scale-95',
      'glow-primary-strong relative overflow-hidden'
    ),
    secondary: cn(
      'bg-surface-secondary text-text-primary font-medium',
      'border border-white/10',
      'hover:bg-surface-primary hover:border-white/20',
      'active:scale-[0.98]'
    ),
    outline: cn(
      'border-2 border-gradient-strong text-gradient-strong font-medium',
      'bg-transparent',
      'hover:bg-gradient-strong hover:text-white',
      'active:scale-[0.98]'
    ),
    ghost: cn(
      'text-text-secondary font-medium',
      'bg-transparent border-0',
      'hover:bg-white/5 hover:text-text-primary',
      'active:scale-[0.98]'
    )
  };

  return (
    <motion.button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      whileTap={!disabled ? { scale: variant === 'voice' ? 0.95 : 0.98 } : undefined}
      {...props}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        children
      )}
    </motion.button>
  );
};

// Voice Button Component - Central CTA with pulse effect
interface VoiceButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  size?: 'md' | 'lg' | 'xl';
  pulsing?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  size = 'lg',
  pulsing = false,
  children,
  className,
  ...props
}) => {
  const sizeMap = {
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  return (
    <div className="relative">
      {/* Pulse rings */}
      {pulsing && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gradient-strong/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gradient-deep/20"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </>
      )}
      
      <Button
        variant="voice"
        className={cn(sizeMap[size], className)}
        {...props}
      >
        {children}
      </Button>
    </div>
  );
};

// Icon Button Component
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'glass',
  className,
  ...props
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('aspect-square p-0', className)}
      {...props}
    >
      <span className={iconSizes[size]}>
        {icon}
      </span>
    </Button>
  );
};

// Floating Action Button
interface FABProps extends Omit<VoiceButtonProps, 'variant'> {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const FloatingActionButton: React.FC<FABProps> = ({
  position = 'bottom-right',
  className,
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2'
  };

  return (
    <motion.div
      className={cn(positionClasses[position], 'z-50')}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.2
      }}
    >
      <VoiceButton
        className={className}
        {...props}
      />
    </motion.div>
  );
};

// Button Group Component
interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  className
}) => {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row space-x-2' : 'flex-col space-y-2',
        className
      )}
    >
      {children}
    </div>
  );
};