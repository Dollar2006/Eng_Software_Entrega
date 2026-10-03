import { useEffect, useRef, useState } from "react";
import GameCard from "@/components/game/GameCard";
import {
  getFilterOptions,
  searchGames,
  type FilterOptions,
  type Game,
} from "@/lib/games";
import { label } from "@/lib/labels";

const PAGE_SIZE = 12;
const ERROR_MSG =
  "Não foi possível carregar os jogos. Confira se a API está rodando.";

const fieldClass =
  "h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900";

export function Bonfirehub() {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [options, setOptions] = useState<FilterOptions>({
    genres: [],
    platforms: [],
  });
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const optionsRequested = useRef(false);

  function loadOptions() {
    if (optionsRequested.current) return;
    optionsRequested.current = true;
    getFilterOptions()
      .then(setOptions)
      .catch(() => {
        optionsRequested.current = false; // permite tentar de novo
        setError(ERROR_MSG);
      });
  }

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchGames({
          name,
          genre,
          platform,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setGames(data);
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        if (!cancelled) setError(ERROR_MSG);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, genre, platform]);

  async function loadMore() {
    setLoading(true);
    try {
      const data = await searchGames({
        name,
        genre,
        platform,
        limit: PAGE_SIZE,
        offset: games.length,
      });
      setGames((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError(ERROR_MSG);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Jogos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Busque por nome, gênero ou plataforma.
          </p>
        </header>

        <section
          onMouseEnter={loadOptions}
          className="mb-8 rounded-xl border border-neutral-200 bg-white p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <input
              type="search"
              placeholder="Buscar jogos..."
              aria-label="Buscar por nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />

            <select
              aria-label="Filtrar por gênero"
              onFocus={loadOptions}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className={fieldClass}
            >
              <option value="">Todos os gêneros</option>
              {options.genres.map((g) => (
                <option key={g} value={g}>
                  {label(g)}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por plataforma"
              onFocus={loadOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={fieldClass}
            >
              <option value="">Todas as plataformas</option>
              {options.platforms.map((p) => (
                <option key={p} value={p}>
                  {label(p)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section aria-live="polite">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-neutral-200 bg-white p-4"
            >
              <p className="text-sm font-medium">Atenção</p>
              <p className="text-sm text-neutral-500">{error}</p>
            </div>
          )}

          {!error && !loading && games.length === 0 && (
            <p className="text-sm text-neutral-500">
              Nenhum jogo encontrado. Tente outro nome ou remova um filtro.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {loading && (
            <p className="mt-6 text-sm text-neutral-500">Carregando...</p>
          )}

          {hasMore && !loading && (
            <button
              onClick={loadMore}
              className="mx-auto mt-8 block h-10 rounded-lg bg-neutral-900 px-6 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Carregar mais
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

export default Bonfirehub;
