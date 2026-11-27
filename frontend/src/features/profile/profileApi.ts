import type { ProfileDraft } from '@/features/profile/profileSchema'
import { api } from '@/lib/api'

export type Profile = {
  gamertag: string | null
  display_name: string | null
  bio: string | null
  avatar: string | null
}

export type PublicProfile = {
  user_id: string
  gamertag: string
  display_name: string | null
  bio: string | null
  avatar: string | null
}

export type UpdateProfilePayload = {
  gamertag: string | null
  display_name: string
  bio: string
  avatar: string | null
}

export function toDraft(profile: Profile): ProfileDraft {
  return {
    gamertag: profile.gamertag ?? '',
    displayName: profile.display_name ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatar,
  }
}

export function toPayload(draft: ProfileDraft): UpdateProfilePayload {
  return {
    gamertag: draft.gamertag.trim() || null,
    display_name: draft.displayName,
    bio: draft.bio,
    avatar: draft.avatarUrl,
  }
}

export async function getProfile(): Promise<Profile> {
  const response = await api.get<Profile>('/users/me/profile')
  return response.data
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<Profile> {
  const response = await api.put<Profile>('/users/me/profile', payload)
  return response.data
}

export async function getPublicProfile(gamertag: string): Promise<PublicProfile> {
  const response = await api.get<PublicProfile>(`/users/${encodeURIComponent(gamertag)}/profile`)
  return response.data
}