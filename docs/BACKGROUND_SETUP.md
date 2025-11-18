# Background Images Setup Guide

LumaWall now supports custom background images with automatic color scheme adaptation!

## Quick Start

### 1. Add Your Background Images

Place your images in: `/frontend/public/backgrounds/`

- `monthly-bg.jpg` - For the monthly calendar view
- `weekly-bg.jpg` - For the weekly timeline view

### 2. Configure Backgrounds

Edit `/frontend/src/config/backgrounds.js`:

```javascript
export const backgrounds = {
  monthly: {
    enabled: true,
    image: '/backgrounds/monthly-bg.jpg',
    theme: 'light', // or 'dark'
    overlay: {
      enabled: true,
      color: 'white', // or 'black'
      opacity: 0.5    // 0 to 1
    }
  },
  weekly: {
    enabled: true,
    image: '/backgrounds/weekly-bg.jpg',
    theme: 'dark',
    overlay: {
      enabled: true,
      color: 'black',
      opacity: 0.4
    }
  }
}
```

## Configuration Options

### Background Settings

- **`enabled`**: `true/false` - Turn background on/off
- **`image`**: Path to your image (relative to `/public/`)
- **`theme`**: `'light'` or `'dark'`
  - `'light'` = Dark text on light background
  - `'dark'` = Light text on dark background

### Overlay Settings

The overlay adds a semi-transparent veil over your background to improve text readability.

- **`enabled`**: `true/false` - Turn overlay on/off
- **`color`**: `'white'` or `'black'`
  - Use `'white'` for light backgrounds
  - Use `'black'` for dark backgrounds
- **`opacity`**: `0` to `1`
  - `0.3` = 30% opacity (subtle)
  - `0.5` = 50% opacity (balanced)
  - `0.7` = 70% opacity (strong fade)

## Recommended Image Specs

- **Format**: JPG or PNG
- **Resolution**:
  - 4K displays: 3840 x 2160 or higher
  - 1080p: 1920 x 1080 or higher
- **File size**: Keep under 2MB for faster loading
- **Content**: Abstract patterns, gradients, or subtle textures work best

## Color Schemes

The app automatically adjusts text and UI colors based on your theme setting:

### Light Theme (dark text on light bg)
- Primary text: Very dark gray
- Borders: Medium gray
- Card backgrounds: Semi-transparent white
- Accent (today): Bright red

### Dark Theme (light text on dark bg)
- Primary text: Almost white
- Borders: Light gray
- Card backgrounds: Semi-transparent dark
- Accent (today): Light red

## Examples

### Example 1: Light Abstract Background
```javascript
monthly: {
  enabled: true,
  image: '/backgrounds/light-abstract.jpg',
  theme: 'light',
  overlay: {
    enabled: true,
    color: 'white',
    opacity: 0.6  // More fade for busy backgrounds
  }
}
```

### Example 2: Dark Gradient Background
```javascript
weekly: {
  enabled: true,
  image: '/backgrounds/dark-gradient.jpg',
  theme: 'dark',
  overlay: {
    enabled: true,
    color: 'black',
    opacity: 0.3  // Less fade for simple gradients
  }
}
```

### Example 3: No Background
```javascript
monthly: {
  enabled: false,  // Disables background completely
  image: '',
  theme: 'light',
  overlay: { enabled: false }
}
```

## Troubleshooting

### Text is hard to read
- Increase overlay `opacity` (try 0.6-0.8)
- Check that `theme` matches your background
  - Light background → theme: 'light'
  - Dark background → theme: 'dark'

### Background not showing
- Check file path is correct (relative to `/public/`)
- Verify `enabled: true`
- Check browser console for errors
- Ensure image file exists in `/public/backgrounds/`

### Colors look wrong
- Verify `theme` setting matches background brightness
- Try adjusting overlay `color` and `opacity`

## Tips

1. **Test both screens**: Monthly and weekly views can have different backgrounds
2. **Start with high opacity**: Begin at 0.6-0.7 and reduce if needed
3. **Match overlay to background**: White overlay for light backgrounds, black for dark
4. **Use subtle images**: Busy backgrounds may distract from calendar content
5. **Optimize images**: Compress images before adding to keep app fast

## Custom Color Schemes

Advanced users can customize the exact colors in `/frontend/src/config/backgrounds.js`:

```javascript
export const colorSchemes = {
  light: {
    primaryText: '#2C3333',
    secondaryText: '#4A5759',
    mutedText: '#6B7280',
    border: '#9CA3AF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    cardBorder: 'rgba(0, 0, 0, 0.1)',
    accentColor: '#DC2626',
    gridLines: 'rgba(0, 0, 0, 0.1)'
  },
  dark: {
    // ... customize dark theme colors
  }
}
```
