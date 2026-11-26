import { api } from "@/lib/api";

export interface FeedItem {
  review_id: number;
  user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  game_id: number;
  game_name: string;
  game_cover_url: string | null;
  rating: number;
  text: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedParams {
  limit?: number;
  offset?: number;
  onlyReviews?: boolean;
}

// Atividade (notas e reviews) de quem o usuário logado segue, mais recentes primeiro.
export async function getFeed({
  limit = 20,
  offset = 0,
  onlyReviews = false,
}: FeedParams = {}): Promise<FeedItem[]> {
  const response = await api.get<FeedItem[]>("/feed", {
    params: { limit, offset, only_reviews: onlyReviews },
  });
  return response.data;
}