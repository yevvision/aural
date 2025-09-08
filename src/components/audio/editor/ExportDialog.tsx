import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Settings, FileAudio } from 'lucide-react';
type EncodeFormat = 'mp3' | 'aac';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: EncodeFormat, kbps: number) => void;
  isExporting?: boolean;
}

export default function ExportDialog({ 
  isOpen, 
  onClose, 
  onExport, 
  isExporting = false 
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<EncodeFormat>('mp3');
  const [selectedKbps, setSelectedKbps] = useState(128);

  const formats = [
    { value: 'mp3' as EncodeFormat, label: 'MP3', description: 'Kleinere Dateigröße' },
    { value: 'aac' as EncodeFormat, label: 'AAC', description: 'Bessere Qualität' },
  ];

  const kbpsOptions = [96, 128, 192, 256, 320];

  const handleExport = () => {
    onExport(selectedFormat, selectedKbps);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-md bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <FileAudio size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Export-Einstellungen</h3>
                  <p className="text-sm text-white/60">Wähle Format und Qualität</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Format Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Audio-Format
                </label>
                <div className="space-y-2">
                  {formats.map((format) => (
                    <motion.button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`w-full p-4 rounded-lg border transition-all touch-manipulation ${
                        selectedFormat === format.value
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{ minHeight: '60px' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-white font-medium">{format.label}</div>
                          <div className="text-white/60 text-sm">{format.description}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedFormat === format.value
                            ? 'border-red-500 bg-red-500'
                            : 'border-white/40'
                        }`}>
                          {selectedFormat === format.value && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quality Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Qualität (kbps)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {kbpsOptions.map((kbps) => (
                    <motion.button
                      key={kbps}
                      onClick={() => setSelectedKbps(kbps)}
                      className={`p-4 rounded-lg border text-sm font-medium transition-all touch-manipulation ${
                        selectedKbps === kbps
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ minHeight: '48px', minWidth: '48px' }}
                    >
                      {kbps}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions - Mobile Optimized */}
            <div className="flex gap-3 mt-8">
              <motion.button
                onClick={onClose}
                className="flex-1 py-4 px-4 rounded-lg border border-white/20 text-white font-medium hover:bg-white/10 transition-colors touch-manipulation"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isExporting}
                style={{ minHeight: '48px' }}
              >
                Abbrechen
              </motion.button>
              <motion.button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 py-4 px-4 rounded-lg bg-red-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50 touch-manipulation"
                whileHover={!isExporting ? { scale: 1.02 } : {}}
                whileTap={!isExporting ? { scale: 0.98 } : {}}
                style={{ minHeight: '48px' }}
              >
                {isExporting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Exportiert...
                  </>
                ) : (
                  <>
                    <Download size={16} strokeWidth={1.5} />
                    Exportieren
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
