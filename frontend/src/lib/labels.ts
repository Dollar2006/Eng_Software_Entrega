// O banco guarda gêneros/plataformas em minúsculas e sem acento.
// Aqui só formatamos o texto exibido; os valores em si vêm da API.
const LABELS: Record<string, string> = {
  acao: "Ação",
  aventura: "Aventura",
  estrategia: "Estratégia",
  simulacao: "Simulação",
  "mundo-aberto": "Mundo Aberto",
  "battle-royale": "Battle Royale",
  "tempo-real": "Tempo Real",
  fps: "FPS",
  rpg: "RPG",
  jrpg: "JRPG",
  moba: "MOBA",
  pc: "PC",
  ps3: "PS3",
  ps4: "PS4",
  ps5: "PS5",
  xbox: "Xbox",
  switch: "Switch",
  mobile: "Mobile",
};

export const label = (value: string) =>
  LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
