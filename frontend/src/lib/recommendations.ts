import { api } from "@/lib/api";
import type { Game } from "@/lib/games";

export interface Recommendation {
  game: Game;
  reason: string;
  strategy: string;
}

// As chaves espelham as estratégias registradas no backend.
export const STRATEGY_OPTIONS = [
  { key: "mixed", label: "Para você" },
  { key: "following", label: "Quem você segue" },
  { key: "similar_users", label: "Gosto parecido" },
  { key: "favorite_genre", label: "Gêneros favoritos" },
  { key: "top_rated", label: "Mais bem avaliados" },
] as const;

export type StrategyKey = (typeof STRATEGY_OPTIONS)[number]["key"];

export async function getRecommendations(
  strategy: StrategyKey = "mixed",
  limit = 8,
): Promise<Recommendation[]> {
  const response = await api.get<Recommendation[]>("/recommendations", {
    params: { strategy, limit },
  });
  return response.data;
}