import { api } from "@/lib/api";

export type FollowStats = {
  user_id: string;
  followers: number;
  following: number;
};

export interface SuggestedUser {
  user_id: string;
  display_name: string | null;
  avatar: string | null;
  followers_count: number;
}

export async function getFollowStats(userId: string): Promise<FollowStats> {
  const response = await api.get<FollowStats>(`/users/${userId}/follow-stats`);
  return response.data;
}

export async function isFollowing(userId: string): Promise<boolean> {
  const response = await api.get<{ is_following: boolean }>(`/users/${userId}/follow`);
  return response.data.is_following;
}

export async function getSuggestions(limit = 5): Promise<SuggestedUser[]> {
  const response = await api.get<SuggestedUser[]>("/users/suggestions", {
    params: { limit },
  });
  return response.data;
}

export async function followUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/follow`);
}
