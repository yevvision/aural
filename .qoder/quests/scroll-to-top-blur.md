# Scroll-to-Top Blur Effect Implementation

## Overview

This document outlines the implementation of a scroll-to-top blur effect feature where content below the top navigation becomes blurry and slightly transparent when scrolling. The effect will only apply to the area beneath the top navigation bar, without adding a visible container to the navigation itself.

## Requirements

1. When users scroll down the page, content beneath the top navigation should become blurry and slightly transparent
2. The top navigation itself should remain unaffected and not gain a visible container
3. The effect should be smooth and performant
4. The implementation should work across all pages that use the AppLayout component

## Technical Approach

### CSS Implementation

We'll use CSS backdrop filters to create the blur effect. The approach involves:

1. Creating a pseudo-element that covers the content area beneath the navigation
2. Applying `backdrop-filter: blur()` to create the blur effect
3. Using `opacity` to create the transparency effect
4. Conditionally applying the effect based on scroll position

### React Implementation

We'll implement scroll position tracking using a custom hook:

1. Create a `useScrollBlur` hook to detect when content is scrolled beneath the navigation
2. Add state to track whether the blur effect should be active
3. Apply CSS classes conditionally based on scroll position

### Component Modifications

1. Modify `AppLayout.tsx` to use the `useScrollBlur` hook and apply the blur effect
2. Update CSS to include the blur effect styles

## Implementation Details

### 1. Create the useScrollBlur Custom Hook

We'll create a custom hook that:
- Tracks scroll position using useEffect
- Adds state to track whether the blur effect should be active
- Returns a boolean indicating whether the blur effect should be applied

### 2. Update AppLayout Component

The `AppLayout.tsx` component will be modified to:
- Import and use the `useScrollBlur` hook
- Add a conditional CSS class to the main content area when scrolling
- Ensure the blur effect only applies to content beneath the navigation

### 3. CSS Styles

We'll add new CSS classes:
- `.content-blur` - Applies the blur and transparency effect
- Ensure the effect only applies to the area beneath the navigation using proper positioning

## Component Architecture

```
graph TD
    A[AppLayout Component] --> B[useScrollBlur Hook]
    A --> C[Main Content Area]
    B --> D[Scroll Position Tracking]
    D --> E[Apply/Remove Blur Classes]
    C --> F[Conditional CSS Classes]
```

## State Management

The scroll blur effect will be managed through the `useScrollBlur` custom hook:
- `isScrolled` - Boolean indicating whether content is scrolled beneath navigation
- Updated via scroll event listener in the hook
- Returned to the AppLayout component for conditional styling

## Styling Approach

### CSS Implementation

We'll use the `::before` pseudo-element on the main content area to create the blur effect. This approach ensures:
1. The blur effect only applies to content beneath the navigation
2. The navigation remains unaffected
3. No additional DOM elements are needed

### CSS Classes and Properties

```
.content-blur::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px; /* Height of top navigation */
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
  opacity: 0.9;
  pointer-events: none;
  z-index: 40; /* Above content but below navigation */
}

/* Fallback for browsers that don't support backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .content-blur::before {
    background: rgba(0, 0, 0, 0.3);
  }
}
```

## Performance Considerations

1. Use passive scroll event listeners to improve performance
2. Throttle scroll events to prevent performance degradation
3. Use CSS transforms and opacity for hardware acceleration
4. Apply `will-change` property to elements that will change

## Accessibility

1. Ensure the blur effect doesn't negatively impact readability for users with visual impairments
2. Maintain sufficient color contrast ratios even with the blur effect applied
3. Consider users who prefer reduced motion and provide appropriate settings

## Testing Strategy

### Unit Tests
1. Test the `useScrollBlur` hook with different scroll positions
2. Verify the hook returns correct boolean values
3. Test edge cases like rapid scrolling
4. Verify proper cleanup of event listeners

### Integration Tests
1. Verify the blur effect is applied to the correct content area
2. Test that navigation remains unaffected
3. Check cross-browser compatibility

### Visual Regression Tests
1. Capture screenshots with and without the blur effect
2. Verify consistent rendering across devices
3. Test various screen sizes and orientations

## Files to be Modified

1. `src/components/layout/AppLayout.tsx` - Main implementation
2. `src/hooks/useScrollBlur.ts` - New custom hook (to be created)
3. `src/index.css` - CSS styles for the effect

## Implementation Steps

### Step 1: Create the useScrollBlur Custom Hook

Create a new file `src/hooks/useScrollBlur.ts` with the following implementation:

```typescript
import { useState, useEffect } from 'react';

export const useScrollBlur = (threshold = 10) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Update state based on scroll position
      setIsScrolled(window.scrollY > threshold);
    };
    
    // Add passive scroll listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return isScrolled;
};
```

### Step 2: Modify AppLayout.tsx

Update `src/components/layout/AppLayout.tsx` to use the new hook:

```tsx
import { useScrollBlur } from '../../hooks/useScrollBlur';

export const AppLayout = () => {
  const { currentTrack } = usePlayerStore();
  const location = useLocation();
  const [visibleAudioCardId, setVisibleAudioCardId] = useState<string | null>(null);
  
  // Add scroll blur effect
  const isScrolled = useScrollBlur(10);
  
  // Initialize the global audio manager once at the app level
  useEffect(() => {
    initializeGlobalAudioManager();
  }, []);
  
  // Use the audio manager to handle state changes
  useGlobalAudioManager();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      {/* Organic Orange Morph Background - Changes with route navigation */}
      <OrganicOrangeMorphBackground />
      
      <div className="min-h-screen flex flex-col text-text-primary relative">
        {/* Top Navigation */}
        <TopNavigation />
        
        {/* Main Content with top padding to prevent overlap with fixed nav */}
        <main className={`flex-1 overflow-hidden pt-20 ${currentTrack ? 'pb-24' : ''} ${isScrolled ? 'content-blur' : ''}`}>
          <div style={{ minHeight: '100%' }}>
            <Outlet context={{ visibleAudioCardId, setVisibleAudioCardId }} />
          </div>
        </main>
        
        {/* Mini Player - fixed at bottom of screen when there's a current track and no visible audio card */}
        {currentTrack && !visibleAudioCardId && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <MiniPlayer displayMode="fixed" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
```

### Step 3: Add CSS Styles

Add the following CSS to `src/index.css`:

```css
/* Scroll blur effect for content beneath navigation */
.content-blur::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px; /* Height of top navigation */
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
  opacity: 0.9;
  pointer-events: none;
  z-index: 40; /* Above content but below navigation (z-50) */
}

/* Fallback for browsers that don't support backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .content-blur::before {
    background: rgba(0, 0, 0, 0.3);
  }
}
```

### Step 4: Testing and Optimization

1. Test the implementation across different pages (FeedPage, ProfilePage, etc.)
2. Verify the effect works on various screen sizes and devices
3. Optimize scroll event handling with throttling if needed for better performance
4. Ensure accessibility compliance with proper color contrast

### Step 5: Cross-browser Compatibility

1. Test on major browsers (Chrome, Firefox, Safari, Edge)
2. Add fallbacks for browsers that don't support backdrop-filter
3. Verify mobile responsiveness and touch interactions

## Success Criteria

1. Content beneath the navigation becomes blurry and transparent when scrolling
2. Navigation remains unaffected and without a visible container
3. Effect is smooth and performant
4. Implementation works consistently across all pages
5. No negative impact on accessibility