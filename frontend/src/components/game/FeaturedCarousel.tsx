import { useEffect, useState } from "react";
import { Link } from "react-router";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { ApiError } from "@/lib/api";
import { getRecommendations, type Recommendation } from "@/lib/recommendations";

const SIZE = "h-56 sm:h-64 lg:h-72";

export default function FeaturedCarousel({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRecommendations("mixed", 5)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) onUnauthorized();
        else setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  if (loading) {
    return <div className={`${SIZE} animate-pulse rounded-2xl bg-muted`} />;
  }

  if (error || items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {error ? (
          "Não foi possível carregar as recomendações."
        ) : (
          <>
            Avalie alguns jogos ou siga outros usuários para receber
            recomendações.{" "}
            <Link to="/bonfirehub" className="underline">
              Explorar jogos
            </Link>
          </>
        )}
      </div>
    );
  }

  const current = items[index];
  const go = (step: number) =>
    setIndex((i) => (i + step + items.length) % items.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Jogos recomendados"
      className={`relative ${SIZE} overflow-hidden rounded-2xl border border-border bg-card`}
    >
      {current.game.cover_url && (
        <img
          src={current.game.cover_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/60" />

      <div
        aria-live="polite"
        className="relative flex h-full max-w-md flex-col justify-center gap-3 px-14 text-white"
      >
        <h2 className="text-2xl font-bold sm:text-3xl">{current.game.name}</h2>
        <p className="text-sm text-white/80">{current.reason}</p>
        <Link
          to={`/jogos/${current.game.id}`}
          className="w-fit rounded-lg border border-white/70 px-4 py-1.5 text-sm font-medium hover:bg-white/10"
        >
          Ver mais
        </Link>
      </div>

      {items.length > 1 && (
        <>
          <button
            aria-label="Anterior"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <IconChevronLeft className="size-5" />
          </button>
          <button
            aria-label="Próximo"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <IconChevronRight className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {items.map((rec, i) => (
              <button
                key={rec.game.id}
                aria-label={`Ir para ${rec.game.name}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`size-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}