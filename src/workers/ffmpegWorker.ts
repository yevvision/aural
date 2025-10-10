import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

// Hinweis: Passt ggf. Version/URLs an.
let ffmpeg: FFmpeg | null = null;

async function ensureFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist'; // example CDN
  
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    console.log('FFmpeg loaded successfully');
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('FFmpeg konnte nicht geladen werden. Verwende WAV-Export.');
  }
  
  return ffmpeg;
}

self.onmessage = async (e) => {
  const { type, wavArrayBuffer, fmt, kbps } = e.data || {};
  if (type !== 'encode') return;
  try {
    const ff = await ensureFFmpeg();
    // Schreiben der Eingabedatei
    await ff.writeFile('in.wav', new Uint8Array(wavArrayBuffer));

    if (fmt === 'mp3') {
      await ff.exec(['-i', 'in.wav', '-b:a', `${kbps}k`, 'out.mp3']);
      const out = await ff.readFile('out.mp3');
      // Post Message zurück als ArrayBuffer
      (self as any).postMessage({ type: 'done', data: (out as any).buffer }, [(out as any).buffer as ArrayBuffer]);
      return;
    }
    if (fmt === 'aac') {
      await ff.exec(['-i', 'in.wav', '-c:a', 'aac', '-b:a', `${kbps}k`, 'out.aac']);
      const out = await ff.readFile('out.aac');
      (self as any).postMessage({ type: 'done', data: (out as any).buffer }, [(out as any).buffer as ArrayBuffer]);
      return;
    }

    (self as any).postMessage({ type: 'error', error: 'Unsupported format' });
  } catch (err) {
    (self as any).postMessage({ type: 'error', error: String(err) });
  }
};
