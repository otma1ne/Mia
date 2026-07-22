import { google } from 'googleapis'

function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  return google.calendar({ version: 'v3', auth })
}

export interface CalendarEventParams {
  summary:      string
  description:  string
  date:         string  // "YYYY-MM-DD"
  time:         string  // "HH:MM"
  timezone?:    string
}

export async function createCalendarEvent(params: CalendarEventParams) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'
  const tz         = params.timezone ?? 'Europe/Paris'

  const [h, m]        = params.time.split(':').map(Number)
  const pad           = (n: number) => String(n).padStart(2, '0')
  const startDateTime = `${params.date}T${pad(h)}:${pad(m)}:00`
  const endDateTime   = `${params.date}T${pad(h + 1)}:${pad(m)}:00`

  const calendar = getClient()
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary:     params.summary,
      description: params.description,
      start: { dateTime: startDateTime, timeZone: tz },
      end:   { dateTime: endDateTime,   timeZone: tz },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    },
  })

  return res.data
}
