import { z } from 'zod'

export const BIO_MAX_LENGTH = 280

export const profileSchema = z.object({
    displayName: z
        .string()
        .trim()
        .max(50, 'O nome de exibição deve ter no máximo 50 caracteres.')
        // Vazio é válido: sem nome, o perfil mostra a parte antes do @ do e-mail.
        .refine((value) => value.length === 0 || value.length >= 2, {
            message: 'O nome precisa ter pelo menos 2 caracteres.',
        }),
    bio: z
        .string()
        .max(BIO_MAX_LENGTH, `A biografia deve ter no máximo ${BIO_MAX_LENGTH} caracteres.`),
})

export type ProfileFormValues = z.infer<typeof profileSchema>