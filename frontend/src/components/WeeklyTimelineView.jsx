import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getHours, getMinutes } from 'date-fns'
import { useMemo } from 'react'

function WeeklyTimelineView({ events = [], colors }) {
  // Use default colors if not provided
  const themeColors = colors || {
    primaryText: '#4A5759',
    secondaryText: '#4A5759',
    mutedText: '#6B7280',
    border: '#9CA3AF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    cardBorder: 'rgba(0, 0, 0, 0.1)',
    accentColor: '#DC2626',
    gridLines: 'rgba(0, 0, 0, 0.1)'
  }
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Time slots from 6 AM to 11 PM (every hour for more detail)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 23; hour += 1) {
      slots.push(hour)
    }
    return slots
  }, [])

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = {}
    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd')
      grouped[dateKey] = []
    })

    events.forEach(event => {
      const eventDate = parseISO(event.start_datetime)
      const dateKey = format(eventDate, 'yyyy-MM-dd')
      if (grouped[dateKey]) {
        const startTime = parseISO(event.start_datetime)
        const endTime = parseISO(event.end_datetime)
        grouped[dateKey].push({
          ...event,
          startTime,
          endTime,
          hour: getHours(startTime),
          minute: getMinutes(startTime)
        })
      }
    })

    // Sort events by start time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.startTime - b.startTime)
    })

    return grouped
  }, [events, weekDays])

  // Group events that start at the exact same time
  const groupEventsByStartTime = (dayEvents) => {
    const groups = {}

    dayEvents.forEach(event => {
      const startKey = `${getHours(event.startTime)}-${getMinutes(event.startTime)}`
      if (!groups[startKey]) {
        groups[startKey] = []
      }
      groups[startKey].push(event)
    })

    return Object.values(groups)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Days of week header */}
      <div className="grid grid-cols-8 gap-3 mb-3 pb-3" style={{ borderBottom: `2px solid ${themeColors.border}` }}>
        {/* Empty cell for time column */}
        <div className="text-center" />

        {/* Day headers */}
        {weekDays.map(day => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className="text-center"
              style={{ color: isToday ? themeColors.accentColor : themeColors.secondaryText }}
            >
              <div className="text-2xl font-bold">
                {format(day, 'EEE')}
              </div>
              <div className="text-4xl font-bold">
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Timeline grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-8 gap-3 relative">
          {/* Time column */}
          <div className="space-y-0">
            {timeSlots.map(hour => (
              <div
                key={hour}
                className="h-16 flex items-start justify-end pr-3 text-lg font-semibold"
                style={{ color: themeColors.mutedText }}
              >
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDay[dateKey] || []
            const isToday = isSameDay(day, today)

            return (
              <div
                key={dateKey}
                className="relative border-l"
                style={{ borderColor: isToday ? themeColors.accentColor : themeColors.gridLines }}
              >
                {/* Hour lines */}
                {timeSlots.map(hour => (
                  <div
                    key={hour}
                    className="h-16 border-b"
                    style={{ borderColor: themeColors.gridLines }}
                  />
                ))}

                {/* Events - grouped by start time */}
                <div className="absolute inset-0 p-1">
                  {groupEventsByStartTime(dayEvents).map((group, groupIndex) => {
                    // Use the first event's start time for positioning
                    const firstEvent = group[0]
                    const startHour = getHours(firstEvent.startTime)
                    const startMinute = getMinutes(firstEvent.startTime)
                    const startMinutesFromBase = (startHour - 6) * 60 + startMinute
                    const blockTop = (startMinutesFromBase / 60) * 4 // in rem (4rem per 1-hour block)

                    return (
                      <div
                        key={groupIndex}
                        className="absolute left-2 right-2"
                        style={{ top: `${blockTop}rem` }}
                      >
                        <div className="space-y-2">
                          {group.map((event) => (
                            <div
                              key={event.id}
                              className="px-3 py-2 rounded-lg border-l-4 shadow-md hover:shadow-lg transition-shadow"
                              style={{
                                backgroundColor: `${event.calendar_color}40`,
                                borderLeftColor: event.calendar_color
                              }}
                            >
                              <div className="text-lg font-bold truncate" style={{ color: themeColors.primaryText }}>
                                {event.summary}
                              </div>
                              {!event.all_day && (
                                <div className="text-base font-medium" style={{ color: themeColors.mutedText }}>
                                  {format(event.startTime, 'h:mm a')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WeeklyTimelineView
