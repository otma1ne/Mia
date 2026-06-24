'use client'

import { useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Search, Users, BookOpen, Clock, MapPin, Monitor, Video,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import type { FormationType } from '@prisma/client'

const typeConfig: Record<FormationType, { label: string; icon: typeof MapPin; className: string }> = {
  PRESENTIAL:   { label: 'Présentiel',    icon: MapPin,   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  REMOTE_LIVE:  { label: 'En ligne live', icon: Monitor,  className: 'bg-violet-50 text-violet-700 border-violet-200' },
  REMOTE_ASYNC: { label: 'Autonome',      icon: Video,    className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const TYPE_TABS: { key: FormationType | 'all'; label: string }[] = [
  { key: 'all',          label: 'Toutes' },
  { key: 'PRESENTIAL',   label: 'Présentiel' },
  { key: 'REMOTE_LIVE',  label: 'En ligne live' },
  { key: 'REMOTE_ASYNC', label: 'Autonome' },
]

interface Formation {
  id: string
  title: string
  description: string
  categoryName: string
  type: FormationType
  enrollmentCount: number
  maxStudents: number
  moduleCount: number
  startDate: Date | null
  endDate: Date | null
}

interface Category {
  id: string
  name: string
}

interface Props {
  data: {
    formations: Formation[]
    total: number
    page: number
    totalPages: number
  }
  search: string
  activeType: FormationType | null
  categories: Category[]
  activeCategoryId: string | null
}

export default function CoursesCatalog({ data, search: initialSearch, activeType, categories, activeCategoryId }: Props) {
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

  return (
    <div className="flex flex-col gap-8">

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <Input
              defaultValue={initialSearch}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher une formation…"
              className="pl-8 w-60 bg-white"
            />
          </div>
          <div className="flex gap-0.5 p-0.5 bg-zinc-100 rounded-lg">
            {TYPE_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => updateParams({ type: key === 'all' ? null : key, page: null })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
                  (key === 'all' ? activeType === null : activeType === key)
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => updateParams({ category: null, page: null })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                activeCategoryId === null
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
              )}
            >
              Toutes les catégories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParams({ category: cat.id, page: null })}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                  activeCategoryId === cat.id
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {formations.length === 0 ? (
        <div className="rounded-2xl border bg-zinc-50 py-20 flex flex-col items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            {initialSearch
              ? `Aucune formation ne correspond à "${initialSearch}".`
              : 'Aucune formation disponible pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map(formation => {
            const typeCfg  = typeConfig[formation.type]
            const TypeIcon = typeCfg.icon
            const isFull   = formation.enrollmentCount >= formation.maxStudents

            return (
              <div
                key={formation.id}
                className="flex flex-col rounded-2xl border bg-white p-5 gap-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-zinc-900 leading-snug line-clamp-2">
                    {formation.title}
                  </h3>
                  <Badge variant="outline" className={cn('text-[10px] shrink-0 gap-1', typeCfg.className)}>
                    <TypeIcon className="h-2.5 w-2.5" />
                    {typeCfg.label}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed -mt-2">
                  {formation.description}
                </p>

                {/* Meta */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <BookOpen className="h-3 w-3 shrink-0 text-zinc-400" />
                    {formation.moduleCount} module{formation.moduleCount !== 1 ? 's' : ''} · {formation.categoryName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="h-3 w-3 shrink-0 text-zinc-400" />
                    {formation.enrollmentCount}/{formation.maxStudents} inscrits
                    {isFull && (
                      <span className="ml-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                        Complet
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="h-3 w-3 shrink-0 text-zinc-400" />
                    {formation.startDate && formation.endDate
                      ? `${format(new Date(formation.startDate), 'd MMM', { locale: fr })} – ${format(new Date(formation.endDate), 'd MMM yyyy', { locale: fr })}`
                      : 'Dates à définir'}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-3 border-t">
                  <Link
                    href={`/login?callbackUrl=/student/courses`}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                      isFull
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed pointer-events-none'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    )}
                  >
                    {isFull ? 'Formation complète' : "S'inscrire"}
                    {!isFull && <ArrowRight className="h-3.5 w-3.5" />}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {total} formation{total !== 1 ? 's' : ''}
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
            <span className="text-xs text-zinc-500 px-2">{page} / {totalPages}</span>
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
      )}

    </div>
  )
}
