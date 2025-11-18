import { format, parseISO } from 'date-fns'

function TodayCompact({ events = [], loading }) {
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.start_datetime) - new Date(b.start_datetime)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 pb-3 border-b-2 border-earthy-rose">
        <h2 className="text-3xl font-bold text-earthy-slate mb-1">Today</h2>
        <p className="text-base text-earthy-slate/60">
          {format(new Date(), 'EEEE, MMM d')}
        </p>
      </div>

      {/* Events */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {loading && events.length === 0 ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-earthy-cream rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-earthy-cream rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-earthy-slate/50 text-lg">No events today</p>
            <p className="text-earthy-slate/30 text-sm mt-2">Enjoy your free time!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map(event => (
              <TodayEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TodayEventCard({ event }) {
  const startTime = parseISO(event.start_datetime)
  const endTime = parseISO(event.end_datetime)

  return (
    <div
      className="p-4 rounded-lg bg-white border-l-4 shadow-sm"
      style={{ borderLeftColor: event.calendar_color }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-base text-earthy-slate leading-tight">
          {event.summary}
        </h3>
        {event.recurring && (
          <span className="text-sm text-earthy-sage ml-2">↻</span>
        )}
      </div>

      <div className="text-sm text-earthy-slate/70 space-y-1">
        {event.all_day ? (
          <p className="font-medium text-earthy-rose">All Day</p>
        ) : (
          <p className="font-medium">
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </p>
        )}

        {event.location && (
          <p className="flex items-center gap-1 truncate text-xs">
            <span>📍</span>
            <span className="truncate">{event.location}</span>
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: event.calendar_color }}
        ></span>
        <span className="text-xs text-earthy-slate/50">{event.calendar_name}</span>
      </div>
    </div>
  )
}

export default TodayCompact
