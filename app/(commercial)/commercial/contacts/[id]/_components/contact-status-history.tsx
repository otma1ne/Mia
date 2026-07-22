import type { ContactStatus } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface HistoryEntry {
  status: ContactStatus
  changedAt: Date
  note: string | null
}

const statusConfig: Record<ContactStatus, { label: string; dotClass: string }> = {
  PROSPECT: { label: 'Prospect', dotClass: 'bg-blue-400' },
  INDECIS:  { label: 'Indécis',  dotClass: 'bg-amber-400' },
  GAGNE:    { label: 'Gagné',    dotClass: 'bg-green-400' },
  PERDU:    { label: 'Perdu',    dotClass: 'bg-red-400' },
}

export default function ContactStatusHistory({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null

  const sorted = [...history].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">Historique des statuts</h2>
      <div className="space-y-2">
        {sorted.map((entry, i) => {
          const cfg = statusConfig[entry.status]
          return (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="flex flex-col items-center mt-1">
                <div className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
                {i < sorted.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="pb-3">
                <p className="font-medium">{cfg.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.changedAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
                {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
