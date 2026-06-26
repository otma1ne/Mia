import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Award, Download, ExternalLink, FileText } from 'lucide-react'

export const metadata: Metadata = { title: 'Mes documents — MIA Digital' }

export default async function DocumentsPage() {
  const session = await requireAuth()

  const [inscriptions, completedEnrollments] = await Promise.all([
    db.inscription.findMany({
      where: {
        email: session.user.email!,
        status: 'ACCEPTED',
        signedContratUrl: { not: null },
      },
      include: { formation: { select: { title: true } } },
      orderBy: { signedAt: 'desc' },
    }),
    db.formationEnrollment.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
        certificate: { not: null },
      },
      include: { formation: { select: { title: true } } },
      orderBy: { completedAt: 'desc' },
    }),
  ])

  const hasDocuments = inscriptions.length > 0 || completedEnrollments.length > 0

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Mes documents</h1>
        <p className="text-sm text-muted-foreground">
          Retrouvez ici vos attestations et documents contractuels signés.
        </p>
      </div>

      {!hasDocuments && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">Aucun document disponible</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Vos documents apparaîtront ici une fois votre dossier accepté.
          </p>
        </div>
      )}

      {/* Attestations de fin de formation */}
      {completedEnrollments.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Attestations de fin de formation
          </h2>
          {completedEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Award className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{enrollment.formation.title}</p>
                    {enrollment.completedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Terminée le {format(new Date(enrollment.completedAt), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={enrollment.certificate!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents contractuels signés */}
      {inscriptions.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Documents contractuels signés
          </h2>
          {inscriptions.map((inscription) => (
            <div key={inscription.id} className="rounded-lg border bg-card p-5">
              <div className="mb-4">
                <p className="font-semibold text-sm">{inscription.formation.title}</p>
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
