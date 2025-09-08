# UI Button Removal and Repositioning Design

## Overview
This design document outlines the changes to the AudioCard component to remove the like, comment, and bookmark buttons and reposition the delete button to the top right corner with a dark gray appearance without a box.

## Current Implementation Analysis
The current AudioCard component in `/src/components/feed/AudioCard.tsx` includes:
- Like button with heart icon and count
- Comment button with message circle icon and count
- Bookmark button with bookmark icon
- Delete button (only visible for own tracks) in the interaction bar

## Proposed Changes

### 1. Button Removal
Remove the following interactive elements from the AudioCard:
- Like button (including count display)
- Comment button (including count display)
- Bookmark button

### 2. Delete Button Repositioning
Move the delete button to the top right corner of the card with the following specifications:
- Position: Top right corner of the card
- Appearance: Dark gray color without any box/background
- Visibility: Always visible for own tracks (no hover requirement)
- Size: Maintain current icon size (16px)

### 3. UI Layout Adjustments
With the removal of the interaction bar:
- Reorganize the card layout to maintain visual balance
- Remove the border-top that separated the interaction bar
- Adjust spacing to maintain proper visual hierarchy

## Component Structure Changes

### Before
```
AudioCard
├── Track Info
│   ├── Title
│   └── Metadata (duration, likes, comments, user)
└── Interaction Bar
    ├── Like Button (with count)
    ├── Comment Button (with count)
    ├── Delete Button (for own tracks)
    └── Bookmark Button
```

### After
```
AudioCard
├── Delete Button (top right corner, for own tracks)
├── Track Info
│   ├── Title
│   └── Metadata (duration, user)
```

## Implementation Details

### Code Changes Required

1. Update imports to remove unused icons:
   ```typescript
   import { Clock, Trash2 } from 'lucide-react';
   ```

2. Remove unused store functions:
   ```typescript
   const {  } = useFeedStore(); // Remove toggleLike and toggleBookmark
   ```

3. Remove event handler functions for like, comment, and bookmark actions

4. Remove metadata display for likes and comments count

5. Remove the entire interaction bar section

6. Add delete button positioned at top right corner:
   ```jsx
   {/* Delete button for own tracks - positioned at top right */}
   {showDeleteButton && isOwnTrack && (
     <button
       onClick={handleDeleteClick}
       className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors z-30"
       aria-label="Aufnahme löschen"
     >
       <Trash2 size={16} />
     </button>
   )}
   ```

### Styling Changes

1. Position the delete button absolutely at the top right corner
2. Apply dark gray color with `text-gray-500` class
3. Add hover effect with `hover:text-gray-300`
4. Remove all glassmorphism styling (background, padding, borders)
5. Ensure proper z-index for visibility

### Removed Components

1. Like button with heart icon and count display
2. Comment button with message circle icon and count display
3. Bookmark button with bookmark icon
4. Entire interaction bar container with its border
5. Associated animation components for the interaction bar

### Preserved Functionality

1. Delete confirmation dialog
2. Audio playback functionality
3. Navigation to player page
4. User profile navigation
5. Track information display (title, duration, user)

## Visual Design
- Clean, minimalist appearance
- Reduced visual clutter
- Consistent with mobile-first design principles
- Maintains glassmorphism aesthetic for core content

## Testing Considerations
- Verify delete functionality still works correctly
- Confirm delete button visibility for own tracks
- Check layout on different screen sizes
- Validate accessibility compliance
