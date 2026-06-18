import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import InscriptionForm from './_components/inscription-form'

export const metadata: Metadata = { title: "Demande d'inscription — MIA Formation" }

export default async function StudentInscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ formationId?: string }>
}) {
  const session = await requireAuth()
  const { formationId } = await searchParams

  const [user, formations] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
    db.formation.findMany({
      where:   { status: 'PUBLISHED' },
      select:  { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!user) return null

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-lg">
      <div>
        <h1 className="text-lg font-semibold">Demande d&apos;inscription</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Soumettez votre candidature pour une nouvelle formation. Vous recevrez un email
          pour compléter votre évaluation de besoins.
        </p>
      </div>

      <InscriptionForm
        formations={formations}
        defaultFormationId={formationId}
        user={user}
      />
    </div>
  )
}
