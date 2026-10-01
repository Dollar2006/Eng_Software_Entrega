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
