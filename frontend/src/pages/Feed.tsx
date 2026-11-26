import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import FeaturedCarousel from "@/components/game/FeaturedCarousel";
import RightRail from "@/components/ui/RightRail";
import UserAvatar from "@/components/profile/UserAvatar";
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

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return dateFmt.format(new Date(iso));
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5 estrelas`} className="tracking-wide">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const author = item.author_name?.trim() || "Usuário";

  return (
    <article className="flex gap-3 p-4">
      <UserAvatar name={author} avatar={item.author_avatar} className="size-10" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="font-semibold">{author}</span>{" "}
          <time dateTime={item.updated_at} className="text-muted-foreground">
            · {timeAgo(item.updated_at)}
          </time>
        </p>
        <p className="text-sm text-muted-foreground">
          avaliou{" "}
          <Link
            to={`/jogos/${item.game_id}`}
            className="font-medium text-foreground hover:underline"
          >
            {item.game_name}
          </Link>{" "}
          <Stars rating={item.rating} />
        </p>
        {item.text && (
          <p className="mt-2 whitespace-pre-line text-sm">{item.text}</p>
        )}
      </div>

      {item.game_cover_url && (
        <Link to={`/jogos/${item.game_id}`} className="shrink-0">
          <img
            src={item.game_cover_url}
            alt={`Capa de ${item.game_name}`}
            className="h-20 w-14 rounded-md object-cover"
          />
        </Link>
      )}
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

  // Identidade estável: o carrossel usa isso como dependência de efeito.
  const handleUnauthorized = useCallback(() => setUnauthorized(true), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
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
    <div className="flex items-start gap-6 px-4 py-4 lg:px-6">
      <div className="min-w-0 flex-1 space-y-4">
        <FeaturedCarousel onUnauthorized={handleUnauthorized} />

        <label className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyReviews}
            onChange={(e) => setOnlyReviews(e.target.checked)}
            className="size-4 accent-blue-500"
          />
          Só reviews escritas
        </label>

        <section aria-live="polite" className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
            >
              {error}
            </div>
          )}

          {!error && !loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Seu feed está vazio. Siga outros usuários para ver o que eles
              estão avaliando.
            </p>
          )}

          {items.length > 0 && (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {items.map((item) => (
                <FeedCard key={item.review_id} item={item} />
              ))}
            </div>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}

          {hasMore && !loading && (
            <button
              onClick={loadMore}
              className="mx-auto block h-10 rounded-lg bg-foreground px-6 text-sm font-medium text-background hover:opacity-90"
            >
              Carregar mais
            </button>
          )}
        </section>
      </div>

      <RightRail />
    </div>
  );
}

export default Feed;