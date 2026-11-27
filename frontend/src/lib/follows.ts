import { api } from "@/lib/api";

export interface SuggestedUser {
  user_id: string;
  display_name: string | null;
  avatar: string | null;
  followers_count: number;
}

export async function getSuggestions(limit = 5): Promise<SuggestedUser[]> {
  const response = await api.get<SuggestedUser[]>("/users/suggestions", {
    params: { limit },
  });
  return response.data;
}

export async function followUser(id: string): Promise<void> {
  await api.post(`/users/${id}/follow`);
}

export async function unfollowUser(id: string): Promise<void> {
  await api.delete(`/users/${id}/follow`);
}