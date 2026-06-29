'use client'

import { logout } from '@/app/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, HelpCircle, LogOut, User, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import logoLightSrc from '@/public/logo-light.png'
import SidebarNav from './sidebar-nav'
import type { UserRole } from '@prisma/client'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface AppSidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: UserRole
  }
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const rolePrefix: Record<string, string> = {
  ADMIN:   '/admin',
  TRAINER: '/trainer',
  STUDENT: '/student',
}

function secondaryNav(role: string) {
  const prefix = rolePrefix[role] ?? '/admin'
  return [
    { label: 'Paramètres', href: `${prefix}/settings`, icon: Settings },
    { label: 'Aide',       href: `${prefix}/help`,     icon: HelpCircle },
  ]
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const prefix    = rolePrefix[user.role] ?? '/admin'
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4 border-b border-sidebar-border">
          <Link href="/" aria-label="MIA Académie — Accueil">
            <Image src={logoLightSrc} alt="MIA Académie" width={50} height={50} className="object-contain" />
          </Link>
        </div>

        {/* Primary navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav role={user.role} />
        </div>

        {/* Secondary navigation */}
        <div className="border-t border-sidebar-border py-3 px-3">
          {secondaryNav(user.role).map(({ label, href, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Menu utilisateur"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-sidebar-accent"
                />
              }
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
                <AvatarFallback className="text-[11px] font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <span className="truncate text-sm font-medium leading-none text-sidebar-foreground">{user.name ?? 'Utilisateur'}</span>
                <span className="truncate text-xs mt-0.5" style={{ color: 'var(--mia-slate)' }}>{user.email ?? ''}</span>
              </div>
              <MoreVertical className="h-4 w-4 shrink-0 text-sidebar-foreground/40" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sticky collisionPadding={0} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${prefix}/settings`)}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${prefix}/settings`)}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setConfirmOpen(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Sign out confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Se déconnecter</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => logout()}>
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
