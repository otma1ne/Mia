import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExternalLink, FileText } from 'lucide-react'

export const metadata: Metadata = { title: 'Mes documents — EduDrive' }

export default async function DocumentsPage() {
  const session = await requireAuth()

  const inscriptions = await db.inscription.findMany({
    where: {
      email: session.user.email!,
      status: 'ACCEPTED',
      signedContratUrl: { not: null },
    },
    include: { formation: { select: { title: true } } },
    orderBy: { signedAt: 'desc' },
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Mes documents</h1>
        <p className="text-sm text-muted-foreground">
          Retrouvez ici les documents contractuels signés pour vos formations.
        </p>
      </div>

      {inscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">Aucun document disponible</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Vos documents signés apparaîtront ici une fois votre dossier accepté.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {inscriptions.map((inscription) => (
            <div key={inscription.id} className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-semibold">{inscription.formation.title}</h2>
                {inscription.signedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Signé le {format(new Date(inscription.signedAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={inscription.signedContratUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Contrat de formation
                </a>
                {inscription.signedReglementUrl && (
                  <a
                    href={inscription.signedReglementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    Règlement intérieur
                  </a>
                )}
                {inscription.signedCgvUrl && (
                  <a
                    href={inscription.signedCgvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    Conditions générales de vente
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
