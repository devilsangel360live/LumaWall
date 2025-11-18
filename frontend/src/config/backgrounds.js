// Background configuration for LumaWall
// Place your background images in /public/backgrounds/

export const backgrounds = {
  // Screen 1: Monthly View
  monthly: {
    enabled: true,
    image: '/backgrounds/monthly-bg.jpg?v=2', // Path relative to public folder (v= forces cache refresh)
    theme: 'light', // 'light' or 'dark' - determines text color scheme
    overlay: {
      enabled: true,
      color: 'white', // 'white' or 'black'
      opacity: 0.4 // 0 to 1 (0.5 = 50% opacity veil)
    }
  },

  // Screen 2: Weekly Timeline View
  weekly: {
    enabled: true,
    image: '/backgrounds/weekly-bg.jpg', // Path relative to public folder
    theme: 'dark', // 'light' or 'dark'
    overlay: {
      enabled: true,
      color: 'black',
      opacity: 0.3
    }
  },

  // Screen 3: Photo Slideshow
  slideshow: {
    enabled: false, // No background image needed for slideshow (photos are the background)
    image: null,
    theme: 'dark', // Use dark theme for text overlays on photos
    overlay: {
      enabled: false,
      color: 'black',
      opacity: 0
    }
  },

  // Screen 4: Photo Collage
  collage: {
    enabled: false, // No background image needed for collage (photos are the content)
    image: null,
    theme: 'dark', // Use dark theme
    overlay: {
      enabled: false,
      color: 'black',
      opacity: 0
    }
  },

  // Screen 5: Weather Panel
  weather: {
    enabled: false, // No background image needed (uses gradient in component)
    image: null,
    theme: 'light', // Use light theme for weather panel
    overlay: {
      enabled: false,
      color: 'white',
      opacity: 0
    }
  }
}

// Color schemes for light and dark backgrounds
export const colorSchemes = {
  light: {
    // For light backgrounds - use dark colors for contrast
    primaryText: '#2C3333',      // Very dark gray
    secondaryText: '#4A5759',    // Dark slate
    mutedText: '#6B7280',        // Medium gray
    border: '#9CA3AF',           // Light gray border
    cardBg: 'rgba(255, 255, 255, 0.6)', // Semi-transparent white
    cardBorder: 'rgba(0, 0, 0, 0.1)',
    accentColor: '#DC2626',      // Bright red for today/highlights
    gridLines: 'rgba(0, 0, 0, 0.1)'
  },

  dark: {
    // For dark backgrounds - use light colors for contrast
    primaryText: '#F9FAFB',      // Almost white
    secondaryText: '#E5E7EB',    // Light gray
    mutedText: '#D1D5DB',        // Medium light gray
    border: '#6B7280',           // Medium gray border
    cardBg: 'rgba(17, 24, 39, 0.7)', // Semi-transparent dark
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    accentColor: '#F87171',      // Lighter red for today/highlights
    gridLines: 'rgba(255, 255, 255, 0.15)'
  }
}
