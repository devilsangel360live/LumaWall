# Custom Weather Icons Guide

This guide explains how to add your own custom icons to the weather panel.

## Directory Structure

```
frontend/src/assets/icons/
├── weather/          # Weather condition icons
└── metrics/          # Metric box icons
```

## How to Add Custom Icons

### 1. Weather Condition Icons

These icons appear in the main weather display and forecast.

**Location:** `frontend/src/assets/icons/weather/`

**Available icon slots:**
- `sunny.svg` - Clear sky (currently: )
- `partly-cloudy.svg` - Few clouds (currently: )
- `cloudy.svg` - Cloudy/Overcast (currently: )
- `rain.svg` - Rain (currently: )
- `showers.svg` - Rain showers (currently: )
- `storm.svg` - Thunderstorm (currently: )
- `snow.svg` - Snow (currently: )
- `fog.svg` - Fog/Mist (currently: )
- `windy.svg` - Windy (currently: )
- `blizzard.svg` - Blizzard (currently: )
- `hurricane.svg` - Hurricane (currently: )

**To replace icons:**
1. Place your icon files in `frontend/src/assets/icons/weather/`
2. Open `frontend/src/components/WeatherPanel.jsx`
3. Find the `getWeatherIcon` function (around line 230)
4. Replace emoji with your icon path:

```javascript
const iconMap = {
  'skc': '/src/assets/icons/weather/sunny.svg',           // Replace 
  'rain': '/src/assets/icons/weather/rain.svg',           // Replace 
  'snow': '/src/assets/icons/weather/snow.svg',           // Replace 
  // ... etc
}
```

### 2. Metric Box Icons

These icons appear in the highlight boxes (humidity, wind, etc.)

**Location:** `frontend/src/assets/icons/metrics/`

**Available icon slots:**
- `humidity.svg` - Humidity icon (currently: )
- `visibility.svg` - Visibility icon (currently: )
- `sunrise.svg` - Sunrise icon (currently: )
- `sunset.svg` - Sunset icon (currently: )
- `temperature.svg` - Feels like temperature (currently: )
- `cloud.svg` - Cloud cover (currently: )
- `wind.svg` - Wind status (currently: )
- `air-quality.svg` - Air quality (currently: )
- `pressure.svg` - Pressure (currently: )

**To replace icons:**
1. Place your icon files in `frontend/src/assets/icons/metrics/`
2. Open `frontend/src/components/WeatherPanel.jsx`
3. Find the `metricIcons` object (around line 268)
4. Replace emoji with your icon path:

```javascript
const metricIcons = {
  humidity: '/src/assets/icons/metrics/humidity.svg',     // Replace 
  visibility: '/src/assets/icons/metrics/visibility.svg', // Replace 
  wind: '/src/assets/icons/metrics/wind.svg',            // Replace 
  // ... etc
}
```

## Icon Requirements

### Format
- **SVG** format recommended (scalable, crisp at any size)
- PNG/JPG also supported (use high resolution: 128x128px minimum)

### Size Guidelines
- Weather condition icons: 64x64px to 128x128px
- Metric box icons: 32x32px to 64x64px

### Style Tips
- Use simple, clean designs that work well at small sizes
- Consider the teal/blue color scheme (#5F8D9C background)
- Icons should work well on white backgrounds (for metric boxes)
- Monochrome or 2-color icons work best for vintage aesthetic

## Example: Replacing the Humidity Icon

1. Save your custom humidity icon as `humidity.svg` in `frontend/src/assets/icons/metrics/`

2. Edit `WeatherPanel.jsx`:
```javascript
const metricIcons = {
  humidity: '/src/assets/icons/metrics/humidity.svg',  // Changed from 
  // ... rest of icons
}
```

3. Save and refresh - your custom icon will appear!

## Finding Icon Packs

Recommended free icon sources:
- [Lucide Icons](https://lucide.dev/) - Clean, modern SVG icons
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted SVG icons
- [Font Awesome](https://fontawesome.com/) - Huge collection (requires license for some)
- [Weather Icons](https://erikflowers.github.io/weather-icons/) - Weather-specific icon font
- [Flaticon](https://www.flaticon.com/) - Large collection (attribution required for free)

## Troubleshooting

**Icon not showing?**
- Check the file path is correct (starts with `/src/assets/`)
- Verify the file exists in the correct directory
- Check browser console for loading errors
- Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

**Icon looks blurry?**
- Use SVG format instead of PNG/JPG
- If using PNG, increase resolution to at least 128x128px

**Icon wrong color?**
- SVG icons inherit color from CSS - check the `className` in `renderIcon()`
- You can edit SVG files to set specific colors
