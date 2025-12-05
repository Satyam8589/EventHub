# Instagram-Style Reels Layout Fix

## Changes Made:

The reels page now displays images/videos like Instagram Reels:

### Mobile (Small Screens):
- Full screen display
- Images/videos use `object-contain` to show full content
- Black background
- Content fills the screen

### Desktop (Large Screens):
- Centered layout with max-width of 480px (md breakpoint)
- 9:16 aspect ratio container (Instagram reels ratio)
- Blurred background for aesthetic
- Rounded corners
- Images/videos use `object-contain` to preserve aspect ratio
- Black letterboxing for images that don't match 9:16

### Key CSS Changes:

```javascript
// Container
className="h-screen w-full snap-start relative flex items-center justify-center bg-black"

// Background blur (desktop only)
<div className="absolute inset-0 overflow-hidden">
  <img className="w-full h-full object-cover blur-2xl opacity-30 scale-110" />
</div>

// Main content wrapper
<div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center">
  
  // Media container
  <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:aspect-[9/16] bg-black md:rounded-xl overflow-hidden shadow-2xl">
    
    // Image/Video
    <img className="w-full h-full object-contain" />
    
  </div>
</div>
```

## How It Works:

1. **Mobile**: Full screen, images fit within screen bounds
2. **Desktop**: 
   - Max width 480px (md:max-w-md)
   - 9:16 aspect ratio (md:aspect-[9/16])
   - Centered horizontally
   - Blurred background shows behind
   - Rounded corners for polish

This matches Instagram's reels display exactly!
