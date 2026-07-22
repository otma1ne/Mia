'use client'

import { useState, useTransition } from 'react'
import { CalendarDays, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { submitPlanifier } from '@/app/actions/planifier'

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

const DAY_LABELS: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
  4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

function formatFrDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${DAY_LABELS[d.getDay()]} ${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`
}

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function PlanifierForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError]             = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [calendarUrl, setCalendarUrl] = useState('')
  const [eventCreated, setEventCreated] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [date, setDate]           = useState('')
  const [time, setTime]           = useState('')
  const [message, setMessage]     = useState('')

  const minDate = getMinDate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await submitPlanifier({ firstName, lastName, email, phone, date, time, message })
      if (!res.success) { setError(res.error ?? 'Une erreur est survenue.'); return }
      setCalendarUrl(res.calendarUrl ?? '')
      setEventCreated(res.eventCreated ?? false)
      setSubmitted(true)
    })
  }

  /* ── Success state ─────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="pl-success">
        <div className="pl-success-icon">
          <CheckCircle2 size={28} color="#16A34A" />
        </div>
        <p className="pl-success-title">Demande envoyée !</p>
        <p className="pl-success-sub">
          Votre demande pour le <strong>{formatFrDate(date)}</strong> à{' '}
          <strong>{time}</strong> a bien été reçue.{' '}
          {eventCreated
            ? "L'événement a été créé dans l'agenda MIA Académie."
            : 'Un conseiller vous confirmera le rendez-vous par email.'}
        </p>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pl-success-cal"
        >
          <CalendarDays size={16} />
          Ajouter à mon Google Agenda
          <ArrowRight size={16} />
        </a>
        <button
          type="button"
          className="pl-success-reset"
          onClick={() => { setSubmitted(false); setDate(''); setTime(''); setMessage('') }}
        >
          Planifier un autre échange
        </button>
      </div>
    )
  }

  /* ── Form ──────────────────────────────────────────────────────────────── */
  return (
    <>
      <form onSubmit={handleSubmit} className="pl-card-body">

        {/* Name row */}
        <div className="pl-field-row">
          <div className="pl-field">
            <label className="pl-label">Prénom <span className="pl-required">*</span></label>
            <input
              required
              className="pl-input"
              placeholder="Othmane"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
          <div className="pl-field">
            <label className="pl-label">Nom <span className="pl-required">*</span></label>
            <input
              required
              className="pl-input"
              placeholder="Benali"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Contact row */}
        <div className="pl-field-row">
          <div className="pl-field">
            <label className="pl-label">Email <span className="pl-required">*</span></label>
            <input
              required
              type="email"
              className="pl-input"
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="pl-field">
            <label className="pl-label">Téléphone</label>
            <input
              type="tel"
              className="pl-input"
              placeholder="06 00 00 00 00"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Date */}
        <div className="pl-field">
          <label htmlFor="pl-date" className="pl-label pl-label-icon">
            <CalendarDays size={14} color="var(--mia-purple)" />
            Date souhaitée <span className="pl-required">*</span>
          </label>
          <input
            id="pl-date"
            required
            type="date"
            min={minDate}
            className="pl-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Time slots */}
        <div className="pl-field">
          <label className="pl-label pl-label-icon">
            <Clock size={14} color="var(--mia-purple)" />
            Heure souhaitée <span className="pl-required">*</span>
          </label>
          <div className="pl-slots">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`pl-slot${time === slot ? ' pl-slot-active' : ''}`}
              >
                {slot}
              </button>
            ))}
          </div>
          {!time && <p className="pl-hint">Sélectionnez un créneau</p>}
        </div>

        {/* Message */}
        <div className="pl-field">
          <label className="pl-label">Message (optionnel)</label>
          <textarea
            rows={3}
            className="pl-textarea"
            placeholder="Précisez l'objet de l'échange, votre projet de formation…"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        {error && <p className="pl-error">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !time}
          className="pl-btn-primary"
        >
          {isPending ? 'Envoi en cours…' : 'Confirmer la demande'}
          {!isPending && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="pl-card-note">
        Un conseiller vous contactera pour confirmer le rendez-vous.
      </p>
    </>
  )
}
