'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startExamAttempt } from '@/app/actions/exams'
import { Button } from '@/components/ui/button'
import { Loader2, Play } from 'lucide-react'

interface Props {
  moduleId: string
  formationId: string
}

export default function StartExamButton({ moduleId, formationId }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    setError(null)
    startTransition(async () => {
      const result = await startExamAttempt(moduleId)
      if (result?.error && !result.attemptId) {
        setError(result.error)
        return
      }
      router.push(`/student/formations/${formationId}/modules/${moduleId}/exam/take`)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="lg" onClick={handleStart} disabled={isPending} className="w-full sm:w-auto self-start">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Démarrage…
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Commencer l&apos;examen
          </>
        )}
      </Button>
    </div>
  )
}
