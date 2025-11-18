import { format, parseISO, startOfDay, isSameDay, addDays, subDays } from 'date-fns'
import { useMemo } from 'react'

function TimelineView({ events = [], loading }) {
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

    // Sort events within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) =>
        new Date(a.start_datetime) - new Date(b.start_datetime)
      )
    })

    return grouped
  }, [events])

  // Generate date range (T-7 to T+30)
  const dateRange = useMemo(() => {
    const today = new Date()
    const dates = []

    for (let i = -7; i <= 30; i++) {
      const date = addDays(today, i)
      dates.push(date)
    }

    return dates
  }, [])

  return (
    <div className="glass-card p-6 h-full">
      <h2 className="text-2xl font-bold mb-6 text-aurora-cyan">Timeline</h2>

      {loading && events.length === 0 ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-aurora-indigo/30 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-16 bg-aurora-indigo/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 scrollbar-thin overflow-y-auto max-h-[calc(100vh-300px)]">
          {dateRange.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dateKey] || []
            const isToday = isSameDay(date, new Date())
            const isPast = date < startOfDay(new Date())

            // Show dates with events, plus today, plus next few days
            const shouldShow = dayEvents.length > 0 || isToday ||
              (date > new Date() && date <= addDays(new Date(), 7))

            if (!shouldShow) return null

            return (
              <div key={dateKey} className={isPast ? 'opacity-50' : ''}>
                <div className="flex items-baseline gap-3 mb-3">
                  <h3 className={`text-lg font-semibold ${
                    isToday
                      ? 'text-aurora-coral'
                      : 'text-aurora-offWhite'
                  }`}>
                    {format(date, 'EEE, MMM d')}
                  </h3>
                  {isToday && (
                    <span className="text-xs bg-aurora-coral/20 text-aurora-coral px-2 py-1 rounded-full">
                      Today
                    </span>
                  )}
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-aurora-purple">
                      {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {dayEvents.length === 0 ? (
                  <div className="text-aurora-indigo text-sm italic pl-4">
                    No events
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map(event => (
                      <TimelineEventCard key={event.id} event={event} />
                    ))}
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

function TimelineEventCard({ event }) {
  const startTime = parseISO(event.start_datetime)
  const endTime = parseISO(event.end_datetime)

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-aurora-indigo/20 hover:bg-aurora-indigo/30 transition-colors border-l-2"
      style={{ borderLeftColor: event.calendar_color }}
    >
      {/* Time */}
      <div className="text-sm text-aurora-cyan min-w-[80px]">
        {event.all_day ? (
          <span>All day</span>
        ) : (
          <span>{format(startTime, 'h:mm a')}</span>
        )}
      </div>

      {/* Event details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{event.summary}</h4>
          {event.recurring && (
            <span className="text-xs text-aurora-cyan">↻</span>
          )}
        </div>

        {event.location && (
          <p className="text-xs text-aurora-purple truncate">📍 {event.location}</p>
        )}
      </div>

      {/* Calendar indicator */}
      <div className="flex items-center gap-1">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: event.calendar_color }}
        ></span>
      </div>
    </div>
  )
}

export default TimelineView
