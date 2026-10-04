import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "@/lib/api";
import {
  getGameStatus,
  removeGameStatus,
  setGameStatus,
  type GameStatus,
} from "@/lib/lists";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  gameId: string | number;
  onChanged?: () => void;
};

const STATUS_LABELS: Record<NonNullable<GameStatus>, string> = {
  played: "Jogados",
  want_to_play: "Pretendo Jogar",
  library: "Biblioteca",
};

export default function GameStatus({ gameId, onChanged }: Props) {
  const navigate = useNavigate();
  const [status, setCurrent] = useState<GameStatus>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await getGameStatus(gameId);
        if (active) {
          setCurrent(s);
          setNeedsLogin(false);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          if (active) {
            setNeedsLogin(true);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [gameId]);

  async function handleSet(next: NonNullable<GameStatus>) {
    setSaving(true);
    try {
      await setGameStatus(gameId, next);
      setCurrent(next);
      setNeedsLogin(false);
      onChanged?.();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setNeedsLogin(true);
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      await removeGameStatus(gameId);
      setCurrent(null);
      onChanged?.();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setNeedsLogin(true);
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-700">Carregando status...</p>;
  }

  if (needsLogin) {
    return (
      <p className="text-sm text-neutral-700">
        <button
          type="button"
          className="underline underline-offset-4 hover:text-neutral-900"
          onClick={() =>
            navigate(`/login?redirect=${encodeURIComponent(`/jogos/${gameId}`)}`)
          }
        >
          Faça login
        </button>{" "}
        para marcar o status deste jogo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const k = key as NonNullable<GameStatus>;
          const active = status === k;
          return (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              disabled={saving}
              onClick={() => handleSet(k)}
              className={cn(active && "shadow-sm")}
            >
              {label}
            </Button>
          );
        })}
        {status !== null && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={handleRemove}
          >
            Remover
          </Button>
        )}
      </div>
      {status && (
        <p className="text-sm text-neutral-700">
          Atualmente marcado como: <strong>{STATUS_LABELS[status]}</strong>
        </p>
      )}
    </div>
  );
}
