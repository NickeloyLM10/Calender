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
  background: string
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
    defaultView: 'monthGrid',
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
            background: '#f0f0f0',
          }
        })

        console.log('Events fetched:', holidayEvents)
        console.log('Events sent to plugin:', ...weekHighlights)
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

// Returns ISO week number (1-53) for a given date
function getISOWeekNumber(date: Date): number {
  // Copy date to avoid modifying original
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday (ISO week starts on Monday, Thursday is midweek)
  temp.setUTCDate(temp.getUTCDate() + 4 - (temp.getUTCDay() || 7))
  // January 1st of this year
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.floor(((temp.getTime() - yearStart.getTime()) / 86400000 - 3 + (yearStart.getUTCDay() || 7)) / 7) + 1
  return weekNo
}

// Returns start and end dates (YYYY-MM-DD) of ISO week for a given year and week number
function getWeekStartEnd(year: number, week: number) {
  // January 4th is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  // Get day of week for Jan 4th (Monday=1,...Sunday=7)
  const jan4Day = jan4.getUTCDay() || 7
  // Calculate start of week 1 (Monday)
  const week1Start = new Date(jan4)
  week1Start.setUTCDate(jan4.getUTCDate() - jan4Day + 1)
  // Calculate start of target week
  const weekStart = new Date(week1Start)
  weekStart.setUTCDate(week1Start.getUTCDate() + (week - 1) * 7)
  // Calculate end of week (Sunday)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  }
}
