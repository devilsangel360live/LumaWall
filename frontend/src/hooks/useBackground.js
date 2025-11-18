import { useMemo } from 'react'
import { backgrounds, colorSchemes } from '../config/backgrounds'

/**
 * Hook to get background and color scheme for a specific screen
 * @param {string} screen - 'monthly' or 'weekly'
 */
export function useBackground(screen) {
  const config = backgrounds[screen] || {}

  const backgroundStyle = useMemo(() => {
    if (!config.enabled || !config.image) {
      return {}
    }

    const style = {
      backgroundImage: `url(${config.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }

    return style
  }, [config])

  const overlayStyle = useMemo(() => {
    if (!config.enabled || !config.overlay?.enabled) {
      return { display: 'none' }
    }

    const bgColor = config.overlay.color === 'white'
      ? `rgba(255, 255, 255, ${config.overlay.opacity})`
      : `rgba(0, 0, 0, ${config.overlay.opacity})`

    return {
      position: 'absolute',
      inset: 0,
      backgroundColor: bgColor,
      pointerEvents: 'none',
      zIndex: 1
    }
  }, [config])

  const colors = useMemo(() => {
    const theme = config.theme || 'light'
    return colorSchemes[theme]
  }, [config])

  const isBackgroundEnabled = config.enabled && config.image

  return {
    backgroundStyle,
    overlayStyle,
    colors,
    isBackgroundEnabled,
    theme: config.theme || 'light'
  }
}
