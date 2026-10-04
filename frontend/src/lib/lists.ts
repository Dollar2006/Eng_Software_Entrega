import { api } from "@/lib/api";

export type GameStatus = "played" | "want_to_play" | "library" | null;

export async function getGameStatus(gameId: string | number): Promise<GameStatus> {
  const response = await api.get<{ status: GameStatus }>(
    `/users/me/lists/game/${gameId}/status`,
  );
  return response.data.status;
}

export async function setGameStatus(
  gameId: string | number,
  status: "played" | "want_to_play" | "library",
): Promise<void> {
  await api.put("/users/me/lists/status", { game_id: Number(gameId), status });
}

export async function removeGameStatus(gameId: string | number): Promise<void> {
  await api.delete(`/users/me/lists/status?game_id=${gameId}`);
}
