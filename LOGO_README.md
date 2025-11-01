# EventHub Logo

This directory contains the custom EventHub logo files and component.

## Logo Files

- **eventhub-logo.svg** - Main logo file (512x512) used for favicons and app icons
- **icon-192.png.svg** - PWA icon (192x192)
- **icon-512.png.svg** - PWA icon (512x512)

## Logo Component

The `EventHubLogo` component (`src/components/EventHubLogo.js`) provides a modern, customizable logo for the EventHub platform.

### Features

- **Modern gradient design** - Blue to purple to pink gradient
- **Responsive sizing** - Configurable size prop
- **Optional text** - Show/hide "EventHub" text
- **Two variants**:
  - `EventHubLogo` - Full logo with optional text
  - `EventHubLogoCompact` - Compact circular version

### Usage

```jsx
import EventHubLogo from "@/components/EventHubLogo";

// Full logo with text
<EventHubLogo size={32} showText={true} />

// Icon only
<EventHubLogo size={32} showText={false} />

// Compact version
import { EventHubLogoCompact } from "@/components/EventHubLogo";
<EventHubLogoCompact size={32} />
```

### Props

- **size** (number, default: 32) - Size of the logo in pixels
- **showText** (boolean, default: true) - Show/hide "EventHub" text
- **className** (string, default: "") - Additional CSS classes

## Design

The logo features:

- A stylized "E" representing EventHub
- Connection dots representing events and networking
- Gradient colors: Blue (#3b82f6) → Purple (#8b5cf6) → Pink (#ec4899)
- Modern, clean design suitable for dark and light backgrounds
