import { useEffect, useState } from "react";
import { Link } from "react-router";
import UserAvatar from "@/components/profile/UserAvatar";
import { followUser, getSuggestions, unfollowUser, type SuggestedUser } from "@/lib/follows";
import { getRecommendations, type Recommendation } from "@/lib/recommendations";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function RightRail() {
  const [top, setTop] = useState<Recommendation[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  // Coluna secundária: se falhar, simplesmente não aparece. O 401 é tratado pelo feed.
  useEffect(() => {
    let cancelled = false;
    getRecommendations("top_rated", 5)
      .then((data) => !cancelled && setTop(data))
      .catch(() => {});
    getSuggestions(5)
      .then((data) => !cancelled && setSuggestions(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function mark(id: string, on: boolean) {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggle(id: string) {
    const was = following.has(id);
    mark(id, !was);
    try {
      if (was) await unfollowUser(id);
      else await followUser(id);
    } catch {
      mark(id, was); // desfaz se a API falhou
    }
  }

  if (top.length === 0 && suggestions.length === 0) return null;

  return (
    <aside className="sticky top-[4.5rem] hidden w-80 shrink-0 space-y-4 self-start xl:block">
      {top.length > 0 && (
        <Panel title="Mais bem avaliados">
          <ol className="space-y-3">
            {top.map((rec, i) => (
              <li key={rec.game.id} className="flex gap-3">
                <span className="w-4 text-sm text-muted-foreground">{i + 1}</span>
                <div className="min-w-0">
                  <Link
                    to={`/jogos/${rec.game.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {rec.game.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {suggestions.length > 0 && (
        <Panel title="Quem seguir">
          <ul className="space-y-3">
            {suggestions.map((s) => {
              const name = s.display_name?.trim() || "Usuário";
              const isFollowing = following.has(s.user_id);
              return (
                <li key={s.user_id} className="flex items-center gap-3">
                  <UserAvatar name={name} avatar={s.avatar} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.followers_count === 1
                        ? "1 seguidor"
                        : `${s.followers_count} seguidores`}
                    </p>
                  </div>
                  <button
                    aria-pressed={isFollowing}
                    onClick={() => toggle(s.user_id)}
                    className={`h-8 rounded-full px-4 text-sm font-medium ${
                      isFollowing
                        ? "border border-border"
                        : "bg-foreground text-background"
                    }`}
                  >
                    {isFollowing ? "Seguindo" : "Seguir"}
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </aside>
  );
}