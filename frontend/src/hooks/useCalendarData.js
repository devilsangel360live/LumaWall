import { useState, useEffect } from 'react'

const API_BASE_URL = '/api/calendar'

export function useCalendarData() {
  const [todayEvents, setTodayEvents] = useState([])
  const [timelineEvents, setTimelineEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch today's events
  const fetchTodayEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/today`)
      if (!response.ok) throw new Error('Failed to fetch today events')
      const data = await response.json()
      setTodayEvents(data)
    } catch (err) {
      console.error('Error fetching today events:', err)
      setError(err.message)
    }
  }

  // Fetch timeline events
  const fetchTimelineEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/timeline`)
      if (!response.ok) throw new Error('Failed to fetch timeline events')
      const data = await response.json()
      setTimelineEvents(data)
    } catch (err) {
      console.error('Error fetching timeline events:', err)
      setError(err.message)
    }
  }

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchTodayEvents(),
        fetchTimelineEvents()
      ])
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchEvents()

    // Refresh every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    todayEvents,
    timelineEvents,
    loading,
    error,
    refetch: fetchEvents
  }
}

// Hook for calendar management
export function useCalendarManagement() {
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCalendars = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/calendars`)
      if (!response.ok) throw new Error('Failed to fetch calendars')
      const data = await response.json()
      setCalendars(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const syncCalendars = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to sync calendars')
      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAuthUrl = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/url`)
      if (!response.ok) throw new Error('Failed to get auth URL')
      const data = await response.json()
      return data.authUrl
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    calendars,
    loading,
    error,
    fetchCalendars,
    syncCalendars,
    getAuthUrl
  }
}
