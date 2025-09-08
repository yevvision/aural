# Audio Card Player Implementation Design

## Overview
This document outlines the implementation design for enhancing the AudioCard component to include an inline MiniPlayer when clicked. The MiniPlayer will initially appear within the AudioCard and transition to the fixed position at the bottom of the screen when the card is scrolled out of view.

## Requirements
1. When an AudioCard is clicked, the MiniPlayer should appear within the card
2. The inline MiniPlayer should contain:
   - Play/Pause button on the left
   - Progress bar in the center
   - Like and Expand buttons on the right
3. When the AudioCard is scrolled out of view, the inline MiniPlayer should transition to the fixed position at the bottom
4. When scrolling back to the AudioCard, the fixed MiniPlayer should transition back to the inline version

## Current Implementation Analysis

### MiniPlayer Component
The existing `MiniPlayer.tsx` component is currently rendered in a fixed position at the bottom of the screen in `AppLayout.tsx` when there's a current track playing. It includes:
- Progress bar with seek functionality
- Play/Pause button
- Track information (title, artist, likes, duration)
- Like button with animation
- Expand button to navigate to full player

### AudioCard Component
The `AudioCard.tsx` component currently:
- Handles play/pause functionality through `useAudioPlayer` hook
- Displays track information (title, metadata)
- Supports delete functionality for user's own tracks
- Uses framer-motion for animations

### State Management
Playback state is managed through `usePlayerStore` which includes:
- Current track information
- Playback status (playing/paused)
- Current time and duration
- Expanded state (for full player)

The feed store (`useFeedStore`) manages track data including likes and bookmarks.

## Architecture

### Component Structure
The implementation will involve modifications to the following components:

1. **AudioCard Component** (`/src/components/feed/AudioCard.tsx`)
   - Add inline MiniPlayer when a track is playing
   - Implement Intersection Observer to detect when the card is in/out of view
   - Manage transition between inline and fixed MiniPlayer states

2. **MiniPlayer Component** (`/src/components/audio/MiniPlayer.tsx`)
   - Refactor to support both inline and fixed display modes through props
   - Add transition animations between modes
   - Modify to conditionally render elements based on display mode

3. **New InlineMiniPlayer Component** (`/src/components/audio/InlineMiniPlayer.tsx`)
   - Create a simplified version of MiniPlayer for inline display within AudioCard
   - Share core functionality with MiniPlayer through common hooks

### State Management
The existing player store will be extended to track:
- Current display mode of MiniPlayer (inline or fixed)
- Reference to the parent AudioCard for inline display

### Visibility Detection
Implement Intersection Observer API to detect when the AudioCard is in or out of the viewport. This approach is more performant than scroll listeners for this use case.

## Implementation Details

### 1. AudioCard Component Modifications
The AudioCard component will be enhanced with:
- Logic to render the inline MiniPlayer when its track is playing
- Intersection Observer to detect when the card is in/out of view
- State management for inline MiniPlayer visibility
- Refactored structure to accommodate the inline player

```tsx
// Enhanced AudioCard with inline MiniPlayer
const AudioCard = ({ track }) => {
  const { currentTrack, isPlaying } = useAudioPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;
  const [isCardVisible, setIsCardVisible] = useState(true);
  const audioCardRef = useRef<HTMLDivElement>(null);
  
  // Initialize Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );
    
    if (audioCardRef.current) {
      observer.observe(audioCardRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <div ref={audioCardRef} className="audio-card relative">
      {/* Audio card content */}
      
      {/* Inline MiniPlayer when track is playing and card is visible */}
      {isTrackPlaying && isCardVisible && (
        <InlineMiniPlayer track={track} />
      )}
    </div>
  );
};
```

### 2. MiniPlayer Component Refactoring
The existing MiniPlayer component will be refactored to:
- Support both inline and fixed display modes through a `displayMode` prop
- Handle transition animations between modes using framer-motion
- Conditionally render elements based on display mode (e.g., track info in fixed mode only)
- Receive display mode as a prop: `inline` or `fixed`
- Maintain all existing functionality but adapt styling based on mode

```tsx
// Refactored MiniPlayer with display mode prop
const MiniPlayer = ({ displayMode = 'fixed' }: { displayMode?: 'inline' | 'fixed' }) => {
  // ... existing logic ...
  
  return (
    <motion.div
      className={`glass-surface ${displayMode === 'inline' ? 
        'rounded-lg border border-white/10 bg-black/90 p-2' : 
        'rounded-none border-t border-white/10 safe-area-bottom bg-black/90 pb-2'}`}
    >
      {/* Progress bar */}
      <div className={displayMode === 'inline' ? 'pt-2 pb-1' : 'px-4 pt-4 pb-3'}>
        {/* ... progress bar ... */}
      </div>

      <div className="flex items-center justify-between">
        {/* Play/Pause button */}
        {/* ... */}
        
        {/* Track info - only in fixed mode */}
        {displayMode === 'fixed' && (
          <div className="flex-1 min-w-0 mx-4 overflow-hidden">
            {/* ... track info ... */}
          </div>
        )}
        
        {/* Controls */}
        {/* ... */}
      </div>
    </motion.div>
  );
};
```

