import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, AlertCircle } from 'lucide-react';

type ExportFormat = 'wav' | 'mp3' | 'aac';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, quality: number) => void;
  isExporting?: boolean;
  error?: string | null;
}

export default function ExportDialog({
  isOpen,
  onClose,
  onExport,
  isExporting = false,
  error = null
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('wav');
  const [quality, setQuality] = useState(128);

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(selectedFormat, quality);
  };

  const formatOptions = [
    { value: 'wav' as const, label: 'WAV (unverlustig)', description: 'Beste Qualität, größere Datei' },
    { value: 'mp3' as const, label: 'MP3', description: 'Kleinere Datei, gute Qualität' },
    { value: 'aac' as const, label: 'AAC', description: 'Moderne Komprimierung' }
  ];

  const qualityOptions = [
    { value: 64, label: '64 kbps', description: 'Niedrige Qualität' },
    { value: 128, label: '128 kbps', description: 'Standard Qualität' },
    { value: 192, label: '192 kbps', description: 'Hohe Qualität' },
    { value: 320, label: '320 kbps', description: 'Sehr hohe Qualität' }
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Export-Optionen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isExporting}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Audio-Format
          </label>
          <div className="space-y-2">
            {formatOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedFormat === option.value
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={selectedFormat === option.value}
                  onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{option.label}</div>
                  <div className="text-gray-400 text-sm">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quality Selection (only for compressed formats) */}
        {selectedFormat !== 'wav' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Qualität
            </label>
            <div className="space-y-2">
              {qualityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    quality === option.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={option.value}
                    checked={quality === option.value}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{option.label}</div>
                    <div className="text-gray-400 text-sm">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? 'Exportiert...' : 'Exportieren'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}