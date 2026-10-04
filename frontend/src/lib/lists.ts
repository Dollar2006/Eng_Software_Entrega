import { api } from "@/lib/api";

export type ListRef = {
  id: number;
  name: string;
  kind: "system" | "custom";
};

export type ListItem = {
  game_id: number;
  added_at: string;
};

export type GameStatus = "played" | "want_to_play" | "library" | null;

export async function getMyLists(): Promise<ListRef[]> {
  const response = await api.get<{ lists: ListRef[] }>("/users/me/lists");
  return response.data.lists;
}

export async function createCustomList(name: string): Promise<ListRef> {
  const response = await api.post<ListRef>("/users/me/lists", { name });
  return response.data;
}

export async function deleteCustomList(listId: number): Promise<void> {
  await api.delete(`/users/me/lists/${listId}`);
}

export async function updateCustomList(listId: number, name: string): Promise<ListRef> {
  const response = await api.patch<ListRef>(`/users/me/lists/${listId}`, { name });
  return response.data;
}

export async function getListItems(listId: number): Promise<ListItem[]> {
  const response = await api.get<ListItem[]>(`/users/me/lists/${listId}/items`);
  return response.data;
}

export async function addListItem(listId: number, gameId: number): Promise<void> {
  await api.put(`/users/me/lists/${listId}/items`, { game_id: gameId });
}

export async function removeListItem(listId: number, gameId: number): Promise<void> {
  await api.delete(`/users/me/lists/${listId}/items/${gameId}`);
}

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
