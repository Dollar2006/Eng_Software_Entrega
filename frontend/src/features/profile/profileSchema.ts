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

// O avatar fica fora do react-hook-form por nao ser campo de texto, entao o
// rascunho da tela e o valor do schema acrescido do avatar. Vive aqui e nao no
// ProfileForm para que a camada de API possa usar o tipo sem importar um
// componente.
export type ProfileDraft = ProfileFormValues & {
    avatarUrl: string | null
}
