import { useState, useEffect } from 'react'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'

const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '')
const PHOTO_API_BASE = `${BACKEND_BASE_URL}/api/photos`

function Slideshow({ colors, events = [] }) {
  const [photos, setPhotos] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [secondImageLoaded, setSecondImageLoaded] = useState(false)
  const [currentOrientation, setCurrentOrientation] = useState('landscape') // 'portrait' or 'landscape'

  // Default colors if not provided
  const themeColors = colors || {
    primaryText: '#F9FAFB',
    secondaryText: '#E5E7EB',
    mutedText: '#D1D5DB'
  }

  // Fetch photos on mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch(`${PHOTO_API_BASE}/list?random=true&count=100`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch photos')
        }

        const data = await response.json()

        if (data.photos && data.photos.length > 0) {
          setPhotos(data.photos)
          setLoading(false)
        } else {
          setError('No photos found in the collection')
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching photos:', err)
        setError(err.message || 'Failed to load photos')
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  // Detect image orientation
  const detectOrientation = (imgElement) => {
    if (imgElement.naturalHeight > imgElement.naturalWidth) {
      setCurrentOrientation('portrait')
    } else {
      setCurrentOrientation('landscape')
    }
  }

  // Auto-advance slideshow
  useEffect(() => {
    if (photos.length === 0) return

    // For landscape, wait for single image. For portrait, wait for both images
    const isReadyToAdvance = currentOrientation === 'landscape'
      ? imageLoaded
      : (imageLoaded && secondImageLoaded)

    if (!isReadyToAdvance) return

    const timer = setInterval(() => {
      setImageLoaded(false)
      setSecondImageLoaded(false)
      setTimeout(() => {
        // For portrait, skip 2 images at a time
        const increment = currentOrientation === 'portrait' ? 2 : 1
        setCurrentIndex((prevIndex) => (prevIndex + increment) % photos.length)
      }, 200)
    }, 5000) // 5 seconds per photo/photo-pair

    return () => clearInterval(timer)
  }, [photos.length, imageLoaded, secondImageLoaded, currentOrientation])

  // Preload next image(s) with memory cleanup
  useEffect(() => {
    if (photos.length > 1) {
      const increment = currentOrientation === 'portrait' ? 2 : 1
      const nextIndex = (currentIndex + increment) % photos.length
      const img = new Image()
      img.src = `${BACKEND_BASE_URL}${photos[nextIndex].url}`

      // Preload second portrait image if needed
      let img2 = null
      if (currentOrientation === 'portrait' && photos.length > nextIndex + 1) {
        img2 = new Image()
        img2.src = `${BACKEND_BASE_URL}${photos[(nextIndex + 1) % photos.length].url}`
      }

      // Cleanup function to prevent memory leaks
      return () => {
        img.src = ''
        if (img2) img2.src = ''
      }
    }
  }, [currentIndex, photos, currentOrientation])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
            style={{ borderColor: themeColors.primaryText }}></div>
          <p className="text-xl" style={{ color: themeColors.secondaryText }}>
            Loading photos...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: themeColors.mutedText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2" style={{ color: themeColors.primaryText }}>
            Photos Not Available
          </h2>
          <p className="text-lg" style={{ color: themeColors.secondaryText }}>
            {error}
          </p>
          <p className="text-sm mt-4" style={{ color: themeColors.mutedText }}>
            Check Docker volume mount and verify photos are accessible
          </p>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xl" style={{ color: themeColors.secondaryText }}>
          No photos available
        </p>
      </div>
    )
  }

  const currentPhoto = photos[currentIndex]
  const photoUrl = `${BACKEND_BASE_URL}${currentPhoto.url}`

  // Get second photo for portrait mode
  const secondPhoto = currentOrientation === 'portrait' && photos.length > currentIndex + 1
    ? photos[currentIndex + 1]
    : null
  const secondPhotoUrl = secondPhoto ? `${BACKEND_BASE_URL}${secondPhoto.url}` : null

  // Get next 10 upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.start_datetime) >= new Date())
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
    .slice(0, 10)

  // Format event date/time
  const formatEventTime = (event) => {
    const startDate = parseISO(event.start_datetime)
    if (isToday(startDate)) {
      return `Today ${format(startDate, 'h:mm a')}`
    } else if (isTomorrow(startDate)) {
      return `Tomorrow ${format(startDate, 'h:mm a')}`
    } else {
      return format(startDate, 'MMM d, h:mm a')
    }
  }

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden bg-black">
      {/* Blurred zoomed background */}
      <div
        className="absolute inset-0 scale-110 blur-2xl opacity-50"
        style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.5)',
          transform: 'scale(1.2)'
        }}
      />

      {/* Photo display - single landscape or dual portrait */}
      {currentOrientation === 'landscape' ? (
        // Single landscape photo
        <img
          src={photoUrl}
          alt={currentPhoto.filename}
          className={`relative z-10 max-h-[90vh] max-w-[90vw] object-contain transition-opacity duration-500 rounded-lg border-4 border-white/20 shadow-2xl ${imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          onLoad={(e) => {
            detectOrientation(e.target)
            setImageLoaded(true)
          }}
          onError={(e) => {
            console.error('Error loading image:', currentPhoto.url)
            setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length)
          }}
        />
      ) : (
        // Dual portrait photos
        <div className="relative z-10 flex gap-6 items-center justify-center max-h-[90vh] px-8">
          <img
            src={photoUrl}
            alt={currentPhoto.filename}
            className={`h-[85vh] w-auto object-contain transition-opacity duration-500 rounded-lg border-4 border-white/20 shadow-2xl ${imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            onLoad={(e) => {
              detectOrientation(e.target)
              setImageLoaded(true)
            }}
            onError={(e) => {
              console.error('Error loading image:', currentPhoto.url)
              setCurrentIndex((prevIndex) => (prevIndex + 2) % photos.length)
            }}
          />
          {secondPhotoUrl && (
            <img
              src={secondPhotoUrl}
              alt={secondPhoto.filename}
              className={`h-[85vh] w-auto object-contain transition-opacity duration-500 rounded-lg border-4 border-white/20 shadow-2xl ${secondImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              onLoad={() => setSecondImageLoaded(true)}
              onError={(e) => {
                console.error('Error loading second image:', secondPhoto.url)
                setSecondImageLoaded(true) // Continue anyway
              }}
            />
          )}
        </div>
      )}

      {/* Upcoming Events Overlay - Top Left */}
      {upcomingEvents.length > 0 && (
        <div className="absolute top-8 left-8 z-20 max-w-2xl">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <h3 className="text-3xl font-bold mb-4" style={{ color: themeColors.primaryText }}>
              Upcoming Events
            </h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {upcomingEvents.map((event, idx) => (
                <div
                  key={event.id || idx}
                  className="pb-4 border-b border-white/20 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    {/* Calendar color indicator */}
                    <div
                      className="w-2 h-full rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: event.calendar_color || '#888' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-2xl truncate leading-tight" style={{ color: themeColors.primaryText }}>
                        {event.summary}
                      </p>
                      <p className="text-lg mt-1 font-medium" style={{ color: themeColors.mutedText }}>
                        {formatEventTime(event)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
        {photos.slice(0, Math.min(10, photos.length)).map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex % 10 ? 'bg-white w-4' : 'bg-white/40'
              }`}
          />
        ))}
      </div>
    </div>
  )
}

export default Slideshow
