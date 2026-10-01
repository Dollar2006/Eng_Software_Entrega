import { api } from '@/lib/api'

export type AuthUser = {
  id: string
  email: string
}

export type RegisterPayload = {
  email: string
  password: string
}

export type RegisterResponse = {
  user: AuthUser
  email_confirmation_required?: boolean
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  user: AuthUser
}

export type CurrentUserResponse = {
  user: AuthUser
}

export async function registerAccount(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', payload)
  return response.data
}

export async function loginAccount(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', payload)
  return response.data
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<CurrentUserResponse>('/auth/me')
  return response.data.user
}

// O refresh_token viaja em cookie HttpOnly: nao ha body nem header a montar.
export async function refreshSession(): Promise<void> {
  await api.post('/auth/refresh')
}

export async function logoutAccount(): Promise<void> {
  await api.post('/auth/logout')
}
