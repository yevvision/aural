import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

// Panel Component with glassmorphism effect
interface PanelProps extends HTMLMotionProps<'div'> {
  variant?: 'primary' | 'secondary' | 'glass';
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ 
  variant = 'primary', 
  className, 
  children, 
  ...props 
}) => {
  const baseClasses = "rounded-xl border transition-all duration-300 ease-smooth";
  
  const variantClasses = {
    primary: "panel-floating bg-surface-primary backdrop-blur-strong border-white/10 shadow-glass",
    secondary: "bg-surface-secondary backdrop-blur-light border-white/10 shadow-glass",
    glass: "glass-surface backdrop-blur-light border-surface-glass-border"
  };

  return (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Card Component
interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  className, 
  children, 
  interactive = false,
  ...props 
}) => {
  return (
    <motion.div
      className={cn(
        "panel-floating p-4 rounded-xl",
        interactive && "cursor-pointer hover:shadow-glass-hover hover:border-gradient-strong/30",
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={interactive ? { 
        y: -2,
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={interactive ? { 
        scale: 0.98,
        transition: { duration: 0.1 }
      } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Container Component
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'w-full'
  };

  return (
    <div className={cn(
      'mx-auto px-4',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
};

// Glass Surface Component
interface GlassSurfaceProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  blur?: 'light' | 'strong';
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({ 
  children, 
  className, 
  blur = 'strong',
  ...props 
}) => {
  const blurClasses = {
    light: 'backdrop-blur-light',
    strong: 'backdrop-blur-strong'
  };

  return (
    <motion.div
      className={cn(
        'glass-surface rounded-xl p-4',
        blurClasses[blur],
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Floating Action Component
interface FloatingActionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingAction: React.FC<FloatingActionProps> = ({ 
  children, 
  className, 
  position = 'bottom-right',
  ...props 
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <motion.div
      className={cn(
        positionClasses[position],
        'z-50 panel-floating p-3 rounded-full shadow-voice',
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.2 
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};