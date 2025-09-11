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
    <div className="flex items-center justify-center gap-2 mt-3">
      <motion.button
        onClick={() => {
          triggerHaptic();
          onZoomOut();
        }}
        disabled={disabled}
        className="w-10 h-10 rounded-full border border-gray-500 bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 active:bg-gray-600/50 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: '40px', minWidth: '40px' }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <ZoomOut size={16} className="text-gray-300" strokeWidth={1.5} />
      </motion.button>

      <motion.button
        onClick={() => {
          triggerHaptic();
          onReset();
        }}
        disabled={disabled}
        className="w-10 h-10 rounded-full border border-orange-500 bg-orange-500/20 flex items-center justify-center hover:bg-orange-500/30 active:bg-orange-500/40 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: '40px', minWidth: '40px' }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <RotateCcw size={16} className="text-orange-500" strokeWidth={1.5} />
      </motion.button>

      <motion.button
        onClick={() => {
          triggerHaptic();
          onZoomIn();
        }}
        disabled={disabled}
        className="w-10 h-10 rounded-full border border-gray-500 bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 active:bg-gray-600/50 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: '40px', minWidth: '40px' }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <ZoomIn size={16} className="text-gray-300" strokeWidth={1.5} />
      </motion.button>
    </div>
  );
}
