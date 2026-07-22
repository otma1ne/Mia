'use client'

import { useState, useTransition } from 'react'
import { joinWaitlist } from '@/app/actions/waitlist'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function WaitlistForm() {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess]        = useState(false)
  const [error, setError]            = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd        = new FormData(e.currentTarget)
    const firstName = fd.get('firstName') as string
    const email     = fd.get('email')     as string
    const phone     = fd.get('phone')     as string

    startTransition(async () => {
      const result = await joinWaitlist({ firstName, email, phone: phone || undefined })
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? 'Une erreur est survenue.')
      }
    })
  }

  if (success) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl px-8 py-8 text-center"
           style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
               style={{ background: 'rgba(107,43,217,0.2)' }}>
            <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--mia-purple-soft)' }} />
          </div>
        </div>
        <p className="font-semibold text-white text-lg mb-1">C&apos;est noté !</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Tu es sur la liste d&apos;attente MIA Académie.<br />
          On te préviendra dès l&apos;ouverture des inscriptions.
        </p>
      </div>
    )
  }

  const inputClass = [
    'w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all',
    'placeholder:text-white/30 text-white disabled:opacity-60',
    'focus:ring-2 focus:ring-offset-0',
  ].join(' ')

  const inputStyle = {
    background:  'rgba(255,255,255,0.07)',
    border:      '1px solid rgba(255,255,255,0.12)',
    '--tw-ring-color': 'var(--mia-purple)',
  } as React.CSSProperties

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <div className="flex flex-col gap-3">
        {/* Prénom + Email row */}
        <div className="flex gap-3">
          <input
            name="firstName"
            type="text"
            placeholder="Prénom"
            required
            disabled={isPending}
            className={inputClass}
            style={inputStyle}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            disabled={isPending}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Téléphone */}
        <input
          name="phone"
          type="tel"
          placeholder="Téléphone (optionnel)"
          disabled={isPending}
          className={inputClass}
          style={inputStyle}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px active:scale-[0.98] disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
          style={{ background: 'var(--mia-purple)' }}
          onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = 'var(--mia-violet)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--mia-purple)' }}
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</>
            : 'Rejoindre la liste d\'attente'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-center text-xs" style={{ color: 'var(--mia-coral)' }}>{error}</p>
      )}

      <p className="mt-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Zéro spam. Tu seras prévenu(e) dès l&apos;ouverture.
      </p>
    </form>
  )
}
