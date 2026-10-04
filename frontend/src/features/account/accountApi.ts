import { api } from '@/lib/api'

export type EmailChangeResult = {
  email: string
  // Preenchido quando o novo endereço ainda precisa ser confirmado por e-mail.
  pending_email: string | null
}

export async function changeEmail(payload: {
  newEmail: string
  currentPassword: string
}): Promise<EmailChangeResult> {
  const response = await api.put<EmailChangeResult>('/users/me/account/email', {
    new_email: payload.newEmail,
    current_password: payload.currentPassword,
  })
  return response.data
}

export async function changePassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  await api.put('/users/me/account/password', {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
  })
}
