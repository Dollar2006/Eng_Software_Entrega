import { ApiError } from '@/lib/api'

export type AccountField = 'currentPassword' | 'newEmail' | 'newPassword'

// Decide em qual campo o erro do backend aparece:
//   400 = senha atual incorreta
//   409 / 422 = problema com o novo e-mail ou a nova senha
//   outros = aviso geral no topo do formulário
export function mapAccountError(
  error: unknown,
  form: 'email' | 'password',
): { field: AccountField | null; message: string } {
  if (!(error instanceof ApiError)) {
    return { field: null, message: 'Erro inesperado. Tente novamente.' }
  }

  if (error.status === 400) {
    return { field: 'currentPassword', message: error.message }
  }

  if (error.status === 409 || error.status === 422) {
    return {
      field: form === 'email' ? 'newEmail' : 'newPassword',
      message: error.message,
    }
  }

  return { field: null, message: error.message }
}
