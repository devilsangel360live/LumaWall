import { format, parseISO, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns'

/**
 * Format a date string into a human-readable relative format
 */
export function formatRelativeDate(dateString) {
  const date = parseISO(dateString)

  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'

  const daysDiff = differenceInDays(date, new Date())

  if (daysDiff > 0 && daysDiff <= 7) {
    return format(date, 'EEEE') // Day name for next week
  }

  if (daysDiff < 0 && daysDiff >= -7) {
    return format(date, 'EEEE') // Day name for last week
  }

  return format(date, 'MMM d') // Month and day
}

/**
 * Format time range for an event
 */
export function formatTimeRange(startDateTime, endDateTime, allDay = false) {
  if (allDay) return 'All day'

  const start = parseISO(startDateTime)
  const end = parseISO(endDateTime)

  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
}

/**
 * Get calendar color with fallback
 */
export function getCalendarColor(color, defaultColor = '#3B82F6') {
  return color || defaultColor
}

/**
 * Group events by date
 */
export function groupEventsByDate(events) {
  const grouped = {}

  events.forEach(event => {
    const dateKey = format(parseISO(event.start_datetime), 'yyyy-MM-dd')
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(event)
  })

  return grouped
}
