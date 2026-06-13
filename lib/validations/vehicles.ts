import { z } from 'zod'

export const createVehicleSchema = z.object({
  name: z.string().min(2, 'Au moins 2 caractères').max(100),
  plate: z.string()
    .min(5, 'Immatriculation invalide')
    .max(20)
    .toUpperCase(),
  category: z.string().min(1, 'Catégorie requise'),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'SOLD']).default('AVAILABLE'),
  photo: z.string().url().optional().or(z.literal('')),
  mileage: z.coerce.number().min(0, 'Kilométrage non-négatif').default(0),
  inspectionDate: z.coerce.date().optional(),
  insuranceExpiry: z.coerce.date().optional(),
})

export const updateVehicleSchema = createVehicleSchema.partial()

export const updateVehicleStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'SOLD']),
})

export const updateCenterSettingsSchema = z.object({
  name: z.string().min(2, 'Au moins 2 caractères').max(200),
  email: z.string().email('Email invalide'),
  phone: z.string().min(5, 'Téléphone invalide'),
  address: z.string().min(5, 'Adresse invalide'),
  description: z.string().max(2000).optional(),
  vehicleAlertDays: z.coerce
    .number()
    .min(1, 'Au moins 1 jour')
    .max(365, 'Maximum 365 jours')
    .default(30),
})

// ─────────────────────────────────────────
// Sale / archive
// ─────────────────────────────────────────

export const markVehicleSoldSchema = z.object({
  buyerFirstName: z.string().trim().min(1, 'Prénom requis').max(80),
  buyerLastName:  z.string().trim().min(1, 'Nom requis').max(80),
  buyerPhone:     z.string().trim().min(5, 'Téléphone invalide').max(30),
  buyerEmail:     z.string().email('Email invalide').optional().or(z.literal('').transform(() => undefined)),
  saleDate:       z.coerce.date().refine(d => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
                    message: 'La date de vente ne peut pas être dans le futur',
                  }),
  salePrice:      z.coerce.number().min(0, 'Prix non-négatif'),
})

export const archiveVehicleSchema = z.object({
  note: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
})

export const updateSaleInfoSchema = markVehicleSoldSchema  // reuses same shape for typo correction

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type UpdateCenterSettingsInput = z.infer<typeof updateCenterSettingsSchema>
export type MarkVehicleSoldInput = z.infer<typeof markVehicleSoldSchema>
export type ArchiveVehicleInput  = z.infer<typeof archiveVehicleSchema>
