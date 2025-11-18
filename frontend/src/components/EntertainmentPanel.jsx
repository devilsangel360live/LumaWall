import { useState, useEffect, useRef } from 'react'

const BACKEND_BASE_URL = (import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001').replace(/\/$/, '')

function EntertainmentPanel({ colors }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
  const skyRef = useRef(null)
  const virtualSkyInstance = useRef(null)

  // Default colors
  const themeColors = colors || {
    primaryText: '#F9FAFB',
    secondaryText: '#E5E7EB',
    mutedText: '#D1D5DB'
  }

  // Fetch all entertainment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching entertainment data from:', `${BACKEND_BASE_URL}/api/entertainment/all`)
        const response = await fetch(`${BACKEND_BASE_URL}/api/entertainment/all`)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
        }
        const result = await response.json()
        console.log('Entertainment data received:', result)
        setData(result)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching entertainment data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 1 hour
    const interval = setInterval(fetchData, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Rotate through movies every 5 seconds
  useEffect(() => {
    if (!data?.movies || data.movies.length === 0) return

    const interval = setInterval(() => {
      setCurrentMovieIndex(prev => (prev + 1) % Math.min(data.movies.length, 12))
    }, 5000)

    return () => clearInterval(interval)
  }, [data?.movies])

  // Initialize VirtualSky when data is loaded
  useEffect(() => {
    if (!data?.location || !skyRef.current) return

    // Check if S (stuquery) and S.virtualsky are available
    if (typeof window.S === 'undefined' || typeof window.S.virtualsky === 'undefined') {
      console.error('❌ VirtualSky library not loaded')
      return
    }

    console.log('✅ Initializing VirtualSky with location:', data.location)

    try {
      // Initialize VirtualSky with proper paths to data files
      virtualSkyInstance.current = window.S.virtualsky({
        id: skyRef.current.id,
        projection: 'stereo',
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        clock: new Date(),
        gradient: true,
        cardinalpoints: true,
        constellations: true,
        constellationlabels: true,
        showstars: true,
        showstarlabels: true,
        showplanets: true,
        showplanetlabels: true,
        ground: true,
        az: 180,
        keyboard: false,
        mouse: false,
        // Specify paths to data files
        lang: 'en',
        langurl: '/virtualsky/lang/',
        planets: {
          'Mercury': true,
          'Venus': true,
          'Mars': true,
          'Jupiter': true,
          'Saturn': true
        }
      })

      console.log('✅ VirtualSky initialized successfully')

      // Set up rotation animation - slowly pan through 360 degrees
      let currentAz = 180 // Start facing south
      const rotationInterval = setInterval(() => {
        if (virtualSkyInstance.current) {
          currentAz = (currentAz + 1) % 360 // Rotate 1 degree every interval
          virtualSkyInstance.current.az = currentAz
          virtualSkyInstance.current.draw() // Redraw the sky
        }
      }, 200) // Update every 200ms for smooth rotation

      // Store interval for cleanup
      virtualSkyInstance.current.rotationInterval = rotationInterval

      console.log('✅ Star chart rotation started')
    } catch (err) {
      console.error('❌ Error initializing VirtualSky:', err)
    }

    // Cleanup
    return () => {
      if (virtualSkyInstance.current) {
        if (virtualSkyInstance.current.rotationInterval) {
          clearInterval(virtualSkyInstance.current.rotationInterval)
        }
        virtualSkyInstance.current = null
      }
    }
  }, [data?.location])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl text-white">Loading entertainment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-white">Content Unavailable</h2>
          <p className="text-lg text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  const currentMovies = data?.movies?.slice(currentMovieIndex, currentMovieIndex + 3) || []
  const historyEvents = data?.history?.events || []

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex">
      {/* Left Column: Movies + History */}
      <div className="w-1/3 flex flex-col p-4 space-y-4">
        {/* Movies Section */}
        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-transparent">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🎬</span> Now in Theaters
            </h2>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            {currentMovies.length > 0 ? (
              <div className="space-y-3 h-full flex flex-col justify-around">
                {currentMovies.map((movie, idx) => (
                  <div key={movie.id} className="flex gap-3 bg-white/5 rounded-lg p-2 transition-all duration-500 hover:bg-white/10">
                    {/* Movie Poster */}
                    {movie.posterPath && (
                      <img
                        src={movie.posterPath}
                        alt={movie.title}
                        className="w-20 h-28 object-cover rounded shadow-lg flex-shrink-0"
                      />
                    )}

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white line-clamp-2 mb-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400 text-sm">★ {movie.rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-sm">{movie.releaseDate?.split('-')[0]}</span>
                      </div>
                      <p className="text-gray-300 text-xs line-clamp-3">
                        {movie.overview}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No movies available</p>
              </div>
            )}
          </div>
        </div>

        {/* Today in History Section */}
        <div className="h-2/5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-amber-500/20 to-transparent">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>📜</span> On This Day
            </h2>
            {data?.history?.date && (
              <p className="text-sm text-gray-300">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historyEvents.slice(0, 6).map((event, idx) => (
              <div key={idx} className="border-l-4 border-amber-500 pl-3 py-1 transition-all hover:border-amber-400">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold text-sm flex-shrink-0">{event.year}</span>
                  {event.type === 'birth' && <span className="text-xs">👶</span>}
                  {event.type === 'death' && <span className="text-xs">🕊️</span>}
                </div>
                <p className="text-white text-sm leading-snug">{event.text}</p>
              </div>
            ))}

            {historyEvents.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No historical events available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Star Chart */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-transparent">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>⭐</span> Night Sky
            </h2>
            <p className="text-sm text-gray-300">Current star positions for your location</p>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            {/* VirtualSky star chart */}
            <div
              ref={skyRef}
              id="starmap"
              className="w-full h-full rounded-lg"
              style={{ minHeight: '500px' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EntertainmentPanel
