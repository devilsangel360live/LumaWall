import { useState, useEffect } from 'react'

// Import weather icons (same as WeatherPanel)
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
import partlyCloudyDayIcon from '../assets/icons/weather/partly-cloudy-day.svg'
import partlyCloudyNightIcon from '../assets/icons/weather/partly-cloudy-night.svg'
import rainIcon from '../assets/icons/weather/rain.svg'
import sleetIcon from '../assets/icons/weather/sleet.svg'
import smokeIcon from '../assets/icons/weather/smoke.svg'
import snowIcon from '../assets/icons/weather/snow.svg'
import thunderstormsIcon from '../assets/icons/weather/thunderstorms.svg'
import windIcon from '../assets/icons/weather/wind.svg'

function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  // Boston coordinates
  const BOSTON_LAT = 42.3601
  const BOSTON_LON = -71.0589

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const pointResponse = await fetch(
          `https://api.weather.gov/points/${BOSTON_LAT},${BOSTON_LON}`
        )
        const pointData = await pointResponse.json()

        const observationResponse = await fetch(pointData.properties.observationStations)
        const stationsData = await observationResponse.json()

        let currentTemp = null
        let currentCondition = 'Unknown'
        let iconUrl = null

        // Get current observation
        if (stationsData.features && stationsData.features.length > 0) {
          const stationUrl = stationsData.features[0].id
          const latestObsResponse = await fetch(`${stationUrl}/observations/latest`)
          const latestObs = await latestObsResponse.json()

          const tempC = latestObs.properties.temperature?.value
          currentTemp = tempC ? Math.round((tempC * 9 / 5) + 32) : null
          currentCondition = latestObs.properties.textDescription || 'Unknown'
          iconUrl = latestObs.properties.icon
        }

        setWeather({
          temp: currentTemp,
          condition: currentCondition,
          icon: getWeatherIcon(iconUrl)
        })
        setLoading(false)
      } catch (err) {
        console.error('Weather widget error:', err)
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // Update every 10 minutes
    return () => clearInterval(interval)
  }, [])

  // Weather icon mapping - uses custom SVG icons (same logic as WeatherPanel)
  const getWeatherIcon = (iconUrl) => {
    if (!iconUrl) {
      return partlyCloudyDayIcon
    }

    // Extract weather condition code from NOAA icon URL
    const urlParts = iconUrl.split('/').pop()
    const conditionWithQuery = urlParts.split(',')[0]
    const condition = conditionWithQuery.split('?')[0].replace(/\d+/g, '')

    // Check if it's a night condition
    const isNight = iconUrl.includes('/night/')

    // Map NOAA weather codes to imported icon files
    const iconMap = {
      'skc': isNight ? clearNightIcon : clearDayIcon,
      'few': isNight ? partlyCloudyNightIcon : partlyCloudyDayIcon,
      'sct': isNight ? partlyCloudyNightIcon : partlyCloudyDayIcon,
      'bkn': cloudyIcon,
      'ovc': isNight ? overcastNightIcon : overcastDayIcon,
      'wind_skc': windIcon,
      'wind': windIcon,
      'rain': rainIcon,
      'rain_showers': rainIcon,
      'shwrs': rainIcon,
      'hi_shwrs': rainIcon,
      'fzra': sleetIcon,
      'rain_fzra': sleetIcon,
      'rain_sleet': sleetIcon,
      'sleet': sleetIcon,
      'tsra': thunderstormsIcon,
      'tsra_sct': thunderstormsIcon,
      'tsra_hi': thunderstormsIcon,
      'snow': snowIcon,
      'snow_fzra': snowIcon,
      'snow_sleet': snowIcon,
      'blizzard': snowIcon,
      'ip': hailIcon,
      'fog': fogIcon,
      'nfg': fogIcon,
      'mist': mistIcon,
      'haze': hazeIcon,
      'smoke': smokeIcon,
      'dust': hazeIcon,
      'drizzle': drizzleIcon,
      'hurricane': hurricaneIcon,
      'tropical_storm': hurricaneIcon,
      'hot': clearDayIcon,
      'cold': snowIcon
    }

    return iconMap[condition] || partlyCloudyDayIcon
  }

  if (loading) {
    return (
      <div className="card-sage p-5 h-full flex items-center justify-center">
        <p className="text-lg text-earthy-slate/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center gap-4 px-4 py-3">
      {/* Weather Icon */}
      <div className="flex-shrink-0">
        <img
          src={weather?.icon || partlyCloudyDayIcon}
          alt="Weather"
          className="w-20 h-20"
        />
      </div>

      {/* Weather Info */}
      <div className="flex-1 min-w-0">
        <p className="text-6xl font-bold text-earthy-slate leading-none mb-1">
          {weather?.temp ? `${weather.temp}°` : '--'}
        </p>
        <p className="text-2xl text-earthy-slate/80 truncate">
          {weather?.condition || 'Unknown'}
        </p>
      </div>
    </div>
  )
}

export default WeatherWidget
