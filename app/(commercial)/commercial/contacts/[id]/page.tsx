import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ContactStatusSelector from './_components/contact-status-selector'
import ContactNotes from './_components/contact-notes'
import ContactStatusHistory from './_components/contact-status-history'
import { getPublishedFormationsBasic } from '@/app/actions/commercial'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const commercial = await db.commercial.findUnique({ where: { userId: session.user.id } })
  if (!commercial) redirect('/login')

  const [contact, formations] = await Promise.all([
    db.contact.findUnique({ where: { id } }),
    getPublishedFormationsBasic(),
  ])
  if (!contact || contact.commercialId !== commercial.id) notFound()

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Link href="/commercial/contacts" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Retour aux contacts
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{contact.firstName} {contact.lastName}</h1>
        <p className="text-sm text-muted-foreground">
          Ajouté le {format(contact.createdAt, 'd MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Info card */}
      <div className="border rounded-lg p-4 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-y-2">
          <span className="text-muted-foreground">Téléphone</span>
          <span>{contact.phone}</span>
          <span className="text-muted-foreground">Email</span>
          <span>{contact.email ?? '—'}</span>
          <span className="text-muted-foreground">Ville</span>
          <span>{contact.city ?? '—'}</span>
          <span className="text-muted-foreground">Besoin</span>
          <span>{contact.need}</span>
        </div>
      </div>

      {/* Status selector */}
      <ContactStatusSelector contactId={id} currentStatus={contact.status} formations={formations} />

      {/* Notes */}
      <ContactNotes contactId={id} initialNotes={contact.notes ?? ''} />

      {/* History */}
      <ContactStatusHistory
        history={contact.statusHistory.map(h => ({
          status: h.status,
          changedAt: h.changedAt,
          note: h.note ?? null,
        }))}
      />
    </div>
  )
}
