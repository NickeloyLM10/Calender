import { useEffect, useMemo, useState } from 'react'
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

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
]

type HolidayEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  backgroundColor: string
}

function CalendarApp() {
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const eventsPlugin = useMemo(() => createEventsServicePlugin(), [])

  const calendar = useCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    events: [],
    plugins: [eventsPlugin],
    defaultView: 'month',
  })

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
          eventsPlugin.set([])
          return
        }

        const holidayEvents: HolidayEvent[] = data.map((h: { date: string; name: string }) => ({
          id: `holiday-${h.date}`,
          title: h.name,
          start: h.date,
          end: h.date,
          allDay: true,
          backgroundColor: '#add8e6', // light blue
        }))

        const weekMap: { [weekKey: string]: number } = {}
        data.forEach((h: { date: string }) => {
          const date = new Date(h.date)
          const year = date.getFullYear()
          const week = getISOWeekNumber(date)
          const key = `${year}-W${week}`
          weekMap[key] = (weekMap[key] || 0) + 1
        })

        const weekHighlights: HolidayEvent[] = Object.entries(weekMap).map(([key, count], idx) => {
          const [yearStr, weekStr] = key.split('-W')
          const year = parseInt(yearStr)
          const week = parseInt(weekStr)
          const { start, end } = getWeekStartEnd(year, week)

          return {
            id: `week-${idx}`,
            title: '',
            start,
            end,
            allDay: true,
            backgroundColor: count > 1 ? '#006400' : '#90ee90',
          }
        })

        eventsPlugin.set([...holidayEvents, ...weekHighlights])
      } catch (err) {
        console.error(err)
        setError('Failed to fetch holidays')
        eventsPlugin.set([])
      } finally {
        setLoading(false)
      }
    }

    fetchHolidays()
  }, [country, eventsPlugin])

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

function getISOWeekNumber(date: Date): number {
  const temp = new Date(date.getTime())
  temp.setHours(0, 0, 0, 0)
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7))
  const week1 = new Date(temp.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  )
}

function getWeekStartEnd(year: number, week: number) {
  const start = new Date(year, 0, 4)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1 + (week - 1) * 7)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}
