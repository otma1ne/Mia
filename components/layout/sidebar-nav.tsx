'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  UserCheck,
  Layers,
  Tag,
  FileText,
  BarChart3,
  ClipboardCheck,
  Briefcase,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const adminSections: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'Inscriptions',  href: '/admin/inscriptions', icon: ClipboardList },
      { label: 'Étudiants',    href: '/admin/students',      icon: Users },
      { label: 'Formateurs',   href: '/admin/trainers',      icon: GraduationCap },
      { label: 'Formations',   href: '/admin/formations',    icon: Layers },
      { label: 'Bilans',       href: '/admin/bilans',        icon: BarChart3 },
      { label: "Secteurs d'activité",   href: '/admin/categories',    icon: Tag },
      { label: 'Commercial',   href: '/admin/commercial',    icon: Briefcase },
      { label: 'Planning',     href: '/admin/schedule',      icon: CalendarDays },
      { label: 'Centre',       href: '/admin/center',        icon: Building2 },
    ],
  },
]

const trainerSections: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/trainer/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Enseignement',
    items: [
      { label: 'Mes modules',   href: '/trainer/modules',   icon: BookOpen },
      { label: 'Étudiants',   href: '/trainer/students',  icon: Users },
      { label: 'Présence',    href: '/trainer/attendance',icon: UserCheck },
      { label: 'Corrections', href: '/trainer/grading',   icon: ClipboardCheck },
      { label: 'Planning',    href: '/trainer/schedule',  icon: CalendarDays },
    ],
  },
]

const studentSections: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/student/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Apprentissage',
    items: [
      { label: 'Parcourir les formations', href: '/student/courses',     icon: BookOpen },
      { label: 'Mes inscriptions',    href: '/student/enrollments', icon: ClipboardList },
      { label: 'Mes documents',       href: '/student/documents',   icon: FileText },
      { label: 'Planning',            href: '/student/schedule',    icon: CalendarDays },
    ],
  },
]

const commercialSections: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/commercial/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Prospection',
    items: [
      { label: 'Mes contacts', href: '/commercial/contacts', icon: Users },
    ],
  },
]

const sectionsByRole: Record<UserRole, NavSection[]> = {
  ADMIN:      adminSections,
  TRAINER:    trainerSections,
  STUDENT:    studentSections,
  COMMERCIAL: commercialSections,
}

interface SidebarNavProps {
  role: UserRole
  onNavigate?: () => void
}

export default function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const sections = sectionsByRole[role] ?? studentSections

  return (
    <nav className="flex flex-col gap-5 px-3">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {section.title && (
            <p className="mb-1 px-3 text-xs font-medium text-muted-foreground/70 tracking-wider">
              {section.title}
            </p>
          )}
          {section.items.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
