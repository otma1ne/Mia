'use server'

import { sendPlanifierNotification } from '@/lib/email'
import { createCalendarEvent }       from '@/lib/google-calendar'

export interface PlanifierInput {
  firstName: string
  lastName:  string
  email:     string
  phone:     string
  date:      string   // "YYYY-MM-DD"
  time:      string   // "HH:MM"
  message:   string
}

function buildCalendarUrl(input: PlanifierInput): string {
  const pad  = (s: string | number) => String(s).padStart(2, '0')
  const stamp = (date: string, time: string) =>
    date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00'

  const [h, m] = input.time.split(':').map(Number)
  const start  = stamp(input.date, input.time)
  const end    = stamp(input.date, `${pad(h + 1)}:${pad(m)}`)

  const title   = encodeURIComponent(`Échange conseil — ${input.firstName} ${input.lastName}`)
  const details = encodeURIComponent(
    `Rendez-vous conseil MIA Digital\n\n` +
    `Nom : ${input.firstName} ${input.lastName}\n` +
    `Email : ${input.email}\n` +
    `Téléphone : ${input.phone || '—'}\n\n` +
    `Message :\n${input.message || '—'}`,
  )

  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}` +
    `&dates=${start}/${end}` +
    `&details=${details}` +
    `&sf=true`
  )
}

export async function submitPlanifier(input: PlanifierInput) {
  if (!input.firstName || !input.lastName || !input.email || !input.date || !input.time) {
    return { success: false, error: 'Veuillez remplir tous les champs obligatoires.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { success: false, error: 'Adresse email invalide.' }
  }

  const selectedDate = new Date(input.date)
  const today        = new Date(); today.setHours(0, 0, 0, 0)
  if (selectedDate < today) {
    return { success: false, error: 'Veuillez choisir une date future.' }
  }

  const eventTitle = `Échange conseil — ${input.firstName} ${input.lastName}`
  const eventDesc  =
    `Rendez-vous conseil MIA Digital\n\n` +
    `Nom : ${input.firstName} ${input.lastName}\n` +
    `Email : ${input.email}\n` +
    `Téléphone : ${input.phone || '—'}\n\n` +
    `Message :\n${input.message || '—'}`

  // Create event in admin's Google Calendar (non-fatal on failure)
  let eventCreated = false
  try {
    await createCalendarEvent({
      summary:     eventTitle,
      description: eventDesc,
      date:        input.date,
      time:        input.time,
    })
    eventCreated = true
  } catch (err) {
    console.error('[planifier] Google Calendar error:', err)
  }

  // Send email notification (non-fatal on failure)
  try {
    await sendPlanifierNotification(input)
  } catch (err) {
    console.error('[planifier] Email error:', err)
  }

  return {
    success:      true,
    eventCreated,
    calendarUrl:  buildCalendarUrl(input),
  }
}
