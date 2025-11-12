import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

// CSS für den runden Greifer
const sliderStyles = `
  .slider {
    background: transparent !important;
    /* Vergrößerte Touch-Fläche bei gleichbleibender visueller Höhe */
    height: 36px !important; /* große, aber transparente Touch-Area */
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .slider::-webkit-slider-thumb {
    appearance: none;
    /* 60% größer als 8px (8px * 1.6 = 13px) */
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ff4e3a;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
    /* Zentriert den 13px Regler auf der 2px Linie */
    margin-top: -5.5px;
  }
  
  .slider::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ff4e3a;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    margin-top: -5.5px; /* Zentriert den 13px Regler auf der 2px Linie */
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
            className="text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', minWidth: '44px', background: 'transparent', border: 'none', marginTop: '-12px' }}
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
              className="w-full bg-transparent appearance-none cursor-pointer slider relative z-10"
              style={{ height: '36px' }}
            />
          </div>
          <button
            onClick={onZoomIn}
            className="text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', minWidth: '44px', background: 'transparent', border: 'none', marginTop: '-12px' }}
            disabled={zoomLevel >= maxZoom}
          >
            <ZoomIn size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );
};
