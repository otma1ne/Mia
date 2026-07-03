import type { Metadata } from 'next'
import { getSkills } from '@/app/actions/skills'
import TrainerApplicationForm from './_components/trainer-application-form'

export const metadata: Metadata = {
  title: 'Rejoindre notre équipe — MIA Académie',
  description: 'Candidatez pour devenir formateur chez MIA Académie. Partagez votre expertise avec nos apprenants.',
}

export default async function RejoindreNotreEquipePage() {
  const skills = await getSkills()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-sm font-semibold text-violet-600 mb-3">Rejoindre l&apos;équipe</p>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Devenez formateur chez MIA</h1>
          <p className="text-muted-foreground leading-relaxed">
            Vous avez une expertise à partager ? Rejoignez notre réseau de formateurs et
            contribuez à la montée en compétences de nos apprenants.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl px-4 py-12">
        <TrainerApplicationForm skills={skills} />
      </div>
    </div>
  )
}
