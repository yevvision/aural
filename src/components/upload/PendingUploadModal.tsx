import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, X } from 'lucide-react';

export interface PendingUploadData {
  uploadId: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  estimatedTime?: string;
}

interface PendingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadData: PendingUploadData;
  variant?: 'A' | 'B' | 'C';
}

export const PendingUploadModal = ({ 
  isOpen, 
  onClose, 
  uploadData, 
  variant = 'A' 
}: PendingUploadModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  // Simuliere Prüfungsprozess
  useEffect(() => {
    if (!isOpen) return;

    const steps = [
      { text: 'Upload empfangen', duration: 1000 },
      { text: 'Sicherheitscheck läuft', duration: 2000 },
      { text: 'Automatische Freigabe vorbereitet', duration: 1500 }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        stepIndex++;
      } else {
        setIsChecking(false);
        clearInterval(interval);
      }
    }, steps[stepIndex]?.duration || 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const renderVariantA = () => (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 bg-[#ff4e3a]/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Clock className="w-8 h-8 text-[#ff4e3a]" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-4">
        Dein Upload läuft jetzt durch unsere kurze Prüfung.
      </h2>
      
      <p className="text-gray-300 text-lg leading-relaxed mb-6">
        Das dauert nur einen Moment. Sobald alles passt, wird deine Audiodatei automatisch freigegeben.
      </p>
      
      <p className="text-gray-400 text-sm">
        Du kannst dieses Fenster schließen – wir melden uns, sobald sie live ist.
      </p>
    </div>
  );

  const renderVariantB = () => (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 bg-[#ff4e3a]/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-8 h-8 text-[#ff4e3a]" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-4">
        Danke für deinen Upload!
      </h2>
      
      <p className="text-gray-300 text-lg leading-relaxed mb-6">
        Wir checken kurz, ob alles okay ist. Danach schalten wir die Audiodatei frei.
      </p>
      
      <p className="text-gray-400 text-sm">
        Das passiert in Kürze – du musst nichts weiter tun.
      </p>
    </div>
  );

  const renderVariantC = () => (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 bg-[#ff4e3a]/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        {isChecking ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="w-8 h-8 text-[#ff4e3a]" />
          </motion.div>
        ) : (
          <CheckCircle className="w-8 h-8 text-[#ff4e3a]" />
        )}
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-6">
        Prüfung gestartet …
      </h2>
      
      <div className="space-y-4 mb-6">
        {[
          { text: 'Upload empfangen', completed: currentStep >= 0 },
          { text: 'Sicherheitscheck läuft', completed: currentStep >= 1 },
          { text: 'Nächster Schritt: automatische Freigabe, wenn alles passt', completed: currentStep >= 2 }
        ].map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: currentStep >= index ? 1 : 0.5,
              x: 0
            }}
            className="flex items-center space-x-3"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              step.completed ? 'bg-[#ff4e3a]' : 'bg-gray-600'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              )}
            </div>
            <span className={`text-sm ${
              step.completed ? 'text-white' : 'text-gray-400'
            }`}>
              {step.text}
            </span>
          </motion.div>
        ))}
      </div>
      
      <p className="text-gray-400 text-sm mb-4">
        Du wirst informiert, sobald die Datei live ist.
      </p>
      
      <button
        onClick={() => window.open('/privacy', '_blank')}
        className="text-[#ff4e3a] hover:text-[#ff4e3a] text-xs underline"
      >
        Warum? (Transparenz)
      </button>
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case 'B': return renderVariantB();
      case 'C': return renderVariantC();
      default: return renderVariantA();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>

          {/* Content */}
          {renderContent()}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col space-y-3">
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-[#ff4e3a]/20 border border-[#ff4e3a] rounded-lg text-[#ff4e3a] font-medium hover:bg-[#ff4e3a]/30 transition-all duration-200"
            >
              Verstanden
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 px-6 bg-transparent border border-gray-600 rounded-lg text-gray-300 font-medium hover:border-gray-500 hover:text-white transition-all duration-200"
            >
              Zur Startseite
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
