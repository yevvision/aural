/// <reference types="vite/client" />

declare global {
  interface Window {
    audioContext?: AudioContext;
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => Promise<any>;
      destroy: () => void;
      setParameter?: (parameter: string, value: any) => void;
      setAnimationSpeed?: (speed: number) => void;
      setColor?: (color: string) => void;
      setIntensity?: (intensity: number) => void;
      addScene?: (config: any) => Promise<any>;
    };
    unicornScenes?: any;
  }
}
