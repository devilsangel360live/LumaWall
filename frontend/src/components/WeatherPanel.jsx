import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import * as maptilersdk from '@maptiler/sdk'
import { PrecipitationLayer, TemperatureLayer, WindLayer } from '@maptiler/weather'
import '@maptiler/sdk/dist/maptiler-sdk.css'

// Import weather icons
import clearDayIcon from '../assets/icons/weather/clear-day.svg'
import clearNightIcon from '../assets/icons/weather/clear-night.svg'
import cloudyIcon from '../assets/icons/weather/cloudy.svg'
import drizzleIcon from '../assets/icons/weather/drizzle.svg'
import fogIcon from '../assets/icons/weather/fog.svg'
import hailIcon from '../assets/icons/weather/hail.svg'
import hazeIcon from '../assets/icons/weather/haze.svg'
import hurricaneIcon from '../assets/icons/weather/hurricane.svg'
import mistIcon from '../assets/icons/weather/mist.svg'
import overcastDayIcon from '../assets/icons/weather/overcast-day.svg'
import overcastNightIcon from '../assets/icons/weather/overcast-night.svg'
import overcastIcon from '../assets/icons/weather/overcast.svg'
import partlyCloudyDayIcon from '../assets/icons/weather/partly-cloudy-day.svg'
import partlyCloudyNightIcon from '../assets/icons/weather/partly-cloudy-night.svg'
import rainIcon from '../assets/icons/weather/rain.svg'
import sleetIcon from '../assets/icons/weather/sleet.svg'
import smokeIcon from '../assets/icons/weather/smoke.svg'
import snowIcon from '../assets/icons/weather/snow.svg'
import thunderstormsIcon from '../assets/icons/weather/thunderstorms.svg'
import windIcon from '../assets/icons/weather/wind.svg'

// Import metric icons
import barometerIcon from '../assets/icons/metrics/barometer.svg'
import sunriseIcon from '../assets/icons/metrics/sunrise.svg'
import sunsetIcon from '../assets/icons/metrics/sunset.svg'
import thermometerWarmerIcon from '../assets/icons/metrics/thermometer-warmer.svg'
import thermometerColderIcon from '../assets/icons/metrics/thermometer-colder.svg'

