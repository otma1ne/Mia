import { z } from 'zod'

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(80),
  lastName:  z.string().trim().min(1, 'Nom requis').max(80),
  phone:     z.string().trim().min(5, 'Téléphone invalide').max(30),
  email:     z.string().trim().email('Email invalide')
               .or(z.literal('').transform(() => undefined))
               .optional(),
  city:      z.string().trim().max(100)
               .or(z.literal('').transform(() => undefined))
               .optional(),
  need:      z.string().trim().min(1, 'Besoin requis').max(500),
})

export const updateContactSchema = createContactSchema.partial()

export const updateContactStatusSchema = z.object({
  status: z.enum(['NOUVEAU', 'CONTACTE', 'RELANCE', 'CONVERTI']),
  note:   z.string().trim().max(500).optional()
            .or(z.literal('').transform(() => undefined)),
})

export const createCommercialAccountSchema = z.object({
  name:  z.string().trim().min(2, 'Au moins 2 caractères').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().trim().max(30).optional()
           .or(z.literal('').transform(() => undefined)),
})

export type CreateContactInput           = z.infer<typeof createContactSchema>
export type UpdateContactInput           = z.infer<typeof updateContactSchema>
export type UpdateContactStatusInput     = z.infer<typeof updateContactStatusSchema>
export type CreateCommercialAccountInput = z.infer<typeof createCommercialAccountSchema>
