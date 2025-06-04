import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react'
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import '@schedule-x/theme-default/dist/index.css'
import './MyCalendar.css'
import { useEffect, useState } from 'react'


const countries = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
]

function CalendarApp() {
  const [country, setCountry] = useState('US')
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`http://localhost:3001/api/holidays?country=${country}`)
        if (!response.ok) {
          throw new Error('Failed to fetch holidays')
        }
        const data = await response.json()

        if (data.error) {
          setError(data.error)
          setHolidays([])
          return
        }

        const holidayEvents = data.map((h: { date: string; name: string }) => ({
          id: 'highlight-1',
          title: h.name,
          start: h.date,
          end: h.date,
          allDay: true,
          backgroundColor: '#add8e6', // light blue
        }))

        console.log('Fetched holidays:', holidayEvents);

        setHolidays(holidayEvents)
      } catch (error) {
        console.error('Failed to fetch holidays:', error)
        setError('Failed to fetch holidays. Please try again.')
        setHolidays([])
      } finally {
        setLoading(false)
      }
    }

    fetchHolidays()
  }, [country])

  const calendar = useCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    events: holidays.flat(),
    plugins: [createEventsServicePlugin()],
    defaultView: 'month',
  })

  return (
    <div className="calendar-container">
      <div className="controls">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          disabled={loading}
          className="country-select"
        >
          {countries.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        {loading && <span className="loading">Loading holidays...</span>}
        {error && <span className="error">{error}</span>}
      </div>
      
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  )
}

export default CalendarApp