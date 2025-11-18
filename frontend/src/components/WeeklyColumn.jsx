import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { useMemo } from 'react'

function WeeklyColumn({ weekStart, events = [] }) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = {}
    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd')
      grouped[dateKey] = []
    })

    events.forEach(event => {
      const eventDate = format(parseISO(event.start_datetime), 'yyyy-MM-dd')
      if (grouped[eventDate]) {
        grouped[eventDate].push(event)
      }
    })

    return grouped
  }, [events, weekDays])

  return (
    <div className="flex flex-col h-full">
      {/* Week header - Skylight style */}
      <div className="mb-6 pb-4 border-b border-earthy-sage/30">
        <h3 className="text-2xl font-bold text-earthy-slate">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </h3>
      </div>

      {/* Days - Skylight style with more spacing */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        {weekDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay[dateKey] || []
          const isToday = isSameDay(day, new Date())

          return (
            <div key={dateKey} className="pb-4">
              {/* Date header - larger and more prominent */}
              <div className={`text-lg font-bold mb-3 ${
                isToday ? 'text-earthy-rose' : 'text-earthy-slate'
              }`}>
                {format(day, 'EEEE, MMM d')}
              </div>

              {dayEvents.length === 0 ? (
                <div className="text-sm text-earthy-slate/40 italic pl-1">No events</div>
              ) : (
                <div className="space-y-2.5">
                  {dayEvents.slice(0, 4).map(event => (
                    <div
                      key={event.id}
                      className="text-sm px-4 py-3 rounded-lg bg-white shadow-sm border-l-4 hover:shadow-md transition-shadow"
                      style={{ borderLeftColor: event.calendar_color }}
                      title={event.summary}
                    >
                      <div className="flex flex-col">
                        {!event.all_day && (
                          <span className="text-earthy-slate/60 text-xs font-medium mb-1">
                            {format(parseISO(event.start_datetime), 'h:mm a')}
                          </span>
                        )}
                        <span className="font-semibold text-earthy-slate leading-relaxed">{event.summary}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="text-xs text-earthy-slate/50 pl-4 pt-1">
                      +{dayEvents.length - 4} more events
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WeeklyColumn
