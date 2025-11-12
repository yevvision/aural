import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicPlayIconProps {
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isFinished: boolean;
  className?: string;
  size?: number;
  variant?: 'default' | 'white-outline' | 'white-outline-thin';
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
        strokeWidth: '3.1' // Dicker für MiniPlayer
      };
    }
    if (variant === 'white-outline-thin') {
      return {
        circleStroke: 'white',
        pathStroke: 'white',
        className: 'w-[90%] h-[90%] text-white',
        strokeWidth: '1.5' // Gleiche Strichstärke wie Record-Button
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

  // Animation variants für flüssige Übergänge
  const iconVariants: any = {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      rotate: -90
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.4
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      rotate: 90,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className={`flex-shrink-0 ${variant === 'white-outline' ? 'w-full h-full flex items-center justify-center' : 'flex items-center justify-center'} ${colors.className}`}>
      <div className="flex items-center justify-center w-full h-full relative">
        <AnimatePresence mode="wait">
          {iconState === 'play' && (
            <motion.div
              key="play"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
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
                      d="M50.971,27.415l-3.488-3.488
			c-3.801-3.801-9.964-3.801-13.765,0c-3.801,3.801-3.801,9.964,0,13.765l3.488,3.488l-3.488,3.488
			c-3.801,3.801-3.801,9.964,0,13.765c3.801,3.801,9.964,3.801,13.765,0l3.488-3.488L64.736,41.18L50.971,27.415z"
                    />
                  </g>
                </g>
              </svg>
            </motion.div>
          )}

          {iconState === 'pause' && (
            <motion.div
              key="pause"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
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
            </motion.div>
          )}

          {iconState === 'reload' && (
            <motion.div
              key="reload"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
