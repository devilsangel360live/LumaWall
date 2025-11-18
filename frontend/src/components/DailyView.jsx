import { format, parseISO, isToday } from 'date-fns'

function DailyView({ events = [], loading }) {
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.start_datetime) - new Date(b.start_datetime)
  )

  return (
    <div className="glass-card p-6 h-full">
      <h2 className="text-2xl font-bold mb-6 text-aurora-cyan">Today</h2>

      {loading && events.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-aurora-indigo/30 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-aurora-indigo/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-aurora-purple text-lg">No events today</p>
          <p className="text-aurora-indigo text-sm mt-2">Enjoy your free time!</p>
        </div>
      ) : (
        <div className="space-y-4 scrollbar-thin overflow-y-auto max-h-[calc(100vh-300px)]">
          {sortedEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event }) {
  const startTime = parseISO(event.start_datetime)
  const endTime = parseISO(event.end_datetime)
  const isAllDay = event.all_day

  return (
    <div
      className="p-4 rounded-xl bg-aurora-indigo/30 border-l-4 hover:bg-aurora-indigo/40 transition-colors"
      style={{ borderLeftColor: event.calendar_color }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{event.summary}</h3>
        {event.recurring && (
          <span className="text-xs text-aurora-cyan">↻</span>
        )}
      </div>

      <div className="text-sm text-aurora-lightGray space-y-1">
        {isAllDay ? (
          <p className="text-aurora-cyan">All Day</p>
        ) : (
          <p className="text-aurora-cyan">
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </p>
        )}

        {event.location && (
          <p className="flex items-center gap-1">
            <span>📍</span>
            <span>{event.location}</span>
          </p>
        )}

        {event.description && (
          <p className="text-aurora-purple text-xs mt-2 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: event.calendar_color }}
        ></span>
        <span className="text-xs text-aurora-purple">{event.calendar_name}</span>
      </div>
    </div>
  )
}

export default DailyView
