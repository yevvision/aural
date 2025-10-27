import React from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';

interface Region {
  start: number;
  end: number;
  id: string;
}

interface RegionListProps {
  regions: Region[];
  onPlayRegion: (region: Region) => void;
  onPauseRegion: () => void;
  onDeleteRegion: (regionId: string) => void;
  onPlayAllRegions: () => void;
  isPlaying: boolean;
  currentPlayingRegionId?: string;
}

export const RegionList: React.FC<RegionListProps> = ({
  regions,
  onPlayRegion,
  onPauseRegion,
  onDeleteRegion,
  onPlayAllRegions,
  isPlaying,
  currentPlayingRegionId,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  return (
    <div className="mt-6 w-full" style={{ marginTop: '75px' }}>
      <h3 className="text-lg font-medium text-white mb-4">Markers</h3>
      <div className="bg-black rounded-lg overflow-hidden">
        {regions.length > 0 ? (
          <table className="w-full">
            <tbody>
              {regions.map((region, index) => (
                <tr key={region.id} className="border-t border-gray-600">
                  <td className="p-4">
                    <div className="text-white font-medium">
                      Marker {index + 1}
                    </div>
                    <div className="text-gray-400 text-sm">
                      from {formatTime(region.start)} to {formatTime(region.end)}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          triggerHaptic();
                          if (isPlaying && currentPlayingRegionId === region.id) {
                            onPauseRegion();
                          } else {
                            onPlayRegion(region);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-[#ff4e3a] hover:bg-[#ff4e3a] active:bg-[#ff4e3a] flex items-center justify-center transition-colors duration-200"
                      >
                        {isPlaying && currentPlayingRegionId === region.id ? (
                          <Pause size={16} className="text-white" />
                        ) : (
                          <Play size={16} className="text-white ml-0.5" />
                        )}
                      </button>
                      
                      {index > 0 && (
                        <button
                          onClick={() => {
                            triggerHaptic();
                            onDeleteRegion(region.id);
                          }}
                          className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 flex items-center justify-center transition-colors duration-200"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No markers available
          </div>
        )}
      </div>
      
      {/* Play All Regions Button */}
      {regions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => {
              triggerHaptic();
              onPlayAllRegions();
            }}
            className="w-full px-8 py-5 sm:py-4 rounded-full border-2 border-gray-600 bg-gradient-to-r from-gray-700/30 to-gray-600/20 flex items-center justify-center space-x-3 hover:from-gray-600/40 hover:to-gray-500/30 active:from-gray-600/50 active:to-gray-500/40 transition-all duration-200 touch-manipulation shadow-lg"
            style={{ minHeight: '64px' }}
          >
            <Play size={20} className="text-gray-300 ml-0.5" strokeWidth={2} />
            <span className="text-gray-300 text-base font-semibold">Play all Selected Areas</span>
          </button>
        </div>
      )}
    </div>
  );
};
