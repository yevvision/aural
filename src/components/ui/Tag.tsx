import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

// Tag Variants
type TagVariant = 'default' | 'selected' | 'disabled';
type TagSize = 'sm' | 'md';

interface TagProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: TagVariant;
  size?: TagSize;
  children: React.ReactNode;
  selected?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  showHashtag?: boolean;
}

/**
 * Tag Component
 * For selectable items like categories, filters, and labels
 * Distinct from buttons - smaller, different visual treatment
 */
export const Tag: React.FC<TagProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  selected = false,
  onToggle,
  disabled = false,
  showHashtag = false,
  ...props
}) => {
  // Determine actual variant based on state
  const actualVariant = disabled ? 'disabled' : (selected ? 'selected' : 'default');

  // Base tag classes - smaller and more subtle than buttons
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium',
    'transition-all duration-200 ease-smooth',
    'focus:outline-none focus:ring-1 focus:ring-gradient-strong focus:ring-offset-1',
    'cursor-pointer',
    disabled && 'cursor-not-allowed opacity-50'
  );

  // Size variants - smaller than button sizes
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs rounded-full min-h-[28px]',
    md: 'px-3 py-1.5 text-sm rounded-full min-h-[32px]'
  };

  // Variant styles - more subtle than buttons
  const variantClasses = {
    default: cn(
      'bg-white/5 text-text-secondary border border-white/30',
      'hover:bg-white/10 hover:text-text-primary hover:border-white/40',
      'active:scale-[0.98]'
    ),
    selected: cn(
      'bg-gradient-primary/20 text-gradient-strong border border-gradient-strong/70',
      'shadow-sm',
      'hover:bg-gradient-primary/30 hover:border-gradient-strong/90',
      'active:scale-[0.98]'
    ),
    disabled: cn(
      'bg-white/5 text-text-tertiary border border-white/20',
      'cursor-not-allowed'
    )
  };

  const handleClick = () => {
    if (!disabled && onToggle) {
      onToggle();
    }
  };

  return (
    <motion.button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[actualVariant],
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      {...props}
    >
      {showHashtag && <span className="opacity-60 mr-1">#</span>}
      {children}
    </motion.button>
  );
};

// Tag Group Component for organizing multiple tags
interface TagGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

export const TagGroup: React.FC<TagGroupProps> = ({
  children,
  orientation = 'horizontal',
  className,
  label
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex flex-wrap gap-2',
          orientation === 'vertical' && 'flex-col items-start'
        )}
      >
        {children}
      </div>
    </div>
  );
};

// Selectable Tag with state management
interface SelectableTagProps extends Omit<TagProps, 'selected' | 'onToggle'> {
  value: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

export const SelectableTag: React.FC<SelectableTagProps> = ({
  value,
  selectedValues,
  onSelectionChange,
  children,
  ...props
}) => {
  const isSelected = selectedValues.includes(value);

  const handleToggle = () => {
    if (isSelected) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  return (
    <Tag
      selected={isSelected}
      onToggle={handleToggle}
      {...props}
    >
      {children}
    </Tag>
  );
};
