/// <reference types="vite/client" />

declare global {
  interface Window {
    audioContext?: AudioContext;
  }
}
