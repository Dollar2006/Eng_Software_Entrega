import { api } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface Game {
  id: number;
  name: string;
  cover_url: string | null;
  genres: string[];
  platforms: string[];
}

export interface GameFilters {
  name?: string;
  genre?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  genres: string[];
  platforms: string[];
}

export async function searchGames(filters: GameFilters = {}): Promise<Game[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  const res = await fetch(`${API_URL}/games?${params}`);
  if (!res.ok) throw new Error("Erro ao buscar jogos");
  return res.json();
}

// Gêneros e plataformas que realmente existem no banco.
export async function getFilterOptions(): Promise<FilterOptions> {
  const res = await fetch(`${API_URL}/games/filters`);
  if (!res.ok) throw new Error("Erro ao buscar filtros");
  return res.json();
}

export interface GameDetail extends Game {
  description: string | null;
  rating_avg: number | null;
  rating_count: number;
}

export class GameNotFoundError extends Error {}

export async function getGame(id: string): Promise<GameDetail> {
  const res = await fetch(`${API_URL}/games/${id}`);
  // 422 acontece quando o id não é um número (ex.: /jogos/abc)
  if (res.status === 404 || res.status === 422) throw new GameNotFoundError();
  if (!res.ok) throw new Error("Erro ao buscar o jogo");
  return res.json();
}

// As rotas de nota exigem sessão. Sem login o backend responde 401 e o `api`
// lança ApiError com status 401 (mesmo caminho do requireSession).

export interface MyReview {
  rating: number | null;
  text: string | null;
}

// Nota e review (se houver) do usuário logado neste jogo.
export async function getMyReview(id: string | number): Promise<MyReview> {
  const response = await api.get<MyReview>(`/games/${id}/rating/me`);
  return response.data;
}

export async function rateGame(id: string | number, rating: number): Promise<void> {
  await api.put(`/games/${id}/rating`, { rating });
}

export interface Review {
  id: number;
  author_name: string | null;
  author_avatar: string | null;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string;
}

// Reviews da comunidade (rota pública, as mais recentes primeiro).
export async function listReviews(
  id: string | number,
  offset = 0,
  limit = 10,
): Promise<Review[]> {
  const res = await fetch(
    `${API_URL}/games/${id}/reviews?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok) throw new Error("Erro ao buscar reviews");
  return res.json();
}

// Publica (ou atualiza) a review do usuário junto com a nota.
export async function writeReview(
  id: string | number,
  rating: number,
  text: string,
): Promise<Review> {
  const response = await api.put<Review>(`/games/${id}/review`, { rating, text });
  return response.data;
}
