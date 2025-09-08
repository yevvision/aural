import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

type UseWaveformEditorOpts = {
  container: HTMLElement | null;
  audioBlob: Blob | null;
  barWidth?: number;
  height?: number;
  selectedSegments?: { start: number; end: number }[];
};

export function useWaveformEditor({ container, audioBlob, barWidth = 2, height = 120, selectedSegments = [] }: UseWaveformEditorOpts) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const [duration, setDuration] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const create = useCallback(() => {
    if (!container) {
      console.warn('useWaveformEditor: Container not available, cannot create WaveSurfer.');
      return;
    }
    
    console.log('useWaveformEditor: Creating WaveSurfer instance...');
    
    // Destroy previous instance if any
    if (wsRef.current) {
      console.log('useWaveformEditor: Destroying previous WaveSurfer instance');
      wsRef.current.destroy();
    }

    try {
      const ws = WaveSurfer.create({
        container,
        height,
        barWidth,
        barGap: 1,
        barRadius: 3,
        waveColor: '#6b7280',      // lighter gray for better visibility
        progressColor: '#f97316',  // orange-500 for better contrast
        cursorColor: '#ffffff',
        interact: true,
        normalize: true,
        minPxPerSec: 15,           // Better zoom level for mobile
        autoScroll: true,
        autoCenter: true,
        // backgroundColor: 'rgba(0, 0, 0, 0.1)', // subtle background
      });

      console.log('useWaveformEditor: WaveSurfer created successfully');

      // Regions plugin - simplified approach
      const regions = ws.registerPlugin(RegionsPlugin.create());
      regionsRef.current = regions;
      console.log('useWaveformEditor: Regions plugin registered.');

      // Event handlers
      regions.on('region-created', (region: any) => {
        console.log('useWaveformEditor: Region created:', region.start, region.end);
        setSelection({ start: region.start, end: region.end });
      });
      
      regions.on('region-updated', (region: any) => {
        console.log('useWaveformEditor: Region updated:', region.start, region.end);
        setSelection({ start: region.start, end: region.end });
      });
      
      regions.on('region-clicked', (region: any, e: MouseEvent) => {
        e.stopPropagation();
        console.log('useWaveformEditor: Region clicked:', region.start, region.end);
        setSelection({ start: region.start, end: region.end });
      });
      
      regions.on('region-removed', (region: any) => {
        console.log('useWaveformEditor: Region removed');
        setSelection(null);
      });

      ws.on('ready', () => {
        setIsReady(true);
        setDuration(ws.getDuration());
        console.log('useWaveformEditor: WaveSurfer ready, duration:', ws.getDuration());
      });

      ws.on('error', (err) => {
        console.error('useWaveformEditor: WaveSurfer error:', err);
        setIsReady(false);
      });

      // Prevent double-click from removing regions
      ws.on('dblclick', (relativeX: number) => {
        console.log('useWaveformEditor: Double-click detected on waveform, preventing default behavior');
      });

      wsRef.current = ws;
      console.log('useWaveformEditor: WaveSurfer instance created successfully.');
    } catch (error) {
      console.error('useWaveformEditor: Error creating WaveSurfer:', error);
    }
  }, [container, barWidth, height]);

  const loadAudio = useCallback(async () => {
    if (!wsRef.current || !audioBlob) {
      console.log('useWaveformEditor: loadAudio skipped: wsRef.current or audioBlob is null', { 
        wsRef: !!wsRef.current, 
        audioBlob: !!audioBlob 
      });
      return;
    }
    
    setIsReady(false);
    setSelection(null);

    console.log('useWaveformEditor: Attempting to load audio blob:', { 
      size: audioBlob.size, 
      type: audioBlob.type 
    });
    
    try {
      await wsRef.current.loadBlob(audioBlob);
      console.log('useWaveformEditor: Audio load initiated. Waiting for "ready" event...');
    } catch (error) {
      console.error('useWaveformEditor: Failed to load audio into WaveSurfer:', error);
      setIsReady(false);
    }
  }, [audioBlob]);

  useEffect(() => {
    if (container) {
      console.log('useWaveformEditor: Container available, creating WaveSurfer...');
      create();
    } else {
      console.log('useWaveformEditor: Container not available yet, waiting...');
    }
    return () => {
      console.log('useWaveformEditor: Destroying WaveSurfer instance...');
      if (wsRef.current) {
        wsRef.current.destroy();
        wsRef.current = null;
      }
    };
  }, [create, container]);

  useEffect(() => {
    if (wsRef.current && audioBlob && container) {
      loadAudio();
    } else {
      console.log('useWaveformEditor: Skipping loadAudio useEffect. wsRef.current:', !!wsRef.current, 'audioBlob:', !!audioBlob, 'container:', !!container);
    }
  }, [audioBlob, loadAudio, container]);

  const addOrReplaceRegion = useCallback((start = 0, end?: number) => {
    console.log('useWaveformEditor: addOrReplaceRegion called with:', { start, end, isReady, hasRegions: !!regionsRef.current, hasWaveSurfer: !!wsRef.current });
    
    if (!regionsRef.current || !wsRef.current || !isReady) {
      console.warn('useWaveformEditor: Cannot add region - missing dependencies:', { 
        regions: !!regionsRef.current, 
        wavesurfer: !!wsRef.current, 
        ready: isReady 
      });
      return;
    }
    
    try {
      // Clear existing regions
      const existingRegions = regionsRef.current.getRegions();
      console.log('useWaveformEditor: Clearing', existingRegions.length, 'existing regions');
      existingRegions.forEach((r: any) => r.remove());

      const dur = wsRef.current.getDuration();
      console.log('useWaveformEditor: Audio duration:', dur);
      
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      // Default to entire audio duration if no end specified
      const s = clamp(start, 0, dur);
      const e = clamp(end ?? dur, s, dur); // Use full duration as default

      console.log('useWaveformEditor: Creating region from', s, 'to', e, '(full duration)');

      // Use the correct API for WaveSurfer v7 with more visible styling
      const region = regionsRef.current.addRegion({
        start: s,
        end: e,
        color: 'rgba(249, 115, 22, 0.25)', // Orange overlay for selected area
        borderColor: 'rgba(249, 115, 22, 0.9)', // Strong orange border
        borderWidth: 3, // Thicker border for better visibility
        drag: true,
        resize: true,
        resizeColor: 'rgba(249, 115, 22, 1)', // Orange resize handles
      });
      
      console.log('useWaveformEditor: Region created successfully:', region);
      setSelection({ start: s, end: e });
      
      // Seek to start for immediate feedback
      wsRef.current.setTime(s);
    } catch (error) {
      console.error('useWaveformEditor: Error creating region:', error);
    }
  }, [isReady]);

  // Function to update selected segments visualization
  const updateSelectedSegmentsVisualization = useCallback(() => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    
    // Remove existing selected segment regions
    const existingRegions = regionsRef.current.getRegions();
    existingRegions.forEach((region: any) => {
      if (region.id && region.id.startsWith('selected-segment-')) {
        region.remove();
      }
    });
    
    // Add new selected segment regions
    selectedSegments.forEach((segment, index) => {
      const region = regionsRef.current.addRegion({
        start: segment.start,
        end: segment.end,
        color: 'rgba(59, 130, 246, 0.3)', // Blue overlay for selected segments
        borderColor: 'rgba(59, 130, 246, 0.9)', // Strong blue border
        borderWidth: 3,
        drag: true,
        resize: true,
        resizeColor: 'rgba(59, 130, 246, 1)', // Blue resize handles
        id: `selected-segment-${index}`,
      });
    });
  }, [selectedSegments, isReady]);

  // Update selected segments visualization when selectedSegments change
  useEffect(() => {
    if (isReady) {
      updateSelectedSegmentsVisualization();
    }
  }, [selectedSegments, isReady, updateSelectedSegmentsVisualization]);

  const zoom = (pxPerSec: number) => {
    if (!wsRef.current) return;
    wsRef.current.zoom(pxPerSec);
  };

  const createRegionAtTime = useCallback((time: number) => {
    if (!regionsRef.current || !wsRef.current || !isReady) return;
    
    const duration = wsRef.current.getDuration();
    const start = Math.max(0, time - 2.5); // 5 second region centered on click
    const end = Math.min(duration, time + 2.5);
    
    console.log('useWaveformEditor: Creating region at time:', time, 'from', start, 'to', end);
    addOrReplaceRegion(start, end);
  }, [isReady, addOrReplaceRegion]);

  return {
    wavesurfer: wsRef,
    duration,
    selection,
    isReady,
    addOrReplaceRegion,
    createRegionAtTime,
    updateSelectedSegmentsVisualization,
    zoom,
    play: () => wsRef.current?.play(),
    pause: () => wsRef.current?.pause(),
    playing: () => !!wsRef.current?.isPlaying(),
    setTime: (t: number) => wsRef.current?.setTime(t),
  };
}