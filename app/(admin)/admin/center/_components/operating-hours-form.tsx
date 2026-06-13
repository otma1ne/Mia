'use client'

import { useState, useTransition } from 'react'
import { saveOperatingHours } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

interface DayHours {
  dayOfWeek: number
  open: string
  close: string
  enabled: boolean
}

interface OperatingHoursFormProps {
  centerId: string
  initialHours: { dayOfWeek: number; open: string; close: string }[]
}

export default function OperatingHoursForm({ centerId, initialHours }: OperatingHoursFormProps) {
  const [hours, setHours] = useState<DayHours[]>(
    DAYS.map((_, i) => {
      const existing = initialHours.find(h => h.dayOfWeek === i)
      return {
        dayOfWeek: i,
        open:  existing?.open  ?? '09:00',
        close: existing?.close ?? '17:00',
        enabled: !!existing,
      }
    })
  )
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(idx: number) {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, enabled: !h.enabled } : h))
  }

  function updateTime(idx: number, field: 'open' | 'close', value: string) {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h))
  }

  function handleSave() {
    setError(null)
    for (const h of hours.filter(h => h.enabled)) {
      if (h.open >= h.close) {
        setError(`${DAYS[h.dayOfWeek]} : l'heure de fermeture doit être après l'heure d'ouverture.`)
        return
      }
    }
    startTransition(async () => {
      await saveOperatingHours(centerId, hours)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Horaires d&apos;ouverture</h2>
          <p className="text-xs text-muted-foreground">Définir les jours et heures d&apos;ouverture du centre</p>
        </div>
      </div>

      <div className="flex flex-col divide-y">
        {DAYS.map((day, idx) => {
          const h = hours[idx]
          return (
            <div key={day} className="flex items-center gap-4 py-3">
              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggle(idx)}
                className={cn(
                  'relative h-5 w-9 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  h.enabled ? 'bg-primary' : 'bg-input'
                )}
                aria-label={`Toggle ${day}`}
              >
                <span className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  h.enabled ? 'translate-x-0' : 'translate-x-0.5'
                )} />
              </button>

              {/* Day name */}
              <span className={cn('w-24 text-sm font-medium shrink-0', !h.enabled && 'text-muted-foreground')}>
                {day}
              </span>

              {h.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={h.open}
                    onChange={e => updateTime(idx, 'open', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground text-sm">à</span>
                  <Input
                    type="time"
                    value={h.close}
                    onChange={e => updateTime(idx, 'close', e.target.value)}
                    className="w-32"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">Fermé</span>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
          {saved ? (
            <><Check className="h-4 w-4" /> Enregistré</>
          ) : isPending ? 'Enregistrement…' : 'Enregistrer les horaires'}
        </Button>
      </div>
    </Card>
  )
}
