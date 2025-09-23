import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Heading, Body } from '../components/ui/Typography';

interface PendingUploadData {
  uploadId: string;
  title: string;
  status: 'pending';
  reason: string;
  estimatedTime: string;
}

interface PendingUploadPageProps {
  uploadData: PendingUploadData;
}

export const PendingUploadPage: React.FC<PendingUploadPageProps> = ({ uploadData }) => {
  const navigate = useNavigate();

  const handleVerstanden = () => {
    navigate('/');
  };

  const handleWarum = () => {
    navigate('/privacy');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Shield className="w-10 h-10 text-orange-500" />
          </motion.div>
          
          <Heading level={1} className="text-3xl mb-4">
            Sicherheitsprüfung läuft
          </Heading>
          
          <Body color="secondary" className="text-lg">
            Hey, zur Sicherheit prüfen wir deinen Upload. Du erhältst automatisch eine Benachrichtigung, sobald dein Audio freigegeben wurde.
          </Body>
        </div>

        {/* Upload Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <Heading level={3} className="text-xl text-orange-500">{uploadData.title}</Heading>
              <Body color="secondary">Upload ID: {uploadData.uploadId}</Body>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-300">Upload erfolgreich empfangen</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <span className="text-gray-300">Sicherheitscheck läuft</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-gray-300">Nächster Schritt: automatische Freigabe, wenn alles passt</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Body className="text-orange-400 text-sm">
              <strong>Grund für Prüfung:</strong> {uploadData.reason}
            </Body>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {/* Verstanden Button */}
          <Button
            onClick={handleVerstanden}
            variant="primary"
            size="lg"
            fullWidth
            className="py-4 text-lg"
          >
            Verstanden
          </Button>
          
          {/* Warum Button */}
          <Button
            onClick={handleWarum}
            variant="glass"
            size="md"
            fullWidth
          >
            Warum?
          </Button>
          
          {/* Zurück Button */}
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="md"
            fullWidth
            className="flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zur Startseite</span>
          </Button>
        </motion.div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 text-sm">
            Diese Prüfung dauert normalerweise nur wenige Minuten. 
            <br />
            Du kannst diese Seite schließen - wir melden uns, sobald dein Audio live ist.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
