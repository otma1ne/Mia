'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Check, User } from 'lucide-react'

interface ProfileFormProps {
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    avatar: string | null
    role: string
    createdAt: Date
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrateur', TRAINER: 'Formateur', STUDENT: 'Étudiant',
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 2500)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Profil</h2>
          <p className="text-xs text-muted-foreground">Mettre à jour vos informations personnelles</p>
        </div>
      </div>

      {/* Avatar + meta */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <Badge variant="secondary" className="w-fit text-[11px] mt-0.5">
            {roleLabel[user.role] ?? user.role}
          </Badge>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user.email} disabled className="opacity-60" />
            <p className="text-[11px] text-muted-foreground">L&apos;e-mail ne peut pas être modifié.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">
              Téléphone <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ''} placeholder="+33 6 00 00 00 00" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Membre depuis</Label>
            <Input
              value={new Intl.DateTimeFormat('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(user.createdAt))}
              disabled
              className="opacity-60"
            />
          </div>
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="gap-1.5">
            {saved ? <><Check className="h-4 w-4" /> Enregistré</> : pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
