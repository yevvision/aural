import React from 'react';

interface LiquidGlassToggleProps {
  options?: string[];
  selected?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const LiquidGlassToggle: React.FC<LiquidGlassToggleProps> = ({ 
  options = [], 
  selected = '', 
  onChange = () => {}, 
  className = '' 
}) => {
  // Sicherheitsprüfung für options
  if (!Array.isArray(options) || options.length === 0) {
    return (
      <div className={`liquid-glass-toggle ${className}`}>
        <span>Keine Optionen verfügbar</span>
      </div>
    );
  }

  return (
    <div className={`liquid-glass-toggle ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          className={`toggle-option ${selected === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
