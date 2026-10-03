import { redirect, type LoaderFunctionArgs } from 'react-router'

import { getCurrentUser, type AuthUser } from '@/features/auth/authApi'
import { ApiError } from '@/lib/api'

export type SessionData = {
  user: AuthUser
}

// Loader das rotas que exigem sessão. Sem access_token válido, o /auth/me
// devolve 401 e a navegação é redirecionada para o login.
export async function requireSession({
  request,
}: LoaderFunctionArgs): Promise<SessionData> {
  try {
    const user = await getCurrentUser()
    return { user }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const from = new URL(request.url).pathname
      throw redirect(`/login?redirect=${encodeURIComponent(from)}`)
    }
    
    throw error
  }
}