### 3. InlineMiniPlayer Component Creation
A new component will be created with:
- Simplified UI for inline display within AudioCard
- Same core functionality as the fixed MiniPlayer (play/pause, progress, like, expand)
- Reduced height and compact design to fit within AudioCard
- Shared logic with MiniPlayer through common hooks

To avoid duplicating logic, a shared hook will be created:

```tsx
// usePlayerControls.ts
export const usePlayerControls = (track: AudioTrack) => {
  const { isPlaying, toggle, seek } = useAudioPlayer();
  const { tracks, toggleLike } = useFeedStore();
  
  // Find the current track in the feed store to get the latest like state
  const feedTrack = tracks.find(t => t.id === track.id);
  const updatedTrack = feedTrack ? { ...track, ...feedTrack } : track;
  
  // Progress and time formatting logic
  const [progressWidth, setProgressWidth] = useState(0);
  const [displayDuration, setDisplayDuration] = useState('0:00');
  
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle progress updates
  // ... shared progress logic ...
  
  return {
    isPlaying,
    updatedTrack,
    progressWidth,
    displayDuration,
    formatTime,
    toggle,
    seek,
    toggleLike
  };
};

// InlineMiniPlayer component
const InlineMiniPlayer = ({ track }: { track: AudioTrack }) => {
  const {
    isPlaying,
    updatedTrack,
    progressWidth,
    displayDuration,
    formatTime,
    toggle,
    seek,
    toggleLike
  } = usePlayerControls(track);
  
  const navigate = useNavigate();
  
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <div className="flex items-center justify-between">
        {/* Play/Pause button */}
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-full border border-white flex items-center justify-center"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        
        {/* Progress bar */}
        <div className="flex-1 mx-3">
          {/* ... progress bar ... */}
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(updatedTrack.id);
            }}
            className="w-8 h-8 rounded-full border border-white flex items-center justify-center"
            aria-label={updatedTrack.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart 
              size={14} 
              className={updatedTrack.isLiked ? "fill-white text-white" : "text-white"} 
            />
          </button>
          
          <button
            onClick={() => navigate(`/player/${updatedTrack.id}`)}
            className="w-8 h-8 rounded-full border border-white flex items-center justify-center"
            aria-label="Expand player"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 4. Visibility Detection Implementation
Using the Intersection Observer API:
- Create an observer in AudioCard to track visibility
- When the card is out of view and a track is playing, show fixed MiniPlayer
- When the card comes back into view, hide fixed MiniPlayer and show inline version

A context will be created to share visibility state between components:

```tsx
// VisibilityContext.ts
interface VisibilityContextType {
  visibleAudioCardId: string | null;
  setVisibleAudioCardId: (id: string | null) => void;
}

const VisibilityContext = createContext<VisibilityContextType>({
  visibleAudioCardId: null,
  setVisibleAudioCardId: () => {},
});

// In AppLayout
const AppLayout = () => {
  const { currentTrack } = usePlayerStore();
  const [visibleAudioCardId, setVisibleAudioCardId] = useState<string | null>(null);
  
  return (
    <VisibilityContext.Provider value={{ visibleAudioCardId, setVisibleAudioCardId }}>
      <div className="min-h-screen">
        {/* ... other components ... */}
        
        <main className={`flex-1 overflow-hidden pt-20 ${currentTrack ? 'pb-24' : ''}`}>
          <Outlet />
        </main>
        
        {/* Fixed MiniPlayer - shown when there's a current track */}
        {/* Will be conditionally shown based on AudioCard visibility */}
        {currentTrack && !visibleAudioCardId && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <MiniPlayer displayMode="fixed" />
          </div>
        )}
      </div>
    </VisibilityContext.Provider>
  );
};

