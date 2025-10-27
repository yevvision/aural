import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MobileZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export default function MobileZoomControls({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  disabled = false 
}: MobileZoomControlsProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <motion.button
        onClick={() => {
          triggerHaptic();
          onZoomOut();
        }}
        disabled={disabled}
        className="w-12 h-12 sm:w-10 sm:h-10 rounded-full border-2 border-gray-400 bg-gradient-to-br from-gray-700/60 to-gray-800/40 flex items-center justify-center hover:from-gray-600/70 hover:to-gray-700/50 active:from-gray-500/80 active:to-gray-600/60 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        style={{ minHeight: '48px', minWidth: '48px' }}
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.9 } : {}}
      >
        <ZoomOut size={18} className="text-gray-200" strokeWidth={2} />
      </motion.button>

      <motion.button
        onClick={() => {
          triggerHaptic();
          onReset();
        }}
        disabled={disabled}
        className="w-14 h-12 sm:w-12 sm:h-10 rounded-full border-2 border-[#ff4e3a] bg-gradient-to-br from-[#ff4e3a]/30 to-[#ff4e3a]/20 flex items-center justify-center hover:from-[#ff4e3a]/40 hover:to-[#ff4e3a]/30 active:from-[#ff4e3a]/50 active:to-[#ff4e3a]/40 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        style={{ minHeight: '48px', minWidth: '56px' }}
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.9 } : {}}
      >
        <RotateCcw size={18} className="text-[#ff4e3a]" strokeWidth={2} />
      </motion.button>

      <motion.button
        onClick={() => {
          triggerHaptic();
          onZoomIn();
        }}
        disabled={disabled}
        className="w-12 h-12 sm:w-10 sm:h-10 rounded-full border-2 border-gray-400 bg-gradient-to-br from-gray-700/60 to-gray-800/40 flex items-center justify-center hover:from-gray-600/70 hover:to-gray-700/50 active:from-gray-500/80 active:to-gray-600/60 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        style={{ minHeight: '48px', minWidth: '48px' }}
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.9 } : {}}
      >
        <ZoomIn size={18} className="text-gray-200" strokeWidth={2} />
      </motion.button>
    </div>
  );
}
