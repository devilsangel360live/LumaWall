import { useState, useEffect } from 'react'
import MonthView from './components/MonthView'
import WeeklyTimelineView from './components/WeeklyTimelineView'
import WeatherWidget from './components/WeatherWidget'
import Slideshow from './components/Slideshow'
import CollageView from './components/CollageView'
import WeatherPanel from './components/WeatherPanel'
import NewsPanel from './components/NewsPanel'
import EntertainmentPanel from './components/EntertainmentPanel'
import { useCalendarData } from './hooks/useCalendarData'
import { useBackground } from './hooks/useBackground'

function App() {
  const { timelineEvents, loading, error } = useCalendarData()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentScreen, setCurrentScreen] = useState(0) // 0 = Monthly, 1 = Weekly, 2 = Slideshow, 3 = Collage, 4 = Weather, 5 = News, 6 = Entertainment
  const [collageKey, setCollageKey] = useState(0) // Force collage refresh when screen changes

  // Get background configurations for all screens
  const monthlyBg = useBackground('monthly')
  const weeklyBg = useBackground('weekly')
  const slideshowBg = useBackground('slideshow')
  const collageBg = useBackground('collage')
  const weatherBg = useBackground('weather')

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Auto-refresh page every 6 hours to prevent memory leaks
  useEffect(() => {
    const REFRESH_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours in milliseconds
    console.log('Auto-refresh scheduled in 6 hours to prevent memory leaks')

    const refreshTimer = setTimeout(() => {
      console.log('Auto-refreshing page to clear memory...')
      window.location.reload()
    }, REFRESH_INTERVAL)

    return () => clearTimeout(refreshTimer)
  }, [])

  // Rotate screens with different durations per screen
  useEffect(() => {
    const durations = {
      0: 0,   // Monthly view: 20 seconds
      1: 0,   // Weekly view: 20 seconds
      2: 0,   // Slideshow: 20 seconds
      3: 0,   // Collage: 20 seconds
      4: 0,   // Weather: 20 seconds
      5: 0,   // News: 30 seconds
      6: 30000    // Entertainment: 30 seconds
    }

    const scheduleNextScreen = () => {
      const currentDuration = durations[currentScreen]
      const timer = setTimeout(() => {
        setCurrentScreen(prev => {
          const next = (prev + 1) % 7  // 7 screens now (0-6)
          // Increment collage key when navigating to collage screen to force fresh render
          if (next === 3) {
            setCollageKey(k => k + 1)
          }
          return next
        })
      }, currentDuration)
      return timer
    }

    const timer = scheduleNextScreen()
    return () => clearTimeout(timer)
  }, [currentScreen])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-rose p-8 max-w-md">
          <h2 className="text-2xl font-bold text-earthy-rose mb-4">Error Loading Calendar</h2>
          <p className="text-earthy-slate">{error}</p>
          <p className="text-sm text-earthy-slate/60 mt-4">
            Make sure the backend is running and calendars are synced.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${!monthlyBg.isBackgroundEnabled && !weeklyBg.isBackgroundEnabled && !slideshowBg.isBackgroundEnabled && !collageBg.isBackgroundEnabled && !weatherBg.isBackgroundEnabled
      ? 'bg-gradient-to-br from-[#344E41] to-earthy-cream'
      : 'bg-gray-900'
      }`}>
      {/* Screen 1: Monthly View */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${currentScreen === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        style={monthlyBg.backgroundStyle}
      >
        {/* Background overlay/veil */}
        <div style={monthlyBg.overlayStyle} />

        <div className="h-screen flex flex-col p-6 relative z-10">
          {/* Header with Clock and Weather */}
          <header className="mb-3 flex justify-between items-center gap-6">
            <div className="flex-1">
              <h1
                className="text-6xl font-bold mb-1"
                style={{ color: monthlyBg.colors.primaryText }}
              >
                {currentTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </h1>
              <p
                className="text-2xl"
                style={{ color: monthlyBg.colors.secondaryText }}
              >
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="w-80">
              <WeatherWidget />
            </div>
          </header>

          {/* Monthly Calendar */}
          <div
            className="flex-1 p-4 overflow-hidden rounded-2xl shadow-lg"
            style={{
              backgroundColor: monthlyBg.colors.cardBg,
              border: `1px solid ${monthlyBg.colors.cardBorder}`
            }}
          >
            <MonthView
              events={timelineEvents}
              loading={loading}
              colors={monthlyBg.colors}
            />
          </div>
        </div>
      </div>

      {/* Screen 2: Weekly Timeline View */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${currentScreen === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        style={weeklyBg.backgroundStyle}
      >
        {/* Background overlay/veil */}
        <div style={weeklyBg.overlayStyle} />

        <div className="h-screen flex flex-col p-8 relative z-10">
          <WeeklyTimelineView
            events={timelineEvents}
            loading={loading}
            colors={weeklyBg.colors}
          />
        </div>
      </div>

      {/* Screen 3: Photo Slideshow */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${currentScreen === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        style={slideshowBg.backgroundStyle}
      >
        {/* Background overlay/veil */}
        <div style={slideshowBg.overlayStyle} />

        <div className="h-screen relative z-10">
          <Slideshow colors={slideshowBg.colors} events={timelineEvents} />
        </div>
      </div>

      {/* Screen 4: Photo Collage */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${currentScreen === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        style={collageBg.backgroundStyle}
      >
        {/* Background overlay/veil */}
        <div style={collageBg.overlayStyle} />

        <div className="h-screen relative z-10">
          {/* Key prop forces fresh collage when screen becomes visible */}
          <CollageView key={collageKey} colors={collageBg.colors} />
        </div>
      </div>

      {/* Screen 5: Weather Panel */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${currentScreen === 4 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        style={weatherBg.backgroundStyle}
      >
        <div style={weatherBg.overlayStyle} />
        <div className="h-screen relative z-10">
          <WeatherPanel colors={weatherBg.colors} />
        </div>
      </div>

      {/* Screen 6: News Panel */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${currentScreen === 5 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="h-screen">
          <NewsPanel />
        </div>
      </div>

      {/* Screen 7: Entertainment Panel */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${currentScreen === 6 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="h-screen">
          <EntertainmentPanel />
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 right-4 text-earthy-sage text-sm animate-pulse bg-white/80 px-3 py-2 rounded-full shadow">
          Syncing...
        </div>
      )}

      {/* Screen indicator dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
        <div className={`w-2 h-2 rounded-full transition-all ${currentScreen === 0 ? 'bg-earthy-slate w-6' : 'bg-earthy-slate/30'}`} />
        <div className={`w-2 h-2 rounded-full transition-all ${currentScreen === 1 ? 'bg-earthy-slate w-6' : 'bg-earthy-slate/30'}`} />
        <div className={`w-2 h-2 rounded-full transition-all ${currentScreen === 2 ? 'bg-earthy-slate w-6' : 'bg-earthy-slate/30'}`} />
        <div className={`w-2 h-2 rounded-full transition-all ${currentScreen === 3 ? 'bg-earthy-slate w-6' : 'bg-earthy-slate/30'}`} />
        <div className={`w-2 h-2 rounded-full transition-all ${currentScreen === 4 ? 'bg-earthy-slate w-6' : 'bg-earthy-slate/30'}`} />
      </div>
    </div>
  )
}

export default App