// In AudioCard
const AudioCard = ({ track }) => {
  // ... existing logic ...
  
  const { setVisibleAudioCardId } = useContext(VisibilityContext);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isTrackPlaying) {
          setVisibleAudioCardId(track.id);
        } else if (!entry.isIntersecting && isTrackPlaying) {
          setVisibleAudioCardId(null);
        }
      },
      { threshold: 0.5 }
    );
    
    if (audioCardRef.current) {
      observer.observe(audioCardRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [isTrackPlaying]);
  
  // ... rest of component ...
};
```

## Data Flow

### Initial State
1. User clicks on an AudioCard
2. Track begins playing in the player store through `useAudioPlayer`
3. AudioCard detects it's the current track and shows inline MiniPlayer
4. Fixed MiniPlayer in AppLayout is hidden (since AudioCard is visible)

### Scrolling Out of View
1. User scrolls, causing AudioCard to leave viewport
2. Intersection Observer in AudioCard detects card is no longer visible
3. AudioCard communicates visibility state to MiniPlayer
4. Fixed MiniPlayer in AppLayout becomes visible
5. Inline MiniPlayer transitions out, fixed MiniPlayer transitions in

### Scrolling Back Into View
1. User scrolls back to AudioCard
2. Intersection Observer in AudioCard detects card is visible again
3. AudioCard communicates visibility state to MiniPlayer
4. Fixed MiniPlayer in AppLayout becomes hidden
5. Fixed MiniPlayer transitions out, inline MiniPlayer transitions in

## Communication Flow

The communication between components will work as follows:

1. **AudioCard** ↔ **Player Store**: AudioCard monitors the player store to determine if its track is currently playing
2. **AudioCard** ↔ **Intersection Observer**: AudioCard uses Intersection Observer to detect its visibility
3. **AudioCard** → **AppLayout**: AudioCard visibility state needs to be communicated to AppLayout to control fixed MiniPlayer visibility
4. **MiniPlayer** ↔ **Player Store**: MiniPlayer gets all playback state from the player store

This can be implemented through:
- Context API to share visibility state between AudioCard and AppLayout
- Direct props passing
- Custom hook for visibility state management

## UI/UX Considerations

### Visual Design
- Inline MiniPlayer will have a compact design to fit within AudioCard (reduced height)
- Consistent styling with the fixed MiniPlayer but adapted for inline context
- Smooth transitions between inline and fixed modes
- Progress bar will maintain the same visual style in both modes
- Visual continuity of progress bar state during transitions

### Animations
- Fade in/out animations when showing/hiding inline MiniPlayer
- Slide up/down animations when transitioning between modes
- Progress bar will maintain continuous progress during transitions
- Consistent animation timing with existing framer-motion components

### Accessibility
- Maintain keyboard navigation support
- Preserve screen reader compatibility
- Ensure proper focus management during transitions
- Maintain ARIA labels for all interactive elements
- Ensure color contrast meets accessibility standards

### Responsive Design
- Inline MiniPlayer must adapt to different screen sizes
- Consistent touch targets for mobile interaction
- Proper spacing within AudioCard container

## Technical Considerations

### Performance
- Use Intersection Observer API for efficient visibility detection (more performant than scroll listeners)
- Implement throttling for Intersection Observer callbacks if needed
- Optimize re-renders with React.memo where appropriate
- Clean up observers and event listeners properly

### Edge Cases
- Handle multiple AudioCards with the same track (should only show one inline player)
- Manage transitions when quickly scrolling in and out of view
- Handle component unmounting during transitions
- Manage state when navigating between pages
- Handle cases where the browser tab is not active

### State Management
- Ensure player state remains consistent between inline and fixed players
- Handle progress updates during transitions
- Manage like state synchronization between feed store and player

### Memory Management
- Properly disconnect Intersection Observers
- Clean up event listeners
- Avoid memory leaks in useEffect hooks

## Implementation Approach

The implementation will be done in phases to ensure stability and proper testing:

### Phase 1: Foundation
1. Create shared hooks for player functionality to be used by both MiniPlayer and InlineMiniPlayer
2. Refactor existing MiniPlayer to accept display mode props
3. Set up context or state management for visibility tracking

### Phase 2: Inline Player
1. Create InlineMiniPlayer component with core functionality
2. Implement Intersection Observer in AudioCard
3. Add inline player rendering logic to AudioCard

### Phase 3: Transition Logic
1. Implement visibility-based switching between inline and fixed players
2. Add smooth transition animations
3. Ensure state consistency during transitions

### Phase 4: Testing and Refinement
1. Conduct unit testing of all components
2. Perform integration testing
3. Refine animations and transitions
4. Conduct accessibility testing

## Testing Strategy

### Unit Tests
- Test visibility detection logic with Intersection Observer
- Test transition between inline and fixed modes
- Test player functionality in both modes
- Test proper cleanup of observers and listeners

### Integration Tests
- Test complete flow from AudioCard click to MiniPlayer transitions
- Test scrolling behavior with multiple AudioCards
- Test edge cases like rapid scrolling
- Test state consistency between inline and fixed players
- Test like functionality synchronization

### Visual Regression Tests
- Verify inline MiniPlayer appearance within AudioCard
- Verify transitions between modes
- Verify consistent styling with fixed MiniPlayer
- Verify proper spacing and layout in different screen sizes

### Accessibility Tests
- Test keyboard navigation
- Test screen reader compatibility
- Test focus management during transitions

### Performance Tests
- Test Intersection Observer performance with many AudioCards
- Test memory usage and cleanup
- Test smoothness of transitions

## Conclusion

This design document outlines a comprehensive approach to implementing the inline MiniPlayer feature within AudioCards. The key aspects of the implementation include:

1. **Component Architecture**: Creating a new InlineMiniPlayer component that shares functionality with the existing MiniPlayer through common hooks
2. **Visibility Detection**: Using the Intersection Observer API for efficient detection of when AudioCards are in or out of view
3. **State Management**: Implementing a context-based approach to share visibility state between components
4. **Smooth Transitions**: Ensuring seamless transitions between inline and fixed player modes
5. **Performance Optimization**: Proper cleanup of observers and efficient state management

The implementation will be done in phases to ensure stability and proper testing. This approach maintains the existing functionality while adding the requested inline player behavior that transitions to a fixed player when the card is scrolled out of view.