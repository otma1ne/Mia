'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { submitLead } from '@/app/actions/leads'

interface FormationOption { id: string; title: string; category: string }

export default function LeadForm({ formations, preselected = '' }: { formations: FormationOption[]; preselected?: string }) {

  const [isPending, startTransition] = useTransition()
  const [error, setError]         = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [company, setCompany]         = useState('')
  const [formationId, setFormationId] = useState(
    formations.some(f => f.id === preselected) ? preselected : '',
  )
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot

  // Regroupe les formations par catégorie pour le <select>
  const groups = useMemo(() => {
    const map = new Map<string, FormationOption[]>()
    for (const f of formations) {
      const key = f.category || 'Autres'
      map.set(key, [...(map.get(key) ?? []), f])
    }
    return [...map.entries()]
  }, [formations])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await submitLead({ name, email, phone, company, formationId, message, website })
      if (!res.success) { setError(res.error ?? 'Une erreur est survenue.'); return }
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="pl-success">
        <div className="pl-success-icon">
          <CheckCircle2 size={28} color="#16A34A" />
        </div>
        <p className="pl-success-title">Merci, demande envoyée !</p>
        <p className="pl-success-sub">
          Un conseiller MIA Académie vous recontacte très vite au <strong>{phone}</strong> ou par email.
        </p>
        <button
          type="button"
          className="pl-success-reset"
          onClick={() => { setSubmitted(false); setMessage('') }}
        >
          Envoyer une autre demande
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="pl-card-body">
      {/* Honeypot anti-spam, invisible pour les humains */}
      <input
        type="text" name="mia_hp_check" tabIndex={-1} autoComplete="new-password" aria-hidden="true"
        value={website} onChange={e => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <div className="pl-field">
        <label htmlFor="lead-name" className="pl-label">Nom complet <span className="pl-required">*</span></label>
        <input id="lead-name" required className="pl-input" placeholder="Jean Dupont"
          value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="pl-field-row">
        <div className="pl-field">
          <label htmlFor="lead-email" className="pl-label">Adresse email <span className="pl-required">*</span></label>
          <input id="lead-email" required type="email" className="pl-input" placeholder="vous@exemple.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="pl-field">
          <label htmlFor="lead-phone" className="pl-label">Téléphone <span className="pl-required">*</span></label>
          <input id="lead-phone" required type="tel" className="pl-input" placeholder="06 00 00 00 00"
            value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="pl-field">
        <label htmlFor="lead-company" className="pl-label">Entreprise</label>
        <input id="lead-company" className="pl-input" placeholder="Nom de votre entreprise (optionnel)"
          value={company} onChange={e => setCompany(e.target.value)} />
      </div>

      <div className="pl-field">
        <label htmlFor="lead-need" className="pl-label">Votre besoin <span className="pl-required">*</span></label>
        <select id="lead-need" required className="pl-input"
          value={formationId} onChange={e => setFormationId(e.target.value)}>
          <option value="" disabled>Choisissez une formation…</option>
          {groups.map(([category, items]) => (
            <optgroup key={category} label={category}>
              {items.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </optgroup>
          ))}
          <option value="autre">Autre / je ne sais pas encore</option>
        </select>
      </div>

      <div className="pl-field">
        <label htmlFor="lead-message" className="pl-label">Votre message</label>
        <textarea id="lead-message" rows={4} maxLength={2000} className="pl-textarea"
          placeholder="Décrivez votre projet, le nombre de personnes, vos disponibilités…"
          value={message} onChange={e => setMessage(e.target.value)} />
      </div>

      {error && <p className="pl-error">{error}</p>}

      <button type="submit" disabled={isPending} className="pl-btn-primary">
        {isPending ? 'Envoi en cours…' : 'Envoyer ma demande'}
        {!isPending && <ArrowRight size={16} />}
      </button>
    </form>
  )
}
