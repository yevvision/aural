import React from 'react';
import UnicornBackground from '../components/UnicornBackground';

const UnicornStudioPage: React.FC = () => {
  return (
    <UnicornBackground className="min-h-screen">
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Unicorn Studio
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-2xl mx-auto">
            Willkommen zur interaktiven Raycast Hintergrund Szene. 
            Bewege deine Maus, um die Animation zu steuern.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-semibold mb-4 text-blue-400">Interaktiv</h3>
              <p className="text-gray-300">
                Die Szene reagiert auf Mausbewegungen und Scroll-Events für eine immersive Erfahrung.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-semibold mb-4 text-purple-400">Performance</h3>
              <p className="text-gray-300">
                Optimiert für 60 FPS mit WebGL-basierter Rendering-Technologie.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-semibold mb-4 text-pink-400">Responsive</h3>
              <p className="text-gray-300">
                Automatische Anpassung an verschiedene Bildschirmgrößen und Geräte.
              </p>
            </div>
          </div>
          
          <div className="mt-16">
            <button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => window.history.back()}
            >
              Zurück zur App
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      <div className="fixed top-4 right-4 z-20">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Unicorn Studio aktiv</span>
          </div>
        </div>
      </div>
    </UnicornBackground>
  );
};

export default UnicornStudioPage;
