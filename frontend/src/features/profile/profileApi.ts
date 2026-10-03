import type { ProfileDraft } from '@/features/profile/profileSchema'
import { api } from '@/lib/api'

export type Profile = {
  display_name: string | null
  bio: string | null
  avatar: string | null
}

export type UpdateProfilePayload = {
  display_name: string
  bio: string
  avatar: string | null
}

export function toDraft(profile: Profile): ProfileDraft {
  return {
    displayName: profile.display_name ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatar,
  }
}

export function toPayload(draft: ProfileDraft): UpdateProfilePayload {
  return {
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