import { getCommercialStats, getMyContacts } from '@/app/actions/commercial'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const statusLabels = {
  PROSPECT: 'Prospect',
  INDECIS:  'Indécis',
  GAGNE:    'Gagné',
  PERDU:    'Perdu',
} as const

const statusColors = {
  PROSPECT: 'text-blue-600',
  INDECIS:  'text-amber-600',
  GAGNE:    'text-green-600',
  PERDU:    'text-red-600',
} as const

export default async function CommercialDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const commercial = await db.commercial.findUnique({ where: { userId: session.user.id } })
  if (!commercial) redirect('/login')

  const [stats, recent] = await Promise.all([
    getCommercialStats(commercial.id),
    getMyContacts({ page: 1, pageSize: 5 }),
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['PROSPECT', 'INDECIS', 'GAGNE', 'PERDU'] as const).map(s => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {statusLabels[s]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${statusColors[s]}`}>{stats[s]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Derniers contacts</h2>
          <Link href="/commercial/contacts" className="text-sm text-primary hover:underline">
            Voir tous
          </Link>
        </div>
        {recent.contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun contact pour l'instant.</p>
        ) : (
          <div className="border rounded-lg divide-y">
            {recent.contacts.map(c => (
              <Link
                key={c.id}
                href={`/commercial/contacts/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${statusColors[c.status]}`}>
                    {statusLabels[c.status]}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(c.createdAt), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
