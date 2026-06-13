'use client'

import { useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { BrowsableFormationsResult } from '@/app/actions/student-dashboard'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Users, BookOpen, Clock, MapPin, Monitor, Video, Eye, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { FormationType } from '@prisma/client'

const typeConfig: Record<FormationType, { label: string; icon: typeof MapPin; className: string }> = {
  PRESENTIAL:   { label: 'Présentiel',   icon: MapPin,   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  REMOTE_LIVE:  { label: 'En ligne live', icon: Monitor,  className: 'bg-violet-50 text-violet-700 border-violet-200' },
  REMOTE_ASYNC: { label: 'Autonome',      icon: Video,    className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

interface StudentCoursesClientProps {
  data: BrowsableFormationsResult
  search: string
  activeType: FormationType | null
}

export default function StudentCoursesClient({
  data,
  search: initialSearch,
  activeType,
}: StudentCoursesClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k)
        else next.set(k, v)
      })
      router.push(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router]
  )

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || null, page: null })
    }, 300)
  }

  const { formations, total, page, totalPages } = data

  const TYPE_TABS: { key: FormationType | 'all'; label: string }[] = [
    { key: 'all',          label: 'Toutes' },
    { key: 'PRESENTIAL',   label: 'Présentiel' },
    { key: 'REMOTE_LIVE',  label: 'En ligne live' },
    { key: 'REMOTE_ASYNC', label: 'Autonome' },
  ]

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher une formation…"
            className="pl-8 w-52"
          />
        </div>
        <div className="flex gap-0.5">
          {TYPE_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => updateParams({ type: key === 'all' ? null : key, page: null })}
              className={cn(
                'flex cursor-pointer select-none items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                (key === 'all' ? activeType === null : activeType === key)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Formation cards */}
      {formations.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {initialSearch
                ? `Aucune formation ne correspond à "${initialSearch}".`
                : 'Aucune formation disponible pour le moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map(formation => {
            const typeCfg = typeConfig[formation.type]
            const TypeIcon = typeCfg.icon
            const isFull = formation.enrollmentCount >= formation.maxStudents

            return (
              <Card key={formation.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold line-clamp-2 leading-snug">
                      {formation.title}
                    </CardTitle>
                    <Badge variant="outline" className={cn('text-[10px] shrink-0 gap-1', typeCfg.className)}>
                      <TypeIcon className="h-2.5 w-2.5" />
                      {typeCfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {formation.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 flex-1">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3 shrink-0" />
                      {formation.moduleCount} module{formation.moduleCount !== 1 ? 's' : ''} · {formation.categoryName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" />
                      {formation.enrollmentCount}/{formation.maxStudents} inscrits
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      {format(new Date(formation.startDate), 'MMM d')} – {format(new Date(formation.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t">
                    {formation.isEnrolled ? (
                      <Link
                        href={`/student/formations/${formation.id}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1 text-xs')}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Voir ma formation
                      </Link>
                    ) : (
                      <Link
                        href={`/student/inscription?formationId=${formation.id}`}
                        className={cn(
                          buttonVariants({ size: 'sm' }),
                          'ml-auto gap-1.5',
                          isFull && 'pointer-events-none opacity-50'
                        )}
                        aria-disabled={isFull}
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {isFull ? 'Complet' : 'Faire une demande'}
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total} formation{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => updateParams({ page: '1' })} disabled={page === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => updateParams({ page: String(page - 1) })} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => updateParams({ page: String(page + 1) })} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => updateParams({ page: String(totalPages) })} disabled={page === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
