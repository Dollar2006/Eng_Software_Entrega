import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Game } from '@/lib/games'
import { label } from '@/lib/labels'

type GameCardProps = {
  game: Game
  // Conteúdo extra no rodapé do card (ex.: nota, texto e botões da review).
  children?: ReactNode
}

export default function GameCard({ game, children }: GameCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900">
      <div className="grid h-32 place-items-center bg-neutral-100">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={`Capa de ${game.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="text-3xl font-semibold text-neutral-400"
          >
            {game.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="text-sm font-semibold text-neutral-900">
          {/* O after:inset-0 estica o link para o card inteiro ficar clicável */}
          <Link
            to={`/jogos/${game.id}`}
            className="outline-none after:absolute after:inset-0"
          >
            {game.name}
          </Link>
        </h3>

        <ul className="flex flex-wrap gap-1.5">
          {game.genres.slice(0, 3).map((g) => (
            <li
              key={g}
              className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
            >
              {label(g)}
            </li>
          ))}
        </ul>

        <p className="text-xs text-neutral-500">
          {game.platforms.map(label).join(', ')}
        </p>
      </div>

      {/* z-10: fica acima do link esticado do título, então os botões clicam */}
      {children && (
        <div className="relative z-10 border-t border-neutral-200 p-4">
          {children}
        </div>
      )}
    </article>
  )
}