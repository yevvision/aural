export async function concatenateSegments(blob: Blob, segments: { start: number; end: number }[]): Promise<Blob> {
  // Reuse existing AudioContext or create new one
  let ac = (window as any).audioContext;
  if (!ac) {
    ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    (window as any).audioContext = ac;
  }
  
  const arr = await blob.arrayBuffer();
  const audioBuffer = await new Promise<AudioBuffer>((res, rej) =>
    ac.decodeAudioData(arr.slice(0), res, rej)
  );
  
  const sr = audioBuffer.sampleRate;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  
  // Check if we have valid segments
  if (!segments || segments.length === 0) {
    throw new Error('Keine Segmente ausgewählt. Bitte wähle mindestens einen Bereich aus.');
  }
  
  // Calculate total length needed
  let totalLength = 0;
  const processedSegments = segments.map(segment => {
    const start = clamp(segment.start, 0, audioBuffer.duration);
    const end = clamp(segment.end, start, audioBuffer.duration);
    const length = end - start;
    totalLength += length;
    return { start, end, length };
  });
  
  // Check if total length is valid
  if (totalLength <= 0) {
    throw new Error('Ausgewählte Segmente haben keine gültige Länge.');
  }
  
  const totalFrames = Math.floor(totalLength * sr);
  
  // Ensure we have at least 1 frame
  if (totalFrames <= 0) {
    throw new Error('Ausgewählte Segmente sind zu kurz.');
  }
  
  const out = ac.createBuffer(audioBuffer.numberOfChannels, totalFrames, sr);
  
  // Copy each segment to the output buffer
  let currentFrame = 0;
  for (const segment of processedSegments) {
    const startFrame = Math.floor(segment.start * sr);
    const endFrame = Math.floor(segment.end * sr);
    const segmentLength = endFrame - startFrame;
    
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const sourceData = audioBuffer.getChannelData(ch).subarray(startFrame, endFrame);
      out.copyToChannel(sourceData, ch, currentFrame);
    }
    
    currentFrame += segmentLength;
  }
  
  // Convert to WAV
  const oac = new OfflineAudioContext(out.numberOfChannels, out.length, out.sampleRate);
  const src = oac.createBufferSource();
  src.buffer = out;
  src.connect(oac.destination);
  src.start(0);
  const rendered = await oac.startRendering();
  
  // Encode PCM16 WAV
  function audioBufferToWav(ab: AudioBuffer) {
    const numCh = ab.numberOfChannels;
    const len = ab.length;
    const arrayBuffer = new ArrayBuffer(44 + len * numCh * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + len * numCh * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, ab.sampleRate, true);
    view.setUint32(28, ab.sampleRate * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, len * numCh * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < len; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const sample = Math.max(-1, Math.min(1, ab.getChannelData(ch)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }
  
  return new Blob([audioBufferToWav(rendered)], { type: 'audio/wav' });
}

export async function trimToWav(blob: Blob, startSec: number, endSec: number): Promise<Blob> {
  // Reuse existing AudioContext or create new one
  let ac = (window as any).audioContext;
  if (!ac) {
    ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    (window as any).audioContext = ac;
  }
  
  const arr = await blob.arrayBuffer();
  const audioBuffer = await new Promise<AudioBuffer>((res, rej) =>
    ac.decodeAudioData(arr.slice(0), res, rej)
  );
  const sr = audioBuffer.sampleRate;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const s = clamp(startSec, 0, audioBuffer.duration);
  const e = clamp(endSec, s, audioBuffer.duration);
  const startFrame = Math.floor(s * sr);
  const endFrame = Math.floor(e * sr);
  const len = endFrame - startFrame;

  const out = ac.createBuffer(audioBuffer.numberOfChannels, len, sr);
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const slice = audioBuffer.getChannelData(ch).subarray(startFrame, endFrame);
    out.copyToChannel(slice, ch, 0);
  }

  const oac = new OfflineAudioContext(out.numberOfChannels, out.length, out.sampleRate);
  const src = oac.createBufferSource();
  src.buffer = out;
  src.connect(oac.destination);
  src.start(0);
  const rendered = await oac.startRendering();

  // Encode PCM16 WAV
  function audioBufferToWav(ab: AudioBuffer) {
    const numCh = ab.numberOfChannels;
    const sampleRate = ab.sampleRate;
    const samples = ab.length * numCh;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };

    writeStr(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true); writeStr(8, 'WAVE');
    writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    writeStr(36, 'data'); view.setUint32(40, samples * 2, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);

    let offset = 44;
    const tmp = new Float32Array(ab.length);
    for (let ch = 0; ch < numCh; ch++) {
      ab.copyFromChannel(tmp, ch);
      for (let i = 0; i < tmp.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, tmp[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  return audioBufferToWav(rendered);
}

// Optional: ffmpeg.wasm – im Worker, um MP3/AAC zu erstellen
export type EncodeFormat = 'mp3' | 'aac';
export async function encodeWithFfmpegWorker(wavBlob: Blob, fmt: EncodeFormat, kbps = 128): Promise<Blob> {
  // Dynamisch importieren, damit nicht der Main-Bundle wächst, und in Worker ausführen
  return new Promise(async (resolve, reject) => {
    const worker = new Worker(new URL('../workers/ffmpegWorker.ts', import.meta.url), { type: 'module' });
    const reader = new FileReader();
    reader.onload = () => {
      worker.postMessage({ type: 'encode', wavArrayBuffer: reader.result, fmt, kbps });
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(wavBlob);
    worker.onmessage = (e) => {
      const { type, data, error } = e.data || {};
      if (type === 'done') {
        resolve(new Blob([data], { type: fmt === 'mp3' ? 'audio/mpeg' : 'audio/aac' }));
        worker.terminate();
      } else if (type === 'error') {
        worker.terminate();
        reject(error || new Error('ffmpeg encode failed'));
      }
    };
  });
}
