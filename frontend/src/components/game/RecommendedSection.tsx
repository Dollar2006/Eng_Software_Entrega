import { useEffect, useState } from "react";
import { Link } from "react-router";
import GameCard from "@/components/game/GameCard";
import { ApiError } from "@/lib/api";
import {
  getRecommendations,
  STRATEGY_OPTIONS,
  type Recommendation,
  type StrategyKey,
} from "@/lib/recommendations";

const ERROR_MSG = "Não foi possível carregar as recomendações.";

export default function RecommendedSection({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [strategy, setStrategy] = useState<StrategyKey>("mixed");
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getRecommendations(strategy, 8)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) onUnauthorized();
        else setError(ERROR_MSG);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [strategy, onUnauthorized]);

  return (
    <section aria-live="polite" className="mb-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Recomendados para você</h2>
        <select
          aria-label="Tipo de recomendação"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as StrategyKey)}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          {STRATEGY_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-neutral-200 bg-white p-4"
        >
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      )}

      {loading && <p className="text-sm text-neutral-500">Carregando...</p>}

      {!error && !loading && items.length === 0 && (
        <p className="text-sm text-neutral-500">
          Ainda não temos recomendações para essa opção. Avalie alguns jogos
          ou siga outros usuários para melhorar as sugestões.{" "}
          <Link to="/bonfirehub" className="underline">
            Explorar jogos
          </Link>
        </p>
      )}

      {!loading && items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((rec) => (
            <li key={rec.game.id} className="flex flex-col gap-2">
              <GameCard game={rec.game} />
              <p className="text-xs text-neutral-500">{rec.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}