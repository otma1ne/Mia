import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getStudentModuleDetail } from '@/app/actions/student-dashboard'
import { getExamStatusForStudent } from '@/app/actions/exams'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import ModuleViewClient from './_components/module-view-client'

interface Props {
  params: Promise<{ id: string; moduleId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, moduleId } = await params
  const module = await getStudentModuleDetail(id, moduleId)
  return { title: module ? `${module.title} — Auto-école` : 'Module — Auto-école' }
}

export default async function StudentModulePage({ params }: Props) {
  const { id: formationId, moduleId } = await params
  const [module, examStatus] = await Promise.all([
    getStudentModuleDetail(formationId, moduleId),
    getExamStatusForStudent(moduleId),
  ])

  if (!module) notFound()

  // Redirect locked modules back to the formation page
  if (module.isLocked) {
    redirect(`/student/formations/${formationId}`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-3xl mx-auto w-full">
      {/* Back + breadcrumb */}
      <div className="flex flex-col gap-1">
        <Link
          href={`/student/formations/${formationId}`}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 h-7 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground self-start -ml-2 text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {module.formationTitle}
        </Link>
        <h1 className="text-xl font-semibold leading-snug">{module.title}</h1>
      </div>

      {/* Content card */}
      <Card>
        <CardContent className="py-5">
          <ModuleViewClient module={module} examStatus={examStatus} />
        </CardContent>
      </Card>
    </div>
  )
}
