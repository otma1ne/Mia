import { z } from 'zod'

export const createFormationSchema = z.object({
  title: z.string().min(3, 'Au moins 3 caractères').max(200),
  description: z.string().min(10, 'Au moins 10 caractères').max(2000),
  categoryId: z.string().min(1, 'Catégorie requise'),
  type: z.enum(['PRESENTIAL', 'ONLINE', 'HYBRID']),
  maxStudents: z.coerce.number().min(1, 'Au moins 1 étudiant').max(100),
})

export const createModuleSchema = z.object({
  formationId: z.string().min(1, 'Formation requise'),
  title: z.string().min(3, 'Au moins 3 caractères').max(200),
  description: z.string().min(10, 'Au moins 10 caractères').max(2000),
  type: z.enum(['THEORY', 'PRACTICAL', 'ASSESSMENT']),
  duration: z.coerce.number().min(0, 'Durée non-négative'),
  videoUrl: z.string().url().optional().or(z.literal('')),
})

export const updateFormationSchema = z.object({
  title: z.string().min(3, 'Au moins 3 caractères').max(200).optional(),
  description: z.string().min(10, 'Au moins 10 caractères').max(2000).optional(),
  categoryId: z.string().min(1, 'Catégorie requise').optional(),
  type: z.enum(['PRESENTIAL', 'ONLINE', 'HYBRID']).optional(),
  maxStudents: z.coerce.number().min(1, 'Au moins 1 étudiant').max(100).optional(),
})

export const updateModuleSchema = z.object({
  formationId: z.string().min(1, 'Formation requise').optional(),
  title: z.string().min(3, 'Au moins 3 caractères').max(200).optional(),
  description: z.string().min(10, 'Au moins 10 caractères').max(2000).optional(),
  type: z.enum(['THEORY', 'PRACTICAL', 'ASSESSMENT']).optional(),
  duration: z.coerce.number().min(0, 'Durée non-négative').optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
})

export type CreateFormationInput = z.infer<typeof createFormationSchema>
export type CreateModuleInput = z.infer<typeof createModuleSchema>
