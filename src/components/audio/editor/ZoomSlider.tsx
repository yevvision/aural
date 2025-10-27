import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

// CSS für den runden Greifer
const sliderStyles = `
  .slider {
    background: transparent !important;
    height: 2px !important;
  }
  
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #f97316;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
    margin-top: -11px; /* Zentriert den 24px Regler auf der 2px Linie */
  }
  
  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #f97316;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    margin-top: -11px; /* Zentriert den 24px Regler auf der 2px Linie */
  }
  
  .slider::-webkit-slider-track {
    background: #4b5563 !important;
    height: 2px !important;
    border-radius: 2px !important;
    border: none !important;
    width: 100% !important;
  }
  
  .slider::-moz-range-track {
    background: #4b5563 !important;
    height: 2px !important;
    border-radius: 2px !important;
    border: none !important;
    width: 100% !important;
  }
  
  .slider::-webkit-slider-runnable-track {
    background: #4b5563 !important;
    height: 2px !important;
    border-radius: 2px !important;
    border: none !important;
  }
`;

interface ZoomSliderProps {
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export const ZoomSlider: React.FC<ZoomSliderProps> = ({
  zoomLevel,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  minZoom = 1,
  maxZoom = 1000,
}) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(event.target.value);
    onZoomChange(newZoom);
  };

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="flex flex-col items-center space-y-2 w-full">
        <div className="flex items-center space-x-3 w-full" style={{ marginTop: '5px' }}>
          <button
            onClick={onZoomOut}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 active:bg-white/30 flex items-center justify-center transition-all duration-200 disabled:bg-gray-600/20 disabled:border-gray-600/30 disabled:cursor-not-allowed disabled:text-gray-400"
            disabled={zoomLevel <= minZoom}
          >
            <ZoomOut size={16} strokeWidth={2} />
          </button>
          <div className="flex-1 relative" style={{ marginTop: '-10px' }}>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              value={zoomLevel}
              onChange={handleSliderChange}
              className="w-full h-1 bg-transparent appearance-none cursor-pointer slider relative z-10"
              style={{ height: '2px' }}
            />
          </div>
          <button
            onClick={onZoomIn}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 active:bg-white/30 flex items-center justify-center transition-all duration-200 disabled:bg-gray-600/20 disabled:border-gray-600/30 disabled:cursor-not-allowed disabled:text-gray-400"
            disabled={zoomLevel >= maxZoom}
          >
            <ZoomIn size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );
};
