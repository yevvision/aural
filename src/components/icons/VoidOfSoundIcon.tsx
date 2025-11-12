import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export const VoidOfSoundIcon: React.FC<IconProps> = ({ 
  size = 128, 
  className = '', 
  color = 'white',
  strokeWidth = 4
}) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 165.887 165.886"
      width={size}
      height={size}
      className={className}
      style={{ fill: 'none' }}
    >
      <g>
        <path 
          style={{ fill: 'none', stroke: color, strokeWidth: strokeWidth, strokeMiterlimit: 10 }} 
          d="M47.849,118.038c-19.126-19.126-19.126-50.136,0-69.263
          s50.136-19.127,69.263,0" 
        />
        <path 
          style={{ fill: 'none', stroke: color, strokeWidth: strokeWidth, strokeMiterlimit: 10 }} 
          d="M120.095,52.036c16.085,19.242,15.09,47.927-2.984,66.001
          c-18.118,18.118-46.898,19.073-66.141,2.867" 
        />
      </g>
      <line 
        style={{ fill: 'none', stroke: color, strokeWidth: strokeWidth, strokeMiterlimit: 10 }} 
        x1="132.383" 
        y1="33.504" 
        x2="32.577" 
        y2="133.309" 
      />
    </svg>
  );
};

