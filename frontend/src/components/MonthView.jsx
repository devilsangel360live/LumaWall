import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay } from 'date-fns'
import { useMemo } from 'react'

function MonthView({ events = [], loading, colors }) {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Get calendar grid including padding days to start on Sunday
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = getDay(monthStart) // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Add empty cells for days before the month starts
    const paddingDays = Array(firstDayOfMonth).fill(null)

    return [...paddingDays, ...daysInMonth]
  }, [monthStart, monthEnd])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = {}

    events.forEach(event => {
      const dateKey = format(parseISO(event.start_datetime), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    return grouped
  }, [events])

  // Use default colors if not provided
  const themeColors = colors || {
    primaryText: '#4A5759',
    secondaryText: '#4A5759',
    mutedText: '#6B7280',
    border: '#9CA3AF',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(0, 0, 0, 0.1)',
    accentColor: '#DC2626',
    gridLines: 'rgba(0, 0, 0, 0.1)'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Month header - Skylight style */}
      <div className="mb-2 pb-2" style={{ borderBottom: `2px solid ${themeColors.border}` }}>
        <h2 className="text-3xl font-bold" style={{ color: themeColors.primaryText }}>
          {format(today, 'MMMM yyyy')}
        </h2>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-64 bg-earthy-rose/80 rounded-lg"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 flex-1">
          {/* Day headers - Skylight style */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-lg font-bold py-1" style={{ color: themeColors.secondaryText }}>
              {day}
            </div>
          ))}

          {/* Calendar days - Skylight style */}
          {calendarDays.map((day, index) => {
            // Handle padding cells (empty days before month starts)
            if (day === null) {
              return <div key={`padding-${index}`} className="min-h-[80px]" />
            }

            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dateKey] || []
            const isCurrentDay = isToday(day)

            return (
              <div
                key={dateKey}
                className="min-h-[80px] p-2 rounded-lg border shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: isCurrentDay ? themeColors.cardBg : `${themeColors.cardBg}`,
                  borderColor: isCurrentDay ? themeColors.accentColor : themeColors.gridLines,
                  borderWidth: isCurrentDay ? '3px' : '1px'
                }}
              >
                <div
                  className="text-xl font-bold mb-1"
                  style={{ color: isCurrentDay ? themeColors.accentColor : themeColors.primaryText }}
                >
                  {format(day, 'd')}
                </div>

                {dayEvents.length > 0 && (
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className="text-sm truncate px-2 py-1 rounded border-l-3"
                        style={{
                          backgroundColor: themeColors.cardBg,
                          borderLeftColor: event.calendar_color,
                          borderLeftWidth: '3px',
                          borderLeftStyle: 'solid',
                          color: themeColors.primaryText
                        }}
                        title={event.summary}
                      >
                        <span className="font-semibold">{event.summary}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs px-2 font-medium" style={{ color: themeColors.mutedText }}>
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MonthView
