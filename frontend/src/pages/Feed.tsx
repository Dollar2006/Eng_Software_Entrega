import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { ApiError } from "@/lib/api";
import { getFeed, type FeedItem } from "@/lib/feed";

const PAGE_SIZE = 20;
const ERROR_MSG =
  "Não foi possível carregar o feed. Confira se a API está rodando.";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5 estrelas`} className="text-sm tracking-wide">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const author = item.author_name?.trim() || "Usuário";
  const initial = author.charAt(0).toUpperCase() || "?";

  return (
    <article className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <Link to={`/jogos/${item.game_id}`} className="shrink-0">
        {item.game_cover_url ? (
          <img
            src={item.game_cover_url}
            alt={`Capa de ${item.game_name}`}
            className="h-24 w-18 rounded-lg object-cover"
          />
        ) : (
          <div className="h-24 w-18 rounded-lg bg-neutral-100" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white"
          >
            {initial}
          </span>
          <p className="truncate text-sm">
            <span className="font-medium">{author}</span>{" "}
            <span className="text-neutral-500">avaliou</span>{" "}
            <Link
              to={`/jogos/${item.game_id}`}
              className="font-medium hover:underline"
            >
              {item.game_name}
            </Link>
          </p>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Stars rating={item.rating} />
          <time
            dateTime={item.updated_at}
            className="text-xs text-neutral-500"
          >
            {dateFmt.format(new Date(item.updated_at))}
          </time>
        </div>

        {item.text && (
          <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">
            {item.text}
          </p>
        )}
      </div>
    </article>
  );
}

export function Feed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [onlyReviews, setOnlyReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setUnauthorized(false);
    setItems([]);

    getFeed({ limit: PAGE_SIZE, onlyReviews })
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) setUnauthorized(true);
        else setError(ERROR_MSG);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onlyReviews]);

  async function loadMore() {
    setLoading(true);
    try {
      const data = await getFeed({
        limit: PAGE_SIZE,
        offset: items.length,
        onlyReviews,
      });
      setItems((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      if (isUnauthorized(err)) setUnauthorized(true);
      else setError(ERROR_MSG);
    } finally {
      setLoading(false);
    }
  }

  // Sessão expirada com a tela aberta: o loader do router só cobre a navegação.
  if (unauthorized) return <Navigate to="/login" replace />;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Feed</h1>
          <p className="mt-1 text-sm text-neutral-500">
            O que as pessoas que você segue estão avaliando.
          </p>
        </header>

        <label className="mb-6 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyReviews}
            onChange={(e) => setOnlyReviews(e.target.checked)}
            className="h-4 w-4 accent-neutral-900"
          />
          Mostrar só reviews escritas
        </label>

        <section aria-live="polite" className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <p className="text-sm font-medium">Atenção</p>
              <p className="text-sm text-neutral-500">{error}</p>
            </div>
          )}

          {!error && !loading && items.length === 0 && (
            <p className="text-sm text-neutral-500">
              Seu feed está vazio. Siga outros usuários para ver o que eles
              estão avaliando.
            </p>
          )}

          {items.map((item) => (
            <FeedCard key={item.review_id} item={item} />
          ))}

          {loading && <p className="text-sm text-neutral-500">Carregando...</p>}

          {hasMore && !loading && (
            <button
              onClick={loadMore}
              className="mx-auto mt-4 block h-10 rounded-lg bg-neutral-900 px-6 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Carregar mais
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

export default Feed;