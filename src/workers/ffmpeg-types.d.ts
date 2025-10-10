// Type definitions for ffmpeg worker
declare global {
  interface Worker {
    postMessage(message: any, transfer?: Transferable[]): void;
  }
}

export {};
