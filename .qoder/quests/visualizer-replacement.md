# Visualizer Replacement Design Document

## Overview

This document outlines the design for replacing the current audio visualization component in the RecorderPage with a new Red Glow Visualizer. The replacement will maintain the exact same layout, position, and size as the current visualizer while implementing a more dynamic and visually appealing visualization effect based on the provided HTML/CSS/JS example.

## Current Implementation Analysis

### RecorderPage Component
The current RecorderPage uses the `RealtimeVisualizer` component for audio visualization during recording:

1. **Location**: The visualizer is displayed in the recording interface within a true-black-card container
2. **Component**: `RealtimeVisualizer` from `../components/ui/RealtimeVisualizer`
3. **Props**: 
   - `frequencies`: Audio frequency data from useRealtimeAudioVisualizer hook
   - `volume`: Audio volume level from useRealtimeAudioVisualizer hook
   - `isActive`: Whether visualization is active (linked to recording state)
   - `style`: Set to "bars"
   - `bars`: 20 bars
   - `height`: 60px
   - `className`: "w-full" for full container width

### RedGlowVisualizer Component
The existing `RedGlowVisualizer` component is used in other parts of the application but not in the RecorderPage:

1. **Location**: Used in other pages for playback visualization
2. **Props**: 
   - `track`: Audio track data
   - `isPlaying`: Playback state
   - `currentTime`: Current playback time
   - `duration`: Track duration
3. **Implementation**: Uses CSS-based glowing effects with multiple layers:
   - Main glow: Central pulsing element
   - Halo: Outer glow that expands with intensity
   - Secondary glow: Appears with higher volumes
   - Particles: Floating elements that react to frequencies
   - Inner glow: Additional glowing element
   - Spikes: Radial elements that extend with volume

## Design Requirements

1. **Maintain Layout**: Keep the exact same position, size, and alignment as the current visualizer (60px height, full width container)
2. **Replace Implementation**: Replace the `RealtimeVisualizer` with the new Red Glow Visualizer
3. **Real-time Audio Processing**: Continue to visualize real-time audio input from the microphone
4. **Visual Consistency**: Maintain the app's dark theme and orange-red color scheme
5. **Performance**: Ensure smooth animation without impacting recording performance
6. **Responsive Design**: Adapt to different screen sizes while maintaining aspect ratio
7. **Accessibility**: Ensure the visualizer does not interfere with screen readers or keyboard navigation

## Architecture

### Component Structure
```
RecorderPage
├── RedGlowVisualizer (new implementation)
│   ├── Audio analysis hook (useRealtimeAudioVisualizer)
│   ├── DOM-based visualization (no canvas)
│   └── CSS animations with animejs
```

### Data Flow
1. **Audio Input**: Microphone stream from `useMediaRecorder`
2. **Audio Analysis**: Frequency and volume data from `useRealtimeAudioVisualizer` hook
3. **Data Mapping**: Map frequency/volume data to visual parameters
4. **Visualization**: Red Glow Visualizer component renders visual effects based on mapped audio data

## Implementation Plan

### 1. Create New Red Glow Visualizer Component

The new component will be based on the HTML/CSS/JS example provided but adapted for React. It will maintain the same 60px height as the current visualizer and span the full width of its container.

#### Core Elements
- **Main Glow**: Central pulsing element that reacts to volume (40px)
- **Halo**: Outer glow that expands with audio intensity (100px)
- **Secondary Glow**: Appears with higher volumes (25px)
- **Inner Glow**: Additional glowing element (20px)
- **Particles**: Floating elements that react to different frequencies
- **Spikes**: Radial elements that extend with volume

#### Styling (CSS Classes)
The visualizer will use CSS classes similar to those in the existing RedGlowVisualizer component but adapted for the 60px height constraint:

