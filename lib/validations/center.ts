import { z } from 'zod'

export const updateCenterSettingsSchema = z.object({
  name: z.string().min(2, 'Au moins 2 caractères').max(200),
  email: z.string().email('Email invalide'),
  phone: z.string().min(5, 'Téléphone invalide'),
  address: z.string().min(5, 'Adresse invalide'),
  description: z.string().max(2000).optional(),
  enrollmentAlertDays: z.coerce
    .number()
    .min(1, 'Au moins 1 jour')
    .max(365, 'Maximum 365 jours')
    .default(7),
})

export type UpdateCenterSettingsInput = z.infer<typeof updateCenterSettingsSchema>
