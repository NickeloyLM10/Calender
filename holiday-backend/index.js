const express = require('express')
const Holidays = require('date-holidays')
const cors = require('cors')

const app = express()
app.use(cors()) // allow cross-origin requests

app.get('/api/holidays', (req, res) => {
  const country = req.query.country || 'US'
  const year = new Date().getFullYear()

  const hd = new Holidays(country)
  const holidays = hd.getHolidays(year)

  if (!holidays || holidays.length === 0) {
    return res.status(400).json({ error: 'Invalid country code or no holidays found' })
  }

  // Send only date and name fields
  const filtered = holidays.map(h => ({
    date: h.date.slice(0, 10), // format as YYYY-MM-DD
    name: h.name,
  }))

  console.log(`Holidays for ${country} in ${year}:`, filtered);

  res.json(filtered)
})
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Holiday API server running on port ${PORT}`)
})
