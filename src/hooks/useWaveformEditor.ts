import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

type UseWaveformEditorOpts = {
  container: HTMLElement | null;
  audioBlob: Blob | null;
  barWidth?: number;
  height?: number;
};

export function useWaveformEditor({ container, audioBlob, barWidth = 2, height = 120 }: UseWaveformEditorOpts) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<ReturnType<typeof RegionsPlugin['create']> | null>(null);
  const [duration, setDuration] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [allRegions, setAllRegions] = useState<{ start: number; end: number; id: string }[]>([]);

  const create = useCallback(() => {
    if (!container) return;
    
    try {
      // Destroy previous instance if any
      wsRef.current?.destroy();

      const ws = WaveSurfer.create({
        container,
        height,
        barWidth,
        barGap: 1,
        barRadius: 2,
        waveColor: '#9ca3af',      // neutral gray
        progressColor: '#ef4444',  // red-500
        cursorColor: '#ffffff',
        interact: true,
        normalize: true,
        minPxPerSec: 50,           // improves touch scrubbing accuracy
        autoScroll: true,
        autoCenter: true,
      });

      // Regions plugin
      const regions = ws.registerPlugin(RegionsPlugin.create());
      // Touch: regions are draggable/resizable by default
      regions.on('region-created', (r: any) => {
        console.log('Region created:', r);
        const newRegion = { start: r.start, end: r.end, id: r.id };
        setAllRegions(prev => [...prev, newRegion]);
        setSelection({ start: r.start, end: r.end });
      });
      regions.on('region-updated', (r: any) => {
        console.log('Region updated:', r);
        setAllRegions(prev => prev.map(region => 
          region.id === r.id ? { ...region, start: r.start, end: r.end } : region
        ));
        setSelection({ start: r.start, end: r.end });
      });
      regions.on('region-clicked', (r: any, e: MouseEvent) => {
        e.stopPropagation();
        console.log('Region clicked:', r);
        setSelection({ start: r.start, end: r.end });
      });
      regions.on('region-removed', (r: any) => {
        console.log('Region removed:', r);
        setAllRegions(prev => prev.filter(region => region.id !== r.id));
      });

      ws.on('ready', () => {
        console.log('WaveSurfer: Ready, duration:', ws.getDuration());
        setIsReady(true);
        setDuration(ws.getDuration());
      });

      ws.on('error', (error: any) => {
        console.error('WaveSurfer error:', error);
      });

      wsRef.current = ws;
      regionsRef.current = regions;
    } catch (error) {
      console.error('Failed to create WaveSurfer instance:', error);
    }
  }, [container, barWidth, height]);

  useEffect(() => {
    if (!container) return;
    create();
    return () => { wsRef.current?.destroy(); wsRef.current = null; };
  }, [container]); // Remove create from dependencies to prevent infinite loop

  useEffect(() => {
    if (audioBlob && wsRef.current) {
      console.log('WaveSurfer: Loading audio blob, size:', audioBlob.size);
      try {
        // Directly load recording blob
        wsRef.current.loadBlob(audioBlob);
      } catch (error) {
        console.error('Failed to load audio blob:', error);
      }
    }
  }, [audioBlob]);

  const addOrReplaceRegion = useCallback((start = 0, end?: number) => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    // Clear existing regions
    const existingRegions = regionsRef.current.getRegions();
    existingRegions.forEach((region: any) => region.remove());

    const dur = wsRef.current.getDuration();
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const s = clamp(start, 0, dur);
    const e = clamp(end ?? s + Math.min(5, dur - s), s, dur);

    const region = regionsRef.current.addRegion({
      start: s,
      end: e,
      color: 'rgba(245, 158, 11, 0.25)', // orange
      drag: true,
      resize: true,
    });
    setSelection({ start: s, end: e });
    // Seek to start for immediate feedback
    wsRef.current.setTime(s);
  }, [isReady]);

  const addNewRegion = useCallback((start = 0, end?: number) => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    
    const dur = wsRef.current.getDuration();
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const s = clamp(start, 0, dur);
    const e = clamp(end ?? s + Math.min(5, dur - s), s, dur);

    // All regions are orange
    const region = regionsRef.current.addRegion({
      start: s,
      end: e,
      color: 'rgba(245, 158, 11, 0.25)', // orange
      drag: true,
      resize: true,
    });
    
    console.log('Added new region:', { start: s, end: e, id: region.id });
    setSelection({ start: s, end: e });
  }, [isReady, allRegions.length]);

  const removeRegion = useCallback((start: number, end: number) => {
    if (!regionsRef.current) return;
    
    const regions = regionsRef.current.getRegions();
    const regionToRemove = regions.find((region: any) => 
      Math.abs(region.start - start) < 0.01 && Math.abs(region.end - end) < 0.01
    );
    
    if (regionToRemove) {
      regionToRemove.remove();
      console.log('Removed region:', { start, end });
    }
  }, []);

  // Auto-create initial region when audio is ready
  useEffect(() => {
    if (isReady && duration > 0 && allRegions.length === 0) {
      // Create initial region covering the first 5 seconds or full duration if shorter
      const initialEnd = Math.min(5, duration);
      addNewRegion(0, initialEnd);
    }
  }, [isReady, duration, allRegions.length, addNewRegion]);

  const zoom = useCallback((pxPerSec: number) => {
    if (!wsRef.current) return;
    wsRef.current.zoom(pxPerSec);
  }, []);

  const play = useCallback(() => {
    wsRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    wsRef.current?.pause();
  }, []);

  const playing = useCallback(() => {
    return !!wsRef.current?.isPlaying();
  }, []);

  const setTime = useCallback((t: number) => {
    wsRef.current?.setTime(t);
  }, []);

  return {
    wavesurfer: wsRef,
    duration,
    selection,
    isReady,
    allRegions,
    addOrReplaceRegion,
    addNewRegion,
    removeRegion,
    zoom,
    play,
    pause,
    playing,
    setTime,
  };
}