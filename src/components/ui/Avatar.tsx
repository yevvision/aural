import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'Avatar', 
  size = 'md',
  className = '',
  fallback
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl'
  };
  
  const baseClasses = 'rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 overflow-hidden';
  const classes = `${baseClasses} ${sizeClasses[size]} ${className}`;
  
  // Fallback text (first letter of alt or fallback prop)
  const fallbackText = fallback || (alt ? alt.charAt(0).toUpperCase() : '?');
  
  return (
    <div className={classes}>
      {src ? (
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = fallbackText;
            }
          }}
        />
      ) : (
        <span>{fallbackText}</span>
      )}
    </div>
  );
};
