'use client'

import { logout } from '@/app/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Menu, LogOut, User, Settings, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import SidebarNav from './sidebar-nav'
import type { UserRole } from '@prisma/client'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: UserRole
  }
  notifications?: React.ReactNode
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const pageTitles: Record<string, string> = {
  '/admin/dashboard':   'Tableau de bord',
  '/admin/students':    'Étudiants',
  '/admin/trainers':    'Formateurs',
  '/admin/formations':  'Formations',
  '/admin/courses':     'Cours',
  '/admin/schedule':    'Planning',
  '/admin/center':        'Centres',
  '/admin/categories':    "Secteurs d'activité",
  '/admin/inscriptions':  'Inscriptions',
  '/admin/settings':      'Paramètres',
  '/trainer/dashboard': 'Tableau de bord',
  '/trainer/modules':   'Mes modules',
  '/trainer/students':  'Étudiants',
  '/trainer/attendance':'Présence',
  '/trainer/schedule':  'Planning',
  '/student/dashboard': 'Tableau de bord',
  '/student/courses':   'Parcourir les formations',
  '/student/enrollments':'Mes inscriptions',
  '/student/schedule':  'Planning',
  '/settings':          'Paramètres',
  '/help':              'Aide',
  '/profile':           'Profil',
}

const rolePrefix: Record<string, string> = {
  ADMIN:   '/admin',
  TRAINER: '/trainer',
  STUDENT: '/student',
}

function getSecondaryNav(role: string) {
  const prefix = rolePrefix[role] ?? '/admin'
  return [
    { label: 'Paramètres', href: `${prefix}/settings`, icon: Settings },
    { label: 'Aide',       href: `${prefix}/help`,     icon: HelpCircle },
  ]
}

export default function DashboardHeader({ user, notifications }: DashboardHeaderProps) {
  const [open, setOpen]           = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()
  const prefix = rolePrefix[user.role] ?? '/admin'
  const pathname = usePathname()

  const title =
    pageTitles[pathname] ??
    Object.entries(pageTitles).find(([key]) => pathname.startsWith(key + '/'))?.[1] ??
    'Tableau de bord'

  return (
    <>
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-64 flex-col p-0">
          {/* Mobile logo */}
          <div className="flex h-14 items-center gap-2.5 border-b px-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-sm"
              onClick={() => setOpen(false)}
            >
              <div className="w-7 h-7 rounded-md bg-white border flex items-center justify-center">
                <Image src={logoSrc} alt="MIA Formation" width={20} height={20} className="object-contain" />
              </div>
              MIA Formation
            </Link>
          </div>
          {/* Mobile primary nav */}
          <div className="flex-1 overflow-y-auto py-4">
            <SidebarNav role={user.role} onNavigate={() => setOpen(false)} />
          </div>
          {/* Mobile secondary nav */}
          <div className="border-t py-3 px-3">
            {getSecondaryNav(user.role).map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
          {/* Mobile user footer */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium leading-none">{user.name ?? 'Utilisateur'}</span>
                <span className="truncate text-xs text-muted-foreground mt-0.5">{user.email ?? ''}</span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <h1 className="text-base font-semibold">{title}</h1>

      {/* Right slot — notifications + avatar */}
      <div className="ml-auto flex items-center gap-2">
        {notifications}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" aria-label="Menu utilisateur" className="cursor-pointer rounded-full outline-none" />
            }
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
    </header>

    {/* Sign out confirmation */}
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