```css
#visualizer {
  position: relative;
  width: 100%;
  height: 60px; /* Match current height */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
  pointer-events: none;
}

.glow-core {
  position: absolute;
  filter: blur(8px);
  mix-blend-mode: screen;
  transition: all 0.1s ease-out;
  will-change: transform, border-radius;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

#main-glow {
  width: 20px;
  height: 20px;
  background: #FFF2D0;
  box-shadow: 0 0 15px 8px #FF2B17;
  border-radius: 50%;
}

#halo {
  width: 40px;
  height: 40px;
  background: #FF3A20;
  box-shadow: 0 0 30px 15px #FF6A30;
  opacity: 0.3;
  border-radius: 50%;
}

#secondary-glow {
  width: 15px;
  height: 15px;
  background: #E03A2A;
  box-shadow: 0 0 10px 5px #FF6A30;
  opacity: 0;
  border-radius: 50%;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: #FF6A30;
  filter: blur(1px);
  mix-blend-mode: screen;
  opacity: 0;
  width: 2px;
  height: 2px;
}

.spike {
  position: absolute;
  background: #FF3A20;
  filter: blur(1px);
  mix-blend-mode: screen;
  opacity: 0;
  width: 1px;
  height: 10px;
  transform-origin: center bottom;
}
```

### 2. Audio Analysis Integration

#### Current Hook: `useRealtimeAudioVisualizer`
The existing hook provides:
- `visualizerData.frequencies`: Array of frequency values (0-1 range)
- `visualizerData.volume`: Current volume level (0-1 range)
- `visualizerData.isActive`: Whether audio is active

#### Data Mapping
- **Volume Level**: Map to glow intensity, size, and opacity
- **Frequency Data**: Map to particle movement, spike extension, and color variations
- **Activity Status**: Control animation states (active vs. idle)

### 3. Component Integration

#### Props Interface
```typescript
interface RedGlowVisualizerProps {
  frequencies: number[];
  volume: number;
  isActive: boolean;
}
```

#### Rendering Logic
1. **Initialization**: Create particles and spikes on mount
2. **Animation Loop**: Update visual elements based on audio data
3. **Idle State**: Subtle animation when no audio is detected

## Technical Specifications

### Performance Considerations
1. **RequestAnimationFrame**: Use for smooth animations
2. **Efficient Updates**: Only update elements when audio data changes
3. **Memory Management**: Proper cleanup of animation frames and elements

### Browser Compatibility
1. **Web Audio API**: Required for audio analysis
2. **CSS Blend Modes**: For glow effects
3. **CSS Animations**: For smooth transitions

### Responsive Design
1. **Fixed Height**: 60px to match current visualizer
2. **Flexible Width**: Full container width
3. **Centered Elements**: All visual elements centered

## Integration Steps

### 1. Create New Component
- Create `RedGlowVisualizer` component in `src/components/audio/`
- Implement core visualization logic
- Add CSS styling

### 2. Update RecorderPage
- Replace `RealtimeVisualizer` with new `RedGlowVisualizer`
- Pass required props from `useRealtimeAudioVisualizer`

### 3. Maintain Existing Functionality
- Preserve all other RecorderPage functionality
- Ensure consistent styling with rest of application

## Testing Strategy

### Unit Tests
1. **Component Rendering**: Verify component renders without errors
2. **Props Handling**: Test with various frequency/volume combinations
3. **Animation States**: Verify idle and active states

### Integration Tests
1. **Audio Data Flow**: Ensure visualizer responds to real audio input
2. **Performance**: Monitor frame rate during visualization
3. **Cleanup**: Verify proper cleanup on component unmount

### Visual Verification
1. **Layout Consistency**: Confirm same position/size as original
2. **Color Scheme**: Match app's orange-red gradient theme
3. **Animation Quality**: Smooth transitions and effects

## Dependencies

### Existing Dependencies
- `react` (v18+)
- `framer-motion` (for animations)
- Web Audio API (browser built-in)

### New Dependencies
- `animejs` (for advanced animations, if needed)

## Rollback Plan

If issues arise with the new visualizer:
1. Revert to using `RealtimeVisualizer` component
2. Restore original RecorderPage implementation
3. Maintain backward compatibility with existing audio hooks