import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { db } from '@/lib/db'
import type { FormationType } from '@prisma/client'
import CoursesCatalog from './_components/courses-catalog'

export const metadata: Metadata = {
  title: 'Formations — MIA Digital',
  description: 'Découvrez toutes les formations disponibles à l\'Académie MIA Digital.',
}

const VALID_TYPES: FormationType[] = ['PRESENTIAL', 'REMOTE_LIVE', 'REMOTE_ASYNC']
const PAGE_SIZE = 12

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; category?: string; page?: string }>
}) {
  const { search = '', type, category, page } = await searchParams

  const activeType = VALID_TYPES.includes(type as FormationType)
    ? (type as FormationType)
    : undefined

  const currentPage = Math.max(1, Number(page) || 1)

  // Validate categoryId exists in DB
  const activeCategoryId = category ?? undefined

  const where = {
    status: 'PUBLISHED' as const,
    ...(activeType ? { type: activeType } : {}),
    ...(activeCategoryId ? { categoryId: activeCategoryId } : {}),
    ...(search.trim()
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {}),
  }

  const [total, formations, categories] = await Promise.all([
    db.formation.count({ where }),
    db.formation.findMany({
      where,
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'asc' },
      include: {
        category: { select: { name: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
    }),
    db.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const data = {
    formations: formations.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      categoryName: f.category.name,
      type: f.type,
      enrollmentCount: f._count.enrollments,
      maxStudents: f.maxStudents,
      moduleCount: f._count.modules,
      startDate: null as Date | null,
      endDate: null as Date | null,
    })),
    total,
    page: currentPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-sm px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <div className="w-7 h-7 rounded-md bg-white border flex items-center justify-center shrink-0">
              <Image src={logoSrc} alt="MIA Digital" width={20} height={20} className="object-contain" />
            </div>
            MIA Digital
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/courses"
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100"
            >
              Nos formations
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Accéder à mon espace
            </Link>
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="border-b bg-zinc-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Catalogue de formations</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {total} formation{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''} — inscrivez-vous pour commencer à apprendre.
          </p>
        </div>
      </div>

      {/* Catalog */}
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <CoursesCatalog
            data={data}
            search={search}
            activeType={activeType ?? null}
            categories={categories}
            activeCategoryId={activeCategoryId ?? null}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm text-zinc-900">
            <div className="w-6 h-6 rounded bg-white border flex items-center justify-center shrink-0">
              <Image src={logoSrc} alt="MIA Digital" width={16} height={16} className="object-contain" />
            </div>
            MIA Digital
          </Link>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>contact@miaformation.ma</span>
            <span>·</span>
            <span>+212 522 456 789</span>
            <span>·</span>
            <span>© {new Date().getFullYear()} Académie MIA Digital</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
