import { z } from 'zod'

import { GAMERTAG_RE } from '@/features/profile/profileSchema'

export const cadastroSchema = z
  .object({
    gamertag: z
      .string()
      .trim()
      .max(30, 'A gamertag deve ter no máximo 30 caracteres.')
      .refine((value) => value.length === 0 || GAMERTAG_RE.test(value), {
        message: 'A gamertag deve ter 3-30 caracteres: letras, números, _ ou .',
      })
      .refine((value) => value.toLowerCase() !== 'me', {
        message: 'Essa gamertag não está disponível.',
      }),
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

export type CadastroFormValues = z.infer<typeof cadastroSchema>
