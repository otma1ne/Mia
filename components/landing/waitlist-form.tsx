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
      <div className="mx-auto max-w-[420px] rounded-2xl px-8 py-7 text-center"
           style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex justify-center mb-3">
          <CheckCircle2 className="h-9 w-9" style={{ color: 'var(--mia-purple)' }} />
        </div>
        <p className="text-white font-semibold text-lg mb-1">C&apos;est noté !</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Tu es sur la liste d&apos;attente MIA Académie.<br />
          On te préviendra dès l&apos;ouverture des inscriptions.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[460px] w-full">
      <div className="flex flex-col gap-2.5">
        {/* Prénom + Email row */}
        <div className="flex gap-2.5">
          <input
            name="firstName"
            type="text"
            placeholder="Prénom"
            required
            disabled={isPending}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors disabled:opacity-60"
            style={{
              background:  'rgba(255,255,255,0.08)',
              border:      '1px solid rgba(255,255,255,0.14)',
              color:       '#fff',
            }}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            disabled={isPending}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors disabled:opacity-60"
            style={{
              background:  'rgba(255,255,255,0.08)',
              border:      '1px solid rgba(255,255,255,0.14)',
              color:       '#fff',
            }}
          />
        </div>

        {/* Téléphone */}
        <input
          name="phone"
          type="tel"
          placeholder="Téléphone (optionnel)"
          disabled={isPending}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors disabled:opacity-60"
          style={{
            background:  'rgba(255,255,255,0.08)',
            border:      '1px solid rgba(255,255,255,0.14)',
            color:       '#fff',
          }}
        />

        {/* Bouton */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-px active:scale-[0.98] disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
          style={{ background: 'var(--mia-purple)' }}
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</>
            : 'Rejoindre la liste d\'attente'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <p className="mt-3 text-center text-xs" style={{ color: '#f87171' }}>{error}</p>
      )}

      {/* Anti-spam */}
      <p className="mt-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Zéro spam. Tu seras prévenu(e) dès l&apos;ouverture.
      </p>
    </form>
  )
}
