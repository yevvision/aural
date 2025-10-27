import React from 'react';

interface DynamicPlayIconProps {
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isFinished: boolean;
  className?: string;
  size?: number;
  variant?: 'default' | 'white-outline';
}

export const DynamicPlayIcon: React.FC<DynamicPlayIconProps> = ({
  isCurrentTrack,
  isPlaying,
  isFinished,
  className = "w-9 h-9 text-[#ff4e3a]",
  size = 36,
  variant = 'default'
}) => {
  // Bestimme den Icon-Zustand
  const getIconState = () => {
    if (!isCurrentTrack) return 'play';
    if (isFinished) return 'reload';
    if (isPlaying) return 'pause';
    return 'play';
  };

  const iconState = getIconState();

  // Bestimme die Farben basierend auf der Variante
  const getColors = () => {
    if (variant === 'white-outline') {
      return {
        circleStroke: 'white',
        pathStroke: 'white',
        className: 'w-[90%] h-[90%] text-white',
        strokeWidth: '1.937' // 50% von 3.8739
      };
    }
    return {
      circleStroke: '#f97316',
      pathStroke: '#f97316',
      className: className,
      strokeWidth: '3.8739'
    };
  };

  const colors = getColors();

  return (
    <div className={`flex-shrink-0 ${variant === 'white-outline' ? 'w-full h-full flex items-center justify-center' : 'flex items-center justify-center'} ${colors.className}`}>
      <div className="flex items-center justify-center w-full h-full">
          {iconState === 'play' && (
            <svg 
              version="1.1" 
              id="Ebene_1" 
              xmlns="http://www.w3.org/2000/svg" 
              xmlnsXlink="http://www.w3.org/1999/xlink" 
              x="0px" 
              y="0px"
              viewBox="0 0 87.733 86.526" 
              style={{["enableBackground" as any]: "new 0 0 87.733 86.526"}} 
              xmlSpace="preserve"
              className={colors.className}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
            >
              <g>
                <g>
                  <g>
                    <circle 
                      style={{fill:"none",stroke:colors.circleStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                      cx="43.866" 
                      cy="42.242" 
                      r="40.577"
                    />
                  </g>
                  <path 
                    style={{fill:"none",stroke:colors.pathStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                    d="M51.459,25.293l-4.025-4.025c-4.387-4.387-11.5-4.387-15.887,0s-4.387,11.5,0,15.887l4.025,4.025l-4.025,4.025c-4.387,4.387-4.387,11.5,0,15.887s11.5,4.387,15.887,0l4.025-4.025L67.346,41.18L51.459,25.293z"
                  />
                </g>
              </g>
            </svg>
          )}

          {iconState === 'pause' && (
            <svg 
              version="1.1" 
              id="Ebene_1" 
              xmlns="http://www.w3.org/2000/svg" 
              xmlnsXlink="http://www.w3.org/1999/xlink" 
              x="0px" 
              y="0px"
              viewBox="0 0 87.733 86.526" 
              style={{["enableBackground" as any]: "new 0 0 87.733 86.526"}} 
              xmlSpace="preserve"
              className={colors.className}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
            >
              <g>
                <g>
                  <g>
                    <circle 
                      style={{fill:"none",stroke:colors.circleStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                      cx="43.866" 
                      cy="42.242" 
                      r="40.577"
                    />
                  </g>
                  {/* Pause Icon - zwei vertikale Linien */}
                  <g>
                    <line 
                      style={{fill:"none",stroke:colors.pathStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                      x1="38.5" 
                      y1="28" 
                      x2="38.5" 
                      y2="56"
                    />
                    <line 
                      style={{fill:"none",stroke:colors.pathStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                      x1="49.5" 
                      y1="28" 
                      x2="49.5" 
                      y2="56"
                    />
                  </g>
                </g>
              </g>
            </svg>
          )}

          {iconState === 'reload' && (
            <svg 
              version="1.1" 
              id="Ebene_1" 
              xmlns="http://www.w3.org/2000/svg" 
              xmlnsXlink="http://www.w3.org/1999/xlink" 
              x="0px" 
              y="0px"
              viewBox="0 0 87.733 86.526" 
              style={{["enableBackground" as any]: "new 0 0 87.733 86.526"}} 
              xmlSpace="preserve"
              className={colors.className}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
            >
              <g>
                <g>
                  <g>
                    <circle 
                      style={{fill:"none",stroke:colors.circleStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                      cx="43.866" 
                      cy="42.242" 
                      r="40.577"
                    />
                  </g>
                  {/* Reload Icon - Einfacher Pfeil */}
                  <g>
                    <path 
                      style={{fill:"none",stroke:colors.pathStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                      d="M43.866,20.5c-12.5,0-22.5,10-22.5,22.5s10,22.5,22.5,22.5s22.5-10,22.5-22.5"
                    />
                    <path 
                      style={{fill:"none",stroke:colors.pathStroke,strokeWidth:colors.strokeWidth,strokeMiterlimit:"10"}} 
                      d="M43.866,20.5l-8,8l8,8"
                    />
                  </g>
                </g>
              </g>
            </svg>
          )}
      </div>
    </div>
  );
};
