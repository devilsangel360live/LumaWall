import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'

function NewsPanel({ colors }) {
  const [news, setNews] = useState({ top: [], politics: [], tech: [], games: [], sports: [] })
  const [nasaPhoto, setNasaPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scrollRefs = useRef({})

  // Default colors
  const themeColors = colors || {
    primaryText: '#F9FAFB',
    secondaryText: '#E5E7EB',
    mutedText: '#D1D5DB'
  }

  // Fetch news and NASA photo on mount
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001'

    const fetchNews = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/news/articles`)
        if (!response.ok) {
          throw new Error('Failed to fetch news')
        }
        const data = await response.json()
        setNews(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching news:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    const fetchNasaPhoto = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/nasa/photo`)
        if (!response.ok) {
          throw new Error('Failed to fetch NASA photo')
        }
        const data = await response.json()
        setNasaPhoto(data)
      } catch (err) {
        console.error('Error fetching NASA photo:', err)
      }
    }

    fetchNews()
    fetchNasaPhoto()

    // Refresh news every 15 minutes
    const newsInterval = setInterval(fetchNews, 15 * 60 * 1000)
    // Refresh NASA photo every hour
    const nasaInterval = setInterval(fetchNasaPhoto, 60 * 60 * 1000)

    return () => {
      clearInterval(newsInterval)
      clearInterval(nasaInterval)
    }
  }, [])

  // Auto-scroll category sections
  useEffect(() => {
    const scrollIntervals = {}

    Object.keys(scrollRefs.current).forEach(category => {
      const container = scrollRefs.current[category]
      if (!container) return

      scrollIntervals[category] = setInterval(() => {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
          // Reached bottom, scroll back to top
          container.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          // Scroll down smoothly
          container.scrollBy({ top: 100, behavior: 'smooth' })
        }
      }, 3000) // Scroll every 3 seconds
    })

    return () => {
      Object.values(scrollIntervals).forEach(clearInterval)
    }
  }, [news, loading])

  // Format date nicely
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      const now = new Date()
      const diffHours = (now - date) / (1000 * 60 * 60)

      if (diffHours < 1) {
        return 'Just now'
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`
      } else {
        return format(date, 'MMM d, h:mm a')
      }
    } catch {
      return ''
    }
  }

  // Category metadata - elegant colors with animated icons
  const categoryInfo = {
    politics: { name: 'Politics', icon: '/icons/politics.gif', accentColor: 'bg-amber-500' },
    tech: { name: 'Technology', icon: '/icons/tech.gif', accentColor: 'bg-cyan-500' },
    games: { name: 'Gaming', icon: '/icons/gaming.gif', accentColor: 'bg-violet-500' },
    sports: { name: 'Sports', icon: '/icons/sports.gif', accentColor: 'bg-green-500' }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl text-white">Loading news...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-white">News Unavailable</h2>
          <p className="text-lg text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  // Get top stories - more items for scrolling
  const topStories = news.top?.slice(0, 20) || []

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-3xl font-bold text-white mb-1">News</h1>
        <p className="text-gray-400 text-xs">Latest headlines from around the world</p>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
        {/* Column 1: NASA Photo of the Day */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          {nasaPhoto ? (
            <>
              <div className="relative flex-1 min-h-0">
                <img
                  src={nasaPhoto.imageUrl}
                  alt={nasaPhoto.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400/1f2937/9ca3af?text=NASA+Photo'
                  }}
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded">
                  <p className="text-white text-xs font-bold">NASA Photo of the Day</p>
                </div>
              </div>
              <div className="px-3 py-2 bg-black/30 backdrop-blur-sm">
                <h3 className="text-white text-xs font-bold mb-1 line-clamp-2">{nasaPhoto.title}</h3>
                <p className="text-gray-300 text-[10px] line-clamp-2">{nasaPhoto.description}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-xs">Loading NASA Photo...</p>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Top Stories - Scrollable */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 flex flex-col min-h-0">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 bg-gradient-to-r from-red-500/20 to-transparent flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/icons/top-stories.gif" alt="Top Stories" className="w-5 h-5" />
              <h3 className="text-white text-xl font-bold">Top Stories</h3>
            </div>
          </div>

          {/* Scrollable Headlines */}
          <div
            ref={el => scrollRefs.current['top'] = el}
            className="flex-1 overflow-y-auto scrollbar-thin min-h-0"
          >
            {topStories.map((story, idx) => (
              <div
                key={story.id || idx}
                className="px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                {idx === 0 && (
                  <span className="inline-block px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase mb-1">
                    Breaking
                  </span>
                )}
                <h4 className="text-white text-sm font-medium leading-snug mb-1">
                  {story.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                  <span className="truncate font-medium">{story.source}</span>
                  <span>•</span>
                  <span className="flex-shrink-0">{formatDate(story.pub_date)}</span>
                </div>
              </div>
            ))}

            {topStories.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                <p className="text-xs">No top stories available</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: All 4 Categories in 2x2 grid */}
        <div className="grid grid-rows-2 grid-cols-2 gap-3 min-h-0">
          {Object.entries(categoryInfo).map(([key, info]) => (
            <div
              key={key}
              className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 flex flex-col min-h-0"
            >
              {/* Category Header */}
              <div className="px-2 py-1.5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <img src={info.icon} alt={info.name} className="w-4 h-4" />
                  <h3 className="text-white text-xl font-bold">{info.name}</h3>
                </div>
              </div>

              {/* Articles List - Scrollable */}
              <div
                ref={el => scrollRefs.current[key] = el}
                className="flex-1 overflow-y-auto scrollbar-thin min-h-0"
              >
                {news[key]?.slice(0, 15).map((article, idx) => (
                  <div
                    key={article.id || idx}
                    className="px-2 py-1.5 border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <h4 className="text-white text-[14px] font-medium leading-tight mb-0.5">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[12px] text-gray-400">
                      <span className="truncate">{article.source}</span>
                      <span>•</span>
                      <span className="flex-shrink-0">{formatDate(article.pub_date)}</span>
                    </div>
                  </div>
                ))}

                {(!news[key] || news[key].length === 0) && (
                  <div className="text-center text-gray-400 py-3">
                    <p className="text-[10px]">No articles available</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NewsPanel
