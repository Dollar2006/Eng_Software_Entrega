import { z } from 'zod'

const currentPassword = z.string().min(1, 'Informe sua senha atual.')

export const changeEmailSchema = z.object({
  newEmail: z.email('Informe um e-mail válido.'),
  currentPassword,
})

export const changePasswordSchema = z
  .object({
    currentPassword,
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter ao menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual.',
  })

export type ChangeEmailValues = z.infer<typeof changeEmailSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