function WeatherPanel({ colors }) {
  const [currentWeather, setCurrentWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weatherLayer, setWeatherLayer] = useState('precipitation')
  const [layersReady, setLayersReady] = useState(false)
  const [mapContainerReady, setMapContainerReady] = useState(false)
  const [sunTimes, setSunTimes] = useState(null)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const weatherLayersRef = useRef({})
  const mapInitTimeRef = useRef(null)

  // Boston coordinates
  const BOSTON_LAT = 42.3601
  const BOSTON_LON = -71.0589

  // MapTiler API key from environment
  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY

  // Debug: Log the API key status and container availability
  useEffect(() => {
    console.log('=== MapTiler Debug ===')
    console.log('API Key present:', !!MAPTILER_KEY)
    console.log('API Key value:', MAPTILER_KEY ? `${MAPTILER_KEY.substring(0, 10)}...` : 'MISSING')
    console.log('Map container ref:', mapContainerRef.current)

    // Check again after a delay to see if container becomes available
    const checkTimer = setInterval(() => {
      if (mapContainerRef.current) {
        console.log(' Map container NOW available:', mapContainerRef.current)
        clearInterval(checkTimer)
      } else {
        console.log(' Map container still null')
      }
    }, 500)

    setTimeout(() => clearInterval(checkTimer), 5000) // Stop after 5 seconds

    return () => clearInterval(checkTimer)
  }, [])

  // Default colors
  const themeColors = colors || {
    primaryText: '#2C3333',
    secondaryText: '#4A5759',
    mutedText: '#6B7280'
  }

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const pointResponse = await fetch(
          `https://api.weather.gov/points/${BOSTON_LAT},${BOSTON_LON}`
        )

        if (!pointResponse.ok) {
          throw new Error('Failed to fetch weather data')
        }

        const pointData = await pointResponse.json()

        const [observationResponse, forecastResponse] = await Promise.all([
          fetch(pointData.properties.observationStations),
          fetch(pointData.properties.forecast)
        ])

        if (!observationResponse.ok || !forecastResponse.ok) {
          throw new Error('Failed to fetch weather details')
        }

        const stationsData = await observationResponse.json()
        const forecastData = await forecastResponse.json()

        if (stationsData.features && stationsData.features.length > 0) {
          const stationUrl = stationsData.features[0].id
          const latestObsResponse = await fetch(`${stationUrl}/observations/latest`)
          const latestObs = await latestObsResponse.json()
          setCurrentWeather(latestObs.properties)
        }

        if (forecastData.properties && forecastData.properties.periods) {
          setForecast(forecastData.properties.periods)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching weather:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000)
    return () => clearInterval(interval)
  }, [])

  // Fetch sunrise and sunset times
  useEffect(() => {
    const fetchSunTimes = async () => {
      try {
        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${BOSTON_LAT}&lng=${BOSTON_LON}&formatted=0`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch sun times')
        }

        const data = await response.json()

        if (data.status === 'OK') {
          // Parse ISO times and format to local time
          const sunriseDate = new Date(data.results.sunrise)
          const sunsetDate = new Date(data.results.sunset)

          setSunTimes({
            sunrise: format(sunriseDate, 'h:mm a'),
            sunset: format(sunsetDate, 'h:mm a')
          })
        }
      } catch (err) {
        console.error('Error fetching sun times:', err)
        // Set default fallback times if API fails
        setSunTimes({
          sunrise: '7:00 AM',
          sunset: '5:00 PM'
        })
      }
    }

    fetchSunTimes()
    // Update sun times once per day (at midnight)
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow - now

    const timeoutId = setTimeout(() => {
      fetchSunTimes()
      // Then update every 24 hours
      const intervalId = setInterval(fetchSunTimes, 24 * 60 * 60 * 1000)
      return () => clearInterval(intervalId)
    }, msUntilMidnight)

    return () => clearTimeout(timeoutId)
  }, [])

  // Check when map container becomes available
  useEffect(() => {
    if (mapContainerRef.current && !mapContainerReady) {
      console.log(' Map container detected, triggering initialization...')
      setMapContainerReady(true)
    } else if (!mapContainerRef.current) {
      const checkTimer = setInterval(() => {
        if (mapContainerRef.current && !mapContainerReady) {
          console.log(' Map container NOW ready!')
          setMapContainerReady(true)
        }
      }, 100)
      return () => clearInterval(checkTimer)
    }
  }, [loading, mapContainerReady]) // Re-check when loading state changes

  // Initialize MapTiler map with weather layers (recreate every 30 minutes to stay in free tier)
  useEffect(() => {
    // Wait for map container to be available
    if (!mapContainerReady || !mapContainerRef.current) {
      console.log('Map container not ready yet, mapContainerReady:', mapContainerReady)
      return
    }

    if (!MAPTILER_KEY || MAPTILER_KEY === 'your_maptiler_api_key_here') {
      console.error('MapTiler API key not configured')
      return
    }

    console.log('Map container ready, initializing map...')

    const initializeMap = () => {
      // Clean up existing map if any
      if (mapRef.current) {
        // Remove weather layers from map before destroying map
        Object.values(weatherLayersRef.current).forEach(layer => {
          if (layer && layer.id && mapRef.current.getLayer(layer.id)) {
            mapRef.current.removeLayer(layer.id)
          }
        })
        mapRef.current.remove()
        mapRef.current = null
        weatherLayersRef.current = {}
        setLayersReady(false)
      }

      console.log('Initializing MapTiler map (free tier optimization: every 30 min)')
      maptilersdk.config.apiKey = MAPTILER_KEY

      const map = new maptilersdk.Map({
        container: mapContainerRef.current,
        style: maptilersdk.MapStyle.HYBRID,
        center: [BOSTON_LON, BOSTON_LAT],
        zoom: 8
      })

      map.on('load', () => {
        console.log('Map loaded, initializing weather layers...')

        try {
          // Add MapTiler Weather Layers
          const precipLayer = new PrecipitationLayer({
            opacity: 0.7
          })

          const tempLayer = new TemperatureLayer({
            opacity: 0.5
          })

          const windLayer = new WindLayer({
            opacity: 0.6
          })

          // Store layers reference
          weatherLayersRef.current = {
            precipitation: precipLayer,
            temperature: tempLayer,
            wind: windLayer
          }

          // Add precipitation layer to map by default using map.addLayer()
          map.addLayer(precipLayer)

          // Mark layers as ready after a short delay to ensure they're fully loaded
          setTimeout(() => {
            setLayersReady(true)
            console.log('Weather layers ready for toggling')
          }, 1000)
        } catch (error) {
          console.error('Error initializing weather layers:', error)
        }
      })

      mapRef.current = map
      mapInitTimeRef.current = Date.now()
    }

    // Initialize map immediately
    initializeMap()

    // Recreate map every 30 minutes to save API calls (free tier optimization)
    const refreshInterval = setInterval(() => {
      console.log('Refreshing map (30-minute interval for free tier)')
      initializeMap()
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      clearInterval(refreshInterval)
      // Remove weather layers from map before destroying map
      if (mapRef.current) {
        Object.values(weatherLayersRef.current).forEach(layer => {
          if (layer && layer.id && mapRef.current.getLayer(layer.id)) {
            mapRef.current.removeLayer(layer.id)
          }
        })
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [MAPTILER_KEY, mapContainerReady])

  // Auto-rotate weather layers every 10 seconds
  useEffect(() => {
    if (!layersReady || !mapRef.current) return

    const layerTypes = ['precipitation', 'temperature', 'wind']
    let currentIndex = layerTypes.indexOf(weatherLayer)

    const rotationInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % layerTypes.length
      const nextLayer = layerTypes[currentIndex]
      console.log(`Auto-rotating to ${nextLayer} layer`)
      toggleWeatherLayer(nextLayer)
    }, 10000) // Rotate every 10 seconds

    return () => clearInterval(rotationInterval)
  }, [layersReady, weatherLayer])

  // Toggle weather layer
  const toggleWeatherLayer = (layerType) => {
    console.log('Toggle weather layer:', layerType)

    if (!mapRef.current) {
      console.error('Map not initialized')
      return
    }

    if (!weatherLayersRef.current || Object.keys(weatherLayersRef.current).length === 0) {
      console.error('Weather layers not loaded yet')
      return
    }

    console.log('Available layers:', Object.keys(weatherLayersRef.current))

    try {
      // Remove all layers first using map.removeLayer()
      Object.entries(weatherLayersRef.current).forEach(([key, layer]) => {
        if (layer && layer.id) {
          console.log(`Removing layer: ${key}`)
          // Check if layer exists on map before removing
          if (mapRef.current.getLayer(layer.id)) {
            mapRef.current.removeLayer(layer.id)
          }
        }
      })

      // Add selected layer using map.addLayer()
      const layer = weatherLayersRef.current[layerType]
      if (layer) {
        console.log(`Adding layer: ${layerType}`)
        // Only add if not already on map
        if (!mapRef.current.getLayer(layer.id)) {
          mapRef.current.addLayer(layer)
        }
        setWeatherLayer(layerType)
        console.log(`Successfully switched to ${layerType} layer`)
      } else {
        console.error(`Layer ${layerType} not found`)
      }
    } catch (error) {
      console.error('Error toggling weather layer:', error)
    }
  }

  const celsiusToFahrenheit = (celsius) => {
    if (celsius === null) return null
    const fahrenheit = (celsius * 9 / 5) + 32
    return Math.round(fahrenheit)
  }

  // Weather icon mapping - uses custom SVG icons
  const getWeatherIcon = (iconUrl) => {
    if (!iconUrl) {
      return partlyCloudyDayIcon
    }

    // Extract weather condition code from NOAA icon URL
    // URL format: https://api.weather.gov/icons/land/day/sct?size=medium
    const urlParts = iconUrl.split('/').pop()  // Get "sct?size=medium"
    const conditionWithQuery = urlParts.split(',')[0]  // Remove any comma parts
    const condition = conditionWithQuery.split('?')[0].replace(/\d+/g, '')  // Remove query params and numbers

    // Check if it's a night condition (NOAA uses /night/ in the URL)
    const isNight = iconUrl.includes('/night/')

    // Map NOAA weather codes to imported icon files
    const iconMap = {
      // Clear conditions
      'skc': isNight ? clearNightIcon : clearDayIcon,

      // Cloudy conditions
      'few': isNight ? partlyCloudyNightIcon : partlyCloudyDayIcon,
      'sct': isNight ? partlyCloudyNightIcon : partlyCloudyDayIcon,
      'bkn': cloudyIcon,
      'ovc': isNight ? overcastNightIcon : overcastDayIcon,

      // Wind
      'wind_skc': windIcon,
      'wind': windIcon,

      // Rain conditions
      'rain': rainIcon,
      'rain_showers': rainIcon,
      'shwrs': rainIcon,
      'hi_shwrs': rainIcon,
      'fzra': sleetIcon,  // Freezing rain
      'rain_fzra': sleetIcon,
      'rain_sleet': sleetIcon,
      'sleet': sleetIcon,

      // Thunderstorms
      'tsra': thunderstormsIcon,
      'tsra_sct': thunderstormsIcon,
      'tsra_hi': thunderstormsIcon,

      // Snow conditions
      'snow': snowIcon,
      'snow_fzra': snowIcon,
      'snow_sleet': snowIcon,
      'blizzard': snowIcon,

      // Hail
      'ip': hailIcon,  // Ice pellets

      // Fog/Mist/Haze
      'fog': fogIcon,
      'nfg': fogIcon,
      'mist': mistIcon,
      'haze': hazeIcon,

      // Smoke/Dust
      'smoke': smokeIcon,
      'dust': hazeIcon,

      // Drizzle
      'drizzle': drizzleIcon,

      // Tropical/Hurricane
      'hurricane': hurricaneIcon,
      'tropical_storm': hurricaneIcon,

      // Hot/Cold (rare, but included)
      'hot': clearDayIcon,
      'cold': snowIcon
    }

    return iconMap[condition] || partlyCloudyDayIcon
  }

  // Metric icons - using custom SVG icons
  const metricIcons = {
    humidity: '',              // Would need droplet/humidity icon
    visibility: '',           // Would need eye/visibility icon
    sunrise: sunriseIcon,
    sunset: sunsetIcon,
    feelsLike: thermometerWarmerIcon,
    cloudCover: cloudyIcon,      // Reusing weather cloud icon
    wind: windIcon,              // Reusing weather wind icon
    airQuality: hazeIcon,        // Reusing weather haze icon
    pressure: barometerIcon
  }

  // Helper to render icon (supports both emoji and image paths/imports)
  const renderIcon = (icon, className = '') => {
    if (!icon) return null

    // Check if it's a string (emoji or path)
    if (typeof icon === 'string') {
      if (icon.startsWith('/') || icon.startsWith('data:') || icon.includes('.svg')) {
        // Image path or data URL - render as img tag with proper sizing
        return <img src={icon} alt="icon" className={className} style={{ width: '1em', height: '1em' }} />
      }
      // Emoji
      return <span className={className}>{icon}</span>
    }

    // It's an imported SVG module - render as img
    return <img src={icon} alt="icon" className={className} style={{ width: '1em', height: '1em' }} />
  }

  if (loading) {
    console.log(' Weather panel in LOADING state')
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
            style={{ borderColor: themeColors.primaryText }}></div>
          <p className="text-xl" style={{ color: themeColors.secondaryText }}>
            Loading weather...
          </p>
        </div>
      </div>
    )
  }

  console.log(' Weather panel RENDERED - currentWeather:', !!currentWeather, 'forecast:', forecast.length)

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2" style={{ color: themeColors.primaryText }}>
            Weather Unavailable
          </h2>
          <p className="text-lg" style={{ color: themeColors.secondaryText }}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  const temp = currentWeather?.temperature?.value
  const tempF = temp ? celsiusToFahrenheit(temp) : null
  const condition = currentWeather?.textDescription || 'Unknown'
  const icon = getWeatherIcon(currentWeather?.icon)
  const humidity = currentWeather?.relativeHumidity?.value
  const windSpeed = currentWeather?.windSpeed?.value

  // Get forecast high/low temps (NOAA provides in Fahrenheit already)
  // NOAA forecast alternates between day and night periods
  // Find today's daytime period (isDaytime: true) for high temp
  // Find tonight's nighttime period (isDaytime: false) for low temp
  const todayDayPeriod = forecast.find(p => p.isDaytime === true)
  const tonightPeriod = forecast.find(p => p.isDaytime === false)
  const highTemp = todayDayPeriod?.temperature  // Already in F
  const lowTemp = tonightPeriod?.temperature  // Already in F

  // Get dynamic colors based on temperature and conditions
  const getWeatherGradient = (temp, condition) => {
    const conditionLower = condition?.toLowerCase() || ''

    // Severe weather conditions take priority
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return {
        today: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
        forecast: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    }
    if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
      return {
        today: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)', // Pale blue
        forecast: 'linear-gradient(135deg, #d4e4f7 0%, #c0d8f0 100%)'
      }
    }
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
      return {
        today: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Bright blue
        forecast: 'linear-gradient(135deg, #43c6db 0%, #00d4ff 100%)'
      }
    }

    // Temperature-based for normal conditions
    if (temp >= 85) {
      return {
        today: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Hot pink/red
        forecast: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' // Orange/yellow
      }
    } else if (temp >= 75) {
      return {
        today: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Warm peach
        forecast: 'linear-gradient(135deg, #ff9a56 0%, #feca57 100%)' // Orange
      }
    } else if (temp >= 60) {
      return {
        today: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Mild blue
        forecast: 'linear-gradient(135deg, #84c9fb 0%, #a7daf8 100%)' // Light blue
      }
    } else if (temp >= 40) {
      return {
        today: 'linear-gradient(135deg, #667eea 0%, #89c4f4 100%)', // Cool blue
        forecast: 'linear-gradient(135deg, #5e81e8 0%, #79b8f3 100%)' // Blue
      }
    } else {
      return {
        today: 'linear-gradient(135deg, #d4e4f7 0%, #c0d8f0 100%)', // Cold pale blue
        forecast: 'linear-gradient(135deg, #b8d5f0 0%, #a8c9eb 100%)' // Icy blue
      }
    }
  }

  const weatherGradients = getWeatherGradient(tempF, condition)

  return (
    <div className="h-full flex gap-6 p-8" style={{ background: 'linear-gradient(135deg, #5F8D9C 0%, #7BA5B3 100%)' }}>
      <div className="w-1/2 flex flex-col gap-4">
        {/* Top Section: Gauge + Day View */}
        <div className="flex gap-4 h-[35%]">
          {/* Temperature Gauge */}
          <div className="w-[45%] backdrop-blur-sm rounded-2xl p-6 shadow-lg flex flex-col items-center justify-between" style={{ background: weatherGradients.today }}>
            <h3 className="text-white text-2xl font-semibold self-start">Today</h3>

            {/* Current Weather Icon */}
            <div className="mb-4">
              {renderIcon(icon, 'text-9xl')}
            </div>

            {/* Temperature Display */}
            <div className="text-center mb-2">
              <p className="text-8xl font-bold text-white">{tempF ? `${tempF}` : '--'}<span className="text-5xl">°F</span></p>
            </div>

            {/* Weather Icon & Condition */}
            <div className="flex flex-col items-center">
              <p className="text-2xl text-white/90 text-center">{format(new Date(), 'EEEE, HH:mm')}</p>
            </div>
          </div>

          {/* Hourly Temperature Chart - Every 3 hours for today */}
          <div className="flex-1 rounded-2xl p-4 shadow-lg relative" style={{ background: weatherGradients.forecast }}>
            <h4 className="text-white font-semibold text-2xl mb-3">Forecast</h4>
            <div className="h-[calc(100%-2rem)] flex flex-col">
              {/* Bars section */}
              <div className="flex-1 flex gap-2 items-end pl-8 pr-2 relative pb-6">

                {/* Forecast bars - 8 periods */}
                {forecast.slice(0, 8).map((period, index) => {
                  const maxTemp = Math.max(...forecast.slice(0, 8).map(p => p.temperature))
                  const minTemp = Math.min(...forecast.slice(0, 8).map(p => p.temperature))
                  const range = maxTemp - minTemp || 1
                  const heightPercent = ((period.temperature - minTemp) / range) * 80 + 15

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      {/* Weather icon */}
                      <div className="mb-1">
                        {renderIcon(getWeatherIcon(period.icon), 'text-5xl')}
                      </div>

                      {/* Temperature value - NOAA forecast temps are in Fahrenheit */}
                      <span className="text-xs font-semibold text-white">{period.temperature}°F</span>

                      {/* Bar */}
                      <div
                        className="w-full bg-white/90 rounded-t-md transition-all"
                        style={{
                          height: `${heightPercent}%`,
                          minHeight: '15%'
                        }}
                      ></div>
                    </div>
                  )
                })}
              </div>

              {/* Day labels with dates - spanning 2 bars each */}
              <div className="flex gap-2 pl-8 pr-2">
                {forecast.slice(0, 8).map((period, index) => {
                  // Only render label for even indices (day periods)
                  if (index % 2 !== 0) return <div key={index} className="flex-1"></div>

                  // Parse the start time to get the date
                  const periodDate = new Date(period.startTime)
                  const dateLabel = format(periodDate, 'MMM d') // "Jan 12"

                  return (
                    <div key={index} className="flex items-center justify-center" style={{ width: 'calc(200% + 0.5rem)' }}>
                      <span className="text-[20px] text-white/80 font-medium whitespace-nowrap">
                        {dateLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* High/Low Section */}
        <div className="h-[15%] rounded-2xl p-4 shadow-lg grid grid-cols-2" style={{ background: 'linear-gradient(90deg, #C85A54 0%, #B8824A 50%, #D4956B 100%)' }}>
          <div className="flex items-center justify-center gap-3 border-r border-white/30">
            <span className="text-8xl">{renderIcon(clearDayIcon)}</span>
            <div>
              <p className="text-white/80 text-sm">HIGH</p>
              <p className="text-white text-3xl font-bold">{highTemp || '--'}°F</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-8xl">{renderIcon(clearNightIcon)}</span>
            <div>
              <p className="text-white/80 text-sm">LOW</p>
              <p className="text-white text-3xl font-bold">{lowTemp || '--'}°F</p>
            </div>
          </div>
        </div>

        {/* Highlights Section */}
        <div className="flex-1">
          <h3 className="text-white text-xl font-semibold mb-3">Highlights</h3>
          <div className="grid grid-cols-4 gap-3 h-[calc(100%-2rem)]">
            {/* Humidity */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-10 shadow-lg overflow-hidden">
              <div className="absolute right-4 top-16 text-teal-100/30 text-[80px]">
                {renderIcon(metricIcons.humidity)}
              </div>
              <div className="relative z-10 mt-10">
                <p className="text-gray-400 text-lg uppercase font-large">Humidity</p>
                <p className="text-5xl font-bold text-teal-700 leading-none mb-2">
                  {humidity ? Math.round(humidity) : '--'}
                  <span className="text-2xl">%</span>
                </p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${humidity || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-10 shadow-lg overflow-hidden">
              <div className="absolute right-4 top-16 text-teal-300/30 text-[120px]">
                {renderIcon(metricIcons.airQuality)}
              </div>
              <div className="relative z-10 mt-10">
                <p className="text-gray-400 text-lg uppercase font-medium">Visibility</p>
                <p className="text-5xl font-bold text-teal-700 leading-none mb-1">
                  {currentWeather?.visibility?.value ? (currentWeather.visibility.value / 1609.34).toFixed(1) : '--'}
                </p>
                <p className="text-base text-gray-500 font-medium">miles</p>
              </div>
            </div>

            {/* Sunrise & Sunset */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-16 shadow-lg overflow-hidden">
              <p className="text-gray-400 text-lg uppercase font-medium mb-2">Sun Times</p>
              <div className="space-y-4">
                <div className="flex items-center gap-12">
                  {renderIcon(metricIcons.sunrise, 'text-5xl')}
                  <p className="text-2xl font-bold text-teal-700">
                    {sunTimes?.sunrise || '7:00 AM'}
                  </p>
                </div>
                <div className="flex items-center gap-12">
                  {renderIcon(metricIcons.sunset, 'text-5xl')}
                  <p className="text-2xl font-bold text-teal-700">
                    {sunTimes?.sunset || '5:00 PM'}
                  </p>
                </div>
              </div>
            </div>

            {/* Feels Like */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-10 shadow-lg overflow-hidden">
              <div className="absolute right-4 top-20 text-teal-300/30 text-[120px]">
                {renderIcon(metricIcons.feelsLike)}
              </div>
              <div className="relative z-10 mt-10">
                <p className="text-gray-400 text-lg uppercase font-medium mb-2">Feels Like</p>
                <p className="text-5xl font-bold text-teal-700 leading-none mb-1">
                  {currentWeather?.heatIndex?.value
                    ? celsiusToFahrenheit(currentWeather.heatIndex.value)
                    : currentWeather?.windChill?.value
                      ? celsiusToFahrenheit(currentWeather.windChill.value)
                      : tempF || '--'}°
                </p>
                <p className="text-base text-gray-500 font-medium">temperature</p>
              </div>
            </div>

            {/* Cloud Cover */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-10 shadow-lg overflow-hidden">
              <div className="absolute right-4 top-16 text-teal-300/30 text-[120px]">
                {renderIcon(metricIcons.cloudCover)}
              </div>
              <div className="relative z-10 mt-10">
                <p className="text-gray-400 text-lg uppercase font-medium mb-2">Cloud Cover</p>
                <p className="text-5xl font-bold text-teal-700 leading-none mb-1">
                  {currentWeather?.cloudLayers?.[0]?.amount
                    ? currentWeather.cloudLayers[0].amount === 'CLR' ? '0'
                      : currentWeather.cloudLayers[0].amount === 'FEW' ? '25'
                        : currentWeather.cloudLayers[0].amount === 'SCT' ? '50'
                          : currentWeather.cloudLayers[0].amount === 'BKN' ? '75'
                            : currentWeather.cloudLayers[0].amount === 'OVC' ? '100'
                              : '--'
                    : '--'}
                  <span className="text-2xl">%</span>
                </p>
                <p className="text-base text-gray-500 font-medium">coverage</p>
              </div>
            </div>

            {/* Wind Status */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-10 shadow-lg overflow-hidden">
              <div className="absolute right-4 top-16 text-teal-300/30 text-[120px]">
                {renderIcon(metricIcons.wind)}
              </div>
              <div className="relative z-10 mt-10">
                <p className="text-gray-400 text-lg uppercase font-medium">Wind Status</p>
                <p className="text-5xl font-bold text-teal-700 leading-none mb-1">
                  {windSpeed ? Math.round(windSpeed * 0.621371) : '--'}
                </p>
                <p className="text-base text-gray-500 font-medium">
                  mph {currentWeather?.windDirection?.value
                    ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(currentWeather.windDirection.value / 45) % 8]
                    : ''}
                </p>
              </div>
            </div>

            {/* Air Quality - placeholder, NOAA doesn't provide this */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-10 shadow-lg overflow-hidden">
              <div className="absolute right-4 top-16 text-teal-300/30 text-[120px]">
                {renderIcon(metricIcons.airQuality)}
              </div>
              <div className="relative z-10 mt-10">
                <p className="text-gray-400 text-lg uppercase font-medium">Dew Point</p>
                <p className="text-5xl font-bold text-teal-700 leading-none mb-1">
                  {currentWeather?.dewPoint?.value ? celsiusToFahrenheit(currentWeather.dewPoint.value) : '--'}°
                </p>
              </div>
            </div>

            {/* Pressure */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-4 pt-10 shadow-lg overflow-hidden">
              <div className="absolute right-4 top-16 text-teal-300/30 text-[120px]">
                {renderIcon(metricIcons.pressure)}
              </div>
              <div className="relative z-10 mt-10">
                <p className="text-gray-400 text-lg uppercase font-medium">Pressure</p>
                <p className="text-5xl font-bold text-teal-700 leading-none mb-1">
                  {currentWeather?.barometricPressure?.value
                    ? (currentWeather.barometricPressure.value / 100).toFixed(0)
                    : '--'}
                </p>
                <p className="text-base text-gray-500 font-medium">mb</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-1/2 bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-bold" style={{ color: themeColors.primaryText }}>
            Weather Radar - Boston
          </h3>
          <p className="text-sm" style={{ color: themeColors.mutedText }}>
            {format(new Date(), 'EEEE, MMMM d, h:mm a')}
          </p>
        </div>

        <div className="relative flex-1">
          <div
            ref={mapContainerRef}
            className="w-full h-full rounded-2xl overflow-hidden bg-gray-100"
            style={{ minHeight: '500px' }}
          >
            {(!MAPTILER_KEY || MAPTILER_KEY === 'your_maptiler_api_key_here') && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="font-semibold mb-2" style={{ color: themeColors.primaryText }}>
                    MapTiler API Key Required
                  </p>
                  <p className="text-sm" style={{ color: themeColors.mutedText }}>
                    Add your key to frontend/.env
                  </p>
                  <p className="text-xs mt-2" style={{ color: themeColors.mutedText }}>
                    VITE_MAPTILER_API_KEY=your_key
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Weather layer toggle buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => toggleWeatherLayer('precipitation')}
              disabled={!layersReady}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${!layersReady
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : weatherLayer === 'precipitation'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
            >
               Rain
            </button>
            <button
              onClick={() => toggleWeatherLayer('temperature')}
              disabled={!layersReady}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${!layersReady
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : weatherLayer === 'temperature'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
            >
               Temp
            </button>
            <button
              onClick={() => toggleWeatherLayer('wind')}
              disabled={!layersReady}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${!layersReady
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : weatherLayer === 'wind'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
            >
               Wind
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs" style={{ color: themeColors.mutedText }}>
          <p className="text-center">
            MapTiler Weather • Updates every 30 min (Free tier: 5K sessions/month)
          </p>
        </div>
      </div>
    </div>
  )
}

export default WeatherPanel
