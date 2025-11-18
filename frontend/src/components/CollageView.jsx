import { useState, useEffect, useCallback } from 'react'

const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '')
const PHOTO_API_BASE = `${BACKEND_BASE_URL}/api/photos`

function CollageView({ colors }) {
  const [photos, setPhotos] = useState([])
  const [collagePhotos, setCollagePhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imagesLoaded, setImagesLoaded] = useState(0)

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

  // Wrap generateRandomCollage in useCallback to prevent infinite loops
  const generateRandomCollage = useCallback(() => {
    if (photos.length === 0) return

    // Random number of photos (2-6)
    const count = Math.floor(Math.random() * 5) + 2 // 2 to 6

    // Get random photos
    const shuffled = [...photos].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, count)

    // Determine aspect ratio for each photo and add styling
    const withStyles = selected.map(photo => {
      // Default aspect ratio if not available - assume landscape
      let aspectRatio = 1.5 // width / height

      // If photo has width/height metadata, calculate actual aspect ratio
      if (photo.width && photo.height) {
        aspectRatio = photo.width / photo.height
      }

      // Classify as portrait, landscape, or square
      const orientation = aspectRatio < 0.85 ? 'portrait' : aspectRatio > 1.2 ? 'landscape' : 'square'

      return {
        ...photo,
        aspectRatio,
        orientation,
        rotation: Math.random() * 16 - 8, // -8 to +8 degrees
        scale: Math.random() * 0.15 + 0.9, // 0.9 to 1.05
        zIndex: Math.floor(Math.random() * 10)
      }
    })

    setCollagePhotos(withStyles)
  }, [photos])

  // Generate random collage when photos are loaded
  useEffect(() => {
    if (photos.length > 0) {
      generateRandomCollage()
    }
  }, [photos, generateRandomCollage])

  // Auto-rotate collage every 8 seconds
  useEffect(() => {
    if (photos.length === 0 || imagesLoaded < collagePhotos.length) return

    const timer = setInterval(() => {
      setImagesLoaded(0)
      setTimeout(() => {
        generateRandomCollage()
      }, 300)
    }, 8000)

    return () => clearInterval(timer)
  }, [photos.length, imagesLoaded, collagePhotos.length, generateRandomCollage])

  // Generate random grid layout based on photo count
  const getLayoutClass = (count) => {
    const layouts = {
      2: 'grid-cols-2 grid-rows-1 gap-4',
      3: 'grid-cols-3 grid-rows-1 gap-4',
      4: 'grid-cols-2 grid-rows-2 gap-4',
      5: 'grid-cols-3 grid-rows-2 gap-4',
      6: 'grid-cols-3 grid-rows-2 gap-4'
    }
    return layouts[count] || 'grid-cols-3 gap-4'
  }

  // Get individual photo sizing based on aspect ratio and position
  const getPhotoSizeClass = (photo, count, index) => {
    const { orientation } = photo

    // For 5 photos, make first one larger
    if (count === 5 && index === 0) {
      return orientation === 'portrait' ? 'col-span-1 row-span-2' : 'col-span-2 row-span-1'
    }

    // For 4 photos, adjust based on orientation
    if (count === 4) {
      return orientation === 'portrait' ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1'
    }

    // For 2-3 photos
    if (count <= 3) {
      return 'col-span-1 row-span-1'
    }

    return 'col-span-1 row-span-1'
  }

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

  if (collagePhotos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xl" style={{ color: themeColors.secondaryText }}>
          Generating collage...
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      {/* Photo collage grid */}
      <div className={`relative z-10 grid ${getLayoutClass(collagePhotos.length)} p-8 w-full h-full`}>
        {collagePhotos.map((photo, index) => {
          const photoUrl = `${BACKEND_BASE_URL}${photo.url}`

          return (
            <div
              key={`${photo.url}-${index}`}
              className={`${getPhotoSizeClass(photo, collagePhotos.length, index)} relative overflow-hidden`}
              style={{
                zIndex: photo.zIndex
              }}
            >
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  imagesLoaded > index ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{
                  transform: `rotate(${photo.rotation}deg) scale(${photo.scale})`,
                  transformOrigin: 'center center',
                  transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
                }}
              >
                {/* Photo shadow/backing */}
                <div className="absolute -inset-4 bg-white/10 blur-xl" style={{ zIndex: -1 }} />

                {/* Actual photo - fills container completely with object-cover */}
                <img
                  src={photoUrl}
                  alt={photo.filename}
                  className="w-full h-full object-cover rounded-lg border-8 border-white shadow-2xl"
                  style={{
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                  }}
                  onLoad={() => setImagesLoaded(prev => prev + 1)}
                  onError={(e) => {
                    console.error('Error loading image:', photo.url)
                    setImagesLoaded(prev => prev + 1)
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Collage info overlay */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full z-20">
        <p className="text-sm" style={{ color: themeColors.primaryText }}>
          {collagePhotos.length} photos
        </p>
      </div>
    </div>
  )
}

export default CollageView
