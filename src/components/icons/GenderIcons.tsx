import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const AllGendersIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50.857 50.857"
      width={size}
      height={size}
      className={className}
      style={{ fill: 'none' }}
    >
      <g>
        <g>
          <line
            style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
            x1="25.428"
            y1="7.687"
            x2="25.428"
            y2="43.169"
          />
          <line
            style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
            x1="43.169"
            y1="25.428"
            x2="7.687"
            y2="25.428"
          />
        </g>
        <g>
          <line
            style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
            x1="37.973"
            y1="12.884"
            x2="12.884"
            y2="37.973"
          />
          <line
            style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
            x1="37.973"
            y1="37.973"
            x2="12.884"
            y2="12.884"
          />
        </g>
      </g>
    </svg>
  );
};

export const FemalesIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50.857 50.857"
      width={size}
      height={size}
      className={className}
      style={{ fill: 'none' }}
    >
      <g>
        <circle
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          cx="25.428"
          cy="15.806"
          r="13.613"
        />
        <line
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          x1="25.428"
          y1="29.292"
          x2="25.428"
          y2="48.664"
        />
        <line
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          x1="35.115"
          y1="38.978"
          x2="15.742"
          y2="38.978"
        />
      </g>
    </svg>
  );
};

export const MalesIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50.857 50.857"
      width={size}
      height={size}
      className={className}
      style={{ fill: 'none' }}
    >
      <g>
        <circle
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          cx="20.618"
          cy="30.239"
          r="13.613"
        />
        <line
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          x1="30.154"
          y1="20.703"
          x2="43.852"
          y2="7.005"
        />
        <polyline
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          points="27.896,7.005 43.852,7.005 43.852,22.96"
        />
      </g>
    </svg>
  );
};

export const DiverseIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50.857 50.857"
      width={size}
      height={size}
      className={className}
      style={{ fill: 'none' }}
    >
      <g>
        <circle
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          cx="25.428"
          cy="35.051"
          r="13.613"
        />
        <line
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          x1="25.428"
          y1="21.565"
          x2="25.428"
          y2="2.193"
        />
        <line
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          x1="17.075"
          y1="16.782"
          x2="33.782"
          y2="6.976"
        />
        <line
          style={{ fill: 'none', stroke: color, strokeWidth: 2.5, strokeMiterlimit: 10 }}
          x1="33.782"
          y1="16.782"
          x2="17.075"
          y2="6.976"
        />
      </g>
    </svg>
  );
};

