# Background Animation Design for Aural App

## Overview

This design document outlines the implementation of a dynamic background animation feature for the Aural mobile web application. The feature will create a morphing orange-red gradient background that transforms smoothly when users navigate between different pages via the top navigation.

The animation will ensure that each page has a distinct background appearance with varying light and dark areas, different positioning, and size variations, all while maintaining smooth transitions without any jarring effects or page reloads.

## Architecture

### Component Structure
- **AppLayout.tsx**: Main layout component that hosts the animated background
- **TopNavigation.tsx**: Navigation component that triggers background changes
- **CSS Styles**: Custom CSS animations and keyframes for background morphing

### Data Flow
1. User clicks on a navigation item in `TopNavigation`
2. Route changes via React Router
3. `AppLayout` detects route change using `useLocation` hook
4. Background variation index is determined based on the current route
5. CSS custom property `--bg-variation` is updated
6. CSS animation keyframes use the variation index to create unique background states
7. Framer Motion handles smooth transitions between states

### Technical Implementation

#### Background Variation Mapping
Each route will be mapped to a specific background variation index:
- Home (/): 1
- Comments (/comments): 2
- Profile (/profile): 3
- Record (/record): 4
- Search (/search): 5

#### CSS Implementation
The background animation will be implemented using:
1. A multi-layered radial gradient system
2. CSS custom properties for variation control
3. Keyframe animations with dynamic property calculations
4. CSS `will-change` property for performance optimization
5. Pseudo-elements for depth effects

## Animation Design

### Visual Characteristics
- **Base Gradient**: Orange to red gradient with multiple layers
- **Dynamic Morphing**: Position, size, and intensity of gradient elements change per route
- **Smooth Transitions**: 30-second infinite animation cycle with seamless transitions
- **Depth Effects**: Multiple pseudo-elements create parallax-like depth
- **Performance Optimized**: Uses hardware acceleration and efficient animations

### Animation States
The background will have 100 keyframes creating a continuous morphing effect:
- Each route variation influences the position and size calculations
- Layers move at different speeds to create depth perception
- Opacity and scale variations add visual interest
- Smooth easing functions prevent jarring transitions

### Implementation Details

#### CSS Structure
```css
.red-animated-gradient {
  /* Multi-layer radial gradients */
  background: 
    radial-gradient(ellipse 80% 60% at 20% 25%, ...),
    radial-gradient(ellipse 70% 80% at 10% 40%, ...),
    linear-gradient(135deg, ...);
  
  /* Dynamic sizing and positioning */
  background-size: 120% 120%, 120% 120%, 120% 120%;
  background-repeat: no-repeat;
  
  /* Animation */
  animation: morphBackground 30s ease-in-out infinite;
  will-change: background-position, background-size;
}

@keyframes morphBackground {
  0% {
    background-position: 
      calc(0% + (var(--bg-variation, 1) * 2%)) calc(0% + (var(--bg-variation, 1) * 1%)),
      calc(10% + (var(--bg-variation, 1) * 1%)) calc(10% + (var(--bg-variation, 1) * 2%)),
      calc(20% + (var(--bg-variation, 1) * 3%)) calc(20% + (var(--bg-variation, 1) * 1%));
    background-size: 
      calc(120% + (var(--bg-variation, 1) * 5%)) calc(120% + (var(--bg-variation, 1) * -3%)),
      calc(120% + (var(--bg-variation, 1) * -2%)) calc(120% + (var(--bg-variation, 1) * 4%)),
      calc(120% + (var(--bg-variation, 1) * 3%)) calc(120% + (var(--bg-variation, 1) * -1%));
  }
  /* Additional keyframes for smooth morphing */
}
```

#### Depth Layers
Three depth layers will be implemented using pseudo-elements:
1. **::before**: Foreground layer with faster animation
2. **::after**: Background layer with slower animation
3. **.depth-layer**: Middle layer with medium animation speed

## Integration Points

### AppLayout Component
The `AppLayout` component will be modified to:
1. Detect route changes using `useLocation`
2. Map routes to background variation indices
3. Update the CSS custom property `--bg-variation`

```tsx
// In AppLayout.tsx
const location = useLocation();

const getBackgroundVariation = () => {
  if (location.pathname === '/') return 1;
  if (location.pathname.startsWith('/comments')) return 2;
  if (location.pathname.startsWith('/profile')) return 3;
  if (location.pathname.startsWith('/record')) return 4;
  if (location.pathname.startsWith('/search')) return 5;
  return 1; // default
};

return (
  <div 
    className="red-animated-gradient fixed inset-0 z-0"
    style={{ 
      '--bg-variation': getBackgroundVariation()
    } as React.CSSProperties}
  >
    <div className="depth-layer"></div>
  </div>
);
```

### Performance Considerations
- Use `will-change` property to hint browser optimizations
- Limit DOM reflows by using transform and opacity changes
- Use `transform: translateZ(0)` to create a new compositor layer
- Ensure animations target composite-only properties

## Testing

### Visual Testing
- Verify smooth transitions between all navigation routes
- Confirm distinct background appearances for each route
- Check animation performance on various devices
- Ensure no visual glitches or flickering during transitions

### Performance Testing
- Monitor frame rate during animations (should maintain 60fps)
- Check memory usage during extended animation periods
- Verify no layout thrashing or excessive repaints
- Test on low-end devices to ensure acceptable performance

### Cross-browser Compatibility
- Test on latest versions of Chrome, Firefox, Safari, and Edge
- Verify gradient support and animation performance
- Check for any rendering inconsistencies

## Future Enhancements

### User Customization
- Allow users to select preferred background themes
- Implement seasonal or event-based background variations
- Add option to disable animations for performance

### Advanced Effects
- Integrate with audio playback for reactive background effects
- Add particle systems for enhanced visual appeal
- Implement time-of-day based background variations