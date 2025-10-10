import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, Mic, Edit3, Upload, Play, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition, RevealOnScroll } from '../components/ui';
import { Heading, Body } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

export const DemoMainPage = () => {
  const navigate = useNavigate();

  const demoPages = [
    {
      id: 'feed',
      title: 'Feed Demo',
      description: 'Zeigt die Feed-Funktionalität mit Audio-Posts',
      icon: Music,
      route: '/demo-feed',
      color: 'bg-blue-500'
    },
    {
      id: 'record',
      title: 'Record Demo',
      description: 'Simuliert die Audio-Aufnahme-Funktionalität',
      icon: Mic,
      route: '/demo-record',
      color: 'bg-red-500'
    },
    {
      id: 'audio-editor',
      title: 'Audio Editor Demo',
      description: 'Zeigt die Audio-Bearbeitung mit Wellenform',
      icon: Edit3,
      route: '/demo-audio-editor',
      color: 'bg-orange-500'
    },
    {
      id: 'upload',
      title: 'Upload Demo',
      description: 'Demonstriert die Upload-Funktionalität',
      icon: Upload,
      route: '/demo-upload',
      color: 'bg-green-500'
    },
    {
      id: 'player',
      title: 'Player Demo',
      description: 'Zeigt den Audio-Player mit Visualisierung',
      icon: Play,
      route: '/demo-player',
      color: 'bg-purple-500'
    },
    {
      id: 'profile',
      title: 'Profile Demo',
      description: 'Demonstriert die Profil-Funktionalität',
      icon: Users,
      route: '/demo-profile',
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-black">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-4 sm:px-6 pb-6 min-h-[calc(100vh-72px)] flex flex-col">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück zur Hauptseite
          </Button>
        </div>

        {/* Demo Title */}
        <Heading level={1} className="text-3xl sm:text-4xl mb-4 sm:mb-6">
          Demo Center
        </Heading>

        {/* Demo Description */}
        <Body color="secondary" className="mb-6 sm:mb-8 leading-snug text-sm sm:text-base font-light">
          Wählen Sie eine Demo aus, um die verschiedenen Funktionen der Aural-App zu testen
        </Body>

        {/* Demo Grid */}
        <div className="flex-1 space-y-4">
          {demoPages.map((demo, index) => {
            const IconComponent = demo.icon;
            return (
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={() => navigate(demo.route)}
                  variant="ghost"
                  className="w-full h-auto p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className={`w-12 h-12 ${demo.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <IconComponent size={24} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold text-base mb-1">
                        {demo.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {demo.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Demo Info */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Settings size={16} className="text-orange-400" />
            <h4 className="text-white font-medium text-sm">Demo-Info</h4>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            Alle Demos verwenden Test-Daten und simulieren die echten Funktionen. 
            Die Audio-Dateien werden lokal geladen und verarbeitet.
          </p>
        </div>
      </div>
    </div>
  );
};
