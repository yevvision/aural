import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Zap, Palette, MousePointer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Heading, Body } from '../components/ui/Typography';

interface AnimationSettings {
  // Performance Settings
  fps: number;
  dpi: number;
  scale: number;
  
  // Beam Settings
  radius: number;
  skew: number;
  speed: number;
  trackMouse: number;
  mouseMomentum: number;
  
  // Position Settings
  posX: number;
  posY: number;
  
  // Effects Settings
  noiseSpeed: number;
  noiseIntensity: number;
  rippleSpeed: number;
  rippleFrequency: number;
  rippleStrength: number;
  
  // Gradient Settings
  gradientSpeed: number;
  gradientIntensity: number;
  
  // Animation State
  isPlaying: boolean;
  isPaused: boolean;
}

const UnicornAnimationControllerPage: React.FC = () => {
  const [settings, setSettings] = useState<AnimationSettings>({
    // Performance
    fps: 60,
    dpi: 1.5,
    scale: 1,
    
    // Beam
    radius: 0.842,
    skew: 0.5,
    speed: 0.25,
    trackMouse: 0.1,
    mouseMomentum: 1,
    
    // Position
    posX: 0.5,
    posY: 0.5,
    
    // Effects
    noiseSpeed: 0.11,
    noiseIntensity: 0.33,
    rippleSpeed: 0.5,
    rippleFrequency: 1.116,
    rippleStrength: 0.5,
    
    // Gradient
    gradientSpeed: 0.5,
    gradientIntensity: 0.45,
    
    // State
    isPlaying: true,
    isPaused: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const unicornRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  // Initialize Unicorn Studio
  useEffect(() => {
    const loadUnicornStudio = async () => {
      if (window.UnicornStudio) {
        initializeScene();
        return;
      }

      const script = document.createElement('script');
      script.src = '/unicornStudio.umd.js';
      script.async = true;
      
      script.onload = () => {
        initializeScene();
      };
      
      document.head.appendChild(script);
    };

    const initializeScene = () => {
      if (window.UnicornStudio && unicornRef.current) {
        (window.UnicornStudio as any).addScene({
          elementId: 'unicorn-canvas',
          fps: settings.fps,
          scale: settings.scale,
          dpi: settings.dpi,
          projectId: '3Z7rqYRTDAvnqc3BpTTz',
          lazyLoad: false,
          production: true,
          interactivity: {
            mouse: {
              disableMobile: false,
              disabled: false
            }
          }
        }).then((scene: any) => {
          sceneRef.current = scene;
          setIsInitialized(true);
        }).catch((err: any) => {
          console.error('Unicorn Studio initialization error:', err);
        });
      }
    };

    loadUnicornStudio();
  }, []);

  // Update scene when settings change
  useEffect(() => {
    if (sceneRef.current && isInitialized) {
      // Update scene properties dynamically
      // Note: This would require the Unicorn Studio API to support runtime updates
      console.log('Settings updated:', settings);
    }
  }, [settings, isInitialized]);

  const handleSettingChange = (key: keyof AnimationSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      fps: 60,
      dpi: 1.5,
      scale: 1,
      radius: 0.842,
      skew: 0.5,
      speed: 0.25,
      trackMouse: 0.1,
      mouseMomentum: 1,
      posX: 0.5,
      posY: 0.5,
      noiseSpeed: 0.11,
      noiseIntensity: 0.33,
      rippleSpeed: 0.5,
      rippleFrequency: 1.116,
      rippleStrength: 0.5,
      gradientSpeed: 0.5,
      gradientIntensity: 0.45,
      isPlaying: true,
      isPaused: false,
    });
  };

  const togglePlayPause = () => {
    if (sceneRef.current) {
      if (settings.isPaused) {
        sceneRef.current.paused = false;
        setSettings(prev => ({ ...prev, isPaused: false, isPlaying: true }));
      } else {
        sceneRef.current.paused = true;
        setSettings(prev => ({ ...prev, isPaused: true, isPlaying: false }));
      }
    }
  };

  const SliderControl = ({ 
    label, 
    value, 
    min, 
    max, 
    step = 0.01, 
    onChange, 
    unit = '',
    description 
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    unit?: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs text-gray-400">{value.toFixed(2)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animation Canvas */}
      <div className="fixed inset-0 z-0">
        <div
          ref={unicornRef}
          id="unicorn-canvas"
          className="w-full h-full"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1
          }}
        />
      </div>

      {/* Control Panel */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Heading level={1} className="text-4xl mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Unicorn Animation Controller
            </Heading>
            <Body className="text-lg text-gray-300">
              Steuere alle Parameter der Unicorn Studio Animation in Echtzeit
            </Body>
          </div>

          {/* Main Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Performance & Basic Settings */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center mb-4">
                  <Zap className="w-5 h-5 mr-2 text-blue-400" />
                  <Heading level={3} className="text-lg text-blue-400">Performance</Heading>
                </div>
                
                <div className="space-y-4">
                  <SliderControl
                    label="FPS"
                    value={settings.fps}
                    min={30}
                    max={120}
                    step={1}
                    onChange={(value) => handleSettingChange('fps', value)}
                    unit=" fps"
                    description="Frames pro Sekunde - höhere Werte = flüssigere Animation"
                  />
                  
                  <SliderControl
                    label="DPI"
                    value={settings.dpi}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onChange={(value) => handleSettingChange('dpi', value)}
                    description="Pixel-Verhältnis - höhere Werte = schärfere Darstellung"
                  />
                  
                  <SliderControl
                    label="Scale"
                    value={settings.scale}
                    min={0.25}
                    max={1}
                    step={0.05}
                    onChange={(value) => handleSettingChange('scale', value)}
                    description="Rendering-Skala - kleinere Werte = bessere Performance"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center mb-4">
                  <MousePointer className="w-5 h-5 mr-2 text-green-400" />
                  <Heading level={3} className="text-lg text-green-400">Position & Interaktion</Heading>
                </div>
                
                <div className="space-y-4">
                  <SliderControl
                    label="Position X"
                    value={settings.posX}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('posX', value)}
                    description="Horizontale Position des Strahls"
                  />
                  
                  <SliderControl
                    label="Position Y"
                    value={settings.posY}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('posY', value)}
                    description="Vertikale Position des Strahls"
                  />
                  
                  <SliderControl
                    label="Mouse Tracking"
                    value={settings.trackMouse}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('trackMouse', value)}
                    description="Wie stark der Strahl der Maus folgt"
                  />
                  
                  <SliderControl
                    label="Mouse Momentum"
                    value={settings.mouseMomentum}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(value) => handleSettingChange('mouseMomentum', value)}
                    description="Trägheit der Maus-Bewegung"
                  />
                </div>
              </motion.div>
            </div>

            {/* Center Panel - Beam Settings */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center mb-4">
                  <Settings className="w-5 h-5 mr-2 text-purple-400" />
                  <Heading level={3} className="text-lg text-purple-400">Beam-Einstellungen</Heading>
                </div>
                
                <div className="space-y-4">
                  <SliderControl
                    label="Radius"
                    value={settings.radius}
                    min={0.1}
                    max={2}
                    step={0.01}
                    onChange={(value) => handleSettingChange('radius', value)}
                    description="Größe des Strahls"
                  />
                  
                  <SliderControl
                    label="Skew"
                    value={settings.skew}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('skew', value)}
                    description="Verzerrung des Strahls"
                  />
                  
                  <SliderControl
                    label="Speed"
                    value={settings.speed}
                    min={0}
                    max={2}
                    step={0.01}
                    onChange={(value) => handleSettingChange('speed', value)}
                    description="Animationsgeschwindigkeit"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center mb-4">
                  <Palette className="w-5 h-5 mr-2 text-pink-400" />
                  <Heading level={3} className="text-lg text-pink-400">Effekte</Heading>
                </div>
                
                <div className="space-y-4">
                  <SliderControl
                    label="Noise Speed"
                    value={settings.noiseSpeed}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('noiseSpeed', value)}
                    description="Geschwindigkeit des Rausch-Effekts"
                  />
                  
                  <SliderControl
                    label="Noise Intensity"
                    value={settings.noiseIntensity}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('noiseIntensity', value)}
                    description="Intensität des Rausch-Effekts"
                  />
                  
                  <SliderControl
                    label="Ripple Speed"
                    value={settings.rippleSpeed}
                    min={0}
                    max={2}
                    step={0.01}
                    onChange={(value) => handleSettingChange('rippleSpeed', value)}
                    description="Geschwindigkeit der Wellen-Effekte"
                  />
                  
                  <SliderControl
                    label="Ripple Frequency"
                    value={settings.rippleFrequency}
                    min={0.1}
                    max={3}
                    step={0.01}
                    onChange={(value) => handleSettingChange('rippleFrequency', value)}
                    description="Frequenz der Wellen"
                  />
                  
                  <SliderControl
                    label="Ripple Strength"
                    value={settings.rippleStrength}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('rippleStrength', value)}
                    description="Stärke der Wellen-Effekte"
                  />
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Controls & Status */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <Heading level={3} className="text-lg text-orange-400 mb-4">Steuerung</Heading>
                
                <div className="space-y-4">
                  <Button
                    onClick={togglePlayPause}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      settings.isPaused 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {settings.isPaused ? (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Animation starten
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Animation pausieren
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={resetToDefaults}
                    className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Auf Standard zurücksetzen
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <Heading level={3} className="text-lg text-cyan-400 mb-4">Status</Heading>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Initialisiert:</span>
                    <span className={isInitialized ? 'text-green-400' : 'text-red-400'}>
                      {isInitialized ? 'Ja' : 'Nein'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={settings.isPlaying ? 'text-green-400' : 'text-orange-400'}>
                      {settings.isPlaying ? 'Läuft' : 'Pausiert'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">FPS:</span>
                    <span className="text-white">{settings.fps}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scale:</span>
                    <span className="text-white">{settings.scale.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Radius:</span>
                    <span className="text-white">{settings.radius.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <Heading level={3} className="text-lg text-yellow-400 mb-4">Gradient</Heading>
                
                <div className="space-y-4">
                  <SliderControl
                    label="Gradient Speed"
                    value={settings.gradientSpeed}
                    min={0}
                    max={2}
                    step={0.01}
                    onChange={(value) => handleSettingChange('gradientSpeed', value)}
                    description="Geschwindigkeit des Farbverlaufs"
                  />
                  
                  <SliderControl
                    label="Gradient Intensity"
                    value={settings.gradientIntensity}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => handleSettingChange('gradientIntensity', value)}
                    description="Intensität des Farbverlaufs"
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <Button
              onClick={() => window.history.back()}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Zurück zur App
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid #1f2937;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
    </div>
  );
};

// TypeScript declaration for UnicornStudio
declare global {
  interface Window {
    UnicornStudio: {
      init: () => Promise<any>;
      destroy: () => void;
      addScene: (config: any) => Promise<any>;
    };
  }
}

export default UnicornAnimationControllerPage;
